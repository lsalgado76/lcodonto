"use client";

import { useState, useEffect, useCallback } from "react";
import type { VisitorContext, SaveContextFn } from "@/lib/visitor-types";

const TTL_DAYS = 60;

function makeKeys(clientId?: string) {
  const suffix = clientId ?? "default";
  return {
    id: `seere_visitor_${suffix}`,
    ctx: `seere_visitor_ctx_${suffix}`,
  };
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para browsers muito antigos sem crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage indisponível (ex: modo privado com storage bloqueado)
  }
}

export function useVisitorMemory(clientId?: string): {
  context: VisitorContext | null;
  saveContext: SaveContextFn;
} {
  const [context, setContext] = useState<VisitorContext | null>(null);

  useEffect(() => {
    const keys = makeKeys(clientId);
    let id: string;
    try {
      id = localStorage.getItem(keys.id) ?? "";
      if (!id) {
        id = generateId();
        localStorage.setItem(keys.id, id);
      }
    } catch {
      id = generateId();
    }

    const stored = readStorage<VisitorContext>(keys.ctx);
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + TTL_DAYS);

    if (stored && new Date(stored.expires_at) > now) {
      // Visita de retorno — incrementa contador e atualiza timestamp
      const updated: VisitorContext = {
        ...stored,
        visit_count: stored.visit_count + 1,
        last_visit: now.toISOString(),
      };
      writeStorage(keys.ctx, updated);
      setContext(updated);
    } else {
      // Primeira visita ou contexto expirado
      const fresh: VisitorContext = {
        visitor_id: id,
        interest: null,
        stage: "novo",
        context_summary: null,
        last_visit: now.toISOString(),
        visit_count: 1,
        converted: false,
        expires_at: expiresAt.toISOString(),
      };
      writeStorage(keys.ctx, fresh);
      setContext(fresh);
    }
  }, [clientId]);

  const ctxKey = makeKeys(clientId).ctx;
  const saveContext = useCallback<SaveContextFn>((updates) => {
    setContext((prev) => {
      if (!prev) return prev;
      const updated: VisitorContext = { ...prev, ...updates };
      writeStorage(ctxKey, updated);
      return updated;
    });
  }, [ctxKey]);

  return { context, saveContext };
}
