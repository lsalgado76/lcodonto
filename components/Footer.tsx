import Image from "next/image";
import { Mail } from "lucide-react";
import { WHATSAPP_LINK } from "@/content/site-config";

export function Footer() {
  return (
    <footer className="bg-charcoal px-6 py-12 text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-sm">
            <Image
              src="/lc_odonto-logo.png"
              alt="LC Odontologia"
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="font-serif text-xl text-white">LC Odontologia</p>
            <p className="mt-1 text-sm">Dra. Ligya Camila Salgado — CRO 22.143</p>
          </div>
        </div>

        <nav className="flex flex-wrap justify-center gap-6 text-sm sm:justify-start" aria-label="Links rápidos">
          <a href="#servicos" className="cursor-pointer transition-colors duration-200 hover:text-rose">
            Serviços
          </a>
          <a href="#unidades" className="cursor-pointer transition-colors duration-200 hover:text-rose">
            Unidades
          </a>
          <a href="#agendamento" className="cursor-pointer transition-colors duration-200 hover:text-rose">
            Agendamento
          </a>
        </nav>

        <div className="flex flex-col items-center gap-2 text-sm sm:items-end">
          <a
            href="https://instagram.com/lcodont"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer transition-colors duration-200 hover:text-rose"
          >
            @lcodont
          </a>
          <a
            href="mailto:lcoortodontia@gmail.com"
            className="inline-flex cursor-pointer items-center gap-1.5 transition-colors duration-200 hover:text-rose"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            lcoortodontia@gmail.com
          </a>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer transition-colors duration-200 hover:text-rose"
          >
            WhatsApp
          </a>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-white/50">
        © 2026 LC Odontologia — Dra. Ligya Camila Salgado
      </p>
    </footer>
  );
}
