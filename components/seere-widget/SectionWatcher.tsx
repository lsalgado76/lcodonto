"use client";

import { useEffect, useRef } from "react";
import defaultOrbComments from "@/content/orb-comments.json";

type CommentEntry = { text: string };
type CommentsMap = Record<string, CommentEntry[]>;

interface SectionWatcherProps {
  isOpen: boolean;
  onBalloon: (text: string) => void;
  /** Override the default institutional orb-comments (e.g. landing-specific pool) */
  comments?: CommentsMap;
  onSectionEnter?: (section: string) => void;
  onSectionLeave?: (section: string) => void;
}

export function SectionWatcher({ isOpen, onBalloon, comments, onSectionEnter, onSectionLeave }: SectionWatcherProps) {
  const orbComments: CommentsMap = comments ?? (defaultOrbComments as CommentsMap);
  const seenRef = useRef(new Set<string>());
  const isOpenRef = useRef(isOpen);
  const onBalloonRef = useRef(onBalloon);
  const onSectionEnterRef = useRef(onSectionEnter);
  const onSectionLeaveRef = useRef(onSectionLeave);
  // Timestamp do último disparo — evita múltiplos disparos em rafaga no mesmo tick
  const lastFiredRef = useRef(0);

  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  useEffect(() => { onBalloonRef.current = onBalloon; }, [onBalloon]);
  useEffect(() => { onSectionEnterRef.current = onSectionEnter; }, [onSectionEnter]);
  useEffect(() => { onSectionLeaveRef.current = onSectionLeave; }, [onSectionLeave]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const section = (entry.target as HTMLElement).dataset.section;
          if (!section) continue;

          if (entry.isIntersecting) {
            onSectionEnterRef.current?.(section);

            if (!(section in orbComments)) continue;
            if (seenRef.current.has(section)) continue;
            if (isOpenRef.current) continue;

            // Debounce: 500ms mínimo entre disparos
            const now = Date.now();
            if (now - lastFiredRef.current < 500) continue;
            lastFiredRef.current = now;

            const pool = orbComments[section];
            const picked = pool[Math.floor(Math.random() * pool.length)];
            seenRef.current.add(section);
            onBalloonRef.current(picked.text);
          } else {
            onSectionLeaveRef.current?.(section);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" }
    );

    document.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []); // observer criado uma vez — refs mantêm os valores atuais

  return null;
}
