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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  "https://gas-delivery-automation.vercel.app";

const metadataBase = new URL(
  siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`,
);

export const metadata: Metadata = {
  metadataBase,
  title: "El Barba Gas — Back office",
  description:
    "Pedidos de gas envasado, conversaciones y despacho · @elbarbagas",
  applicationName: "El Barba Gas",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: metadataBase,
    siteName: "El Barba Gas",
    title: "El Barba Gas — Back office",
    description:
      "Pedidos de gas envasado, conversaciones y despacho · @elbarbagas",
    images: [
      {
        url: "/og-login.jpg",
        width: 1200,
        height: 630,
        alt: "El Barba Gas — login del back office",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "El Barba Gas — Back office",
    description:
      "Pedidos de gas envasado, conversaciones y despacho · @elbarbagas",
    images: ["/og-login.jpg"],
  },
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
