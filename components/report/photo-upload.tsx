'use client'

import { useState, useRef } from 'react'

interface PhotoUploadProps {
  onPhotos: (urls: string[]) => void
}

interface PhotoEntry {
  preview: string   // local data URL for instant display
  url: string       // remote URL after upload (empty while uploading)
  uploading: boolean
  id: string
}

export function PhotoUpload({ onPhotos }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function notifyParent(entries: PhotoEntry[]) {
    const uploaded = entries.filter(p => p.url).map(p => p.url)
    onPhotos(uploaded)
  }

  async function handleFiles(files: FileList) {
    const newEntries: PhotoEntry[] = Array.from(files).map((file) => ({
      preview: URL.createObjectURL(file),
      url: '',
      uploading: true,
      id: `${Date.now()}-${Math.random()}`,
    }))

    setPhotos(prev => {
      const next = [...prev, ...newEntries]
      notifyParent(next)
      return next
    })

    // Upload each file independently
    await Promise.all(
      newEntries.map(async (entry, i) => {
        const formData = new FormData()
        formData.append('file', files[i])
        const res = await fetch('/api/upload', { method: 'POST', body: formData }).catch(() => null)
        const remoteUrl = res?.ok ? (await res.json()).url : ''

        setPhotos(prev => {
          const next = prev.map(p =>
            p.id === entry.id ? { ...p, url: remoteUrl, uploading: false } : p
          )
          notifyParent(next)
          return next
        })
      })
    )
  }

  function remove(id: string) {
    setPhotos(prev => {
      const next = prev.filter(p => p.id !== id)
      notifyParent(next)
      return next
    })
  }

  const anyUploading = photos.some(p => p.uploading)

  return (
    <div>
      {/* Photo grid */}
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
          {photos.map((photo, idx) => (
            <div key={photo.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: 'var(--surface-card)' }}>
              <img
                src={photo.preview}
                alt={`Report photo ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {photo.uploading && (
                <div role="status" aria-label={`Uploading photo ${idx + 1}`} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span aria-hidden="true" style={{ color: '#fff', fontSize: 11, fontFamily: 'var(--font-barlow-condensed)' }}>UPLOADING</span>
                </div>
              )}
              {!photo.uploading && (
                <button
                  type="button"
                  aria-label={`Remove photo ${idx + 1}`}
                  onClick={() => remove(photo.id)}
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span aria-hidden="true">✕</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add more / initial button */}
      <input
        ref={inputRef}
        id="photo-upload-input"
        type="file"
        accept="image/*"
        multiple
        aria-label="Upload report photos"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
      />
      <button
        type="button"
        aria-controls="photo-upload-input"
        aria-label={anyUploading ? 'Uploading photos, please wait' : photos.length ? 'Add more photos' : 'Add photos (optional)'}
        onClick={() => inputRef.current?.click()}
        disabled={anyUploading}
        style={{
          width: '100%',
          padding: photos.length ? '10px' : '20px',
          background: 'var(--surface-card)',
          border: '1px dashed var(--border)',
          borderRadius: 8,
          color: anyUploading ? 'var(--text-muted)' : 'var(--text-secondary)',
          cursor: anyUploading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-barlow)',
          fontSize: 14,
        }}
      >
        {anyUploading ? 'Uploading…' : photos.length ? '+ Add more photos' : '📷 Add photos (optional)'}
      </button>
    </div>
  )
}
