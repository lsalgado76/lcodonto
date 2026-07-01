import type { CaptureLeadInput } from "./lead-tool";
import { sendLeadNotification } from "./gmail";
import { supabaseAdmin } from "./supabase/server";

// Apenas seções de produto contam para interest — seções de navegação
// (hero, depoimentos, unidades, faq) são ignoradas no cálculo.
const INTEREST_SECTIONS = ['servicos', 'dra-lygia', 'agendamento', 'diferenciais']

async function generateIntentReport({
  nome,
  interest,
  behaviorEvents,
  areaInteresse,
  contexto,
}: {
  nome: string
  interest: string | null
  behaviorEvents: unknown[]
  areaInteresse: string
  contexto: string
}): Promise<string> {
  const sectionTime: Record<string, number> = {}
  behaviorEvents?.forEach((e: any) => {
    if (e.type === 'section' && INTEREST_SECTIONS.includes(e.section) && e.duration_seconds) {
      sectionTime[e.section] = (sectionTime[e.section] ?? 0) + e.duration_seconds
    }
  })

  const totalTime = Object.values(sectionTime).reduce((a, b) => a + b, 0)
  const nivelIntencao =
    totalTime > 120 ? 'alta' :
    totalTime > 30  ? 'média' : 'baixa'

  const evidencias: string[] = []
  if (interest) evidencias.push(`Maior interesse em: ${interest}`)
  Object.entries(sectionTime)
    .sort((a, b) => b[1] - a[1])
    .forEach(([section, seconds]) => {
      evidencias.push(`${section}: ${seconds}s de navegação`)
    })
  if (areaInteresse) evidencias.push(`Área declarada no chat: ${areaInteresse}`)

  return JSON.stringify({
    interesse_principal: interest ?? areaInteresse ?? 'não identificado',
    nivel_intencao: nivelIntencao,
    tempo_navegacao_total: totalTime,
    evidencias,
    contexto_conversa: contexto,
    gerado_em: new Date().toISOString(),
  }, null, 2)
}

async function linkLeadToVisitorSession({
  visitorFingerprint,
  clientId,
  leadId,
  intentReport,
}: {
  visitorFingerprint: string
  clientId: string
  leadId: string
  intentReport: string
}) {
  await supabaseAdmin
    .from('visitor_sessions')
    .upsert(
      {
        visitor_fingerprint: visitorFingerprint,
        client_id: clientId,
        lead_id: leadId,
        converted: true,
        stage: 'convertido',
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'visitor_fingerprint,client_id' }
    )

  await supabaseAdmin
    .from('leads')
    .update({ intent_report: intentReport })
    .eq('id', leadId)
}

async function saveLeadToSupabase({
  clientId,
  nome,
  contato,
  areaInteresse,
  contexto,
}: {
  clientId: string
  nome: string
  contato: string
  areaInteresse: string
  contexto: string
}): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({
      client_id: clientId,
      nome,
      contato,
      area_interesse: areaInteresse,
      contexto,
      status: 'novo',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[leads] Erro ao salvar no Supabase:', error.message)
    return null
  }

  console.log('[leads] Salvo no Supabase:', nome, contato)
  return data.id
}

export async function processLead(
  input: CaptureLeadInput & {
    clientId?: string
    visitorFingerprint?: string
    behaviorEvents?: unknown[]
    interest?: string | null
  }
): Promise<void> {
  const { clientId, visitorFingerprint, behaviorEvents, interest, ...leadInput } = input

  let leadId: string | null = null

  if (clientId) {
    leadId = await saveLeadToSupabase({
      clientId,
      nome: leadInput.nome,
      contato: leadInput.contato,
      areaInteresse: leadInput.area_interesse,
      contexto: leadInput.contexto,
    })
  }

  if (leadId && visitorFingerprint && clientId) {
    const intentReport = await generateIntentReport({
      nome: leadInput.nome,
      interest: interest ?? null,
      behaviorEvents: behaviorEvents ?? [],
      areaInteresse: leadInput.area_interesse,
      contexto: leadInput.contexto,
    })

    await linkLeadToVisitorSession({
      visitorFingerprint,
      clientId,
      leadId,
      intentReport,
    })
  }

  try {
    await sendLeadNotification(leadInput);
    console.log(
      "[lead] Notificação enviada:",
      leadInput.nome,
      `<${leadInput.contato}>`,
      leadInput.area_interesse
    );
  } catch (error) {
    // Falha no e-mail não propaga — visitante nunca vê erro técnico (RF11).
    console.error("[lead] Falha ao enviar e-mail de notificação:", error);
  }
}
