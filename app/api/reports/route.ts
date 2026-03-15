import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { classifyReport } from '@/lib/ai/classify'
import { reverseGeocode } from '@/lib/geocoding'
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
    const { description, lat, lng, rawFingerprint, photoUrl, photoUrls, voiceTranscript } = body
    // Prefer the full array; fall back to single URL for backwards compat
    const allPhotoUrls: string[] = Array.isArray(photoUrls) && photoUrls.length
      ? photoUrls
      : photoUrl ? [photoUrl] : []

    // Validate required fields
    if (!description || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Missing required fields: description, lat, lng' }, { status: 400 })
    }
    if (description.length < 10) {
      return NextResponse.json({ error: 'Description too short' }, { status: 400 })
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

    // Geocode first — parish is needed for accurate AI classification
    const { address, parish } = await reverseGeocode(lat, lng)
    const finalClassification = await classifyReport({ description, parish, lat, lng })

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
        lat,
        lng,
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
      address:    address || `${lat}, ${lng}`,
      parish:     parish || 'Unknown',
      lat,
      lng,
      aiSummary:  finalClassification.aiSummary,
      timestamp:  report.created_at,
      mapUrl:     `/incidents/${report.id}`,
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
