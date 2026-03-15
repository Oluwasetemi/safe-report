export function AlertEmailTemplate({ payload }: { payload: import('../../types').AlertPayload }) {
  const severityColor: Record<string, string> = {
    CRITICAL: '#FF2D2D',
    HIGH:     '#FF7A00',
    MEDIUM:   '#FFD600',
    LOW:      '#00C853',
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '0 auto', padding: 24, background: '#111318', color: '#F2F4F7' }}>
      <div style={{ background: '#D4FF00', padding: '8px 16px', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#0A0A0A', fontSize: 20, fontWeight: 700 }}>
          SAFEREPORT — INCIDENT ALERT
        </h1>
      </div>
      <div style={{ background: severityColor[payload.severity], color: '#0A0A0A', padding: '4px 12px', display: 'inline-block', borderRadius: 4, marginBottom: 16, fontWeight: 700 }}>
        {payload.severity}
      </div>
      <p><strong>Category:</strong> {payload.category.replace('_', ' ').toUpperCase()}</p>
      <p><strong>Parish:</strong> {payload.parish}</p>
      <p><strong>Address:</strong> {payload.address}</p>
      <p><strong>AI Summary:</strong> {payload.aiSummary}</p>
      <p><strong>Coordinates:</strong> {payload.lat}, {payload.lng}</p>
      <p><strong>Reported at:</strong> {new Date(payload.timestamp).toLocaleString('en-JM')}</p>
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <a href={`${process.env.NEXT_PUBLIC_APP_URL}${payload.mapUrl}`}
           style={{ background: '#D4FF00', color: '#0A0A0A', padding: '10px 20px', textDecoration: 'none', fontWeight: 700, borderRadius: 4 }}>
          View on Map
        </a>
        <a href={`${process.env.NEXT_PUBLIC_APP_URL}${payload.respondUrl}`}
           style={{ background: '#1A2235', color: '#F2F4F7', padding: '10px 20px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4 }}>
          Authority Portal
        </a>
      </div>
    </div>
  )
}
