# Configuration ElevenLabs — Agent Marine

> Guide complet pour connecter Marine à ElevenLabs Conversational AI.
> Une fois configuré : appel entrant → Marine décroche → RDV créé dans Google Calendar + SMS envoyé.

---

## Prérequis

Avant de commencer :

- [ ] ElevenLabs connecté dans LynarisHub → Intégrations → ElevenLabs (clé API)
- [ ] Twilio connecté (Account SID + Auth Token + numéro)
- [ ] Google Calendar connecté (OAuth)
- [ ] `ELEVENLABS_API_KEY` présent dans `.env`

---

## Étape 1 — Créer l'agent dans ElevenLabs

ElevenLabs → **Conversational AI** → **Create Agent** → **Blank template**

### Onglet "Agent"

**First message** (phrase de décroché) :

> Laisse ce champ vide — LynarisHub génère automatiquement la phrase d'accueil selon ton secteur et ton nom d'organisation.
> Si tu veux en mettre une manuelle : `Bonjour, vous êtes bien au [NomEntreprise], je suis Marine votre assistante. Comment puis-je vous aider ?`

**System prompt** :

> Laisse vide ou mets `En attente de synchronisation depuis LynarisHub`.
> LynarisHub pousse automatiquement le prompt complet (adapté à ton secteur) à chaque sauvegarde des paramètres Marine.

**Language** : `French`

---

### Onglet "Voice"

Choisis la voix que tu as sélectionnée dans **LynarisHub → Marine → Paramètres → Voix ElevenLabs**.

Si tu n'en as pas encore sélectionné, retourne dans LynarisHub pour choisir et sauvegarder — le sync poussera la voix vers ElevenLabs automatiquement.

---

### Onglet "Tools" — Outil de prise de RDV

**Ajoute un outil de type Webhook** avec ces paramètres :

| Champ | Valeur |
|---|---|
| Nom | `Marine Lynaris` |
| Méthode | `POST` |
| URL | `https://www.lynaris.pro/api/voice/book` |
| Disable interruptions | ✅ coché |
| Discours avant l'outil | Auto |

**Description de l'outil** :

```
Utilise cet outil pour confirmer une prise de rendez-vous. Appelle-le UNIQUEMENT quand le patient a confirmé un créneau précis et que tu as son nom complet. L'outil crée le rendez-vous dans le calendrier et envoie un SMS de confirmation au patient.
```

**Body parameters** — ajoute ces 6 propriétés :

| Identifiant | Type | Requis | Description |
|---|---|---|---|
| `org_id` | string | ✅ | **Dynamic Variable** → sélectionne `org_id` dans la liste |
| `patient_name` | string | ✅ | Prénom et nom complet du patient |
| `patient_phone` | string | ✅ | Numéro de téléphone au format `+33XXXXXXXXX` |
| `appointment_datetime` | string | ✅ | Date et heure confirmée au format ISO 8601 — ex : `2026-06-01T14:00:00` |
| `service` | string | — | Motif ou type de consultation |
| `notes` | string | — | Informations complémentaires pour le praticien |

> **Important pour `org_id`** : dans ElevenLabs, sélectionne "Dynamic Variable" comme type de valeur, puis choisis `org_id` dans le menu déroulant. Cette valeur est injectée automatiquement depuis Twilio à chaque appel entrant.

---

### Onglet "Phone" — Connecter Twilio

1. **Add Phone Number** → **Twilio**
2. Entre tes credentials Twilio (Account SID + Auth Token)
3. Sélectionne ton numéro
4. Assigne-le à cet agent

> **Note Twilio** : n'entre rien dans le champ webhook de Twilio — ElevenLabs prend le contrôle direct du numéro une fois lié ici. Le webhook configuré dans Twilio (`/api/voice/incoming?org=...`) n'est utilisé que si ElevenLabs n'est **pas** connecté (fallback).

---

### Onglet "Post-call webhook"

| Champ | Valeur |
|---|---|
| URL | `https://www.lynaris.pro/api/webhooks/elevenlabs` |
| Events | `post_call_transcription` |
| Secret | Génère une chaîne aléatoire (32+ chars) |

Copie le secret dans ton `.env` :

```env
ELEVENLABS_WEBHOOK_SECRET=ta_chaine_ici
```

---

### Variables dynamiques

Dans ElevenLabs → ton agent → **Dynamic Variables** → ajoute :

| Variable | Valeur par défaut |
|---|---|
| `org_id` | Ton `org_id` (visible dans LynarisHub → Marine → Paramètres → section Téléphonie) |

---

## Étape 2 — Connecter l'agent à LynarisHub

1. Copie l'**Agent ID** de ton agent ElevenLabs (Settings de l'agent → en haut de la page, format `xxxxxxxxxxxxxxxxxxxxxxxx`)
2. Dans LynarisHub → **Marine → Paramètres** → section **ElevenLabs Conversational AI**
3. Colle l'Agent ID → **Sauvegarder**
4. Clique **Synchroniser le prompt maintenant** pour pousser immédiatement la config

---

## Étape 3 — Configurer Marine dans LynarisHub

Dans LynarisHub → **Marine → Paramètres** :

- **Nom de l'organisation** : le nom que Marine dira en décrochant
- **Secteur** : Médical, Restaurant, Artisan, Immobilier, Auto-école, Commerce ou Générique
- **Services proposés** : ce que Marine peut expliquer aux appelants
- **Horaires d'ouverture** : Marine les communiquera si demandé
- **Durée RDV** : durée par défaut pour les créneaux
- **Téléphone d'urgence** : numéro où transférer si urgence
- **Voix ElevenLabs** : la voix choisie (sélectionne + écoute le preview)

Clique **Sauvegarder** → le prompt est automatiquement poussé vers ElevenLabs.

---

## Flux d'un appel

```
Appelant compose le numéro Twilio
    ↓
Twilio → ElevenLabs (Conversational AI natif)
    ↓
Marine décroche, converse naturellement en FR
    ↓
Patient confirme un RDV
    ↓
Marine appelle l'outil "Marine Lynaris"
    → POST /api/voice/book { org_id, patient_name, patient_phone, appointment_datetime, ... }
    ↓
LynarisHub crée l'événement Google Calendar
LynarisHub envoie le SMS Twilio au patient
    ↓
Marine annonce la confirmation à voix haute
    ↓
Fin d'appel → webhook post-call → transcription sauvegardée
```

---

## Variables d'environnement requises

```env
# ElevenLabs
ELEVENLABS_API_KEY=sk_...          # Clé API ElevenLabs
ELEVENLABS_WEBHOOK_SECRET=...      # Secret du post-call webhook
ELEVENLABS_VOICE_ID_MARINE=...     # Voice ID fallback (optionnel si configuré dans settings)

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+33...

# Google (OAuth — configuré via LynarisHub → Intégrations → Google)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## Troubleshooting

| Symptôme | Cause probable | Solution |
|---|---|---|
| Marine ne décroche pas | Twilio webhook mal configuré | Vérifie que le numéro est bien assigné dans ElevenLabs → Phone |
| Prompt générique | `agent_id` pas configuré dans LynarisHub | Section ElevenLabs dans les settings Marine → colle l'Agent ID |
| RDV pas créé | `org_id` absent dans le body de l'outil | Dans l'outil ElevenLabs, `org_id` doit être en Dynamic Variable, pas en valeur fixe |
| SMS non envoyé | Twilio credentials absents | Vérifie LynarisHub → Intégrations → Twilio |
| Voix par défaut | Voice ID non synchronisé | Settings Marine → choisis une voix → Sauvegarder → Synchroniser |
| Erreur 403 webhook | Secret HMAC incorrect | Vérifie que `ELEVENLABS_WEBHOOK_SECRET` correspond au secret ElevenLabs |
