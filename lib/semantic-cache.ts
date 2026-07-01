import { supabaseAdmin } from '@/lib/supabase/server'

// Perguntas com esses marcadores contêm contexto específico do visitante —
// nunca devem ser respondidas do cache (precisam de resposta personalizada do LLM).
const CONTEXT_MARKERS = [
  'pra', 'para', 'no caso', 'no meu', 'com',
  'pessoas', 'participantes', 'dias', 'horas',
  'específico', 'especial', 'diferente', 'personalizado',
  'quanto custa', 'valor', 'preço', 'orçamento',
  'meu evento', 'minha empresa', 'nosso', 'nossa',
]

const STOPWORDS = new Set([
  // artigos, pronomes, preposições
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'que', 'e',
  'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'por', 'para', 'com', 'sem', 'sob', 'sobre', 'me',
  // verbos e expressões genéricas — 'como' e 'quem' removidos: são keywords de domínio
  'fala', 'explica', 'diz', 'conta', 'fale', 'explique', 'se', 'eu',
  'voce', 'voces', 'tem', 'ter', 'vai', 'pode', 'ser', 'sao', 'foi', 'eram',
  'faz', 'fazem', 'dao',
  // verbos genéricos de consulta — não discriminam tema (o TEMA está no substantivo)
  'oferecem', 'trabalham', 'atuam', 'prestam', 'realizam', 'executam',
  'esta', 'estao', 'tinha', 'esse', 'essa', 'isso', 'aqui', 'ali',
  'mais', 'muito', 'pouco', 'bem', 'mal', 'nao', 'sim', 'ja', 'ainda',
  'mas', 'ou', 'tambem', 'quais', 'qual', 'quando', 'onde',
  'porque', 'quanto', 'quanta', 'quero', 'queria', 'gostaria', 'preciso',
  'saber', 'conhecer', 'entender', 'ver', 'eh', 'pois', 'pq',
])

// Respostas curtas de confirmação — o visitante leu mas não engajou de verdade.
const NEUTRAL_PATTERNS = [
  'ok', 'okay', 'entendi', 'certo', 'ta', 'beleza', 'legal',
  'otimo', 'obrigado', 'obrigada', 'valeu', 'blz', 'show', 'perfeito',
  'ate mais', 'bye', 'tchau', 'tudo bem',
]

const DEEP_ENGAGEMENT_MARKERS = [
  'no meu caso', 'e se', 'mas e', 'meu caso', 'minha situacao',
  'pra mim', 'no nosso', 'na nossa', 'e quando', 'mas quando',
]

// Nomes de marca/produto que aparecem em quase toda pergunta sobre Wibag/Seere.
const BRAND_NAMES = new Set(['wibag', 'seere'])

// Keywords que identificam o TEMA/PILAR da pergunta.
const DOMAIN_KEYWORDS = new Set([
  // Wibag / Conectividade
  'wibag', 'mochila', '5g', 'conectividade', 'sinal', 'cobertura', 'rede', 'privada',
  // Software / Desenvolvimento
  'software', 'sistema', 'desenvolvimento', 'desenvolvem', 'app', 'aplicativo',
  'site', 'ecommerce', 'loja', 'plataforma', 'web', 'mobile', 'codigo',
  // BI / Dados
  'bi', 'dados', 'dashboard', 'relatorio', 'analytics', 'metricas',
  'indicadores', 'gestao', 'planilha', 'inteligencia',
  // AI / Atendimento
  'ai', 'artificial', 'atendimento', 'chatbot', 'agente', 'automatizacao', 'bot',
  // Preço / Comercial
  'custa', 'custo', 'preco', 'investimento', 'contrato', 'plano', 'mensalidade',
  // Clientes / Cases
  'clientes', 'casos', 'exemplos', 'parceiros', 'portfolio',
  // Institucional
  'seere', 'empresa', 'somos', 'historia', 'equipe', 'diferencial', 'servicos',
])

// Termos com < 3 chars que o filtro de tamanho eliminaria, mas são discriminadores críticos.
const SHORT_KEYWORDS = new Set(['bi', 'ai', '5g'])

// Mapeia variações de vocabulário para uma keyword canônica por tema.
const TOPIC_SYNONYMS: Record<string, string> = {
  'custa': 'preco',
  'custo': 'preco',
  'valores': 'preco',
  'valor': 'preco',
  'investimento': 'preco',
  'mensalidade': 'preco',
  'plano': 'preco',
  'funciona': 'como',
  'funcionalidade': 'como',
  'trabalha': 'como',
  'mochila': 'wibag',
  'conectividade': 'wibag',
  'sinal': 'wibag',
  'cobertura': 'wibag',
  'usa': 'clientes',
  'usam': 'clientes',
  'casos': 'clientes',
  'exemplos': 'clientes',
}

function normalizeKeywords(keywords: string[]): string[] {
  return keywords.map((kw) => TOPIC_SYNONYMS[kw] ?? kw)
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractKeywords(text: string): string[] {
  const words = normalizeText(text)
    .split(' ')
    .filter((w) => (w.length >= 3 || SHORT_KEYWORDS.has(w)) && !STOPWORDS.has(w))

  const unique = [...new Set(words)]

  const domainKws = unique.filter((w) => DOMAIN_KEYWORDS.has(w))
  const otherKws = unique.filter((w) => !DOMAIN_KEYWORDS.has(w))

  return [...new Set(normalizeKeywords([...domainKws, ...otherKws]))].slice(0, 3)
}

function getMatchingKeywords(keywords: string[]): string[] {
  const topicKws = keywords.filter((kw) => !BRAND_NAMES.has(kw))
  return topicKws.length > 0 ? topicKws : keywords
}

export function hasSpecificContext(question: string): boolean {
  const lower = question.toLowerCase()
  const words = lower.split(/\s+/)
  return CONTEXT_MARKERS.some((marker) =>
    marker.includes(' ') ? lower.includes(marker) : words.includes(marker)
  )
}

export function evaluateApproval(
  _previousResponse: string,
  nextUserMessage: string,
  turnCount: number,
  leadCaptured: boolean
): 'approved' | 'rejected' | 'neutral' {
  if (leadCaptured) return 'approved'

  const normalized = normalizeText(nextUserMessage.trim())
  const raw = nextUserMessage.trim()

  if (
    raw.length <= 35 &&
    NEUTRAL_PATTERNS.some(
      (p) => normalized === p || normalized.startsWith(p + ' ') || normalized.endsWith(' ' + p)
    )
  ) {
    return 'neutral'
  }

  if (turnCount >= 6) return 'approved'

  if (DEEP_ENGAGEMENT_MARKERS.some((m) => normalized.includes(normalizeText(m)))) {
    return 'approved'
  }

  if (raw.endsWith('?') || raw.length > 50) return 'approved'

  return 'neutral'
}

async function getTtlDays(clientId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('widget_clients')
    .select('ttl_cache_days')
    .eq('id', clientId)
    .single()
  return data?.ttl_cache_days ?? 30
}

export async function refreshFamilyStatus(familyId: string): Promise<void> {
  const { count, error } = await supabaseAdmin
    .from('cached_responses')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', familyId)
    .gt('expires_at', new Date().toISOString())

  if (error) {
    console.error('[semantic-cache] refreshFamilyStatus count error:', error)
    return
  }

  const validCount = count ?? 0
  const shouldBeActive = validCount >= 3

  const { error: updateError } = await supabaseAdmin
    .from('question_families')
    .update({ active: shouldBeActive, approved_count: validCount })
    .eq('id', familyId)

  if (updateError) {
    console.error('[semantic-cache] refreshFamilyStatus update error:', updateError)
  } else {
    console.log(
      `[semantic-cache] refreshFamilyStatus family=${familyId} validCount=${validCount} active=${shouldBeActive}`
    )
  }
}

export async function findCachedResponse(
  question: string,
  clientId: string
): Promise<{ text: string; id: string; timesServed: number } | null> {
  const keywords = extractKeywords(question)
  const specificContext = hasSpecificContext(question)

  const matchKws = getMatchingKeywords(keywords)
  console.log(
    `[semantic-cache] FIND "${question.slice(0, 60)}" | keywords=${JSON.stringify(keywords)} | matchKws=${JSON.stringify(matchKws)}`
  )

  if (keywords.length === 0) {
    console.log('[semantic-cache] MISS: nenhuma keyword extraída')
    return null
  }

  const { data: families, error } = await supabaseAdmin
    .from('question_families')
    .select('id, canonical_question, approved_count')
    .eq('client_id', clientId)
    .eq('active', true)
    .order('approved_count', { ascending: false })
    .limit(100)

  if (error) {
    console.error('[semantic-cache] MISS: erro na query de famílias:', error)
    return null
  }

  if (!families || families.length === 0) {
    console.log('[semantic-cache] MISS: nenhuma família ativa no banco')
    return null
  }

  const matched = families.filter((f) => {
    const canonicalKws = extractKeywords(f.canonical_question)
    return matchKws.some((kw) => canonicalKws.includes(kw))
  })

  if (matched.length === 0) {
    console.log(`[semantic-cache] MISS: nenhuma das ${families.length} famílias bateu com ${JSON.stringify(matchKws)}`)
    return null
  }

  const bestFamily = matched[0]
  console.log(`[semantic-cache] família escolhida: "${bestFamily.canonical_question}" (approved=${bestFamily.approved_count})`)

  const { data: responses, error: err2 } = await supabaseAdmin
    .from('cached_responses')
    .select('id, response, times_served')
    .eq('family_id', bestFamily.id)
    .gt('expires_at', new Date().toISOString())
    .limit(10)

  if (err2) {
    console.error('[semantic-cache] MISS: erro na query de respostas:', err2)
    return null
  }

  if (!responses || responses.length === 0) {
    console.log(`[semantic-cache] MISS: família ${bestFamily.id} não tem respostas válidas — recalibrando status`)
    await refreshFamilyStatus(bestFamily.id)
    return null
  }

  const pick = responses[Math.floor(Math.random() * responses.length)]

  console.log(
    `[semantic-cache] HIT family=${bestFamily.id} approved=${bestFamily.approved_count} responses=${responses.length}`
  )

  return { text: pick.response, id: pick.id, timesServed: pick.times_served ?? 0 }
}

export async function incrementTimesServed(id: string, current: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from('cached_responses')
    .update({ times_served: current + 1 })
    .eq('id', id)
  if (error) console.error('[semantic-cache] times_served update failed:', error)
  else console.log(`[semantic-cache] times_served incremented → ${current + 1} (id=${id})`)
}

export async function saveApprovedResponse(
  question: string,
  response: string,
  clientId: string,
  approvalSignal: 'continued_conversation' | 'deep_engagement' | 'long_session' | 'lead_captured'
): Promise<void> {
  if (hasSpecificContext(question)) return

  try {
    const keywords = extractKeywords(question)
    const ttlDays = await getTtlDays(clientId)
    const expiresAt = new Date(Date.now() + ttlDays * 86_400_000).toISOString()

    const { data: families } = await supabaseAdmin
      .from('question_families')
      .select('id, canonical_question, approved_count')
      .eq('client_id', clientId)
      .limit(100)

    let familyId: string | null = null
    let currentCount = 0

    if (families && keywords.length > 0) {
      const matchKws = getMatchingKeywords(keywords)
      const matched = families.filter((f) => {
        const canonicalKws = extractKeywords(f.canonical_question)
        return matchKws.some((kw) => canonicalKws.includes(kw))
      })
      if (matched.length > 0) {
        familyId = matched[0].id
        currentCount = matched[0].approved_count
      }
    }

    if (!familyId) {
      const { data: newFamily, error } = await supabaseAdmin
        .from('question_families')
        .insert({
          client_id: clientId,
          canonical_question: question,
          approved_count: 1,
          active: false,
        })
        .select('id')
        .single()

      if (error || !newFamily) {
        console.error('[semantic-cache] Failed to create family:', error)
        return
      }
      familyId = newFamily.id
    } else {
      const newCount = currentCount + 1
      const { error } = await supabaseAdmin
        .from('question_families')
        .update({ approved_count: newCount, active: newCount >= 3 })
        .eq('id', familyId)

      if (error) {
        console.error('[semantic-cache] Failed to update family:', error)
        return
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from('cached_responses')
      .insert({
        family_id: familyId,
        client_id: clientId,
        question_variant: question,
        response,
        approval_signals: { signal: approvalSignal },
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('[semantic-cache] Failed to insert response:', insertError)
      return
    }

    console.log(`[semantic-cache] Saved (signal=${approvalSignal}, family=${familyId})`)
  } catch (err) {
    console.error('[semantic-cache] saveApprovedResponse error:', err)
  }
}
