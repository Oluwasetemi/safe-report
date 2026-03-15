'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CategoryPicker } from '@/components/report/category-picker'
import { LocationCapture } from '@/components/report/location-capture'
import { PhotoUpload } from '@/components/report/photo-upload'
import { DiscreetModeToggle } from '@/components/report/discreet-mode-toggle'
import { DiscreetOverlay } from '@/components/report/discreet-overlay'
import { VoiceInput } from '@/components/safe-guide/voice-input'
import type { Category, Severity } from '@/lib/types'

type Step = 'category' | 'location' | 'description' | 'classify' | 'review'

interface AIClassification {
  category: Category
  subcategory: string
  severity: Severity
  urgencySignals: string[]
  confidence: number
  parish: string
}

const SEVERITY_COLOR: Record<Severity, string> = {
  CRITICAL: '#FF2D2D',
  HIGH:     '#FF7A00',
  MEDIUM:   '#FFB800',
  LOW:      '#00C853',
}

const CATEGORY_LABEL: Record<string, string> = {
  fire_explosion:    'Fire / Explosion',
  flash_flood:       'Flash Flood',
  medical_emergency: 'Medical Emergency',
  building_collapse: 'Building Collapse',
  downed_power_line: 'Downed Power Line',
  crime:             'Crime',
  violence:          'Violence',
  road_collapse:     'Road Collapse',
  pothole:           'Pothole',
  power_outage:      'Power Outage',
  environmental:     'Environmental',
  road_hazard:       'Road Hazard',
  other:             'Other',
}

export default function ReportPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('category')
  const [category, setCategory] = useState<Category | null>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [accuracy, setAccuracy] = useState<number>(0)
  const [description, setDescription] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [error, setError] = useState('')
  const [discreetMode, setDiscreetMode] = useState(false)
  const [aiResult, setAiResult] = useState<AIClassification | null>(null)

  const rawFingerprint = typeof window !== 'undefined' ? [
    navigator.userAgent,
    screen.width,
    screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
  ].join('|') : 'server'

  async function runClassify() {
    if (!lat || !lng || !description) return
    setClassifying(true)
    setError('')
    try {
      const res = await fetch('/api/reports/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, lat, lng }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAiResult(data)
      // Override category with AI suggestion
      setCategory(data.category)
      setStep('classify')
    } catch {
      setError('AI classification failed — you can still submit manually')
      setStep('review')
    } finally {
      setClassifying(false)
    }
  }

  async function submit() {
    if (!category || !lat || !lng || !description) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description, lat, lng, accuracy, category,
          photoUrl: photoUrls[0] ?? '',
          photoUrls,
          rawFingerprint,
          // Pass AI-pre-classified severity so API can skip reclassification if desired
          preClassifiedSeverity: aiResult?.severity,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.isDuplicate) {
        router.push(`/report/${data.parentId}`)
      } else {
        router.push(`/report/${data.reportId}`)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed')
      setSubmitting(false)
    }
  }

  const steps: Step[] = ['category', 'location', 'description', 'classify', 'review']
  // For progress bar, collapse classify + review into the same visual step
  const visualSteps = ['category', 'location', 'description', 'review']
  const visualIndex = step === 'classify' ? 3 : visualSteps.indexOf(step)

  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface-base)', color: 'var(--text-primary)', maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => {
            const prev: Record<Step, Step | null> = {
              category: null, location: 'category', description: 'location',
              classify: 'description', review: 'classify',
            }
            const p = prev[step]
            if (p) setStep(p); else router.push('/')
          }}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20 }}>
          ←
        </button>
        <h1 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 24, fontWeight: 700, margin: 0 }}>
          REPORT INCIDENT
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
        {visualSteps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= visualIndex ? 'var(--brand-primary)' : 'var(--border)' }} />
        ))}
      </div>

      {step === 'category' && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', marginBottom: 16 }}>What happened?</h2>
          <CategoryPicker value={category} onChange={(c) => { setCategory(c); setStep('location') }} />
        </div>
      )}

      {step === 'location' && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', marginBottom: 16 }}>Where is it?</h2>
          <LocationCapture onLocation={(la, ln, ac) => { setLat(la); setLng(ln); setAccuracy(ac) }} />
          {lat && (
            <button onClick={() => setStep('description')}
              style={{ marginTop: 16, width: '100%', padding: '14px', background: 'var(--brand-primary)', color: '#0A0A0A', border: 'none', borderRadius: 8, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              CONTINUE →
            </button>
          )}
        </div>
      )}

      {step === 'description' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', margin: 0 }}>Describe the incident</h2>
            <VoiceInput onTranscript={(t) => setDescription(prev => prev ? `${prev} ${t}` : t)} />
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you see? Speak or type — include details like injuries, size of fire, road conditions..."
            rows={5}
            style={{ width: '100%', padding: 12, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-barlow)', fontSize: 14, resize: 'vertical' }}
          />
          <div style={{ marginTop: 16 }}>
            <PhotoUpload onPhotos={setPhotoUrls} />
          </div>
          {(category === 'crime' || category === 'violence') && (
            <DiscreetModeToggle enabled={discreetMode} onToggle={() => setDiscreetMode(!discreetMode)} />
          )}
          {error && <p style={{ color: 'var(--severity-critical)', marginTop: 8, fontSize: 13 }}>{error}</p>}
          <button
            disabled={description.length < 10 || classifying}
            onClick={runClassify}
            style={{ marginTop: 16, width: '100%', padding: '14px', background: description.length >= 10 ? 'var(--brand-primary)' : 'var(--border)', color: description.length >= 10 ? '#0A0A0A' : 'var(--text-muted)', border: 'none', borderRadius: 8, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, fontSize: 16, cursor: description.length >= 10 ? 'pointer' : 'not-allowed' }}>
            {classifying ? 'ANALYSING...' : 'ANALYSE WITH AI →'}
          </button>
        </div>
      )}

      {step === 'classify' && aiResult && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', marginBottom: 4 }}>AI CLASSIFICATION</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
            Review the AI&apos;s assessment. You can approve it or correct the category and severity before submitting.
          </p>

          {/* Severity badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              padding: '6px 14px', borderRadius: 20,
              background: SEVERITY_COLOR[aiResult.severity] + '22',
              border: `1px solid ${SEVERITY_COLOR[aiResult.severity]}`,
              color: SEVERITY_COLOR[aiResult.severity],
              fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, fontSize: 14, letterSpacing: 1,
            }}>
              {aiResult.severity}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              {Math.round(aiResult.confidence * 100)}% confidence
            </div>
          </div>

          {/* Category + subcategory */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 4px', letterSpacing: 1 }}>CATEGORY</p>
            <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-barlow-condensed)', fontSize: 18 }}>
              {CATEGORY_LABEL[aiResult.category] ?? aiResult.category}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 4px', letterSpacing: 1 }}>SUBCATEGORY</p>
            <p style={{ margin: 0, fontSize: 14 }}>{aiResult.subcategory}</p>
          </div>

          {/* Urgency signals */}
          {aiResult.urgencySignals.length > 0 && (
            <div style={{ background: 'var(--surface-card)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 10px', letterSpacing: 1 }}>URGENCY SIGNALS DETECTED</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {aiResult.urgencySignals.map((s, i) => (
                  <span key={i} style={{ padding: '3px 10px', borderRadius: 12, background: '#FF2D2D22', border: '1px solid #FF2D2D44', color: '#FF7A7A', fontSize: 12, fontFamily: 'var(--font-barlow)' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Correct category override */}
          <div style={{ background: 'var(--surface-card)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '0 0 10px', letterSpacing: 1 }}>CORRECT CATEGORY (OPTIONAL)</p>
            <CategoryPicker value={category} onChange={setCategory} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep('review')}
              style={{ flex: 1, padding: '14px', background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              SKIP →
            </button>
            <button
              onClick={() => setStep('review')}
              style={{ flex: 2, padding: '14px', background: 'var(--brand-primary)', color: '#0A0A0A', border: 'none', borderRadius: 8, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              APPROVE & CONTINUE →
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', marginBottom: 16 }}>Confirm report</h2>
          <div style={{ background: 'var(--surface-card)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <p><strong>Category:</strong> {CATEGORY_LABEL[category ?? ''] ?? category?.replace(/_/g, ' ')}</p>
            {aiResult && <p><strong>Severity:</strong> <span style={{ color: SEVERITY_COLOR[aiResult.severity] }}>{aiResult.severity}</span></p>}
            <p><strong>Location:</strong> {lat?.toFixed(4)}, {lng?.toFixed(4)}</p>
            <p><strong>Description:</strong> {description}</p>
            {photoUrls.length > 0 && <p><strong>Photos:</strong> {photoUrls.length} attached</p>}
          </div>
          {error && <p style={{ color: 'var(--severity-critical)', marginBottom: 12 }}>{error}</p>}
          <button onClick={submit} disabled={submitting}
            style={{ width: '100%', padding: '16px', background: submitting ? 'var(--border)' : 'var(--brand-primary)', color: '#0A0A0A', border: 'none', borderRadius: 8, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, fontSize: 18, cursor: submitting ? 'not-allowed' : 'pointer', letterSpacing: 1 }}>
            {submitting ? 'SUBMITTING...' : 'SUBMIT REPORT'}
          </button>
        </div>
      )}

      {discreetMode && <DiscreetOverlay onExit={() => setDiscreetMode(false)} />}
    </main>
  )
}
