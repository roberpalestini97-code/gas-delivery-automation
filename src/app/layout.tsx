import type { Metadata } from "next";
import { Barlow_Condensed, Outfit } from "next/font/google";
import "./globals.css";

const display = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

const brand = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-brand",
});

export const metadata: Metadata = {
  title: "El Barba Gas — Back office",
  description: "Pedidos de gas envasado, WhatsApp y despacho · @elbarbagas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${brand.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
