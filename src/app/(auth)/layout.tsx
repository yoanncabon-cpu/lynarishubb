import type { Metadata } from "next"

export const metadata: Metadata = {
  title: { template: "%s | Lynaris", default: "Authentification | Lynaris" },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
