"use client";

import { useState } from "react";
import {
  Stethoscope,
  Sparkles,
  Wrench,
  Sun,
  AlignCenter,
  Syringe,
  ChevronDown,
} from "lucide-react";
import { FadeIn } from "@/components/FadeIn";
import { SERVICOS } from "@/content/site-config";

const ICONS = [Stethoscope, Sparkles, Wrench, Sun, AlignCenter, Syringe];

export function Servicos() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="servicos"
      data-section="servicos"
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <FadeIn>
        <h2 className="text-center font-serif text-3xl text-charcoal sm:text-4xl">
          Nossos serviços
        </h2>
      </FadeIn>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICOS.map((servico, i) => {
          const Icon = ICONS[i];
          const isOpen = openIndex === i;
          return (
            <FadeIn key={servico.nome} delay={(i % 3) * 0.08}>
              <div className="group h-full rounded-2xl border border-t-2 border-rose-light border-t-transparent bg-white p-6 shadow-sm transition-[transform,box-shadow,border-color] duration-250 ease-out hover:-translate-y-1 hover:border-t-rose hover:shadow-[0_12px_32px_rgba(232,180,184,0.25)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-light">
                  <Icon
                    className="h-5 w-5 text-rose-dark transition-transform duration-200 group-hover:scale-110"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-4 font-serif text-lg text-charcoal">{servico.nome}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-charcoal/70">
                  {servico.resumo}
                </p>

                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="mt-4 flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-rose-dark transition-colors duration-200 hover:text-charcoal"
                >
                  Saiba mais
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <p className="overflow-hidden pt-3 text-sm leading-relaxed text-charcoal/70">
                    {servico.detalhe}
                  </p>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}
