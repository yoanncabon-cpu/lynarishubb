# Lynaris n8n Workflows

12 workflows prets a importer dans votre instance n8n self-hosted.

## Prerequis

- n8n self-hosted version 1.x (1.40+)
- Acces admin a l'instance
- Variables d'environnement configurees

## Variables d'environnement n8n

Ajouter dans Settings > Variables ou dans le fichier `.env` de n8n :

| Variable | Description | Obligatoire |
|---|---|---|
| `LYNARIS_CALLBACK_URL` | URL de base de votre app Lynaris (ex: https://lynarisai.com) | Oui |
| `LYNARIS_WEBHOOK_SECRET` | Secret HMAC partage avec Lynaris | Oui |
| `LINKEDIN_ACCESS_TOKEN` | Token OAuth LinkedIn | Pour publish-linkedin |
| `LINKEDIN_PERSON_ID` | ID de personne LinkedIn | Pour publish-linkedin |
| `META_ACCESS_TOKEN` | Token Meta Graph API | Pour publish-instagram |
| `INSTAGRAM_ACCOUNT_ID` | ID compte Instagram Business | Pour publish-instagram |
| `TIKTOK_ACCESS_TOKEN` | Token TikTok Business API | Pour publish-tiktok |
| `RESEND_API_KEY` | Cle API Resend | Pour publish-newsletter |
| `TWILIO_ACCOUNT_SID` | SID compte Twilio | Pour send-sms |
| `TWILIO_AUTH_TOKEN` | Token auth Twilio | Pour send-sms |
| `TWILIO_FROM_NUMBER` | Numero expediteur Twilio | Pour send-sms |
| `NOTION_TOKEN` | Token d'integration Notion | Pour notion + invoice |
| `ANTHROPIC_API_KEY` | Cle API Anthropic | Pour extract-invoice |
| `HUBSPOT_ACCESS_TOKEN` | Token acces HubSpot | Pour hubspot-sync |
| `SLACK_BOT_TOKEN` | Token bot Slack | Pour send-slack |
| `SLACK_DEFAULT_CHANNEL` | Channel Slack par defaut | Pour send-slack |
| `TRELLO_API_KEY` | Cle API Trello | Pour create-trello-card |
| `TRELLO_TOKEN` | Token OAuth Trello | Pour create-trello-card |
| `PHANTOMBUSTER_API_KEY` | Cle API Phantombuster | Pour linkedin-prospecting |
| `PHANTOMBUSTER_LINKEDIN_AGENT_ID` | ID agent Phantombuster LinkedIn | Pour linkedin-prospecting |

## Procedure d'import

### Methode 1 -- Import via interface n8n (recommandee)

1. Ouvrir n8n > **Workflows** > bouton **Import**
2. Selectionner le fichier JSON souhaite
3. Confirmer l'import
4. Configurer les variables d'environnement manquantes
5. Activer le workflow (toggle en haut a droite)
6. Copier l'URL du webhook affiche et la coller dans Lynaris > Integrations > n8n

### Methode 2 -- Import via API n8n (pour automatiser)

```bash
# Importer un workflow via l'API n8n
curl -X POST https://votre-n8n.domain.com/api/v1/workflows \
  -H "X-N8N-API-KEY: votre-api-key" \
  -H "Content-Type: application/json" \
  -d @publish-linkedin.json

# Activer le workflow
curl -X POST https://votre-n8n.domain.com/api/v1/workflows/{id}/activate \
  -H "X-N8N-API-KEY: votre-api-key"
```

### Methode 3 -- Script d'import automatique (tous les workflows)

```bash
#!/bin/bash
N8N_URL="https://votre-n8n.domain.com"
API_KEY="votre-api-key"

for f in *.json; do
  echo "Importing $f..."
  curl -s -X POST "$N8N_URL/api/v1/workflows" \
    -H "X-N8N-API-KEY: $API_KEY" \
    -H "Content-Type: application/json" \
    -d @"$f" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  > ID: {d[\"id\"]} | {d[\"name\"]}')"
done
echo "Done."
```

## Architecture de chaque workflow

Chaque workflow suit le pattern suivant :

```
[Webhook Entree]
     | (payload Lynaris)
[Extract Data]
     |
[Action Metier] (API tierce)
     | succes            | erreur
[Callback Success]    [Error Trigger]
                          |
                      [Callback Error]
```

### Payload entrant (depuis Lynaris)

```json
{
  "workflow": "publish-linkedin",
  "org_id": "uuid-de-lorg",
  "agent_slug": "lou",
  "run_id": "run_1745400000000",
  "timestamp": "2026-04-23T10:00:00Z",
  "data": { }
}
```

### Payload callback (vers Lynaris /api/webhooks/n8n)

```json
{
  "run_id": "run_1745400000000",
  "org_id": "uuid-de-lorg",
  "workflow": "publish-linkedin",
  "status": "success",
  "output": { "post_id": "7234..." },
  "duration_ms": 1842
}
```

## Workflows disponibles

| Fichier | Objectif | APIs requises |
|---|---|---|
| `publish-linkedin.json` | Post LinkedIn | LinkedIn API |
| `publish-instagram-carousel.json` | Carousel Instagram | Meta Graph API |
| `publish-tiktok.json` | Video TikTok | TikTok Business API |
| `publish-wordpress.json` | Article WordPress | WP REST API |
| `publish-newsletter.json` | Campagne email | Resend |
| `send-sms.json` | SMS | Twilio |
| `create-notion-page.json` | Page Notion | Notion API |
| `create-trello-card.json` | Carte Trello | Trello API |
| `send-slack-notification.json` | Notification Slack | Slack API |
| `extract-invoice-from-pdf.json` | OCR facture vers Notion | Anthropic + Notion |
| `linkedin-prospecting-send-message.json` | Message prospect LinkedIn | Phantombuster / LinkedIn |
| `hubspot-sync-contact.json` | Contact HubSpot | HubSpot CRM API |

## Details par workflow

### publish-linkedin
- **Payload data** : `content` (string), `image_url` (string, optionnel)
- **Output** : `post_id`
- **Notes** : Utilise l'API UGC Posts v2. Necessite un token OAuth LinkedIn avec scope `w_member_social`.

### publish-instagram-carousel
- **Payload data** : `images` (string[]), `caption` (string), `ig_account_id` (string, optionnel)
- **Output** : `media_id`
- **Notes** : Cree les containers individuels puis le carousel container, puis publie. Min 2, max 10 images.

### publish-tiktok
- **Payload data** : `video_url` (string), `caption` (string), `privacy_level` (string, defaut PUBLIC_TO_EVERYONE)
- **Output** : `publish_id`, `status`
- **Notes** : TikTok pull la video depuis l'URL. Inclut un wait de 5s pour le traitement.

### publish-wordpress
- **Payload data** : `title` (string), `content` (string HTML), `tags` (string[]), `status` (string), `schedule_at` (ISO date, optionnel), `site_url`, `username`, `app_password`
- **Output** : `post_id`, `post_url`, `post_status`
- **Notes** : Si `schedule_at` est fourni, le post est programme avec status "future". Auth via Application Password WordPress.

### publish-newsletter
- **Payload data** : `from` (string), `to` (string[]), `subject` (string), `html` (string), `text` (string)
- **Output** : `total_sent`, `batches`
- **Notes** : Split automatique en lots de 50 pour respecter les limites Resend.

### send-sms
- **Payload data** : `to` (string E.164), `body` (string), `from` (string, optionnel)
- **Output** : `message_sid`, `to`, `status`
- **Notes** : Si `from` non fourni, utilise `TWILIO_FROM_NUMBER`.

### create-notion-page
- **Payload data** : `database_id` (string), `title` (string), `properties` (object, optionnel), `content` (string, optionnel)
- **Output** : `page_id`, `page_url`
- **Notes** : Si `content` fourni, ajoute un bloc paragraphe apres creation. Les `properties` sont mergees avec le titre.

### create-trello-card
- **Payload data** : `list_id` (string), `name` (string), `desc` (string), `due` (ISO date), `members` (string[])
- **Output** : `card_id`, `card_url`
- **Notes** : Si `members` fourni, ajoute chaque membre a la carte apres creation.

### send-slack-notification
- **Payload data** : `channel` (string, optionnel), `message` (string), `blocks` (Block Kit array, optionnel), `username` (string, optionnel), `webhook_url` (string, optionnel)
- **Output** : `channel`, `sent_via`
- **Notes** : Si `webhook_url` fourni, envoie via Incoming Webhook. Sinon, utilise l'API chat.postMessage avec `SLACK_BOT_TOKEN`.

### extract-invoice-from-pdf
- **Payload data** : `pdf_url` (string), `notion_database_id` (string)
- **Output** : `notion_page_id`, `invoice_number`, `supplier`, `total`
- **Notes** : Telecharge le PDF, extrait le texte, envoie a Claude Haiku pour extraction structuree, cree une entree Notion. La DB Notion doit avoir les proprietes : Name (title), Numero (rich_text), Fournisseur (rich_text), Montant (number), Date (date), Devise (select).

### linkedin-prospecting-send-message
- **Payload data** : `prospect_profile_url` (string), `message_content` (string), `prospect_name` (string)
- **Output** : `prospect_name`, `prospect_url`, `message_sent`
- **Notes** : Verifie que le message contient le nom du prospect (personnalisation). Inclut un wait de 30s pour les rate limits LinkedIn. Necessite la configuration d'un agent Phantombuster.

### hubspot-sync-contact
- **Payload data** : `email` (string), `firstname` (string), `lastname` (string), `company` (string), `phone` (string), `properties` (object, optionnel)
- **Output** : `contact_id`, `action` (created/updated), `email`
- **Notes** : Recherche par email, cree si inexistant, met a jour si existant. Les `properties` additionnelles sont mergees.

## Depannage

### Le webhook n'est pas appele
- Verifier que le workflow est **active** (toggle vert)
- Verifier l'URL webhook dans Lynaris > Integrations > n8n

### Erreur d'authentification sur l'API tierce
- Verifier les variables d'environnement dans n8n Settings > Variables
- Tester manuellement le token avec curl avant d'importer

### Le callback vers Lynaris echoue
- Verifier que `LYNARIS_CALLBACK_URL` ne contient pas de slash final
- Verifier que votre instance Lynaris est accessible depuis le serveur n8n
- En local : utiliser ngrok (`ngrok http 3000`) et mettre l'URL ngrok dans `LYNARIS_CALLBACK_URL`

### Erreur 400 sur le callback
- Verifier le format du payload JSON dans le node "Callback Success"
- Le champ `run_id` doit etre present

### Le workflow extract-invoice echoue
- Verifier que le PDF est accessible publiquement via l'URL fournie
- Verifier que la DB Notion a les bonnes proprietes (Name, Numero, Fournisseur, Montant, Date, Devise)
- Verifier que `ANTHROPIC_API_KEY` a des credits disponibles
