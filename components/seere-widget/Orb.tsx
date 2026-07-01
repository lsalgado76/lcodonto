"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation, MotionConfig } from "motion/react";

interface OrbProps {
  isOpen: boolean;
  onOpen: () => void;
}

const ORB_COLOR = "#D94F6B";
const ORB_COLOR_LIGHT = "#E56A85";
const ORB_GLOW = "rgba(217, 79, 107, 0.4)";

export function Orb({ isOpen, onOpen }: OrbProps) {
  const wasOpen = useRef(false);
  // false durante "disappearing" (chat aberto) e "reappearing" (logo após fechar)
  const [idleActive, setIdleActive] = useState(true);
  const jumpControls = useAnimation();
  const jumpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true;
      setIdleActive(false);
    } else if (wasOpen.current) {
      // acabou de fechar — aguarda reaparecimento antes de retomar o loop idle
      const timer = setTimeout(() => setIdleActive(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Salto ocasional — loop com delay randomizado entre 8 e 15 segundos
  useEffect(() => {
    if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
    jumpControls.stop();

    if (!isOpen && idleActive) {
      let active = true;
      const schedule = () => {
        const delay = 8000 + Math.random() * 7000;
        jumpTimerRef.current = setTimeout(async () => {
          if (!active) return;
          await jumpControls.start({
            y: [0, -10, 2, 0],
            transition: { duration: 0.55, times: [0, 0.4, 0.75, 1], ease: "easeOut" },
          });
          if (active) schedule();
        }, delay);
      };
      schedule();
      return () => {
        active = false;
        if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
      };
    }

    return () => {
      if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
    };
  }, [isOpen, idleActive, jumpControls]);

  return (
    // reducedMotion="never" sobrescreve o MotionConfig global (reducedMotion="user")
    // só pra orbe — ela é o mascote do widget, deve "respirar" mesmo para quem
    // ativou "reduzir movimento" no SO. O resto do site continua respeitando a preferência.
    <MotionConfig reducedMotion="never">
    {/* Contêiner de referência 56×56. SVG sobrepõe -4px em cada lado (64×64) */}
    <div className="relative" style={{ width: 56, height: 56 }}>

      {/* Camada de posição: translada centro → início do S ao abrir, retorna ao fechar */}
      <motion.div
        className="absolute inset-0"
        animate={isOpen ? { x: 12, y: -20 } : { x: 0, y: 0 }}
        transition={
          isOpen
            ? { duration: 0.2, ease: "easeIn" }
            : { duration: 0.35, ease: "easeOut", delay: 0.2 }
        }
      >
        {/* Wrapper do salto ocasional — y independente da pulsação do botão */}
        <motion.div className="absolute inset-0" animate={jumpControls}>

          {/* Esfera: pulsação + hover squash + opacity breathing */}
          <motion.button
            aria-label="Abrir chat LC Odontologia"
            onClick={!isOpen ? onOpen : undefined}
            className="absolute inset-0 rounded-full border-0 outline-none flex items-center justify-center
                       focus-visible:ring-2 focus-visible:ring-[#D94F6B] focus-visible:ring-offset-2"
            style={{
              background: `linear-gradient(to bottom, ${ORB_COLOR_LIGHT}, ${ORB_COLOR})`,
              boxShadow: `0 8px 24px ${ORB_GLOW}, 0 2px 8px rgba(0, 0, 0, 0.10)`,
              cursor: isOpen ? "default" : "pointer",
            }}
            whileHover={!isOpen ? { scale: 1.1 } : undefined}
            animate={
              isOpen
                ? { opacity: 0, scale: 0, x: 0, y: 0 }
                : idleActive
                  ? {
                      // Opacity breathing — ciclo lento (5s), independente da pulsação
                      opacity: [1, 0.84, 1],
                      // Pulsação original de escala e drift
                      scale: [1, 1.07, 0.97, 1.04, 1],
                      x: [0, 2, -1.5, 1, 0],
                      y: [0, -3, 1, -2, 0],
                    }
                  : { opacity: 1, scale: 1, x: 0, y: 0 }
            }
            transition={
              isOpen
                ? { duration: 0.2, ease: "easeIn" }
                : idleActive
                  ? {
                      // Per-property transitions — ciclos desacoplados para parecer orgânico
                      opacity: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                      scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 },
                      x: { duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 },
                      y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 },
                    }
                  : { duration: 0.35, ease: "easeOut", delay: 0.2 }
            }
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2C9.5 2 7 3.5 6 6C5 8 5 10 5.5 12C6 14 6.5 16 6 18C5.7 19.5 6.5 21 8 21C9 21 9.5 20 10 19C10.5 18 11 17 12 17C13 17 13.5 18 14 19C14.5 20 15 21 16 21C17.5 21 18.3 19.5 18 18C17.5 16 18 14 18.5 12C19 10 19 8 18 6C17 3.5 14.5 2 12 2Z"
                fill="white"
                fillOpacity="0.95"
              />
            </svg>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Traço do "C" — pathLength 0→1 ao abrir, retrai de volta ao ponto inicial ao fechar */}
      <svg
        className="absolute pointer-events-none"
        style={{ top: -4, left: -4, width: 64, height: 64 }}
        viewBox="0 0 40 50"
        fill="none"
        aria-hidden="true"
      >
        <motion.path
          d="M 35 15 C 25 5, 5 5, 5 25 C 5 45, 25 45, 35 35"
          stroke={ORB_COLOR}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={
            isOpen
              ? { pathLength: 1, opacity: 1 }
              : { pathLength: 0, opacity: 0 }
          }
          transition={
            isOpen
              ? {
                  pathLength: { delay: 0.15, duration: 0.55, ease: "easeOut" },
                  opacity: { delay: 0.15, duration: 0.05 },
                }
              : {
                  pathLength: { duration: 0.2, ease: "easeIn" },
                  opacity: { duration: 0.1, delay: 0.12 },
                }
          }
        />
      </svg>
    </div>
    </MotionConfig>
  );
}
