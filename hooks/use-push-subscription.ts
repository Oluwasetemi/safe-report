'use client'

import { useState, useEffect } from 'react'

export type PushStatus = 'idle' | 'loading' | 'subscribed' | 'denied' | 'unsupported' | 'error'

interface Options {
  type?: 'citizen' | 'authority'
  lat?: number
  lng?: number
  org_id?: string
}

/** Convert a base64url string to Uint8Array (required by Safari and some Chrome versions) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushSubscription(options: Options = {}) {
  const { type = 'citizen', lat, lng, org_id } = options
  const [status, setStatus] = useState<PushStatus>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
    }
  }, [])

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    setStatus('loading')

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      const applicationServerKey = vapidKey
        ? urlBase64ToUint8Array(vapidKey)
        : undefined
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      const { endpoint, keys } = subscription.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          type,
          lat: lat ?? null,
          lng: lng ?? null,
          org_id: org_id ?? null,
        }),
      })

      setStatus('subscribed')
    } catch (err) {
      console.error('[push] subscribe error:', err)
      setStatus('error')
    }
  }

  async function unsubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return

      const endpoint = sub.endpoint
      await sub.unsubscribe()
      await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })
      setStatus('idle')
    } catch (err) {
      console.error('[push] unsubscribe error:', err)
    }
  }

  return { status, subscribe, unsubscribe }
}
