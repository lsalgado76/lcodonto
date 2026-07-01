import { HeartHandshake, MapPin, Microscope } from "lucide-react";
import { FadeIn } from "@/components/FadeIn";

const ITEMS = [
  {
    icon: HeartHandshake,
    titulo: "Atendimento humanizado",
    texto: "Cada paciente é único. Tratamos com atenção e cuidado.",
  },
  {
    icon: MapPin,
    titulo: "Duas unidades",
    texto: "Curitiba Centro e Fazenda Rio Grande para sua comodidade.",
  },
  {
    icon: Microscope,
    titulo: "Tecnologia moderna",
    texto: "Equipamentos atuais para diagnóstico preciso e tratamento seguro.",
  },
];

export function Diferenciais() {
  return (
    <section
      id="diferenciais"
      data-section="diferenciais"
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <div className="grid gap-6 sm:grid-cols-3">
        {ITEMS.map(({ icon: Icon, titulo, texto }, i) => (
          <FadeIn key={titulo} delay={i * 0.15} y={30}>
            <div className="h-full rounded-2xl border border-rose-light bg-white p-7 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-light">
                <Icon className="h-6 w-6 text-rose-dark" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-serif text-xl text-charcoal">{titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{texto}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
