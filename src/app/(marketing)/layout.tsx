import { Navbar } from "@/components/marketing/Navbar"
import { Footer } from "@/components/marketing/Footer"
import { CookieBanner } from "@/components/shared/CookieBanner"
import { SmoothScrollProvider } from "@/components/shared/SmoothScrollProvider"
import {
  OrganizationSchema,
  FAQSchema,
  SoftwareAppSchema,
} from "@/components/marketing/StructuredData"

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrganizationSchema />
      <FAQSchema />
      <SoftwareAppSchema />
      <SmoothScrollProvider />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  )
}
