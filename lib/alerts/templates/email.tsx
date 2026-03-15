export function AlertEmailTemplate({ payload }: { payload: import('../../types').AlertPayload }) {
  const severityColor: Record<string, string> = {
    CRITICAL: '#FF2D2D',
    HIGH:     '#FF7A00',
    MEDIUM:   '#FFD600',
    LOW:      '#00C853',
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://safereport.app'

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto', padding: 24, background: '#111318', color: '#F2F4F7' }}>
      <div style={{ background: '#D4FF00', padding: '8px 16px', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#0A0A0A', fontSize: 20, fontWeight: 700 }}>
          SAFEREPORT — INCIDENT ALERT
        </h1>
      </div>

      <div style={{ background: severityColor[payload.severity] ?? '#888', color: '#0A0A0A', padding: '4px 12px', display: 'inline-block', borderRadius: 4, marginBottom: 16, fontWeight: 700 }}>
        {payload.severity}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <tbody>
          {[
            ['Category',    payload.category.replace(/_/g, ' ').toUpperCase()],
            ['Parish',      payload.parish],
            ['Address',     payload.address],
            ['AI Summary',  payload.aiSummary],
            ['Coordinates', `${payload.lat}, ${payload.lng}`],
            ['Reported at', new Date(payload.timestamp).toLocaleString('en-JM')],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ padding: '6px 0', color: '#A0AEC0', width: 120, verticalAlign: 'top', fontSize: 14 }}>
                <strong>{label}</strong>
              </td>
              <td style={{ padding: '6px 0', fontSize: 14 }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 24 }}>
        <a href={`${appUrl}${payload.mapUrl}`}
           style={{ background: '#D4FF00', color: '#0A0A0A', padding: '10px 20px', textDecoration: 'none', fontWeight: 700, borderRadius: 4, display: 'inline-block', marginRight: 12 }}>
          View on Map
        </a>
        <a href={`${appUrl}${payload.respondUrl}`}
           style={{ background: '#1A2235', color: '#F2F4F7', padding: '10px 20px', textDecoration: 'none', border: '1px solid #334155', borderRadius: 4, display: 'inline-block' }}>
          Authority Portal
        </a>
      </div>
    </div>
  )
}
