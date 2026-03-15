'use client'

export function DiscreetOverlay({ onExit }: { onExit: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 9999, padding: 24 }}
      onClick={(e) => {
        const { clientX, clientY } = e
        if (clientX < 60 && clientY < 60) onExit()
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
          Tap top-left corner three times to return
        </p>
      </div>
    </div>
  )
}
