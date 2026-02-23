import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import { Providers } from "./providers";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { getLandingConfigPublic } from "@/lib/landing-config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const config = await getLandingConfigPublic();
    const logoUrl = config.logoUrl || "/images/cannalize-logo.png";
    return {
      title: "Cannabilize | Plataforma nacional de acesso ao tratamento com cannabis medicinal",
      description: "A Cannabilize conecta pacientes e médicos especializados em cannabis medicinal. Atendimento em todo o Brasil, com acompanhamento e suporte em todas as etapas.",
      keywords: "cannabis medicinal, CBD, consulta médica online, telemedicina, tratamento com cannabis",
      icons: { icon: logoUrl, apple: logoUrl },
    };
  } catch {
    return {
      title: "Cannabilize | Plataforma nacional de acesso ao tratamento com cannabis medicinal",
      description: "A Cannabilize conecta pacientes e médicos especializados em cannabis medicinal. Atendimento em todo o Brasil, com acompanhamento e suporte em todas as etapas.",
      keywords: "cannabis medicinal, CBD, consulta médica online, telemedicina, tratamento com cannabis",
      icons: { icon: "/images/cannalize-logo.png", apple: "/images/cannalize-logo.png" },
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <GoogleAnalytics />
          {/* Skip Link para acessibilidade */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg"
          >
            Pular para conteúdo principal
          </a>
          <ConditionalNavbar />
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
          <ConditionalFooter />
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
