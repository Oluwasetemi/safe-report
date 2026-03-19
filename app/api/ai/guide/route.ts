import { streamText, convertToModelMessages, createUIMessageStreamResponse } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { SAFEGUIDE_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

const MAX_MESSAGES = 20

export async function POST(req: NextRequest) {
  const body = await req.json()
  const rawMessages = Array.isArray(body.messages) ? body.messages.slice(-MAX_MESSAGES) : []

  if (!rawMessages.length) {
    return new Response('messages array is required', { status: 400 })
  }

  // Capture origin for internal API calls inside tool execute functions
  const origin = new URL(req.url).origin

  const result = streamText({
    model:    anthropic('claude-sonnet-4-5'),
    system:   SAFEGUIDE_SYSTEM_PROMPT,
    messages: await convertToModelMessages(rawMessages),
    maxSteps: 5,
    tools: {
      // ── Tool 1: Check ticket status ────────────────────────────────────
      checkTicketStatus: {
        description: 'Look up the status of a SafeReport ticket by its ticket number (e.g. SR-LQMCQJRK)',
        inputSchema: z.object({
          ticketNumber: z.string().describe('The ticket number in SR-XXXXXXXX format'),
        }),
        execute: async ({ ticketNumber }) => {
          const supabase = createServiceSupabaseClient()
          const { data, error } = await supabase
            .from('reports')
            .select('id, ticket_number, status, category, subcategory, severity, ai_summary, address, parish, created_at, acknowledged_at, resolved_at, departments_alerted, police_ref_number')
            .ilike('ticket_number', ticketNumber.trim())
            .single()

          if (error || !data) {
            return { found: false, ticketNumber }
          }

          return {
            found:              true,
            ticketNumber:       data.ticket_number,
            status:             data.status,
            category:           data.category,
            subcategory:        data.subcategory,
            severity:           data.severity,
            aiSummary:          data.ai_summary,
            address:            data.address,
            parish:             data.parish,
            createdAt:          data.created_at,
            acknowledgedAt:     data.acknowledged_at,
            resolvedAt:         data.resolved_at,
            departmentsAlerted: data.departments_alerted,
            policeRefNumber:    data.police_ref_number,
          }
        },
      },

      // ── Tool 2: Create a new report ─────────────────────────────────────
      createReport: {
        description: 'Submit a new incident report after collecting description and location from the user',
        inputSchema: z.object({
          description: z.string().min(10).describe('Full incident description collected from the user'),
          lat:    z.number().optional().describe('Latitude if available from device GPS'),
          lng:    z.number().optional().describe('Longitude if available from device GPS'),
          parish: z.string().optional().describe('Jamaica parish name if known'),
        }),
        execute: async ({ description, lat, lng, parish }) => {
          // Use centre of Jamaica as default when GPS not available
          const reportLat = lat ?? 18.1096
          const reportLng = lng ?? -77.2975

          const res = await fetch(`${origin}/api/reports`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              description,
              lat:            reportLat,
              lng:            reportLng,
              parish,
              rawFingerprint: 'safeguide-agent',
            }),
          })

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Unknown error' }))
            return { success: false, error: err.error ?? `HTTP ${res.status}` }
          }

          const data = await res.json()
          return {
            success:            true,
            ticketNumber:       data.ticketNumber,
            policeRefNumber:    data.policeRefNumber ?? null,
            departmentsAlerted: data.departmentsAlerted ?? [],
          }
        },
      },
    },
  })

  return createUIMessageStreamResponse({
    stream: result.toUIMessageStream(),
  })
}
