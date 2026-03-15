'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CategoryPicker } from '@/components/report/category-picker'
import { LocationCapture } from '@/components/report/location-capture'
import { PhotoUpload } from '@/components/report/photo-upload'
import { DiscreetModeToggle } from '@/components/report/discreet-mode-toggle'
import { DiscreetOverlay } from '@/components/report/discreet-overlay'
import type { Category } from '@/lib/types'

type Step = 'category' | 'location' | 'description' | 'review'

export default function ReportPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('category')
  const [category, setCategory] = useState<Category | null>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [accuracy, setAccuracy] = useState<number>(0)
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [discreetMode, setDiscreetMode] = useState(false)

  const rawFingerprint = typeof window !== 'undefined' ? [
    navigator.userAgent,
    screen.width,
    screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
  ].join('|') : 'server'

  async function submit() {
    if (!category || !lat || !lng || !description) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, lat, lng, accuracy, category, photoUrl, rawFingerprint }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/report/${data.reportId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed')
      setSubmitting(false)
    }
  }

  const steps: Step[] = ['category', 'location', 'description', 'review']
  const stepIndex = steps.indexOf(step)

  return (
    <main style={{ minHeight: '100vh', background: 'var(--surface-base)', color: 'var(--text-primary)', maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => stepIndex > 0 ? setStep(steps[stepIndex - 1]) : router.push('/')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20 }}>
          ←
        </button>
        <h1 style={{ fontFamily: 'var(--font-barlow-condensed)', fontSize: 24, fontWeight: 700, margin: 0 }}>
          REPORT INCIDENT
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= stepIndex ? 'var(--brand-primary)' : 'var(--border)' }} />
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
          <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', marginBottom: 16 }}>Describe the incident</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you see? Include details like injuries, size of fire, road conditions..."
            rows={5}
            style={{ width: '100%', padding: 12, background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-barlow)', fontSize: 14, resize: 'vertical' }}
          />
          <div style={{ marginTop: 16 }}>
            <PhotoUpload onPhoto={setPhotoUrl} />
          </div>
          {(category === 'crime' || category === 'violence') && (
            <DiscreetModeToggle enabled={discreetMode} onToggle={() => setDiscreetMode(!discreetMode)} />
          )}
          <button disabled={description.length < 10} onClick={() => setStep('review')}
            style={{ marginTop: 16, width: '100%', padding: '14px', background: description.length >= 10 ? 'var(--brand-primary)' : 'var(--border)', color: description.length >= 10 ? '#0A0A0A' : 'var(--text-muted)', border: 'none', borderRadius: 8, fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, fontSize: 16, cursor: description.length >= 10 ? 'pointer' : 'not-allowed' }}>
            REVIEW →
          </button>
        </div>
      )}

      {step === 'review' && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-barlow-condensed)', marginBottom: 16 }}>Confirm report</h2>
          <div style={{ background: 'var(--surface-card)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <p><strong>Category:</strong> {category?.replace(/_/g, ' ')}</p>
            <p><strong>Location:</strong> {lat?.toFixed(4)}, {lng?.toFixed(4)}</p>
            <p><strong>Description:</strong> {description}</p>
            {photoUrl && <p><strong>Photo:</strong> Attached</p>}
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
