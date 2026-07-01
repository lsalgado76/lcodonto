"use client";

import { useState, useRef, useEffect, useMemo, useCallback, KeyboardEvent } from "react";
import { motion } from "motion/react";
import { useChat } from "./useChat";
import type { VisitorContext, SaveContextFn } from "@/lib/visitor-types";
import type { BehaviorEvent } from "./useTracker";

// Reveals `text` word-by-word. Each step commits to DOM before calling `onStep`,
// so the parent's scrollToBottom always sees the updated scrollHeight.
function TypewriterText({ text, onStep }: { text: string; onStep: () => void }) {
  const tokens = useMemo(
    () => (text ? text.match(/\S+\s*/g) ?? [text] : []),
    [text]
  );
  const [count, setCount] = useState(0);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  useEffect(() => {
    setCount(0);
  }, [text]);

  useEffect(() => {
    if (count >= tokens.length) return;
    const id = setTimeout(() => setCount((n) => n + 1), 40);
    return () => clearTimeout(id);
  }, [count, tokens.length]);

  // Runs after DOM commit for this count — scrollHeight is already updated
  useEffect(() => {
    if (count > 0) onStepRef.current();
  }, [count]);

  return <>{tokens.slice(0, count).join("")}</>;
}

interface ChatPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  visitorContext?: VisitorContext | null;
  saveContext?: SaveContextFn;
  clientId?: string;
  visitorFingerprint?: string;
  trackChatIntent?: (intent: string) => void;
  getBehaviorEvents?: () => BehaviorEvent[];
}

export function ChatPanel({ isOpen = true, onClose, visitorContext, saveContext, clientId, visitorFingerprint, trackChatIntent, getBehaviorEvents }: ChatPanelProps) {
  const { messages, sendMessage, isLoading } = useChat({ visitorContext, saveContext, clientId, visitorFingerprint, trackChatIntent, getBehaviorEvents });
  const [input, setInput] = useState("");
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);
  const isProgrammaticScroll = useRef(false);
  const prevMessagesLength = useRef(0);

  const scrollToBottom = useCallback(() => {
    if (userScrolledUp.current) return;
    const el = scrollAreaRef.current;
    if (!el) return;
    isProgrammaticScroll.current = true;
    el.scrollTop = el.scrollHeight;
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 0);
  }, []);

  // Distinguish user scroll from programmatic scroll
  const handleScroll = useCallback(() => {
    if (isProgrammaticScroll.current) return;
    const el = scrollAreaRef.current;
    if (!el) return;
    userScrolledUp.current = el.scrollHeight - el.scrollTop - el.clientHeight > 60;
  }, []);

  // Detect new messages: start typewriter for assistant replies, reset scroll intent
  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLength.current;
    prevMessagesLength.current = messages.length;

    if (!isNewMessage) return;

    const last = messages[messages.length - 1];
    userScrolledUp.current = false;

    if (last?.role === "assistant" && !isLoading) {
      setAnimatingIndex(messages.length - 1);
    }

    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Scroll when loading indicator appears (user just sent a message)
  useEffect(() => {
    if (isLoading) {
      userScrolledUp.current = false;
      scrollToBottom();
    }
  }, [isLoading, scrollToBottom]);

  function handleSend() {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-black/10"
      style={{
        width: "340px",
        height: "520px",
        transformOrigin: "bottom right",
        pointerEvents: isOpen ? "auto" : "none",
      }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
      transition={
        isOpen
          ? { type: "spring", bounce: 0.3, duration: 0.4, delay: 0.5 }
          : { duration: 0.2, ease: "easeIn" }
      }
    >
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 shrink-0"
        style={{ background: "#1E5A8C" }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: "#E8923C" }}
        />
        <span className="flex-1 text-white text-sm font-semibold tracking-wide">
          Agente IA · LC Odontologia
        </span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fechar chat"
            className="text-white/70 hover:text-white transition-colors leading-none text-lg shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 bg-white"
      >
        {messages.length === 0 && (
          <p className="text-xs text-center text-gray-400 mt-6 px-2">
            Olá! Sou a IA da LC Odonto. Como posso ajudar?
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "text-white rounded-br-sm"
                  : "text-gray-800 rounded-bl-sm"
              }`}
              style={
                m.role === "user"
                  ? { background: "#1E5A8C" }
                  : { background: "#F0F4F8", border: "1px solid #E2E8F0" }
              }
            >
              {m.role === "assistant" && i === animatingIndex ? (
                <TypewriterText text={m.content} onStep={scrollToBottom} />
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-400"
              style={{ background: "#F0F4F8", border: "1px solid #E2E8F0" }}
            >
              digitando...
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div aria-hidden="true" />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 bg-white shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          disabled={isLoading}
          className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-[#1E5A8C] disabled:opacity-50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          aria-label="Enviar"
          className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
          style={{ background: "#E8923C" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 7h12M7.5 1.5L13 7l-5.5 5.5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Footer */}
      <div className="bg-white pb-2 text-center shrink-0 select-none">
        <span className="text-[10px] text-gray-400 tracking-wide">
          Powered by{" "}
          <span className="text-gray-400 font-medium">Seere Digital</span>
        </span>
      </div>
    </motion.div>
  );
}
