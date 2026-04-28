# Guide de configuration Stripe — Lynaris

Suis ce guide dans l'ordre pour configurer les abonnements Lynaris dans Stripe.

---

## 1. Créer les 3 produits

Va sur **dashboard.stripe.com → Catalogue produits → Créer un produit**

### Produit 1 — Essentiel

| Champ | Valeur |
|-------|--------|
| **Nom** | Essentiel |
| **Description** | 1 agent actif, clé en main — 500 appels ou actions / mois |
| **Tarif** | Récurrent |
| **Montant** | `69,00` EUR |
| **Période** | Mensuelle |

→ Clique **Ajouter le produit**
→ Copie le `price_xxx` qui apparaît → colle dans `.env.local` : `STRIPE_PRICE_ESSENTIEL_MONTHLY=price_xxx`

**Ajouter un 2e tarif annuel sur ce même produit :**
→ Produit Essentiel → Ajouter un tarif → `59,00` EUR / Annuelle
→ Copie ce `price_xxx` → `STRIPE_PRICE_ESSENTIEL_YEARLY=price_xxx`

---

### Produit 2 — Pro

| Champ | Valeur |
|-------|--------|
| **Nom** | Pro |
| **Description** | Toute l'équipe IA, sans limite — 2 000 appels ou actions / mois |
| **Tarif** | Récurrent |
| **Montant** | `149,00` EUR |
| **Période** | Mensuelle |

→ `STRIPE_PRICE_PRO_MONTHLY=price_xxx`

**Tarif annuel :**
→ `127,00` EUR / Annuelle
→ `STRIPE_PRICE_PRO_YEARLY=price_xxx`

---

### Produit 3 — Sur-mesure

| Champ | Valeur |
|-------|--------|
| **Nom** | Sur-mesure |
| **Description** | Agent dédié à votre entreprise, configuré et opérationnel en 48h |
| **Tarif** | Récurrent |
| **Montant** | `590,00` EUR |
| **Période** | Mensuelle |

→ `STRIPE_PRICE_CABINET_MONTHLY=price_xxx`

**Tarif annuel :**
→ `499,00` EUR / Annuelle
→ `STRIPE_PRICE_CABINET_YEARLY=price_xxx`

---

## 2. Remplir le .env.local

Une fois les 6 price IDs copiés, ton `.env.local` doit ressembler à ça :

```env
STRIPE_PRICE_ESSENTIEL_MONTHLY=price_1TPn5JPhZvVSyEMzAKwdXSXd
STRIPE_PRICE_ESSENTIEL_YEARLY=price_1TPn7nPhZvVSyEMzTH6k9m4P
STRIPE_PRICE_PRO_MONTHLY=price_1TPn8JPhZvVSyEMzA6I8GwtP.
STRIPE_PRICE_PRO_YEARLY=price_1TPn8rPhZvVSyEMz2uhqrFIz

---

## 3. Configurer le webhook Stripe

Le webhook met à jour le plan en DB après paiement.

1. Stripe Dashboard → **Développeurs → Webhooks → Ajouter un endpoint**
2. **URL** :
   - En dev : utilise [Stripe CLI](https://stripe.com/docs/stripe-cli) ou [ngrok](https://ngrok.com)
   - En prod : `https://lynarisai.com/api/webhooks/stripe`
3. **Événements à écouter** (sélectionne tous ces events) :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copie le **Signing secret** (`whsec_...`) → `.env.local` : `STRIPE_WEBHOOK_SECRET=whsec_xxx`

---

## 4. Tester en local avec Stripe CLI

```bash
# Installer Stripe CLI
! stripe login

# Forwarder les events vers localhost
! stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Dans un autre terminal, simuler un paiement
! stripe trigger checkout.session.completed
```

---

## 5. Où trouver les Price IDs

Stripe Dashboard → **Catalogue produits** → clique sur ton produit → section **Tarifs**
→ Le Price ID est le petit code `price_1...` sous chaque tarif (clique pour copier)

---

## 6. Checklist finale

- [ ] Produit "Essentiel" créé avec tarif mensuel + annuel
- [ ] Produit "Pro" créé avec tarif mensuel + annuel
- [ ] Produit "Cabinet médical" créé avec tarif mensuel + annuel
- [ ] Les 6 `price_xxx` copiés dans `.env.local`
- [ ] Webhook configuré avec les 6 événements
- [ ] `STRIPE_WEBHOOK_SECRET` mis à jour dans `.env.local`
- [ ] Test local avec Stripe CLI réussi

---

## Rappel des prix Lynaris

| Plan | Mensuel | Annuel |
|------|---------|--------|
| Essentiel | 69 €/mois | 59 €/mois (708 €/an) |
| Pro | 149 €/mois | 127 €/mois (1 524 €/an) |
| Cabinet | 590 €/mois | 499 €/mois (5 988 €/an) |
