import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[track] recebido:', JSON.stringify(body))

    const {
      visitor_fingerprint,
      client_id,
      section,
      entered_at,
      duration_seconds,
      type,
      intent,
      stage,
    } = body

    if (!visitor_fingerprint || !client_id) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    if (type === 'stage_update' && stage) {
      await supabaseAdmin
        .from('visitor_sessions')
        .update({
          stage,
          last_seen_at: new Date().toISOString(),
        })
        .eq('visitor_fingerprint', visitor_fingerprint)
        .eq('client_id', client_id)
      return NextResponse.json({ ok: true })
    }

    const event = {
      type: type ?? 'section',
      section: section ?? null,
      intent: intent ?? null,
      entered_at,
      duration_seconds: duration_seconds ?? null,
      timestamp: new Date().toISOString(),
    }

    const { data: existing } = await supabaseAdmin
      .from('visitor_sessions')
      .select('id, behavior_events, interest, stage, converted')
      .eq('visitor_fingerprint', visitor_fingerprint)
      .eq('client_id', client_id)
      .maybeSingle()

    const updatedEvents = [...(existing?.behavior_events ?? []), event]

    // Apenas seções de produto contam para interest — seções de navegação
    // (hero, depoimentos, unidades, faq) são ignoradas no cálculo.
    const INTEREST_SECTIONS = ['servicos', 'dra-ligya', 'agendamento', 'diferenciais']

    const sectionTime: Record<string, number> = {}
    updatedEvents.forEach((e: any) => {
      if (
        e.type === 'section' &&
        e.section &&
        e.duration_seconds &&
        INTEREST_SECTIONS.includes(e.section)
      ) {
        sectionTime[e.section] = (sectionTime[e.section] ?? 0) + e.duration_seconds
      }
    })
    const dominantInterest =
      Object.entries(sectionTime).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      existing?.interest ??
      null

    const { error } = await supabaseAdmin
      .from('visitor_sessions')
      .upsert(
        {
          visitor_fingerprint,
          client_id,
          behavior_events: updatedEvents,
          interest: dominantInterest,
          stage: existing?.stage ?? 'novo',
          converted: existing?.converted ?? false,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'visitor_fingerprint,client_id' }
      )

    if (error) {
      console.error('[track] Erro upsert:', error)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track] Erro:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
