import { WhatsappIcon } from "@/components/icons/WhatsappIcon";
import { FadeIn } from "@/components/FadeIn";
import { WHATSAPP_LINK } from "@/content/site-config";
import { BUTTON_MICRO } from "@/lib/ui";

export function CtaFinal() {
  return (
    <section className="bg-rose px-6 py-20">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-3xl text-charcoal sm:text-4xl">
          Pronto para transformar seu sorriso?
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="#agendamento"
            className={`cursor-pointer rounded-full bg-charcoal px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-charcoal/85 ${BUTTON_MICRO}`}
          >
            Agendar agora
          </a>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-charcoal/30 px-7 py-3.5 text-sm font-semibold text-charcoal transition-colors duration-200 hover:border-charcoal hover:bg-white/40 ${BUTTON_MICRO}`}
          >
            <WhatsappIcon className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </FadeIn>
    </section>
  );
}
