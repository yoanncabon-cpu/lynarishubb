# Audit Complet — Lynaris Hub

**Date** : 24 avril 2026
**Projet** : Next.js 16.2.4 + Supabase + Drizzle ORM
**Résultat** : 27 problèmes identifiés (7 critiques, 8 importants, 8 modérés, 4 mineurs)

---

## Résumé exécutif

Le projet est bien architecturé avec un TypeScript strict (0 erreurs), un build fonctionnel, et de bonnes pratiques (Drizzle ORM, 0 usage de `any`, CI/CD en place). Cependant, **7 vulnérabilités de sécurité critiques** doivent être corrigées avant toute mise en production, principalement autour de l'isolation multi-tenant et de la validation des entrées.

---

## CRITIQUE — Action immédiate requise

### C1. Cross-Tenant via header X-Org-ID contrôlé par le client
- **Fichier** : `src/app/api/agents/[slug]/chat/route.ts:76`
- **Problème** : L'orgId est lu depuis le header HTTP `x-org-id` envoyé par le client, avec fallback à `"demo"`. N'importe quel utilisateur peut accéder aux données d'une autre organisation en modifiant ce header.
- **Impact** : Fuite de données inter-tenants, violation RGPD potentielle.
- **Correction** : Extraire l'orgId de la session Supabase authentifiée (JWT claims), jamais depuis un header client.

### C2. Génération de clés API avec Math.random()
- **Fichier** : `src/app/api/keys/route.ts:14-22`
- **Problème** : Les clés API sont générées avec `Math.floor(Math.random())` au lieu de `crypto.getRandomValues()`. Les clés sont prédictibles et vulnérables au brute-force.
- **Impact** : Un attaquant peut deviner les clés API.
- **Correction** : Utiliser `crypto.randomBytes(32).toString('hex')` ou `crypto.getRandomValues()`.

### C3. Bypass auth middleware — matching trop permissif
- **Fichier** : `src/middleware.ts:24-31`
- **Problème** : `isPublicPath()` utilise `startsWith()`, donc `/api/webhooks/n'importe-quoi` ou `/api/auth/custom` bypass l'authentification.
- **Impact** : Routes API accessibles sans authentification.
- **Correction** : Utiliser une allowlist explicite par route ou des regex précises.

### C4. Webhook Stripe — pas de vérification si secret vide
- **Fichier** : `src/app/api/webhooks/stripe/route.ts:11-30`
- **Problème** : Si `STRIPE_WEBHOOK_SECRET` est absent ou vide, `stripe.webhooks.constructEvent()` ne vérifiera pas correctement la signature. Un attaquant pourrait injecter de faux événements.
- **Impact** : Faux paiements, modifications non autorisées des abonnements.
- **Correction** : Vérifier l'existence et la non-vacuité du secret, sinon retourner 500.

### C5. Invitation d'équipe sans vérification d'ownership (IDOR)
- **Fichier** : `src/app/api/team/invite/route.ts:13-119`
- **Problème** : L'endpoint ne vérifie pas que l'utilisateur authentifié est owner/admin de l'organisation cible.
- **Impact** : N'importe quel user authentifié peut inviter dans n'importe quelle org.
- **Correction** : Vérifier le rôle de l'utilisateur dans l'org avant d'envoyer l'invitation.

### C6. Injection XML/TwiML dans l'endpoint voice
- **Fichier** : `src/app/api/voice/incoming/route.ts:29-34`
- **Problème** : Le paramètre `orgId` est injecté directement dans le TwiML XML sans échappement : `<Parameter name="org_id" value="${orgId}" />`.
- **Impact** : Injection XML si orgId contient des caractères spéciaux.
- **Correction** : Échapper les valeurs avec une fonction XML-safe avant insertion.

### C7. Bloquants production non résolus
- **Fichier** : `NIGHT_LOG.md`
- **Problème** : 3 prérequis bloquants documentés : Resend (emails transactionnels) non configuré, migrations Supabase non appliquées en prod, variables d'environnement prod non configurées.
- **Correction** : Configurer Resend, appliquer les migrations, remplir les env vars avant déploiement.

---

## IMPORTANT — À traiter rapidement

### H1. Rate limiting in-memory — pas distribué
- **Fichier** : `src/app/api/agents/[slug]/chat/route.ts:14-28`
- **Problème** : `Map` en mémoire. En multi-instance, chaque serveur a son propre compteur. L'IP via `x-forwarded-for` est spoofable.
- **Correction** : Migrer vers Upstash Redis (déjà en dépendance).

### H2. Erreurs internes exposées au client
- **Fichiers** : `chat/route.ts:121-124`, `billing/checkout/route.ts:52-53`
- **Problème** : Les messages d'erreur internes (stack traces, détails Stripe) sont retournés dans les réponses.
- **Correction** : Message générique au client, erreur détaillée en log serveur.

### H3. Erreurs DB silencieusement ignorées
- **Fichier** : `src/app/api/agents/[slug]/chat/route.ts:80-93`
- **Problème** : Le try-catch avale l'erreur. L'utilisateur reçoit une config dégradée sans le savoir.
- **Correction** : Logger l'erreur et retourner un message explicite.

### H4. Nom d'utilisateur hardcodé "Yoann Cabon"
- **Fichier** : `src/app/api/keys/route.ts:41, 80`
- **Problème** : Le champ `created_by` est hardcodé au lieu d'utiliser l'utilisateur authentifié.
- **Correction** : Extraire le nom de l'utilisateur depuis la session Supabase.

### H5. Pas de vérification d'autorisation par organisation
- **Fichiers** : Multiples routes dans `src/app/api/`
- **Problème** : Les routes vérifient l'authentification mais pas l'autorisation (appartenance à l'org).
- **Correction** : Middleware d'autorisation vérifiant l'appartenance org via la table users.

### H6. planMap Stripe dupliqué à deux endroits
- **Fichier** : `src/app/api/webhooks/stripe/route.ts:86-93 et 149-156`
- **Problème** : Mapping prix → plan défini en dur à deux endroits. Risque de dérive.
- **Correction** : Centraliser dans un fichier de configuration partagé.

### H7. Email de bienvenue fire-and-forget
- **Fichier** : `src/app/api/auth/callback/route.ts:30-33`
- **Problème** : `void import(...).then(...)` sans gestion d'erreur. Aucun moyen de savoir si le mail a échoué.
- **Correction** : Ajouter un catch avec logging, ou utiliser Inngest pour retry.

### H8. Vulnérabilités npm modérées
- **Fichier** : `package-lock.json`
- **Problème** : 7 vulnérabilités modérées (esbuild dans drizzle-kit, uuid dans resend/svix).
- **Correction** : `npm audit fix --force` ou mettre à jour drizzle-kit et resend.

---

## MODÉRÉ — À planifier

### M1. Clé de chiffrement importée à chaque requête
- **Fichier** : `src/lib/crypto.ts:4-14`
- **Problème** : `getEncryptionKey()` appelle `crypto.subtle.importKey()` sur chaque appel.
- **Correction** : Memoizer la clé importée dans une variable module-level.

### M2. Index manquants dans le schéma DB
- **Fichier** : `src/lib/db/schema.ts`
- **Problème** : Pas d'index sur `agentMemories(orgId, agentSlug)`, `conversations(orgId, agentInstanceId)`, `actionLogs(status)`.
- **Correction** : Ajouter des index composites sur les colonnes fréquemment filtrées.

### M3. FK avec onDelete: "set null" crée des orphelins
- **Fichier** : `src/lib/db/schema.ts:166-168, 208-214`
- **Problème** : `conversations.agentInstanceId` et `actionLogs` utilisent `onDelete: "set null"`, créant des enregistrements orphelins.
- **Correction** : Évaluer `onDelete: "cascade"` ou ajouter des contraintes d'intégrité.

### M4. Code DB commenté dans les webhooks (TODO non résolu)
- **Fichiers** : `src/app/api/webhooks/n8n/route.ts:42`, `src/app/api/voice/status/route.ts:20`
- **Problème** : Code de mise à jour DB commenté avec des TODO. Les événements sont reçus mais pas persistés.
- **Correction** : Décommenter et finaliser le code de persistance.

### M5. Query N+1 — config agent rechargée à chaque requête chat
- **Fichier** : `src/app/api/agents/[slug]/chat/route.ts:81-90`
- **Problème** : Chaque requête de chat interroge la table `agentInstances`.
- **Correction** : Cache avec TTL (ex: 5 minutes).

### M6. Rate limiting global par IP, pas par organisation
- **Fichier** : `src/lib/rate-limit.ts:28-33`
- **Problème** : Les limites sont par IP, pas par org. Une org à fort trafic peut épuiser les quotas pour les autres.
- **Correction** : Combiner rate limit par IP + par org (identifié via JWT).

### M7. Dossier src/lib/billing/ vide
- **Fichier** : `src/lib/billing/.gitkeep`
- **Problème** : Le dossier billing est vide malgré la présence d'endpoints billing. La logique métier n'est pas factorisée.
- **Correction** : Centraliser la logique billing dans ce dossier.

### M8. Incohérence Next.js 15 vs 16 dans la documentation
- **Fichiers** : `DECISIONS.md` vs `package.json`
- **Problème** : DECISIONS.md mentionne "Next.js 15" tandis que package.json utilise 16.2.4.
- **Correction** : Mettre à jour DECISIONS.md.

---

## MINEUR — Améliorations

### L1. console.log restants en code de production
- **Fichiers** : `src/lib/email/resend.ts:12`, `src/app/api/team/invite/route.ts:109`, `src/app/(marketing)/contact/page.tsx:20`
- **Correction** : Remplacer par un logger structuré conditionné sur l'environnement.

### L2. Commentaires XXX/HACK non nettoyés
- **Fichiers** : `src/lib/agents/prompts/alba.ts:355`, `src/app/(app)/dashboard/integrations/_components/ConfigModal.tsx:110,132`
- **Correction** : Résoudre ou documenter proprement chaque occurrence.

### L3. Charset manquant sur le Content-Type SSE
- **Fichier** : `src/app/api/agents/[slug]/chat/route.ts:199`
- **Problème** : `text/event-stream` sans `charset=utf-8`. Risque d'encodage avec le français.
- **Correction** : Ajouter `; charset=utf-8` au Content-Type.

### L4. Dépendances mineures à mettre à jour
- **Fichier** : `package.json`
- **Problème** : 8 packages avec des mises à jour disponibles (patches et mineurs).
- **Correction** : Exécuter `npm update`.

---

## Points forts du projet

- TypeScript strict mode — 0 erreurs, `noUncheckedIndexedAccess` activé
- Build Next.js 16 passant, CI/CD GitHub Actions fonctionnel
- Headers de sécurité complets (CSP, HSTS, X-Frame-Options, Permissions-Policy)
- Drizzle ORM — pas de SQL brut, protection native contre l'injection SQL
- Architecture agents bien structurée (registry, executor, prompts séparés)
- 0 usage de type `any` dans tout le codebase
- 0 catch blocks vides
- SEO bien configuré (sitemap, robots.txt, JSON-LD, OG images)
- .gitignore correct — .env.local non versionné
- Schema DB avec enums PostgreSQL, types stricts, et migrations versionnées
- Middleware d'auth couvrant les routes protégées
- 9 agents avec prompts système documentés et outils définis
- Caching d'assets statiques configuré (1 an, immutable)
- Design system documenté avec palette, typographie, et anti-patterns

---

## Questions ouvertes pour le propriétaire

1. Domaine de production `lynaris.ai` confirmé ?
2. Plan gratuit : essai 7 jours sans carte, ou plan permanent avec limitations ?
3. Clé API Resend disponible ?
4. Inngest nécessaire maintenant pour la génération d'images (30s timeout) ?
5. Client IDs OAuth LinkedIn/Instagram disponibles ?
6. Numéro Twilio de démo ?
