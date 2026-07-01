"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { FadeIn } from "@/components/FadeIn";

const FAQ = [
  {
    pergunta: "Vocês atendem plano odontológico?",
    resposta:
      "Trabalhamos com consultas particulares. Entre em contato para saber sobre condições especiais e formas de pagamento.",
  },
  {
    pergunta: "Como funciona o agendamento?",
    resposta:
      "Preencha o formulário ou entre em contato pelo WhatsApp. Confirmamos em até 24h úteis.",
  },
  {
    pergunta: "Qual a diferença entre as duas unidades?",
    resposta:
      "Os mesmos serviços e padrão de atendimento. A Dra. Ligya atende em ambas — escolha a mais conveniente para você.",
  },
  {
    pergunta: "Crianças podem ser atendidas?",
    resposta:
      "Sim! Atendemos pacientes de todas as idades com cuidado especial para os pequenos.",
  },
  {
    pergunta: "Como me preparar para a primeira consulta?",
    resposta:
      "Traga documentos de identificação e, se tiver, exames anteriores. O restante cuidamos juntos.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" data-section="faq" className="mx-auto max-w-3xl px-6 py-20">
      <FadeIn>
        <h2 className="text-center font-serif text-3xl text-charcoal sm:text-4xl">
          Perguntas frequentes
        </h2>
      </FadeIn>

      <div className="mt-10 divide-y divide-rose-light">
        {FAQ.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.pergunta}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-4 py-5 text-left"
              >
                <span className="font-medium text-charcoal">{item.pergunta}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-rose-dark transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 text-sm leading-relaxed text-charcoal/70">
                      {item.resposta}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
