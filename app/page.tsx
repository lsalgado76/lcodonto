import { Header } from "@/components/Header";
import { Hero } from "@/components/sections/Hero";
import { Diferenciais } from "@/components/sections/Diferenciais";
import { Servicos } from "@/components/sections/Servicos";
import { DraLigya } from "@/components/sections/DraLigya";
import { Agendamento } from "@/components/sections/Agendamento";
import { Unidades } from "@/components/sections/Unidades";
import { Depoimentos } from "@/components/sections/Depoimentos";
import { Faq } from "@/components/sections/Faq";
import { CtaFinal } from "@/components/sections/CtaFinal";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1">
        <Hero />
        <Diferenciais />
        <Servicos />
        <DraLigya />
        <Agendamento />
        <Unidades />
        <Depoimentos />
        <Faq />
        <CtaFinal />
      </main>
      <Footer />
    </div>
  );
}
