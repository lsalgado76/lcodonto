"use client";

import { useState, useCallback } from "react";
import type { VisitorContext, SaveContextFn, InterestPillar } from "@/lib/visitor-types";
import type { BehaviorEvent } from "./useTracker";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const NETWORK_ERROR_MSG =
  "Não consegui me conectar agora. Tente novamente em instantes ou fale " +
  "diretamente com a Seere pelo WhatsApp (41) 99846-5803.";

const INTEREST_PATTERNS: [NonNullable<InterestPillar>, string[]][] = [
  ["wibag", ["wibag", "conectividade", "5g", "internet para evento", "mochila", "fwa", "evento"]],
  ["ai-customer-service", ["chatbot", "bot", "atendimento automático", "ia para atendimento", "agente de ia", "whatsapp automático"]],
  ["bi", ["bi", "dashboard", "relatório", "métricas", "kpi", "dados", "business intelligence"]],
  ["software-dev", ["software sob medida", "sistema", "erp", "crm", "aplicativo", "desenvolvimento", "plataforma"]],
];

function detectInterest(messages: Message[]): NonNullable<InterestPillar> | null {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  for (const [pillar, keywords] of INTEREST_PATTERNS) {
    if (keywords.some((kw) => userText.includes(kw))) return pillar;
  }
  return null;
}

function extractSummary(assistantReply: string): string {
  return assistantReply
    .replace(/\*\*/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 200);
}

// Seções que indicam interesse real — navegação/contato são ignorados
const INTEREST_SECTIONS = ['wibag', 'bi', 'software-dev', 'ai-customer-service', 'software']

function calcDominantSection(events: BehaviorEvent[]): string | null {
  const sectionTime: Record<string, number> = {};
  for (const e of events) {
    if (
      e.type === 'section' &&
      e.section &&
      e.duration_seconds &&
      INTEREST_SECTIONS.includes(e.section)
    ) {
      sectionTime[e.section] = (sectionTime[e.section] ?? 0) + e.duration_seconds;
    }
  }

  if (Object.keys(sectionTime).length > 0) {
    return Object.entries(sectionTime).sort((a, b) => b[1] - a[1])[0][0];
  }

  // Fallback: visitante ainda está na seção (sem duration_seconds ainda)
  // Pegar a última seção de produto visitada na ordem cronológica
  const interestVisited = events
    .filter(e => e.type === 'section' && e.section && INTEREST_SECTIONS.includes(e.section!))
    .map(e => e.section!);
  return interestVisited[interestVisited.length - 1] ?? null;
}

interface UseChatOptions {
  visitorContext?: VisitorContext | null;
  saveContext?: SaveContextFn;
  clientId?: string;
  visitorFingerprint?: string;
  trackChatIntent?: (intent: string) => void;
  getBehaviorEvents?: () => BehaviorEvent[];
}

export function useChat({ visitorContext, saveContext, clientId, visitorFingerprint, trackChatIntent, getBehaviorEvents }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMessage: Message = { role: "user", content: trimmed };
      const nextMessages: Message[] = [...messages, userMessage];
      const isFirstMessage = messages.length === 0;

      setMessages(nextMessages);
      setIsLoading(true);

      // Atualiza stage para 'qualificado' quando o chat é aberto pela primeira vez
      if (isFirstMessage && visitorFingerprint && clientId) {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitor_fingerprint: visitorFingerprint,
            client_id: clientId,
            type: 'stage_update',
            stage: 'qualificado',
          }),
        }).catch(() => {})
      }

      try {
        // Sempre incluir contexto comportamental para que processLead tenha acesso ao capturar lead
        let behaviorContext: object | undefined;
        if (getBehaviorEvents) {
          const events = getBehaviorEvents();
          if (events.length > 0) {
            const dominantSection = calcDominantSection(events);
            const totalSections = [...new Set(events.map(e => e.section).filter(Boolean))] as string[];
            behaviorContext = { events, dominantSection, totalSections };
          }
        }

        const requestBody = {
          messages: nextMessages,
          ...(visitorContext ? { visitorContext } : {}),
          ...(clientId ? { clientId } : {}),
          ...(behaviorContext ? { behaviorContext } : {}),
          conversationId,
        };
        console.log('[useChat] body primeira mensagem:', isFirstMessage ? requestBody : '(não é primeira mensagem)');

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const data: { reply: string; leadCaptured?: unknown; conversationId?: string } = await res.json();

        const updatedMessages: Message[] = [
          ...nextMessages,
          { role: "assistant", content: data.reply },
        ];

        setMessages(updatedMessages);

        if (data.conversationId) setConversationId(data.conversationId);

        if (saveContext && updatedMessages.length >= 2) {
          const updates: Parameters<SaveContextFn>[0] = {};

          if (data.leadCaptured) {
            updates.converted = true;
            updates.stage = "convertido";
          } else {
            if (!visitorContext?.interest && updatedMessages.length >= 4) {
              const detected = detectInterest(updatedMessages);
              if (detected) {
                updates.interest = detected;
                trackChatIntent?.(detected);
              }
            }

            const summary = extractSummary(data.reply);
            if (summary) {
              updates.context_summary = summary;
              if (!visitorContext?.converted) {
                updates.stage = "qualificado";
              }
            }
          }

          if (Object.keys(updates).length > 0) {
            saveContext(updates);
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: NETWORK_ERROR_MSG },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, visitorContext, saveContext, clientId, visitorFingerprint, trackChatIntent, getBehaviorEvents]
  );

  return { messages, sendMessage, isLoading };
}
