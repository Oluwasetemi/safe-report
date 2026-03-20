'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isTextUIPart, isToolUIPart, getToolName } from 'ai'
import type { UIMessage } from 'ai'
import { useEffect, useRef, useState } from 'react'
import { VoiceInput } from './voice-input'
import { Streamdown } from './streamdown'

interface SafeGuideChatProps {
  onClose: () => void
  initialMessage?: string
}

function ToolStatusBadge({ toolName }: { toolName: string }) {
  const labels: Record<string, string> = {
    checkTicketStatus: '🔍 Checking ticket…',
    createReport:      '📝 Submitting report…',
  }
  return (
    <div style={{
      alignSelf: 'flex-start',
      background: 'rgba(212,255,0,0.1)',
      border: '1px solid rgba(212,255,0,0.3)',
      borderRadius: 8,
      padding: '6px 10px',
      fontSize: 12,
      color: 'var(--brand-primary)',
      fontStyle: 'italic',
    }}>
      {labels[toolName] ?? `⚙️ ${toolName}…`}
    </div>
  )
}

export function SafeGuideChat({ onClose, initialMessage }: SafeGuideChatProps) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/guide' }),
  })
  const [input, setInput] = useState('')
  const isLoading = status === 'submitted' || status === 'streaming'
  const bottomRef = useRef<HTMLDivElement>(null)
  const sentInitialRef = useRef(false)

  // Auto-send voice transcript from landing page voice button
  useEffect(() => {
    if (initialMessage && !sentInitialRef.current && messages.length === 0) {
      sentInitialRef.current = true
      sendMessage({ text: initialMessage })
    }
  }, [initialMessage, messages.length, sendMessage])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleVoice(transcript: string) {
    setInput(transcript)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  function getMessageText(msg: UIMessage): string {
    return msg.parts
      .filter(isTextUIPart)
      .map((p) => p.text)
      .join('')
  }

  function getPendingTools(msg: UIMessage): string[] {
    return msg.parts
      .filter(isToolUIPart)
      .filter((p) => p.state === 'input-streaming' || p.state === 'input-available')
      .map((p) => getToolName(p))
  }

  // Text-to-speech for assistant messages — ElevenLabs primary, Azure fallback, browser speech final fallback.
  const spokenIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (isLoading) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role !== 'assistant') return
    if (spokenIdRef.current === lastMsg.id) return
    const text = getMessageText(lastMsg)
    if (!text) return
    spokenIdRef.current = lastMsg.id

    let ttsText = text
    function decodeB64Utf8(b64: string): string {
      try {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
        return new TextDecoder().decode(bytes)
      } catch {
        return text
      }
    }
    function speakFallback(speakText: string) {
      if (!('speechSynthesis' in window)) return
      const utterance = new SpeechSynthesisUtterance(speakText)
      utterance.lang = 'en-GB'
      utterance.rate = 0.9
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    }
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then(async r => {
        const header = r.headers.get('X-Tts-Text')
        if (header) ttsText = decodeB64Utf8(header)
        if (!r.ok) { speakFallback(ttsText); return }
        const blob  = await r.blob()
        const url   = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.onended = () => URL.revokeObjectURL(url)
        audio.onerror = () => { URL.revokeObjectURL(url); speakFallback(ttsText) }
        audio.play().catch(() => speakFallback(ttsText))
      })
      .catch(() => speakFallback(ttsText))
  }, [messages, isLoading])

  return (
    <div style={{
      position:     'fixed',
      bottom:        0,
      right:         0,
      width:         '100%',
      maxWidth:      420,
      height:        '70vh',
      background:   'var(--surface-raised)',
      borderRadius: '16px 16px 0 0',
      border:       '1px solid var(--border)',
      zIndex:        2000,
      display:       'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, color: 'var(--brand-primary)', fontSize: 16 }}>
            SAFEGUIDE
          </span>
          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>AI Safety Agent</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 32, fontSize: 14 }}>
            <p>Mi deh yah fi help yuh.</p>
            <p style={{ marginTop: 8 }}>Tell me what happened and I will help you report it.</p>
            <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>You can also check a ticket — just give me the number (e.g. SR-LQMCQJRK)</p>
          </div>
        )}
        {messages.map((msg: UIMessage) => {
          const text       = getMessageText(msg)
          const pendingTools = getPendingTools(msg)

          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {/* Tool activity indicators */}
              {pendingTools.map((toolName) => (
                <ToolStatusBadge key={toolName} toolName={toolName} />
              ))}

              {/* Message bubble — only rendered if there's text */}
              {text && (
                <div style={{
                  background:   msg.role === 'user' ? 'var(--brand-primary)' : 'var(--surface-card)',
                  color:        msg.role === 'user' ? '#0A0A0A' : 'var(--text-primary)',
                  padding:      '8px 12px',
                  borderRadius:  msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  maxWidth:      '80%',
                  fontSize:      14,
                }}>
                  {msg.role === 'assistant'
                    ? <Streamdown content={text} isStreaming={isLoading && msg === messages[messages.length - 1]} />
                    : text
                  }
                </div>
              )}
            </div>
          )
        })}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: 12 }}>SafeGuide thinking…</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or speak…"
          style={{ flex: 1, padding: '10px 12px', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-barlow)', fontSize: 14 }}
        />
        <VoiceInput onTranscript={handleVoice} />
        <button type="submit" disabled={!input.trim() || isLoading}
          style={{ background: 'var(--brand-primary)', color: '#0A0A0A', border: 'none', borderRadius: 8, width: 44, height: 44, cursor: 'pointer', fontSize: 18, opacity: !input.trim() || isLoading ? 0.35 : 1, transition: 'opacity 0.15s' }}>
          &#x2191;
        </button>
      </form>
    </div>
  )
}
