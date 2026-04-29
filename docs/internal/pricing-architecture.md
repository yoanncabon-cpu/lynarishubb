# Pricing & Cost-Protection — Architecture

> Documentation interne de la grille tarifaire 5 paliers et du système
> de protection de marge. **Ne pas exposer au client.**

---

## 🏗️ Architecture en 2 couches

L'architecture sépare strictement ce qui est **visible client** de ce qui
est **interne admin** :

```
┌─────────────────────────────────────────────────────────────────┐
│                      COUCHE CLIENT (visible)                      │
│  ─────────────────────────────────────────────────────────────  │
│  • org_usage_counters : actions, voice, RAG, team membres        │
│  • usage_ledger       : audit immutable (1 ligne par action)     │
│  • src/lib/usage/service.ts : consumeAction(), getCurrentUsage() │
│  • RLS Supabase : SELECT user "own org"                           │
│  • Endpoints publics : GET /api/billing/usage, /api/billing/plan │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                     COUCHE INTERNE (admin only)                   │
│  ─────────────────────────────────────────────────────────────  │
│  • usage_costs           : coût RÉEL par action (€ HT)            │
│  • org_protection_state  : currentCost, budget, flags paliers     │
│  • src/lib/cost-protection/* : trackUsage(), checkProtection()    │
│  • RLS Supabase : ALL only is_lynaris_admin()                     │
│  • Endpoints admin : /api/admin/protection/{overview,orgs}        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Modes de protection

Variable d'env `COST_PROTECTION_MODE` :

### Mode `alert` (par défaut, à la publication)

- ✅ Tracking complet : `usage_costs` rempli, `currentCostEuros` à jour
- ✅ Notifications admin : 70% / 90% / 100% / 130%
- ✅ Email upsell client à 90%
- ❌ Aucune bascule auto
- ❌ Aucune action bloquée

→ Permet de **calibrer** sur des données réelles avant d'activer les
   bascules. Recommandé pendant 2 mois post-publication.

### Mode `active` (après calibration)

- ✅ Tout du mode `alert` +
- ✅ À 100% : bascule auto vers modèles éco (Opus → Sonnet → Haiku)
  - Marine **toujours protégée** (qualité voix critique)
- ✅ À 130% : hard cap actions non critiques
  - Actions `optional` (Max images, Orion automation) bloquées
  - Actions `standard` continuent en mode éco
  - Actions `critical` (Marine voice) **jamais bloquées**

### Comment basculer

Dans Vercel → Project Settings → Environment Variables :

```
COST_PROTECTION_MODE=active
```

Puis redéployer. Aucune migration DB nécessaire.

---

## 💰 Budgets et marge

### Calcul du budget par plan

Tableau dans `src/lib/cost-protection/config.ts` :

| Plan | Prix client | Budget coût réel | Marge garantie |
|---|---|---|---|
| Découverte | 0 € | 5 € (acquisition) | — |
| Starter | 149 € | **45 €** | 70% |
| Pro | 449 € | **135 €** | 70% |
| Business | 1 190 € | **360 €** | 70% |
| Sur-mesure | 2 490 €+ | **750 €+** | 70% (négocié) |

**Formule** : `budget = prix_plan × 0.30` (30% du CA = coûts max
acceptés pour garder 70% de marge brute).

### Comment ajuster un budget

Modifier `PLAN_COST_BUDGET_EUROS` dans `src/lib/cost-protection/config.ts`,
redéployer. La prochaine itération du cron `monthly-reset` utilisera
les nouvelles valeurs (les périodes en cours conservent leur budget
actuel — comportement attendu).

---

## 🤖 Mapping criticité agent / action

`src/lib/cost-protection/criticality.ts`

| Agent / Action | Criticité | Effet en hard cap |
|---|---|---|
| Marine voice_inbound | **critical** | Toujours autorisée |
| Marine voice_outbound | **critical** | Toujours autorisée |
| Marine chat | standard | Modèle éco à 100%, bloquée à 130% |
| Charles, Lou, Elio, Mae, Nova, Alba | standard | Idem |
| Max image_gen / video_gen | **optional** | Bloquée dès 100% |
| Orion automation | **optional** | Bloquée dès 100% |

### Règle absolue

**Marine ne doit JAMAIS être bloquée** sur un appel entrant, même en
hard cap. Et **Marine ne doit JAMAIS basculer en mode économie**
(qualité voix client = critique).

→ `economy-mode.ts` : `NO_ECONOMY_AGENTS = ["marine"]`

---

## 🔄 Flow complet d'une action agent

```
1. UI client appelle /api/agents/[slug]/chat
   └─> checkPreTurnAccess(orgId, slug) [permissions.ts]
        ├─ Refus → 403 PLAN_LIMIT_REACHED + upgradeUrl
        └─ OK → continue

2. executor.ts : runAgent / streamAgent
   └─> appel anthropic.messages.create

3. Après réponse Anthropic (instrumentation.ts → fire-and-forget) :
   ├─> trackUsage() [cost-protection/service.ts]
   │   ├─ INSERT usage_costs (ledger)
   │   ├─ Lock SELECT FOR UPDATE org_protection_state
   │   ├─ Update currentCost + flags
   │   └─ Post-commit : dispatchNotification (si palier franchi)
   │
   └─> consumeAction() [usage/service.ts]
       ├─ canConsumeActions() → check permission
       ├─ INSERT usage_ledger
       └─ UPDATE actionsUsed +1
```

---

## 📅 Cron monthly-reset

`/api/cron/monthly-reset` — daily 02:00 UTC (vercel.json)

Pour chaque org dont `periodEnd <= NOW()` :

1. **org_usage_counters** :
   - Reset `actionsUsed`, `voiceMinutesUsed`
   - Conserve : `ragDocsCount`, `teamMembersCount` (cumulatifs métier)
   - Conserve : `voicePackMinutesRemaining` (solde pack acheté)
2. **org_protection_state** :
   - Reset `currentCostEuros = 0`
   - Recalcule `budgetEuros` selon `planId` actuel
   - Reset tous les flags
   - Conserve les `*ActivatedAt` (audit historique)
3. Avance les périodes : `periodStart = old end`, `periodEnd = +30j`

**Idempotent** : peut être ré-exécuté sans dégât.

---

## 🚨 Notifications cost-protection

`src/lib/cost-protection/notifications-resend.ts`

| Palier | Destinataire | Template | Subject |
|---|---|---|---|
| 70% | admin | `adminCostAlert70` | 🟡 70% du budget |
| 90% | admin | `adminCostAlert90` | 🟠 90% du budget |
| 90% | client | `clientUpsellAt90` | Tu utilises beaucoup Lynaris |
| 100% | admin | `adminCostAlert100` | 🔴 100% — limite de marge |
| 130% | admin | `adminCostAlert130` | 🚨 CRITIQUE — marge effondrée |

### Idempotence

Garantie via flags DB (`notifiedAdmin70`, `notifiedClient90`,
`alertedAdmin100`, `alertedAdmin130`). Reset par le cron mensuel.

### Email admin

`COST_PROTECTION_ADMIN_EMAIL` (default `support@lynarisai.com`)

---

## 📊 Dashboard admin /protection

`/dashboard/admin/protection` — réservé `isLynarisAdmin`

### Sections

1. **Vue d'ensemble** (4 KPI)
   - Total orgs · Coût mois · Marge moyenne · Orgs en alerte
2. **Table organisations**
   - Filtres : recherche, plan, état
   - Colonnes : org / plan / budget / conso / % / top agent / état
   - États : safe / notify70 / notify90 / over100 / over130

### À ajouter (post-launch)

- Graph Recharts conso 30 jours empilé par agent
- Drilldown par org (timeline + breakdown agent + breakdown provider)
- Top consommateurs (top 10 conso, top 10 pire marge)

---

## 🔧 Comment ajouter un nouveau plan

1. **`src/lib/pricing/plans.ts`** :
   - Ajouter le slug à `PLAN_IDS`
   - Ajouter la définition `Plan` complète (prix, features, Stripe IDs)
   - Mettre à jour `PLANS` Record

2. **`src/lib/cost-protection/config.ts`** :
   - Ajouter le budget dans `PLAN_COST_BUDGET_EUROS`

3. **`src/lib/pricing/permissions.ts`** :
   - Adapter `getNextPlan()` pour la suggestion d'upgrade
   - Adapter `canConsumeActions()` etc. pour la nouvelle valeur

4. **`src/db/schema.ts`** :
   - L'enum `plan` est legacy — le nouveau plan utilise `planId` (text).
     Pas de migration enum nécessaire.

5. **Stripe** :
   - Créer le produit + prix (cf. `stripe-setup.md`)
   - Renseigner les IDs dans `.env.local`
   - Ajouter le mapping dans `src/lib/pricing/stripe-resolver.ts`

6. **UI** :
   - Ajouter la card dans `TarifsPricing.tsx`
   - Ajouter au mapping `PLAN_DISPLAY_COLORS` et `PLAN_UPGRADE_PATH`
     dans `dashboard/billing/page.tsx`

7. **Tests** :
   - Étendre `plans.test.ts` (5 tests structurels + features)
   - Étendre `permissions.test.ts` (matrice plan × action)

---

## 📞 Procédure mise à jour tarifs fournisseurs

Tarifs lus depuis `process.env` — **pas de redéploiement** nécessaire.

```bash
# Anthropic — quand Sonnet/Opus changent de prix
ANTHROPIC_PRICE_OPUS_INPUT_PER_M=...
ANTHROPIC_PRICE_OPUS_OUTPUT_PER_M=...

# Replicate, Twilio, ElevenLabs, Deepgram : idem (cf. .env.example)
```

Modifier dans Vercel → Settings → Environment Variables, puis
redémarrer la prochaine fonction (Vercel met à jour automatiquement).

Le cron `monthly-reset` recalculera les budgets avec les nouveaux
tarifs au prochain reset (mais les coûts déjà loggés en
`usage_costs.costEuros` sont figés — on ne réécrit pas l'historique).

---

## 🔗 Liens

- Stripe setup : [stripe-setup.md](./stripe-setup.md)
- Source de vérité pricing : `src/lib/pricing/plans.ts`
- Service tracking : `src/lib/cost-protection/service.ts`
- Permissions : `src/lib/pricing/permissions.ts`
