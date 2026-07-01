'use client'

import { useCallback, useEffect, useRef } from 'react'

const PROACTIVE_THRESHOLD_MS = 20_000

export interface BehaviorEvent {
  type: 'section' | 'chat'
  section?: string | null
  intent?: string | null
  entered_at?: string
  duration_seconds?: number | null
  timestamp: string
}

interface TrackOptions {
  visitorFingerprint: string
  clientId: string
}

export function useTracker({ visitorFingerprint, clientId }: TrackOptions) {
  const fingerprintRef = useRef(visitorFingerprint)
  const clientIdRef = useRef(clientId)
  const sectionStartRef = useRef<Record<string, number>>({})
  const proactiveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const behaviorEventsRef = useRef<BehaviorEvent[]>([])

  useEffect(() => {
    fingerprintRef.current = visitorFingerprint
    clientIdRef.current = clientId
    console.log('[useTracker] props atualizadas:', {
      visitorFingerprint: fingerprintRef.current,
      clientId: clientIdRef.current,
    })
  }, [visitorFingerprint, clientId])

  const trackSectionEnter = useCallback((section: string) => {
    const now = Date.now()
    sectionStartRef.current[section] = now

    // Timer proativo: roda mesmo antes do fingerprint estar pronto (é só UI local,
    // não depende do /api/track). Sem isso, quem chega e fica parado na primeira
    // seção visível — tipicamente o hero, o caso mais comum de teste — nunca
    // dispara o balão, porque o fingerprint só fica pronto um render depois do
    // IntersectionObserver já ter chamado trackSectionEnter uma única vez.
    if (proactiveTimersRef.current[section]) {
      clearTimeout(proactiveTimersRef.current[section])
    }
    proactiveTimersRef.current[section] = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('seere:proactive', { detail: { section } }))
      delete proactiveTimersRef.current[section]
    }, PROACTIVE_THRESHOLD_MS)

    if (!fingerprintRef.current || !clientIdRef.current) return

    const event: BehaviorEvent = {
      type: 'section',
      section,
      entered_at: new Date(now).toISOString(),
      timestamp: new Date(now).toISOString(),
    }
    behaviorEventsRef.current = [...behaviorEventsRef.current, event]

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_fingerprint: fingerprintRef.current,
        client_id: clientIdRef.current,
        type: 'section',
        section,
        entered_at: event.entered_at,
      }),
    }).catch(() => {})
  }, [])

  const trackSectionLeave = useCallback((section: string) => {
    // Cancelar timer proativo ao sair da seção antes do threshold — roda mesmo
    // sem fingerprint ainda, senão o timer da primeira seção fica órfão e dispara
    // o balão depois que o visitante já saiu dela.
    if (proactiveTimersRef.current[section]) {
      clearTimeout(proactiveTimersRef.current[section])
      delete proactiveTimersRef.current[section]
    }

    if (!fingerprintRef.current || !clientIdRef.current) return

    const startTime = sectionStartRef.current[section]
    if (!startTime) return

    const duration_seconds = Math.round((Date.now() - startTime) / 1000)
    delete sectionStartRef.current[section]

    // Atualizar o evento de saída local com a duração calculada
    const events = [...behaviorEventsRef.current]
    const lastIdx = events.map(e => e.section).lastIndexOf(section)
    if (lastIdx !== -1) {
      events[lastIdx] = { ...events[lastIdx], duration_seconds }
      behaviorEventsRef.current = events
    }

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_fingerprint: fingerprintRef.current,
        client_id: clientIdRef.current,
        type: 'section',
        section,
        duration_seconds,
      }),
    }).catch(() => {})
  }, [])

  const trackChatIntent = useCallback((intent: string) => {
    if (!fingerprintRef.current || !clientIdRef.current) return

    const event: BehaviorEvent = {
      type: 'chat',
      intent,
      timestamp: new Date().toISOString(),
    }
    behaviorEventsRef.current = [...behaviorEventsRef.current, event]

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_fingerprint: fingerprintRef.current,
        client_id: clientIdRef.current,
        type: 'chat',
        intent,
      }),
    }).catch(() => {})
  }, [])

  const getBehaviorEvents = useCallback((): BehaviorEvent[] => {
    return behaviorEventsRef.current
  }, [])

  return { trackSectionEnter, trackSectionLeave, trackChatIntent, getBehaviorEvents }
}
