'use client'

import { useState, useRef } from 'react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
}

interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: ISpeechRecognitionEvent) => void) | null
  onerror: ((e: Event) => void) | null
  onend: (() => void) | null
}

interface ISpeechRecognitionEvent extends Event {
  results: { [index: number]: { [index: number]: { transcript: string } } }
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition

function getSpeechRecognitionAPI(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)

  function toggle() {
    const SpeechRecognitionAPI = getSpeechRecognitionAPI()
    if (!SpeechRecognitionAPI) {
      alert('Voice input not supported in this browser')
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'en-JM'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (e: ISpeechRecognitionEvent) => {
      onTranscript(e.results[0][0].transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return (
    <button type="button" onClick={toggle}
      style={{
        background:   listening ? 'var(--severity-critical)' : 'var(--surface-card)',
        border:       'none',
        borderRadius: '50%',
        width:         44,
        height:        44,
        cursor:        'pointer',
        fontSize:      20,
        flexShrink:    0,
      }}
      title={listening ? 'Stop recording' : 'Voice input'}
    >
      {listening ? '\u23F9' : '\uD83C\uDF99'}
    </button>
  )
}
