-- ─────────────────────────────────────────────────────────────────────────────
-- RLS pour les tables pricing v2 et cost-protection
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Politique :
-- - org_usage_counters / usage_ledger : user "own org" (lecture)
-- - usage_costs / org_protection_state : admin Lynaris uniquement
--
-- Les écritures sur ces tables se font exclusivement via API serveur
-- (service role key), donc pas de policy INSERT/UPDATE pour les users.

-- ─── Helper : fonction is_lynaris_admin() ────────────────────────────────────
-- Lit l'email du JWT et vérifie s'il appartient à l'équipe Lynaris.
-- Cohérent avec src/lib/auth/is-admin.ts (côté Node.js).

CREATE OR REPLACE FUNCTION public.is_lynaris_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    coalesce(
      (auth.jwt() ->> 'email') = 'yoanncabon@gmail.com'
        OR lower(auth.jwt() ->> 'email') LIKE '%@lynarisai.com',
      false
    );
$$;

COMMENT ON FUNCTION public.is_lynaris_admin() IS
  'Renvoie true si l''utilisateur JWT est admin Lynaris. Utilisé par les RLS internes.';

-- ─── Helper : récupérer l'orgId de l'utilisateur courant ─────────────────────

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

COMMENT ON FUNCTION public.current_user_org_id() IS
  'Retourne l''orgId de l''utilisateur courant via la table users (synced auth.users).';

-- ─── org_usage_counters : RLS user own org (lecture) ─────────────────────────

ALTER TABLE public.org_usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_usage_counters_select_own_org"
  ON public.org_usage_counters
  FOR SELECT
  USING (org_id = public.current_user_org_id());

-- Les écritures se font via service role uniquement (API serveur).
-- Pas de policy INSERT/UPDATE pour les users authentifiés.

-- ─── usage_ledger : RLS user own org (lecture) ───────────────────────────────

ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_ledger_select_own_org"
  ON public.usage_ledger
  FOR SELECT
  USING (org_id = public.current_user_org_id());

-- ─── usage_costs : RLS admin only ────────────────────────────────────────────
-- ⚠️ INTERNE — coût réel JAMAIS exposé au client.

ALTER TABLE public.usage_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_costs_admin_only"
  ON public.usage_costs
  FOR ALL
  USING (public.is_lynaris_admin())
  WITH CHECK (public.is_lynaris_admin());

-- ─── org_protection_state : RLS admin only ──────────────────────────────────
-- ⚠️ INTERNE — budget/seuils JAMAIS exposés au client.

ALTER TABLE public.org_protection_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_protection_state_admin_only"
  ON public.org_protection_state
  FOR ALL
  USING (public.is_lynaris_admin())
  WITH CHECK (public.is_lynaris_admin());
