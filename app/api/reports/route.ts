import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { classifyReport } from '@/lib/ai/classify'
import { reverseGeocode, forwardGeocode } from '@/lib/geocoding'
import { hashFingerprint } from '@/lib/fingerprint'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { getDepartmentsForCategory } from '@/lib/alerts/routing'
import { sendSMS } from '@/lib/alerts/sms'
import { sendWhatsApp } from '@/lib/alerts/whatsapp'
import { sendEmail } from '@/lib/alerts/email'
import type { AlertPayload } from '@/lib/types'
import { citizenPush } from '@/lib/push/citizen-push'
import { authorityPush } from '@/lib/push/authority-push'

const REPORT_TTL_HOURS: Record<string, number> = {
  CRITICAL: 48,
  HIGH:     24,
  MEDIUM:   12,
  LOW:       6,
}

const RATE_LIMIT_WINDOW_MINS = 10
const RATE_LIMIT_MAX = 5

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { description, rawFingerprint, photoUrl, photoUrls, voiceTranscript } = body
    let { lat, lng, address: bodyAddress } = body as { lat?: number; lng?: number; address?: string }

    // Prefer the full array; fall back to single URL for backwards compat
    const allPhotoUrls: string[] = Array.isArray(photoUrls) && photoUrls.length
      ? photoUrls
      : photoUrl ? [photoUrl] : []

    if (!description || description.length < 10) {
      return NextResponse.json({ error: 'description is required and must be at least 10 characters' }, { status: 400 })
    }

    const hasCoords = typeof lat === 'number' && typeof lng === 'number'
    const hasAddress = typeof bodyAddress === 'string' && bodyAddress.trim().length > 0

    if (!hasCoords && !hasAddress) {
      return NextResponse.json(
        { error: 'Provide either (lat, lng) coordinates or an address string' },
        { status: 400 }
      )
    }

    if (hasCoords && (
      !Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat! < -90 || lat! > 90 || lng! < -180 || lng! > 180
    )) {
      return NextResponse.json({ error: 'Coordinates out of valid range' }, { status: 400 })
    }

    const supabase = createServiceSupabaseClient()

    // Hash fingerprint
    const fingerprint = hashFingerprint(rawFingerprint || 'anonymous', process.env.FINGERPRINT_SALT ?? 'default-salt')

    // Rate limit check: max 5 reports per fingerprint per 10 min
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINS * 60 * 1000).toISOString()
    const { data: recentReports } = await supabase
      .from('reports')
      .select('id')
      .eq('device_fingerprint', fingerprint)
      .gte('created_at', windowStart)

    if (recentReports && recentReports.length >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before submitting another report.' },
        { status: 429 }
      )
    }

    // Resolve coordinates + address/parish
    let address: string
    let parish: string

    if (hasCoords) {
      // lat/lng provided — reverse geocode to get human address + parish
      ;({ address, parish } = await reverseGeocode(lat!, lng!))
    } else {
      // Address-only submission — forward geocode to extract lat/lng
      const geocoded = await forwardGeocode(bodyAddress!)
      if (!geocoded) {
        return NextResponse.json(
          { error: `Could not resolve coordinates for address: "${bodyAddress}". Try adding a parish or landmark.` },
          { status: 422 }
        )
      }
      lat     = geocoded.lat
      lng     = geocoded.lng
      address = geocoded.address
      parish  = geocoded.parish
    }

    const finalClassification = await classifyReport({ description, parish, lat: lat!, lng: lng! })

    // If duplicate, corroborate parent and return
    if (finalClassification.isDuplicate && finalClassification.parentId) {
      await supabase.rpc('corroborate_report', {
        p_report_id: finalClassification.parentId,
        p_trust_multiplier: 1.0,
      })
      return NextResponse.json({
        isDuplicate: true,
        parentId: finalClassification.parentId,
        message: 'This incident has already been reported. Your confirmation helps authorities prioritize it.',
      })
    }

    // Generate ticket number
    const ticketNumber = `SR-${Date.now().toString(36).toUpperCase()}`
    const policeRefNumber = finalClassification.category === 'crime'
      ? `JCF-${randomBytes(3).toString('hex').toUpperCase()}`
      : null

    // Calculate expiry
    const ttlHours = REPORT_TTL_HOURS[finalClassification.severity] ?? 12
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()

    // Insert report
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        device_fingerprint: fingerprint,
        lat: lat!,
        lng: lng!,
        address,
        parish,
        description,
        photo_url:           allPhotoUrls.length ? JSON.stringify(allPhotoUrls) : null,
        voice_transcript:    voiceTranscript,
        category:            finalClassification.category,
        subcategory:         finalClassification.subcategory,
        severity:            finalClassification.severity,
        ai_summary:          finalClassification.aiSummary,
        ai_confidence:       finalClassification.confidence,
        embedding:           finalClassification.embedding,
        is_crime:            finalClassification.category === 'crime' || finalClassification.category === 'violence',
        ticket_number:       ticketNumber,
        police_ref_number:   policeRefNumber,
        expires_at:          expiresAt,
      })
      .select()
      .single()

    if (error) throw error

    // Get departments to alert
    const deptTypes = getDepartmentsForCategory(finalClassification.category)
    const { data: departments, error: deptError } = await supabase
      .from('authority_organizations')
      .select('*')
      .in('type', deptTypes)
      .contains('parish', parish ? [parish] : [])

    console.log(`[alerts] category=${finalClassification.category} parish="${parish}" deptTypes=${JSON.stringify(deptTypes)} matched=${departments?.length ?? 0}`)
    if (deptError) console.error('[alerts] dept query error:', deptError)
    if (departments?.length) console.log('[alerts] targets:', departments.map((d: { name: string; alert_phone?: string; alert_email?: string }) => `${d.name} phone=${d.alert_phone ?? 'none'} email=${d.alert_email ?? 'none'}`))

    const alertPayload: AlertPayload = {
      reportId:   report.id,
      category:   report.category,
      severity:   report.severity,
      address:    address || `${lat!}, ${lng!}`,
      parish:     parish || 'Unknown',
      lat:        lat!,
      lng:        lng!,
      aiSummary:  finalClassification.aiSummary,
      timestamp:  report.created_at,
      mapUrl:     `/report/${report.id}`,
      respondUrl: '/authority/login',
    }

    // Fire alerts + PartyKit broadcast in parallel
    await Promise.all([
      departments?.length
        ? Promise.all([
            sendSMS(departments, alertPayload),
            sendWhatsApp(departments, alertPayload),
            sendEmail(departments, alertPayload),
          ])
        : Promise.resolve(),
      fetch(`${process.env.NEXT_PUBLIC_PARTYKIT_HOST}/parties/map/map:global`, {
        method: 'POST',
        body: JSON.stringify({ type: 'INCIDENT_CREATED', incident: report }),
      }).catch(() => {}),
    ])

    // Update departments_alerted
    if (departments?.length) {
      await supabase
        .from('reports')
        .update({
          departments_alerted: departments.map((d: { name: string }) => d.name),
          alerts_sent_at: new Date().toISOString(),
        })
        .eq('id', report.id)
    }

    // Upsert reporter profile — atomic increment via RPC (non-blocking)
    const SEVERITY_POINTS: Record<string, number> = { CRITICAL: 50, HIGH: 30, MEDIUM: 20, LOW: 10 }
    const pts = SEVERITY_POINTS[finalClassification.severity] ?? 10
    supabase.rpc('upsert_reporter_stats', { p_fingerprint: fingerprint, p_points: pts })
      .catch((e) => console.error('[reporter_profile] upsert error:', e))

    // Fire push notifications (non-blocking)
    citizenPush(report).catch((e) => console.error('[push] citizenPush error:', e))

    if (departments?.length) {
      for (const dept of departments) {
        authorityPush(dept.id, report).catch((e) => console.error('[push] authorityPush error:', e))
      }
    }

    return NextResponse.json({
      reportId:           report.id,
      ticketNumber:       report.ticket_number,
      policeRefNumber:    report.police_ref_number,
      departmentsAlerted: departments?.map((d: { name: string }) => d.name) ?? [],
    }, { status: 201 })
  } catch (err) {
    console.error('POST /api/reports error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
