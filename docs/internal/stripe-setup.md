# Stripe Setup — Manifest manuel

> Guide pas-à-pas pour créer les produits Stripe **à la main**
> dans le dashboard avant la mise en ligne. Tous les IDs générés
> sont à renseigner dans `.env.local` (puis Vercel pour la prod).

---

## ⚠️ Prérequis

- Compte Stripe activé (mode Test pour démarrer, Live ensuite)
- Webhook configuré sur `https://lynarisai.com/api/webhooks/stripe`
  avec les events :
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- Récupérer `whsec_...` → `STRIPE_WEBHOOK_SECRET`

---

## 📦 Produits à créer

### 1. Plan Starter — 149 €/mois

**Dashboard Stripe → Products → Add product**

- **Name** : `Lynaris Starter`
- **Description** : `3 agents au choix (hors Marine), 1 200 actions/mois, 250 docs RAG.`

#### Prix mensuel
- **Recurring** · Mensuel · **149 €**
- Currency : EUR
- → Copier le `price_...` → `STRIPE_PRICE_STARTER_MONTHLY`

#### Prix annuel (engagement annuel, mensualisé -15%)
- **Recurring** · Mensuel · **127 €** (= 1 524 €/an)
- ⚠️ Bien créer un price en **mensuel à 127 €** (le client paie chaque
  mois mais s'engage 12 mois via le checkout `mode: subscription` +
  `subscription_data.trial_settings.end_behavior` ou via une promo
  d'engagement). Stripe ne supporte pas nativement les remises
  d'engagement, on utilise donc 2 prix séparés.
- → `STRIPE_PRICE_STARTER_ANNUAL`

#### Product ID
- → Copier le `prod_...` → `STRIPE_PRODUCT_STARTER`

---

### 2. Plan Pro — 449 €/mois + 290 € setup ⭐

**Dashboard Stripe → Products → Add product**

- **Name** : `Lynaris Pro`
- **Description** : `Tous les 9 agents, 4 000 actions/mois, 400 min Marine, intégrations Google + Stripe + n8n + Make.`

#### Prix mensuel
- **Recurring** · Mensuel · **449 €**
- → `STRIPE_PRICE_PRO_MONTHLY`

#### Prix annuel
- **Recurring** · Mensuel · **382 €** (= 4 584 €/an)
- → `STRIPE_PRICE_PRO_ANNUAL`

#### Setup fee (one-shot)
- **One-time** · **290 €**
- Currency : EUR
- → `STRIPE_PRICE_PRO_SETUP`

> ⚠️ Le setup fee est ajouté comme **line item one-shot** au Checkout
> Session lors du premier paiement (cf. `src/app/api/billing/checkout/route.ts`).
> Stripe le débite en plus du premier mois d'abonnement.

#### Product ID
- → `STRIPE_PRODUCT_PRO`

---

### 3. Plan Business — 1 190 €/mois + 690 € setup

**Dashboard Stripe → Products → Add product**

- **Name** : `Lynaris Business`
- **Description** : `Tous les agents + 1 custom, numéro Twilio FR dédié, 1 500 min Marine, 12 000 actions/mois, support Slack J+0.`

#### Prix mensuel
- **Recurring** · Mensuel · **1 190 €**
- → `STRIPE_PRICE_BUSINESS_MONTHLY`

#### Prix annuel
- **Recurring** · Mensuel · **1 012 €** (= 12 144 €/an)
- → `STRIPE_PRICE_BUSINESS_ANNUAL`

#### Setup fee
- **One-time** · **690 €**
- → `STRIPE_PRICE_BUSINESS_SETUP`

#### Product ID
- → `STRIPE_PRODUCT_BUSINESS`

---

### 4. Voice Pack — 99 € (option Starter)

**Dashboard Stripe → Products → Add product**

- **Name** : `Lynaris Pack Marine 200 minutes`
- **Description** : `Recharge minutes Marine pour les abonnés au plan Starter (option facturée à l'usage).`

#### Prix one-shot
- **One-time** · **99 €**
- Currency : EUR
- → `STRIPE_PRICE_VOICE_PACK`

> Pas de Product ID séparé requis (price_data inline en fallback).

---

### 5. Sur-mesure (PAS DE PRODUIT STRIPE)

Le plan Sur-mesure est géré **manuellement** :
- Devis envoyé au client (mail)
- Paiement via virement / facture Stripe manuelle
- Ne nécessite pas de product/price préconfigurés

---

## 🔧 Configuration `.env.local` finale

Une fois les produits créés, copier les IDs :

```bash
# Plans
STRIPE_PRODUCT_STARTER=prod_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...

STRIPE_PRODUCT_PRO=prod_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_PRO_SETUP=price_...

STRIPE_PRODUCT_BUSINESS=prod_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_ANNUAL=price_...
STRIPE_PRICE_BUSINESS_SETUP=price_...

STRIPE_PRICE_VOICE_PACK=price_...

# Webhook
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## ✅ Checklist avant publication

- [ ] 4 produits créés en mode **Test** (validation flow complet)
- [ ] Tester le checkout Pro 449€ + setup 290€ en mode test
- [ ] Tester le webhook → org.planId mis à jour en DB
- [ ] Tester le voice pack en checkout one-shot
- [ ] Migrer en mode **Live** : recréer les produits identiques
- [ ] Mettre à jour les env vars Vercel avec les IDs Live
- [ ] Re-tester un checkout en prod avec une vraie carte
- [ ] Vérifier l'invoice générée (numérotation, footer, etc.)

---

## 🔗 Liens utiles

- Dashboard Stripe : https://dashboard.stripe.com/
- Webhook setup : https://dashboard.stripe.com/webhooks
- Test cards : https://stripe.com/docs/testing#cards
- Architecture interne : `docs/internal/pricing-architecture.md`
