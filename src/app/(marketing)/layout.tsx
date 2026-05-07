import { Navbar } from "@/components/marketing/Navbar"
import { Footer } from "@/components/marketing/Footer"
import { CookieBanner } from "@/components/shared/CookieBanner"
import { SmoothScrollProvider } from "@/components/shared/SmoothScrollProvider"
import { SiteLogoWatermark } from "@/components/marketing/SiteLogoWatermark"
import {
  OrganizationSchema,
  FAQSchema,
  SoftwareAppSchema,
} from "@/components/marketing/StructuredData"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "clip", width: "100%", maxWidth: "100vw", position: "relative" }}>
      <OrganizationSchema />
      <FAQSchema />
      <SoftwareAppSchema />
      <SmoothScrollProvider />
      {/* Logo Lynaris ghost watermark — fixed derrière tout le site */}
      <SiteLogoWatermark />
      <Navbar />
      <main className="flex-1 relative z-10" style={{ backgroundColor: "var(--ly-bg)", width: "100%", maxWidth: "100%" }}>{children}</main>
      <Footer />
      <CookieBanner />
    </div>
  )
}
