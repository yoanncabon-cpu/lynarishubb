import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Fraunces } from "next/font/google"
import "./globals.css"
import { ServiceWorkerRegister } from "@/components/shared/ServiceWorkerRegister"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "optional" })
const fraunces = Fraunces({
  variable: "--font-fraunces-var",
  subsets: ["latin"],
  display: "optional",
  style: ["normal", "italic"],
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env["NEXT_PUBLIC_APP_URL"] ?? "https://lynaris.ai"),
  title: {
    default: "Lynaris — Ton équipe IA qui exécute",
    template: "%s — Lynaris",
  },
  // Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré
  description:
    "Une équipe d'agents IA autonomes qui exécute pendant que tu décides. Marine décroche tes appels, Lou publie ton contenu, Elio prospecte pour toi.",
  keywords: ["agents IA", "automatisation PME", "IA productive", "SaaS IA", "agent virtuel"],
  authors: [{ name: "Lynaris" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://lynaris.ai",
    siteName: "Lynaris",
    title: "Lynaris — Ton équipe IA, opérationnelle en 48h",
    // Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré
    description:
      "Une équipe d'agents IA spécialisés qui exécutent vraiment : Marine décroche tes appels, Lou publie ton contenu, Elio prospecte pour toi.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Lynaris" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lynaris — Ton équipe IA qui exécute",
    // Reformulation marketing : éviter le chiffre brut "9 agents" jugé prématuré
    description:
      "Une équipe d'agents IA autonomes qui exécute pendant que tu décides.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
}

export const viewport: Viewport = {
  themeColor: "#E86F4D",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
