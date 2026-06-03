import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EthFinance | Capa financiera con IA",
  description: "Cuenta financiera descentralizada impulsada por IA y Ethereum",
  keywords: ["web3", "defi", "finanzas", "ethereum", "usdc", "ia"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <div suppressHydrationWarning>{children}</div>
      </body>
    </html>
  );
}
