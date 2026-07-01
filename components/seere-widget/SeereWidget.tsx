"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Orb } from "./Orb";
import { ChatPanel } from "./ChatPanel";
import { SectionWatcher } from "./SectionWatcher";
import { useVisitorMemory } from "./useVisitorMemory";
import { useTracker } from "./useTracker";
import { proactiveComments } from "@/content/orb-proactive-comments";

interface SeereWidgetProps {
  clientId?: string;
  orbComments?: Record<string, Array<{ text: string }>>;
}

export function SeereWidget({ clientId, orbComments }: SeereWidgetProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [balloon, setBalloon] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string>('');
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOpenRef = useRef(isOpen);
  const { context, saveContext } = useVisitorMemory(clientId);

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  useEffect(() => {
    if (context?.visitor_id && !visitorId) {
      setVisitorId(context.visitor_id);
    }
  }, [context?.visitor_id]);

  const { trackSectionEnter, trackSectionLeave, trackChatIntent, getBehaviorEvents } = useTracker({
    visitorFingerprint: visitorId,
    clientId: clientId ?? '',
  });

  const showBalloon = useCallback((text: string) => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setBalloon(text);
    dismissTimerRef.current = setTimeout(() => setBalloon(null), 6000);
  }, []);

  function handleOpen() {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setBalloon(null);
    setIsOpen(true);
  }

  // Evento global para abrir o widget programaticamente
  useEffect(() => {
    const listener = () => handleOpen();
    window.addEventListener("seere:open", listener);
    return () => window.removeEventListener("seere:open", listener);
  }, []);

  // Balão proativo após 20s numa seção
  useEffect(() => {
    const handleProactive = (e: Event) => {
      const { section } = (e as CustomEvent<{ section: string }>).detail;

      if (isOpenRef.current) return;

      const comment = proactiveComments[section];
      if (!comment) return;

      // Uma vez por sessão por seção — só marca depois de confirmar que há
      // comentário, senão uma seção sem match queima a flag sem nunca mostrar nada.
      const key = `seere_proactive_${clientId ?? 'default'}_${section}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');

      showBalloon(comment);
    };

    window.addEventListener('seere:proactive', handleProactive);
    return () => window.removeEventListener('seere:proactive', handleProactive);
  }, [clientId, showBalloon]);

  return (
    <>
      <SectionWatcher
        isOpen={isOpen}
        onBalloon={showBalloon}
        comments={orbComments}
        onSectionEnter={trackSectionEnter}
        onSectionLeave={trackSectionLeave}
      />

      {/* Balão proativo — clicável para abrir o chat */}
      <AnimatePresence>
        {balloon && !isOpen && (
          <motion.div
            key={balloon}
            className="fixed z-50 max-w-55 rounded-xl border border-[#1E5A8C]/30
                       bg-white shadow-lg text-sm leading-snug text-[#2D4A5C] cursor-pointer"
            style={{ bottom: 90, right: 24 }}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={handleOpen}
            role="button"
            aria-label="Abrir chat"
          >
            <span className="block px-3 py-2.5">{balloon}</span>
            <button
              onClick={(ev) => { ev.stopPropagation(); setBalloon(null); }}
              aria-label="Fechar"
              className="absolute top-1.5 right-2 text-xs text-gray-300 hover:text-gray-500 leading-none"
            >
              ✕
            </button>
            {/* Caret apontando para a orbe */}
            <span
              className="absolute -bottom-1.75 right-4 w-3 h-3 rotate-45 bg-white
                         border-b border-r border-[#1E5A8C]/30"
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orbe: z-40 — fica sob o painel quando aberto */}
      <div className="fixed bottom-6 right-6 z-40">
        <Orb isOpen={isOpen} onOpen={handleOpen} />
      </div>

      {/* Painel: z-50 */}
      <ChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        visitorContext={context}
        saveContext={saveContext}
        clientId={clientId}
        visitorFingerprint={visitorId}
        trackChatIntent={trackChatIntent}
        getBehaviorEvents={getBehaviorEvents}
      />
    </>
  );
}
