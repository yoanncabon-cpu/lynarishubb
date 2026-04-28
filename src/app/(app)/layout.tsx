import { PlanProvider } from "@/providers/PlanProvider"
import { AppShell } from "@/components/app/AppShell"
import { getPlanServer } from "@/lib/plan-server"
import "@/styles/onboarding.css"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const plan = await getPlanServer()
  return (
    <PlanProvider plan={plan}>
      <AppShell>{children}</AppShell>
    </PlanProvider>
  )
}
