import { PipedreamClient, ProjectEnvironment } from "@pipedream/sdk"

export function getPipedreamClient() {
  const clientId = process.env["PIPEDREAM_CLIENT_ID"]
  const clientSecret = process.env["PIPEDREAM_CLIENT_SECRET"]
  const projectId = process.env["PIPEDREAM_PROJECT_ID"]

  if (!clientId || !clientSecret || !projectId) {
    throw new Error("PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET et PIPEDREAM_PROJECT_ID requis")
  }

  return new PipedreamClient({
    projectId,
    clientId,
    clientSecret,
    projectEnvironment:
      process.env["PIPEDREAM_ENVIRONMENT"] === "production" || process.env["NODE_ENV"] === "production"
        ? ProjectEnvironment.Production
        : ProjectEnvironment.Development,
  })
}

/**
 * Crée un token court-terme pour le flow Connect côté frontend.
 * external_user_id = orgId Lynaris → lie chaque connexion à une org.
 */
export async function createConnectToken(orgId: string) {
  const pd = getPipedreamClient()
  const result = await pd.tokens.create({ externalUserId: orgId })
  return { token: result.token, expires_at: result.expiresAt }
}

/**
 * Récupère les credentials d'une connexion Pipedream.
 * Utilisé par les agents pour obtenir le access_token d'une intégration.
 */
export async function getPipedreamConnection(accountId: string) {
  const pd = getPipedreamClient()
  return pd.accounts.retrieve(accountId, { includeCredentials: true })
}

// Mapping slug Lynaris → slug Pipedream
// https://pipedream.com/apps (chercher le slug dans l'URL de l'app)
export const PIPEDREAM_APP_SLUGS: Record<string, string> = {
  // Communication
  slack:           "slack",
  discord:         "discord",
  zoom:            "zoom",
  telegram:        "telegram_bot_api",
  microsoft_teams: "microsoft_teams",
  outlook:         "microsoft_outlook",
  microsoft:       "microsoft_teams",
  intercom:        "intercom",
  zendesk:         "zendesk",
  freshdesk:       "freshdesk",
  freshservice:    "freshservice",
  crisp:           "crisp",
  livechat:        "livechat",
  front:           "front",
  helpscout:       "help_scout",
  gorgias:         "gorgias",
  tidio:           "tidio",
  chatwoot:        "chatwoot",

  // Google
  google:          "google",
  google_drive:    "google_drive",
  google_sheets:   "google_sheets",
  google_docs:     "google_docs",
  google_meet:     "google_meet",
  google_ads:      "google_ads",
  google_analytics:"google_analytics",
  youtube:         "youtube",

  // CRM & Ventes
  notion:          "notion",
  hubspot:         "hubspot",
  salesforce:      "salesforce",
  pipedrive:       "pipedrive",
  monday:          "monday",
  airtable:        "airtable",
  close:           "close",
  copper:          "copper",
  zoho:            "zoho_crm",
  attio:           "attio",
  streak:          "streak",
  freshsales:      "freshsales",
  folk:            "folk",

  // Réseaux sociaux & Contenu
  instagram:       "instagram_business",
  linkedin:        "linkedin",
  twitter:         "twitter_v2",
  facebook:        "facebook_pages",
  tiktok:          "tiktok",
  buffer:          "buffer",
  hootsuite:       "hootsuite",
  mailchimp:       "mailchimp",
  substack:        "substack",
  wordpress:       "wordpress",
  webflow:         "webflow",
  shopify:         "shopify",
  woocommerce:     "woocommerce",
  figma:           "figma",

  // Finance & Paiements
  stripe:          "stripe",
  quickbooks:      "quickbooks",
  xero:            "xero",
  paypal:          "paypal",
  gocardless:      "gocardless",
  chargebee:       "chargebee",
  mollie:          "mollie",
  freshbooks:      "freshbooks",

  // Marketing Email
  activecampaign:  "activecampaign",
  convertkit:      "convertkit",
  klaviyo:         "klaviyo",
  getresponse:     "getresponse",
  mailerlite:      "mailerlite",
  customerio:      "customer_io",
  brevo:           "brevo",
  sendgrid:        "sendgrid",
  drip:            "drip",
  omnisend:        "omnisend",
  postmark:        "postmark",
  mailgun:         "mailgun",
  onesignal:       "onesignal",

  // Prospection
  lusha:           "lusha",
  hunter:          "hunter",
  dropcontact:     "dropcontact",
  apollo:          "apollo",
  lemlist:         "lemlist",
  instantly:       "instantly",
  reply:           "reply_io",
  snov:            "snov_io",
  phantombuster:   "phantombuster",
  salesloft:       "salesloft",
  outreach:        "outreach",

  // Gestion de projet
  trello:          "trello",
  asana:           "asana",
  clickup:         "clickup",
  jira:            "jira",
  linear:          "linear",
  basecamp:        "basecamp",
  todoist:         "todoist",
  smartsheet:      "smartsheet",
  miro:            "miro",
  monday_work:     "monday",
  notion_calendar: "notion",
  loom:            "loom",
  typeform:        "typeform",
  surveymonkey:    "survey_monkey",

  // Stockage & Documents
  dropbox:         "dropbox",
  box:             "box",
  onedrive:        "microsoft_onedrive",
  docusign:        "docusign",
  pandadoc:        "pandadoc",
  hellosign:       "hellosign",
  yousign:         "yousign",

  // RH
  bamboohr:        "bamboohr",
  lever:           "lever",
  greenhouse:      "greenhouse",
  workable:        "workable",
  recruitee:       "recruitee",
  payfit:          "payfit",
  personio:        "personio",
  factorial:       "factorial",

  // Calendriers
  calendly:        "calendly",
  cal:             "cal_com",
  acuity:          "acuity_scheduling",

  // Infrastructure
  github:          "github",
  gitlab:          "gitlab",
  jira_cloud:      "jira",
  confluence:      "confluence",
  vercel:          "vercel",
  datadog:         "datadog",
  sentry:          "sentry",
  pagerduty:       "pagerduty",
  circleci:        "circleci",
  bitbucket:       "bitbucket",
  linear_app:      "linear",
  betterstack:     "betterstack",
  new_relic:       "new_relic",

  // Analytics
  amplitude:       "amplitude",
  mixpanel:        "mixpanel",
  segment:         "segment",
  posthog:         "posthog",
  hotjar:          "hotjar",
  google_looker:   "looker",

  // IA & Modèles
  openai:          "openai",
  anthropic:       "anthropic",
  replicate:       "replicate",
  deepgram:        "deepgram",
  huggingface:     "hugging_face",
  cohere:          "cohere",
  groq:            "groq",

  // Collaboration
  zoom_webinar:    "zoom",
  tally:           "tally",
  coda:            "coda",
  gitbook:         "gitbook",
  confluence_cloud:"confluence",
  fillout:         "fillout",

  // E-commerce & Logistique
  etsy:            "etsy",
  amazon_seller:   "amazon_seller_central",
  lightspeed:      "lightspeed",
  bigcommerce:     "bigcommerce",
  squarespace:     "squarespace",
  wix:             "wix",
  lemon_squeezy:   "lemonsqueezy",
  shipstation:     "shipstation",
  sendcloud:       "sendcloud",

  // Support
  zendesk_sell:    "zendesk_sell",

  // Vidéo & Médias
  vimeo:           "vimeo",
  wistia:          "wistia",
  vidyard:         "vidyard",
  cloudinary:      "cloudinary",
  sprout_social:   "sprout_social",
  later:           "later",

  // Comptabilité
  sage:            "sage_accounting",
  sellsy:          "sellsy",
  qonto:           "qonto",
  pennylane:       "pennylane",
  xero_fr:         "xero",

  // Automatisation
  zapier:          "zapier",
  make:            "make",
  n8n:             "n8n",
  pabbly:          "pabbly_connect",

  // Divers
  twilio:          "twilio",
  supabase:        "supabase",
  resend:          "resend",
  braintree:       "braintree",
  paypal_checkout: "paypal",

  // Communication / Téléphonie
  aircall:         "aircall",
  ringcentral:     "ringcentral",
  dialpad:         "dialpad",
  telnyx:          "telnyx",
  vonage:          "vonage",
  sinch:           "sinch",
  plivo:           "plivo",
  bandwidth:       "bandwidth",
  messagebird:     "messagebird",
  infobip:         "infobip",
  cloudtalk:       "cloudtalk",
  justcall:        "justcall",
  whatsapp:        "whatsapp_business",

  // Cloud & Infra
  aws:             "aws",
  cloudflare:      "cloudflare",
  neon:            "neon",
  railway:         "railway",
  render:          "render",
  upstash:         "upstash",
  fly:             "fly_io",
  grafana:         "grafana",

  // CMS & E-commerce
  contentful:      "contentful",
  ghost:           "ghost",
  prestashop:      "prestashop",
  adobe_sign:      "adobe_sign",

  // Analytics & BI
  heap:            "heap",
  fullstory:       "fullstory",
  metabase:        "metabase",
  tableau:         "tableau",
  power_bi:        "microsoft_power_bi",
  plausible:       "plausible",

  // IA & Modèles (supplémentaires)
  gemini:          "google_gemini",
  mistral:         "mistral",
  perplexity:      "perplexity",
  assemblyai:      "assemblyai",
  stability:       "stability_ai",
  together:        "together_ai",
  fireworks:       "fireworks_ai",
  fal:             "fal_ai",
  whisper:         "openai",
  azure_openai:    "azure_openai",
  bedrock:         "aws",
  ollama:          "ollama",
  elevenlabs:      "elevenlabs",

  // Finance (supplémentaires)
  adyen:           "adyen",
  revolut_biz:     "revolut_business",
  sumup:           "sumup",
  sumup_pos:       "sumup",
  iterable:        "iterable",

  // Automatisation (supplémentaires)
  workato:         "workato",
  activepieces:    "activepieces",
  integrately:     "integrately",
  pipedream:       "pipedream",

  // RH (supplémentaires)
  workday:         "workday",
  welcomejungle:   "welcome_to_the_jungle",
  elevo:           "elevo",
  lucca:           "lucca",
  silae:           "silae",

  // Prospection (supplémentaires)
  cognism:         "cognism",
  kaspr:           "kaspr",
  overloop:        "overloop",
  waalaxy:         "waalaxy",
  medium:          "medium",
  semrush:         "semrush",
  ahrefs:          "ahrefs",
  signaturit:      "signaturit",
  signnow:         "signnow",
  universign:      "universign",
  mux:             "mux",
  uptime_robot:    "uptimerobot",
  abby:            "abby",
  appointlet:      "appointlet",
  tidycal:         "tidycal",
  simplybook:      "simplybook",
  setmore:         "setmore",
  microsoft_pa:    "microsoft_power_automate",
}
