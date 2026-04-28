// Vérifie si l'user authentifié est un admin Lynaris
import { createSupabaseServerClient } from "./supabase-server"

export async function isLynarisAdmin(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()
    const email = data.user?.email ?? ""

    const adminEmails = (process.env["ADMIN_EMAILS"] ?? "yoanncabon@gmail.com")
      .split(",")
      .map((e) => e.trim().toLowerCase())

    return (
      adminEmails.includes(email.toLowerCase()) ||
      email.toLowerCase().endsWith("@lynarisai.com")
    )
  } catch {
    return false
  }
}
