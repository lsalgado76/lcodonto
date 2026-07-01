import { AgendamentoForm } from "@/components/AgendamentoForm";
import { WhatsappIcon } from "@/components/icons/WhatsappIcon";
import { FadeIn } from "@/components/FadeIn";
import { WHATSAPP_LINK } from "@/content/site-config";
import { BUTTON_MICRO } from "@/lib/ui";

export function Agendamento() {
  return (
    <section
      id="agendamento"
      data-section="agendamento"
      className="bg-linear-to-b from-white to-rose-light/40 px-6 py-20"
    >
      <div className="mx-auto max-w-xl">
        <FadeIn className="text-center">
          <h2 className="font-serif text-3xl text-charcoal sm:text-4xl">
            Agende sua consulta
          </h2>
          <p className="mt-3 text-charcoal/70">
            Escolha a unidade e o serviço desejado. Entraremos em contato para
            confirmar.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-8">
          <AgendamentoForm />
        </FadeIn>

        <FadeIn delay={0.15} className="mt-6 text-center">
          <p className="text-sm text-charcoal/60">Prefere falar direto?</p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full border border-charcoal/15 px-6 py-3 text-sm font-semibold text-charcoal transition-colors duration-200 hover:border-rose-dark hover:text-rose-dark ${BUTTON_MICRO}`}
          >
            <WhatsappIcon className="h-4 w-4" />
            WhatsApp
          </a>
        </FadeIn>
      </div>
    </section>
  );
}
