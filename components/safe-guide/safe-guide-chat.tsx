'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isTextUIPart } from 'ai'
import type { UIMessage } from 'ai'
import { useEffect, useRef, useState } from 'react'
import { VoiceInput } from './voice-input'

interface SafeGuideChatProps {
  onClose: () => void
}

export function SafeGuideChat({ onClose }: SafeGuideChatProps) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/guide' }),
  })
  const [input, setInput] = useState('')
  const isLoading = status === 'submitted' || status === 'streaming'
  const bottomRef = useRef<HTMLDivElement>(null)

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

  // Text-to-speech for assistant messages — only when streaming is complete
  const spokenIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (isLoading) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role !== 'assistant') return
    if (spokenIdRef.current === lastMsg.id) return
    const text = getMessageText(lastMsg)
    if (!text || !('speechSynthesis' in window)) return
    spokenIdRef.current = lastMsg.id
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-JM'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
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
          <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>AI Safety Assistant</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 32, fontSize: 14 }}>
            <p>Mi deh yah fi help yuh.</p>
            <p style={{ marginTop: 8 }}>Tell me what happened and I will help you report it.</p>
          </div>
        )}
        {messages.map((msg: UIMessage) => (
          <div key={msg.id} style={{
            alignSelf:    msg.role === 'user' ? 'flex-end' : 'flex-start',
            background:   msg.role === 'user' ? 'var(--brand-primary)' : 'var(--surface-card)',
            color:        msg.role === 'user' ? '#0A0A0A' : 'var(--text-primary)',
            padding:      '8px 12px',
            borderRadius:  msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
            maxWidth:      '80%',
            fontSize:      14,
            lineHeight:    1.5,
          }}>
            {getMessageText(msg)}
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: 12 }}>SafeGuide typing...</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or speak..."
          style={{ flex: 1, padding: '10px 12px', background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-barlow)', fontSize: 14 }}
        />
        <VoiceInput onTranscript={handleVoice} />
        <button type="submit" disabled={!input.trim() || isLoading}
          style={{ background: 'var(--brand-primary)', border: 'none', borderRadius: 8, width: 44, height: 44, cursor: 'pointer', fontSize: 18 }}>
          &#x2191;
        </button>
      </form>
    </div>
  )
}
