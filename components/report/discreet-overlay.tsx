'use client'

import { useRef, useEffect } from 'react'

export function DiscreetOverlay({ onExit }: { onExit: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-label="Discreet mode — tap top-left corner or press Escape to exit"
      tabIndex={-1}
      style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 9999, padding: 24, outline: 'none' }}
      onClick={(e) => {
        const { clientX, clientY } = e
        if (clientX < 60 && clientY < 60) onExit()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onExit()
      }}
    >
      <div style={{ color: '#000', fontFamily: 'system-ui' }}>
        <h2 style={{ fontSize: 20, fontWeight: 400, marginBottom: 16, color: '#555' }}>Notes</h2>
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#000', margin: '0 0 4px' }}>Shopping list</p>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Yesterday at 10:32 AM</p>
        </div>
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#000', margin: '0 0 4px' }}>Work meeting notes</p>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Monday at 2:15 PM</p>
        </div>
        <p style={{ fontSize: 11, color: '#ccc', textAlign: 'center', marginTop: 40 }}>
          Tap top-left corner to return
        </p>
      </div>
    </div>
  )
}
