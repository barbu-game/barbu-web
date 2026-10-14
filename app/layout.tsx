import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "./lib/i18n";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Le Barbu",
  description: "Jouez au Barbu en ligne, de 2 à 10 joueurs",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0e0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${cinzel.variable} ${inter.variable} h-full antialiased`}>
      <body className="h-full">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
