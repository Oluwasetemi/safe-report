// components/safe-guide/streamdown.tsx
'use client'

import { Streamdown as StreamdownBase } from 'streamdown'

interface StreamdownProps {
  content: string
  isStreaming?: boolean
}

export function Streamdown({ content, isStreaming = false }: StreamdownProps) {
  return (
    <StreamdownBase
      mode={isStreaming ? 'streaming' : 'static'}
      isAnimating={isStreaming}
    >
      {content}
    </StreamdownBase>
  )
}
