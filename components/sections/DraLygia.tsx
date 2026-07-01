import Image from "next/image";
import { FadeIn } from "@/components/FadeIn";

export function DraLygia() {
  return (
    <section
      id="dra-lygia"
      data-section="dra-lygia"
      className="bg-rose-light/40 px-6 py-20"
    >
      <div className="mx-auto grid max-w-5xl items-center gap-10 sm:grid-cols-[220px_1fr]">
        <FadeIn className="flex justify-center sm:justify-start">
          <div className="relative h-44 w-44 overflow-hidden rounded-full shadow-md ring-4 ring-white">
            <Image
              src="/foto-camila.png"
              alt="Dra. Lygia Camila Salgado"
              fill
              sizes="176px"
              className="object-cover"
              style={{ objectPosition: "50% 22%" }}
            />
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <h2 className="font-serif text-3xl text-charcoal sm:text-4xl">
            Dra. Lygia Camila Salgado
          </h2>
          <p className="mt-1 text-sm font-medium text-rose-dark">
            Cirurgiã-Dentista — CRO 22.143
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-charcoal/80">
            &ldquo;Com dedicação e cuidado, ofereço atendimento odontológico
            completo focado no bem-estar e na saúde bucal de cada paciente.
            Meu compromisso é proporcionar uma experiência acolhedora, sem
            medos e com resultados que transformam sorrisos.&rdquo;
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
