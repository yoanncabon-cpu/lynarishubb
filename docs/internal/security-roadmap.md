# Sécurité — Roadmap & checklist

> Audit + plan d'actions pour atteindre une sécurité maximale sur Lynaris.
> Mis à jour au fil des fixes.

---

## ✅ Déjà en place

### Authentification & autorisation
- Supabase Auth (email + password, magic link) — brute force protection native
- RLS Postgres activée sur **toutes** les tables (`org_isolation` policy)
- RLS admin-only sur `usage_costs` + `org_protection_state`
- `isLynarisAdmin()` côté Node.js + `is_lynaris_admin()` côté SQL

### Chiffrement
- Tokens OAuth chiffrés AES-256-GCM en DB (`src/lib/crypto.ts`)
- HTTPS forcé (HSTS `max-age=31536000; includeSubDomains; preload`)
- TLS 1.2+ via Vercel

### Headers sécurité (next.config.ts)
- `X-Frame-Options: DENY` (anti-clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictif (camera/microphone/geolocation off)
- **CSP renforcée** (sans `'unsafe-eval'`, `frame-ancestors 'none'`,
  `object-src 'none'`, `upgrade-insecure-requests`)

### Validation
- Zod sur tous les endpoints API (in/out)
- TypeScript strict (`noUncheckedIndexedAccess`)

### Webhooks
- ✅ Stripe : HMAC `stripe.webhooks.constructEvent`
- ✅ Make : HMAC obligatoire (refus si signature absente — fix sécurité v1)
- ✅ n8n : HMAC obligatoire
- ✅ WhatsApp : HMAC X-Hub-Signature-256 (Meta) — fix sécurité v1
- ✅ Webhook idempotence (Stripe : processed_recharges, processed_voice_packs)

### Rate limiting (Upstash)
- ✅ Agents chat : 10 req/min
- ✅ API généraux : 100 req/min
- ✅ Tickets support : ajouté en v1 sécurité

### Sécurité Stripe
- Webhook secret (whsec_...)
- Signed customer portal sessions
- Pas de stockage de PAN (Stripe gère tout)

### Audit trail
- `action_logs` : 1 ligne par action agent (audit immuable)
- `usage_ledger` : 1 ligne par consommation client
- `usage_costs` : 1 ligne par coût provider

---

## ⚠️ À renforcer (priorité haute)

### 1. CSP nonce-based
Actuellement `'unsafe-inline'` autorisé sur scripts/styles. Pour un
durcissement maximal, basculer sur CSP nonce :

```ts
// middleware.ts
const nonce = crypto.randomUUID()
response.headers.set(
  "Content-Security-Policy",
  `script-src 'self' 'nonce-${nonce}' ...`
)
```

Effort : moyen (~2h). Bloque toute injection inline.

### 2. CSRF tokens sur mutations
Les POST/PUT/DELETE n'ont pas de token CSRF explicite. Supabase Auth
fournit un cookie sameSite mais pas de protection token-based.

Implémentation : middleware qui génère un nonce serveur, vérifié sur
toute mutation.

Effort : moyen (~3h).

### 3. Sanitization HTML user-generated
Les descriptions de tickets, messages chat, contacts sont stockés en
DB et ré-affichés dans les emails admin. Si un user injecte du HTML
malveillant dans une description, il pourrait s'exécuter dans le
client mail admin.

Solution : DOMPurify côté serveur AVANT insertion DB, OU escape
strict côté template.

Effort : faible (~1h). Package : `isomorphic-dompurify`.

### 4. Audit logs étendus
`action_logs` ne capture pas tous les événements sensibles :
- Changement de plan
- Suppression de compte
- Modification mentions légales
- Accès dashboard admin (qui, quand)
- Échecs auth (5+ consécutifs = alerte)

Solution : table `audit_logs` dédiée + helper `logSensitiveAction()`.

Effort : moyen (~4h).

### 5. Suppression compte (RGPD article 17)
Aucun endpoint actuel pour qu'un user demande la suppression de ses
données. Obligation RGPD.

Solution : `DELETE /api/auth/account` avec :
- Soft delete d'org (status: deleted) + cron purge à J+30
- Anonymisation des messages, tickets, etc.
- Email de confirmation
- Log audit

Effort : moyen (~3h).

### 6. Export données utilisateur (RGPD article 20)
L'utilisateur doit pouvoir télécharger toutes ses données.

Solution : `GET /api/auth/account/export` qui retourne un ZIP JSON
de toutes les tables avec son orgId.

Effort : moyen (~2h).

---

## 🔒 À renforcer (priorité moyenne)

### 7. 2FA (Supabase Auth supporte natif)
Passage par TOTP / WebAuthn pour comptes admin.
Effort : faible (~1h, UI + activation Supabase).

### 8. Brute force / credential stuffing
Supabase a une protection basique. Renforcer avec :
- Captcha (hCaptcha) sur signup/login après 3 échecs
- IP blocklist temporaire après 10 échecs

Effort : moyen (~3h).

### 9. Signed URLs pour Supabase Storage
Les fichiers uploads (tickets attachments) sont publiques. Devraient
être servis via signed URLs avec expiration courte (1h).

Solution : remplacer `getPublicUrl()` par `createSignedUrl(60*60)`.

Effort : faible (~1h).

### 10. Logs sans PII
Audit des `console.info/error` pour s'assurer qu'aucun email, message
client, contenu de conversation ne fuite dans les logs Vercel/Sentry.

Effort : moyen (~2h, audit + helper `safeLog`).

### 11. npm audit fix
État : 11 vulnérabilités (9 moderate, 2 critical) au dernier check.
Solution : `npm audit fix --force` après tests sur staging.

Effort : variable (test régression 1-3h).

### 12. Sentry sans données sensibles
Configurer `beforeSend` pour scrubber email, password, message body
des crash reports.

Effort : faible (~30min).

---

## 📋 Conformité RGPD

### 13. Cookie banner
Page `/legal/confidentialite` mentionne cookies. Mais pas de banner
de consentement. CNIL exige un consentement explicite avant tout
cookie non-essentiel (analytics, ads).

Solution : composant `<CookieBanner>` (déjà existant `src/components/shared/CookieBanner.tsx`)
à intégrer + bloquer GA/PostHog avant accept.

Effort : moyen (~2h).

### 14. DPA (Data Processing Agreement) avec sous-traitants
Liste des sous-traitants à documenter dans `/legal/confidentialite` :
- Anthropic (LLM)
- Stripe (paiement)
- Twilio (téléphonie)
- ElevenLabs (TTS)
- Deepgram (STT)
- Resend (email)
- Supabase (hébergement)
- Vercel (hébergement)
- Replicate (image/video)

Effort : juridique (~4h, à valider par un avocat).

### 15. Hébergement EU strict
Vérifier que toutes les données restent en UE :
- Vercel : choisir région Frankfurt/Paris (env `VERCEL_REGION`)
- Supabase : EU-West (déjà OK)
- Anthropic : pas de DC EU à ce jour ⚠️ (mention RGPD)
- Twilio : EU available
- ElevenLabs : multi-région

Effort : audit + mention transparente dans privacy policy.

---

## 🛡️ Renforcement long terme

### 16. WAF (Web Application Firewall)
Vercel a une WAF basique. Pour anti-DDoS / anti-scraping renforcé :
- Cloudflare devant Vercel (CNAME)
- Bot management
- Rate limiting global

Effort : config infra (~1 journée).

### 17. Pen test
Faire auditer le site par un pentester externe (~3-5k€).
À planifier après publication v1 stable.

### 18. Bug bounty
Programme HackerOne / YesWeHack. Coût : variable.

### 19. SOC 2 / ISO 27001
Obligatoire si vente à des grands comptes. Long terme (12-18 mois).

---

## Phase 1 (livré) — récap

Commit `security: fix HMAC bypass + CSP renforcée + rate limit`

- ✅ Make webhook : HMAC obligatoire (fix bypass `if (signature && secret)`)
- ✅ WhatsApp webhook : HMAC X-Hub-Signature-256 vérifié
- ✅ CSP : `'unsafe-eval'` retiré + `frame-ancestors 'none'` + `object-src 'none'`
  + `upgrade-insecure-requests` + `base-uri 'self'` + `form-action 'self'`
- ✅ Rate limiting sur `/api/support/ticket`
- ✅ DB : pool postgres-js HMR-safe via globalThis
- ✅ DATABASE_URL : transaction pooler 6543 documenté

## Phase 2 (à planifier)

- CSRF tokens sur mutations
- Sanitization HTML (DOMPurify)
- Suppression compte + Export données (RGPD)
- Audit logs étendus
- Logs sans PII

## Phase 3 (long terme)

- 2FA admin
- CSP nonce-based
- Cookie banner consentement
- WAF Cloudflare
- Pen test
