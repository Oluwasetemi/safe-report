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
  const [state, setState] = useState<'idle' | 'recording' | 'transcribing'>('idle')
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  async function sendToWhisper(blob: Blob) {
    setState('transcribing')
    try {
      const form = new FormData()
      form.append('audio', blob, 'recording.webm')
      const res = await fetch('/api/ai/transcribe', { method: 'POST', body: form })
      const data = await res.json()
      if (data.transcript) onTranscript(data.transcript)
    } catch {
      // silently fail — user can type manually
    } finally {
      setState('idle')
    }
  }

  async function startMediaRecorder() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })
        sendToWhisper(blob)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setState('recording')
    } catch {
      setState('idle')
    }
  }

  function stopMediaRecorder() {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
  }

  function toggle() {
    if (state === 'recording') {
      // Stop whichever recorder is active
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
      if (mediaRecorderRef.current) {
        stopMediaRecorder()
      }
      return
    }

    if (state !== 'idle') return

    // Try Web Speech API first (zero-latency, no server round-trip)
    const SpeechRecognitionAPI = getSpeechRecognitionAPI()
    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI()
      recognition.lang = 'en-JM'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (e: ISpeechRecognitionEvent) => {
        onTranscript(e.results[0][0].transcript)
        setState('idle')
      }
      recognition.onerror = () => {
        // Fall back to MediaRecorder on Web Speech failure
        setState('idle')
        startMediaRecorder()
      }
      recognition.onend = () => setState('idle')

      recognitionRef.current = recognition
      recognition.start()
      setState('recording')
      return
    }

    // Fallback: MediaRecorder + Whisper
    startMediaRecorder()
  }

  const isRecording = state === 'recording'
  const isTranscribing = state === 'transcribing'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isTranscribing}
      title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Voice input'}
      style={{
        background:   isRecording ? 'var(--severity-critical)' : isTranscribing ? 'var(--border)' : 'var(--surface-card)',
        border:       isRecording ? '2px solid var(--severity-critical)' : '2px solid transparent',
        borderRadius: '50%',
        width:         44,
        height:        44,
        cursor:        isTranscribing ? 'not-allowed' : 'pointer',
        fontSize:      isTranscribing ? 12 : 20,
        flexShrink:    0,
        transition:   'background 0.15s',
        color:        isTranscribing ? 'var(--text-muted)' : undefined,
      }}
    >
      {isTranscribing ? '...' : isRecording ? '\u23F9' : '\uD83C\uDF99'}
    </button>
  )
}
