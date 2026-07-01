import { NextRequest, NextResponse, after } from "next/server";
import { guardRequest } from "@/lib/api-guard";
import { callClaude as callLLM } from "@/lib/anthropic";
// import { callGemini as callLLM } from "@/lib/gemini";
import { getSystemPrompt } from "@/content/system-prompt";
import { processLead } from "@/lib/process-lead";
import type { VisitorContext } from "@/lib/visitor-types";
import {
  hasSpecificContext,
  findCachedResponse,
  saveApprovedResponse,
  evaluateApproval,
  incrementTimesServed,
} from "@/lib/semantic-cache";
import { supabaseAdmin } from "@/lib/supabase/server";

// Lazy singleton: lê a env var no primeiro request (não em build time)
let _clientId: string | undefined;
function getClientId(): string {
  if (_clientId !== undefined) return _clientId;
  const id = process.env.WIDGET_CLIENT_ID;
  if (!id) throw new Error("WIDGET_CLIENT_ID não configurado — defina no .env.local");
  return (_clientId = id);
}

interface BehaviorContext {
  dominantSection: string | null
  totalSections: string[]
  events: unknown[]
}

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  visitorContext?: VisitorContext;
  clientId?: string; // sent by widget; landing uses NEXT_PUBLIC_WIDGET_CLIENT_ID_LANDING
  behaviorContext?: BehaviorContext;
  conversationId?: string | null;
}

async function saveConversation({
  conversationId,
  clientId,
  visitorFingerprint,
  messages,
  leadId,
}: {
  conversationId: string | null
  clientId: string
  visitorFingerprint: string
  messages: Array<{ role: string; content: string }>
  leadId?: string
}): Promise<string | null> {
  const { data: session } = await supabaseAdmin
    .from('visitor_sessions')
    .select('id')
    .eq('visitor_fingerprint', visitorFingerprint)
    .eq('client_id', clientId)
    .maybeSingle()

  if (conversationId) {
    await supabaseAdmin
      .from('conversations')
      .update({
        messages,
        turn_count: messages.filter((m) => m.role === 'user').length,
        ...(leadId ? { lead_id: leadId, converted: true } : {}),
      })
      .eq('id', conversationId)
    return conversationId
  } else {
    const { data } = await supabaseAdmin
      .from('conversations')
      .insert({
        client_id: clientId,
        session_id: session?.id ?? null,
        messages,
        turn_count: 1,
        converted: false,
      })
      .select('id')
      .single()
    return data?.id ?? null
  }
}


const FALLBACK_REPLY =
  "No momento não consigo processar sua mensagem. " +
  "Entre em contato diretamente com a Seere pelo WhatsApp (41) 99846-5803.";

export async function POST(req: NextRequest) {
  // Passo 0: rate limit + origin check
  const guard = await guardRequest(req, "chat");
  if (guard) return guard;

  try {
    const body: ChatRequest = await req.json();
    const { messages, visitorContext, clientId: bodyClientId, behaviorContext, conversationId: incomingConversationId } = body;
    console.log('[chat] behaviorContext recebido:', behaviorContext ?? null);

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: FALLBACK_REPLY });
    }

    // Landing widget sends its own clientId; institutional falls back to WIDGET_CLIENT_ID env
    const clientId = bodyClientId ?? getClientId();
    const lastMsg = messages[messages.length - 1];

    // Passo 1: avaliar aprovação da resposta anterior (se houver conversa de 3+ turnos)
    if (messages.length >= 3) {
      const prevAssistant = messages[messages.length - 2];
      const prevUserQuestion = messages[messages.length - 3];
      if (prevAssistant.role === "assistant" && prevUserQuestion.role === "user") {
        const approval = evaluateApproval(
          prevAssistant.content,
          lastMsg.content,
          messages.length,
          false
        );
        if (approval === "approved") {
          after(() =>
            saveApprovedResponse(
              prevUserQuestion.content,
              prevAssistant.content,
              clientId,
              "continued_conversation"
            )
          );
        }
      }
    }

    // Passo 2: tentar responder do cache (só para perguntas genéricas sem contexto comportamental)
    // Se há behaviorContext, a resposta deve ser personalizada — bypass do cache
    if (!hasSpecificContext(lastMsg.content) && !behaviorContext) {
      const hit = await findCachedResponse(lastMsg.content, clientId);
      if (hit) {
        console.log(`[/api/chat] fromCache=true question="${lastMsg.content.slice(0, 60)}"`);
        after(async () => {
          await incrementTimesServed(hit.id, hit.timesServed);
          // Cache hit = sinal de aprovação implícita: reforça approved_count da família
          // e adiciona a pergunta atual como nova variante no pool de cached_responses.
          await saveApprovedResponse(lastMsg.content, hit.text, clientId, "continued_conversation");
        });
        return NextResponse.json({ reply: hit.text, fromCache: true });
      }
    }

    // Passo 3: chamar LLM normalmente
    const system = getSystemPrompt(visitorContext, clientId, behaviorContext);
    const result = await callLLM(system, messages);

    const allMessages = [
      ...messages,
      { role: "assistant" as const, content: result.reply },
    ];

    // Passo 4: persistir conversa (nunca bloqueia o fluxo)
    let conversationId: string | null = incomingConversationId ?? null;
    const visitorFingerprint = visitorContext?.visitor_id ?? '';
    if (visitorFingerprint && clientId) {
      try {
        conversationId = await saveConversation({
          conversationId,
          clientId,
          visitorFingerprint,
          messages: allMessages,
        });
      } catch (err) {
        console.error('[chat] saveConversation falhou (não crítico):', err);
      }
    }

    if (result.leadCaptured) {
      after(async () => {
        await processLead({
          ...result.leadCaptured!,
          clientId,
          visitorFingerprint,
          behaviorEvents: behaviorContext?.events ?? [],
          interest: behaviorContext?.dominantSection ?? null,
        });

        // processLead just wrote lead_id into visitor_sessions — fetch it to link conversation
        if (conversationId && visitorFingerprint && clientId) {
          try {
            const { data: session } = await supabaseAdmin
              .from('visitor_sessions')
              .select('lead_id')
              .eq('visitor_fingerprint', visitorFingerprint)
              .eq('client_id', clientId)
              .maybeSingle();
            if (session?.lead_id) {
              await saveConversation({
                conversationId,
                clientId,
                visitorFingerprint,
                messages: allMessages,
                leadId: session.lead_id,
              });
            }
          } catch (err) {
            console.error('[chat] saveConversation (lead) falhou (não crítico):', err);
          }
        }

        saveApprovedResponse(lastMsg.content, result.reply, clientId, "lead_captured");
      });
    }

    return NextResponse.json({
      reply: result.reply,
      fromCache: false,
      conversationId,
      ...(result.leadCaptured && { leadCaptured: result.leadCaptured }),
    });
  } catch (error) {
    console.error("[/api/chat]", error);
    return NextResponse.json({ reply: FALLBACK_REPLY });
  }
}
