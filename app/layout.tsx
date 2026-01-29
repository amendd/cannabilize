import type { Metadata } from "next";
import { Inter, Poppins, Montserrat, Lato, Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import { Providers } from "./providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-poppins',
  display: 'swap',
});

const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-montserrat',
  display: 'swap',
});

const lato = Lato({
  weight: ['400', '700'],
  subsets: ["latin"],
  variable: '--font-lato',
  display: 'swap',
});

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ["latin"],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "CannabiLize | Líder em Tratamentos com Cannabis Medicinal",
  description: "Consultas online com médicos especialistas em cannabis medicinal por apenas R$50. Suporte completo no processo de importação legal.",
  keywords: "cannabis medicinal, CBD, consulta médica online, telemedicina, tratamento com cannabis",
  icons: {
    icon: "/images/cannalize-logo.png",
    apple: "/images/cannalize-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable} ${montserrat.variable} ${lato.variable} ${roboto.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <Providers>
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
