"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { BUTTON_MICRO } from "@/lib/ui";

const LINKS = [
  { href: "#servicos", label: "Serviços" },
  { href: "#unidades", label: "Unidades" },
  { href: "#depoimentos", label: "Depoimentos" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu automatically after an in-page nav click
  const closeMenu = () => setMenuOpen(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-30 px-3 pt-3 sm:px-4"
    >
      <div
        className={`mx-auto max-w-6xl rounded-3xl border transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled
            ? "border-white/60 bg-white/90 shadow-md backdrop-blur-xl"
            : "border-white/40 bg-white/70 shadow-sm backdrop-blur-md"
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <a href="#hero" className="flex cursor-pointer items-center gap-2.5">
            <Image
              src="/lc_odonto-logo.png"
              alt="LC Odontologia"
              width={44}
              height={44}
              priority
              className="h-10 w-10 object-contain sm:h-11 sm:w-11"
            />
            <span className="hidden font-serif text-lg text-charcoal sm:inline">
              LC Odontologia
            </span>
          </a>

          <nav
            className="hidden items-center gap-7 text-sm font-medium text-charcoal/80 md:flex"
            aria-label="Navegação principal"
          >
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="cursor-pointer transition-colors duration-200 hover:text-rose-dark"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#agendamento"
              className={`hidden cursor-pointer rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-charcoal shadow-sm transition-colors duration-200 hover:bg-rose-dark hover:text-white sm:inline-block ${BUTTON_MICRO}`}
            >
              Agendar
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              className="cursor-pointer p-2 text-charcoal md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden md:hidden"
            >
              <nav
                className="flex flex-col gap-1 px-4 pb-4 text-sm font-medium text-charcoal/80"
                aria-label="Navegação móvel"
              >
                {LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="cursor-pointer rounded-lg px-2 py-2.5 transition-colors duration-200 hover:bg-rose-light hover:text-rose-dark"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="#agendamento"
                  onClick={closeMenu}
                  className="mt-1 cursor-pointer rounded-full bg-rose px-5 py-2.5 text-center font-semibold text-charcoal shadow-sm transition-colors duration-200 hover:bg-rose-dark hover:text-white"
                >
                  Agendar consulta
                </a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
