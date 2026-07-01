"use client";

import { motion } from "motion/react";
import { BUTTON_MICRO } from "@/lib/ui";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

// ponytail: always autoplays, even under prefers-reduced-motion — client decision
// (traded off against the accessibility guideline of pausing background video for
// visitors who asked their OS to reduce motion).
export function Hero() {
  return (
    <section
      id="hero"
      data-section="hero"
      className="relative isolate min-h-[85dvh] overflow-hidden bg-charcoal sm:min-h-[92dvh]"
    >
      <div className="absolute inset-3 overflow-hidden rounded-4xl border border-white/15 sm:inset-4 sm:rounded-[3rem]">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/videos/hero-smile-poster.jpg"
          className="h-full w-full object-cover"
          src="/videos/hero-smile.mp4"
        />
        <div className="absolute inset-0 bg-linear-to-r from-charcoal/80 via-charcoal/35 to-charcoal/10" />
        <div className="absolute inset-0 bg-linear-to-t from-charcoal/60 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[85dvh] max-w-6xl flex-col justify-center px-6 pt-24 pb-16 sm:min-h-[92dvh] sm:px-10 sm:pt-28">
        <div className="max-w-xl">
          <motion.p
            {...fadeUp(0)}
            className="font-sans text-sm font-semibold uppercase tracking-widest text-rose-light"
          >
            LC Odontologia
          </motion.p>
          <motion.h1
            {...fadeUp(0)}
            className="mt-3 font-serif text-4xl leading-tight text-white sm:text-5xl"
          >
            Seu sorriso merece cuidado especializado
          </motion.h1>
          <motion.p
            {...fadeUp(0.15)}
            className="mt-5 max-w-md text-lg leading-relaxed text-white/85"
          >
            Atendimento humanizado e personalizado em Curitiba e Fazenda Rio Grande
          </motion.p>
          <motion.div {...fadeUp(0.3)} className="mt-8 flex flex-wrap gap-4">
            <a
              href="#agendamento"
              className={`cursor-pointer rounded-full bg-rose px-7 py-3.5 text-sm font-semibold text-charcoal shadow-sm transition-colors duration-200 hover:bg-rose-dark hover:text-white ${BUTTON_MICRO}`}
            >
              Agendar consulta
            </a>
            <a
              href="#servicos"
              className={`cursor-pointer rounded-full border border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:border-white hover:bg-white/10 ${BUTTON_MICRO}`}
            >
              Conheça os serviços
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
