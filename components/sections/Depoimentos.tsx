import { Star } from "lucide-react";
import { FadeIn } from "@/components/FadeIn";

const DEPOIMENTOS = [
  {
    texto: "Fui com muito medo e saí sorrindo. A Dra. Lygia é incrível!",
    nome: "Maria S.",
  },
  {
    texto: "Atendimento muito cuidadoso, me senti à vontade do início ao fim.",
    nome: "Carlos R.",
  },
  {
    texto: "Fiz o clareamento e o resultado superou minhas expectativas!",
    nome: "Ana P.",
  },
];

export function Depoimentos() {
  return (
    <section
      id="depoimentos"
      data-section="depoimentos"
      className="bg-rose-light/40 px-6 py-20"
    >
      <FadeIn>
        <h2 className="text-center font-serif text-3xl text-charcoal sm:text-4xl">
          O que dizem nossos pacientes
        </h2>
      </FadeIn>

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-3">
        {DEPOIMENTOS.map((d, i) => (
          <FadeIn key={d.nome} delay={i * 0.1}>
            <div className="h-full rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex gap-0.5 text-rose-dark" aria-label="5 de 5 estrelas">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-charcoal/80">
                &ldquo;{d.texto}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose text-xs font-semibold text-charcoal">
                  {d.nome.charAt(0)}
                </div>
                <span className="text-sm font-medium text-charcoal">{d.nome}</span>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
