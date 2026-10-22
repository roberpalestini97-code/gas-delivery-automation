import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const display = DM_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

const brand = Fraunces({
  subsets: ["latin"],
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