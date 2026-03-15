'use client'

interface MapControlsProps {
  onReportClick: () => void
  onLocateClick: () => void
  onGuideClick: () => void
}

export function MapControls({ onReportClick, onLocateClick, onGuideClick }: MapControlsProps) {
  return (
    <>
      {/* Report FAB — bottom center */}
      <button
        data-tour="tour-report-fab"
        onClick={onReportClick}
        style={{
          position:     'fixed',
          bottom:        32,
          left:          '50%',
          transform:    'translateX(-50%)',
          zIndex:        1000,
          background:   'var(--brand-primary)',
          color:        '#0A0A0A',
          border:       'none',
          borderRadius:  8,
          padding:      '14px 32px',
          fontFamily:   'var(--font-barlow-condensed)',
          fontWeight:    700,
          fontSize:      18,
          letterSpacing: 1,
          cursor:        'pointer',
          boxShadow:    '0 4px 20px rgba(212,255,0,0.4)',
        }}
      >
        + REPORT INCIDENT
      </button>

      {/* SafeGuide FAB — bottom right */}
      <button
        data-tour="tour-safeguide"
        onClick={onGuideClick}
        style={{
          position:     'fixed',
          bottom:        32,
          right:         24,
          zIndex:        1000,
          background:   '#1A2235',
          color:        'var(--brand-primary)',
          border:       '1px solid var(--brand-primary)',
          borderRadius:  '50%',
          width:         56,
          height:        56,
          fontSize:      24,
          cursor:        'pointer',
          boxShadow:    '0 4px 12px rgba(0,0,0,0.4)',
        }}
        title="SafeGuide Assistant"
      >
        🤖
      </button>

      {/* Locate me — top right */}
      <button
        onClick={onLocateClick}
        style={{
          position:   'fixed',
          top:         80,
          right:       12,
          zIndex:      1000,
          background: '#1A2235',
          color:      'var(--text-primary)',
          border:     '1px solid var(--border)',
          borderRadius: 8,
          width:       40,
          height:      40,
          fontSize:    18,
          cursor:      'pointer',
        }}
        title="My location"
      >
        📍
      </button>
    </>
  )
}
