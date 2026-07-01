import { MapPin } from "lucide-react";
import { FadeIn } from "@/components/FadeIn";
import { UNIDADES } from "@/content/site-config";

export function Unidades() {
  return (
    <section
      id="unidades"
      data-section="unidades"
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <FadeIn>
        <h2 className="text-center font-serif text-3xl text-charcoal sm:text-4xl">
          Nossas unidades
        </h2>
      </FadeIn>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {UNIDADES.map((u, i) => (
          <FadeIn key={u.nome} delay={i * 0.1}>
            <div className="h-full rounded-2xl border border-rose-light bg-white p-7 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-light">
                <MapPin className="h-5 w-5 text-rose-dark" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-charcoal">{u.nome}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
                {u.endereco}
                <br />
                {u.cidade}
              </p>
              <p className="mt-3 text-sm text-charcoal/60">
                Horário: consulte disponibilidade
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(u.mapsQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-rose-dark transition-colors duration-200 hover:text-charcoal"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Ver no mapa
              </a>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
