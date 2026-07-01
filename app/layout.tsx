import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { MotionConfig } from "motion/react";
import { SeereWidget } from "@/components/seere-widget/SeereWidget";
import orbComments from "@/content/orb-comments-clinica.json";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LC Odontologia — Dra. Ligya Camila Salgado",
  description:
    "Atendimento odontológico humanizado e personalizado em Curitiba e Campo Largo com a Dra. Ligya Camila Salgado.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-charcoal">
        <MotionConfig reducedMotion="user">
          {children}
          <SeereWidget
            clientId={process.env.NEXT_PUBLIC_WIDGET_CLIENT_ID}
            orbComments={orbComments}
          />
        </MotionConfig>
      </body>
    </html>
  );
}
