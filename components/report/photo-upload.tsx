'use client'

import { useState, useRef } from 'react'

interface PhotoUploadProps {
  onPhoto: (url: string) => void
}

export function PhotoUpload({ onPhoto }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData }).catch(() => null)
    if (res?.ok) {
      const { url } = await res.json()
      onPhoto(url)
    }
    setUploading(false)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {preview ? (
        <div style={{ position: 'relative' }}>
          <img src={preview} alt="Report photo" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }} />
          <button onClick={() => { setPreview(null); onPhoto('') }}
            style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          style={{ width: '100%', padding: 24, background: 'var(--surface-card)', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-barlow)' }}>
          {uploading ? 'Uploading...' : '📷 Add photo (optional)'}
        </button>
      )}
    </div>
  )
}
