"use client"

import React, { useState, useEffect, useCallback } from "react"
import { logger } from "@/lib/logger"
import dynamic from "next/dynamic"
import { Search, CheckCircle2, X, Plug, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { GlassCard, GlassChip, GlassPanel } from "@/components/app/glass"
// import { AutomationConnectForm } from "./_components/AutomationConnectForm"

// Convertit un hex (#RRGGBB) en rgba(r,g,b,alpha)
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return `rgba(232,111,77,${alpha})`
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const ConfigModal = dynamic(
  () => import("./_components/ConfigModal").then(m => ({ default: m.ConfigModal })),
  { ssr: false }
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface IntegrationStatus {
  provider: string
  status: string
  connectedAt: string
}

type ConnectionType = "oauth" | "apikey" | "form" | "config" | "none"

interface Integration {
  provider: string
  name: string
  domain: string        // used for Clearbit logo: logo.clearbit.com/{domain}
  color: string         // fallback background if logo fails
  initial: string       // fallback letter
  category: string
  description: string
  connectionType: ConnectionType
  apiKeyLabel?: string
  comingSoon?: boolean
}

type _ApiKeyModalState = { provider: string; name: string; label: string } | null
type ConfigModalState = { provider: string; name: string; color: string; initial: string; domain: string } | null
type _OAuthModalState = { provider: string; name: string; domain: string } | null

// ─── 150+ Integrations catalog ────────────────────────────────────────────────

const ALL_INTEGRATIONS: Integration[] = [
  // ── Automatisation ─────────────────────────────────────────────────────────
  { provider: "n8n",          name: "n8n",              domain: "n8n.io",             color: "#FF6D5A", initial: "n", category: "automation",      description: "Workflows self-hosted via webhook", connectionType: "form" },
  { provider: "make",         name: "Make",             domain: "make.com",           color: "#6D00CC", initial: "M", category: "automation",      description: "Scénarios cloud via webhook instant", connectionType: "form" },
  { provider: "zapier",       name: "Zapier",           domain: "zapier.com",         color: "#FF4A00", initial: "Z", category: "automation",      description: "Connecte 5000+ apps automatiquement",connectionType: "oauth" },
  { provider: "activepieces", name: "ActivePieces",     domain: "activepieces.com",   color: "#6C47FF", initial: "A", category: "automation",      description: "Alternative open-source à Zapier",connectionType: "oauth" },
  { provider: "pipedream",    name: "Pipedream",        domain: "pipedream.com",      color: "#3D82FF", initial: "P", category: "automation",      description: "Workflows serverless pour développeurs",connectionType: "oauth" },
  { provider: "tray",         name: "Tray.io",          domain: "tray.io",            color: "#00C5CE", initial: "T", category: "automation",      description: "Automatisation enterprise low-code",connectionType: "oauth" },
  { provider: "automate",     name: "Automate.io",      domain: "automate.io",        color: "#0073FF", initial: "A", category: "automation",      description: "Automatisations multi-apps simples",connectionType: "oauth" },

  // ── Google ─────────────────────────────────────────────────────────────────
  { provider: "google",         name: "Google",           domain: "google.com",         color: "#4285F4", initial: "G", category: "google",          description: "Calendar + Gmail — agendas et emails", connectionType: "oauth" },
  { provider: "google_drive",   name: "Google Drive",     domain: "drive.google.com",   color: "#1DA462", initial: "D", category: "google",          description: "Stockage et partage de fichiers", connectionType: "oauth" },
  { provider: "google_sheets",  name: "Google Sheets",    domain: "sheets.google.com",  color: "#0F9D58", initial: "S", category: "google",          description: "Tableurs et données structurées", connectionType: "oauth" },
  { provider: "google_docs",    name: "Google Docs",      domain: "docs.google.com",    color: "#4285F4", initial: "D", category: "google",          description: "Création et édition de documents", connectionType: "oauth" },
  { provider: "google_meet",    name: "Google Meet",      domain: "meet.google.com",    color: "#00832D", initial: "M", category: "google",          description: "Visioconférences et réunions", connectionType: "oauth" },
  { provider: "google_ads",     name: "Google Ads",       domain: "ads.google.com",     color: "#4285F4", initial: "A", category: "google",          description: "Campagnes publicitaires Google",connectionType: "oauth" },
  { provider: "google_analytics", name: "Google Analytics", domain: "analytics.google.com", color: "#E37400", initial: "A", category: "google",   description: "Analytics et suivi de trafic",connectionType: "oauth" },

  // ── Communication ──────────────────────────────────────────────────────────
  { provider: "twilio",         name: "Twilio",           domain: "twilio.com",         color: "#F22F46", initial: "T", category: "communication",   description: "Appels, SMS, routing voix IA", connectionType: "config" },
  { provider: "elevenlabs",     name: "ElevenLabs",       domain: "elevenlabs.io",      color: "#1A1A2E", initial: "E", category: "communication",   description: "Voix IA ultra-réaliste pour agents", connectionType: "config" },
  { provider: "slack",          name: "Slack",            domain: "slack.com",          color: "#4A154B", initial: "S", category: "communication",   description: "Notifications depuis vos channels",connectionType: "oauth" },
  { provider: "discord",        name: "Discord",          domain: "discord.com",        color: "#5865F2", initial: "D", category: "communication",   description: "Bots et notifications Discord",connectionType: "oauth" },
  { provider: "whatsapp",       name: "WhatsApp Business",domain: "whatsapp.com",       color: "#25D366", initial: "W", category: "communication",   description: "Messagerie WhatsApp pour agents", connectionType: "config" },
  { provider: "telegram",       name: "Telegram",         domain: "telegram.org",       color: "#26A5E4", initial: "T", category: "communication",   description: "Bots Telegram pour notifications",connectionType: "oauth" },
  { provider: "microsoft_teams",name: "Microsoft Teams",  domain: "microsoft.com",      color: "#464EB8", initial: "M", category: "communication",   description: "Collaboration et réunions Teams",connectionType: "oauth" },
  { provider: "intercom",       name: "Intercom",         domain: "intercom.com",       color: "#1F8EFA", initial: "I", category: "communication",   description: "Messagerie client et support live",connectionType: "oauth" },
  { provider: "zendesk",        name: "Zendesk",          domain: "zendesk.com",        color: "#03363D", initial: "Z", category: "communication",   description: "Support client et ticketing",connectionType: "oauth" },
  { provider: "freshdesk",      name: "Freshdesk",        domain: "freshdesk.com",      color: "#25C16F", initial: "F", category: "communication",   description: "Helpdesk et gestion des tickets",connectionType: "oauth" },
  { provider: "sendgrid",       name: "SendGrid",         domain: "sendgrid.com",       color: "#1A82E2", initial: "S", category: "communication",   description: "Emails transactionnels et marketing", connectionType: "oauth" },
  { provider: "mailchimp",      name: "Mailchimp",        domain: "mailchimp.com",      color: "#FFE01B", initial: "M", category: "communication",   description: "Campagnes email et newsletters",connectionType: "oauth" },
  { provider: "brevo",          name: "Brevo",            domain: "brevo.com",          color: "#0B996E", initial: "B", category: "communication",   description: "Email marketing et CRM (ex Sendinblue)", connectionType: "oauth" },

  // ── CRM & Commercial ───────────────────────────────────────────────────────
  { provider: "hubspot",        name: "HubSpot",          domain: "hubspot.com",        color: "#FF7A59", initial: "H", category: "crm",             description: "CRM, contacts et pipeline commercial",connectionType: "oauth" },
  { provider: "salesforce",     name: "Salesforce",       domain: "salesforce.com",     color: "#00A1E0", initial: "S", category: "crm",             description: "CRM enterprise cloud leader",connectionType: "oauth" },
  { provider: "pipedrive",      name: "Pipedrive",        domain: "pipedrive.com",      color: "#053149", initial: "P", category: "crm",             description: "CRM pipeline pour équipes commerciales",connectionType: "oauth" },
  { provider: "notion",         name: "Notion",           domain: "notion.so",          color: "#000000", initial: "N", category: "crm",             description: "Bases de données et documents",connectionType: "oauth" },
  { provider: "airtable",       name: "Airtable",         domain: "airtable.com",       color: "#FCB400", initial: "A", category: "crm",             description: "Bases de données visuelles flexibles", connectionType: "oauth" },
  { provider: "monday",         name: "Monday.com",       domain: "monday.com",         color: "#FF3D57", initial: "m", category: "crm",             description: "Gestion de projets et CRM",connectionType: "oauth" },
  { provider: "dropcontact",    name: "Dropcontact",      domain: "dropcontact.com",    color: "#7C3AED", initial: "D", category: "crm",             description: "Enrichissement de prospects B2B", connectionType: "oauth" },
  { provider: "hunter",         name: "Hunter.io",        domain: "hunter.io",          color: "#F97316", initial: "H", category: "crm",             description: "Recherche d'emails et prospection", connectionType: "oauth" },
  { provider: "apollo",         name: "Apollo.io",        domain: "apollo.io",          color: "#4F46E5", initial: "A", category: "crm",             description: "Plateforme de prospection B2B complète", connectionType: "oauth" },
  { provider: "lemlist",        name: "Lemlist",          domain: "lemlist.com",        color: "#FF5484", initial: "L", category: "crm",             description: "Cold email et prospection automatisée", connectionType: "oauth" },
  { provider: "close",          name: "Close CRM",        domain: "close.com",          color: "#5F6BE8", initial: "C", category: "crm",             description: "CRM avec calling intégré",connectionType: "oauth" },
  { provider: "copper",         name: "Copper",           domain: "copper.com",         color: "#B07B56", initial: "C", category: "crm",             description: "CRM natif Google Workspace",connectionType: "oauth" },
  { provider: "zoho",           name: "Zoho CRM",         domain: "zoho.com",           color: "#E42527", initial: "Z", category: "crm",             description: "Suite CRM complète Zoho",connectionType: "oauth" },

  // ── Paiements & Finance ────────────────────────────────────────────────────
  { provider: "stripe",         name: "Stripe",           domain: "stripe.com",         color: "#635BFF", initial: "S", category: "payment",         description: "Paiements, abonnements et facturation", connectionType: "config" },
  { provider: "qonto",          name: "Qonto",            domain: "qonto.com",          color: "#000000", initial: "Q", category: "payment",         description: "Banque pro et comptabilité", connectionType: "oauth" },
  { provider: "pennylane",      name: "Pennylane",        domain: "pennylane.com",      color: "#00B8A9", initial: "P", category: "payment",         description: "Comptabilité et gestion financière", connectionType: "oauth" },
  { provider: "paypal",         name: "PayPal",           domain: "paypal.com",         color: "#003087", initial: "P", category: "payment",         description: "Paiements en ligne internationaux",connectionType: "oauth" },
  { provider: "chargebee",      name: "Chargebee",        domain: "chargebee.com",      color: "#FF6B4A", initial: "C", category: "payment",         description: "Facturation récurrente SaaS", connectionType: "oauth" },
  { provider: "gocardless",     name: "GoCardless",       domain: "gocardless.com",     color: "#019EF7", initial: "G", category: "payment",         description: "Prélèvements bancaires automatiques", connectionType: "oauth" },
  { provider: "sumup",          name: "SumUp",            domain: "sumup.com",          color: "#0072EF", initial: "S", category: "payment",         description: "Terminal de paiement et facturation", connectionType: "oauth" },

  // ── Contenu & SEO ──────────────────────────────────────────────────────────
  { provider: "wordpress",      name: "WordPress",        domain: "wordpress.org",      color: "#21759B", initial: "W", category: "content",         description: "Publication automatique d'articles", connectionType: "oauth" },
  { provider: "webflow",        name: "Webflow",          domain: "webflow.com",        color: "#4353FF", initial: "W", category: "content",         description: "Sites web no-code avancés", connectionType: "oauth" },
  { provider: "shopify",        name: "Shopify",          domain: "shopify.com",        color: "#96BF48", initial: "S", category: "content",         description: "E-commerce et gestion boutique", connectionType: "oauth" },
  { provider: "instagram",      name: "Instagram",        domain: "instagram.com",      color: "#E1306C", initial: "I", category: "content",         description: "Publication et analytics Instagram", connectionType: "oauth" },
  { provider: "linkedin",       name: "LinkedIn",         domain: "linkedin.com",       color: "#0077B5", initial: "L", category: "content",         description: "Posts et prospection LinkedIn", connectionType: "oauth" },
  { provider: "twitter",        name: "X (Twitter)",      domain: "twitter.com",        color: "#000000", initial: "X", category: "content",         description: "Tweets automatiques et monitoring", connectionType: "oauth" },
  { provider: "youtube",        name: "YouTube",          domain: "youtube.com",        color: "#FF0000", initial: "Y", category: "content",         description: "Analytics et publication vidéo",connectionType: "oauth" },
  { provider: "buffer",         name: "Buffer",           domain: "buffer.com",         color: "#2C4BFF", initial: "B", category: "content",         description: "Planification multi-réseaux sociaux",connectionType: "oauth" },
  { provider: "hootsuite",      name: "Hootsuite",        domain: "hootsuite.com",      color: "#000000", initial: "H", category: "content",         description: "Gestion des réseaux sociaux",connectionType: "oauth" },
  { provider: "semrush",        name: "SEMrush",          domain: "semrush.com",        color: "#FF6B00", initial: "S", category: "content",         description: "SEO, mots-clés et audits", connectionType: "oauth" },
  { provider: "ahrefs",         name: "Ahrefs",           domain: "ahrefs.com",         color: "#FF8200", initial: "A", category: "content",         description: "Analyse backlinks et SEO", connectionType: "oauth" },
  { provider: "contentful",     name: "Contentful",       domain: "contentful.com",     color: "#2478CC", initial: "C", category: "content",         description: "CMS headless pour développeurs", connectionType: "oauth" },
  { provider: "ghost",          name: "Ghost",            domain: "ghost.org",          color: "#15171A", initial: "G", category: "content",         description: "Blog et newsletter premium", connectionType: "oauth" },
  { provider: "medium",         name: "Medium",           domain: "medium.com",         color: "#000000", initial: "M", category: "content",         description: "Publication d'articles Medium", connectionType: "oauth" },
  { provider: "substack",       name: "Substack",         domain: "substack.com",       color: "#FF6719", initial: "S", category: "content",         description: "Newsletter et abonnements",connectionType: "oauth" },
  { provider: "figma",          name: "Figma",            domain: "figma.com",          color: "#1ABCFE", initial: "F", category: "content",         description: "Design et prototypage collaboratif",connectionType: "oauth" },

  // ── IA & Vision ────────────────────────────────────────────────────────────
  { provider: "replicate",      name: "Replicate",        domain: "replicate.com",      color: "#7C3AED", initial: "R", category: "ai",              description: "Génération d'images Flux 1.1 Pro", connectionType: "oauth" },
  { provider: "openai",         name: "OpenAI",           domain: "openai.com",         color: "#10A37F", initial: "O", category: "ai",              description: "GPT-4o, DALL-E, Whisper STT", connectionType: "oauth" },
  { provider: "deepgram",       name: "Deepgram",         domain: "deepgram.com",       color: "#13EF93", initial: "D", category: "ai",              description: "Transcription vocale temps réel", connectionType: "oauth" },
  { provider: "anthropic",      name: "Anthropic",        domain: "anthropic.com",      color: "#D4A27F", initial: "A", category: "ai",              description: "Claude — modèle configuré par défaut", connectionType: "oauth" },
  { provider: "midjourney",     name: "Midjourney",       domain: "midjourney.com",     color: "#000000", initial: "M", category: "ai",              description: "Génération d'images artistiques",connectionType: "oauth" },
  { provider: "perplexity",     name: "Perplexity AI",    domain: "perplexity.ai",      color: "#20808D", initial: "P", category: "ai",              description: "Recherche web avec IA", connectionType: "oauth" },
  { provider: "huggingface",    name: "Hugging Face",     domain: "huggingface.co",     color: "#FFD21E", initial: "H", category: "ai",              description: "Modèles ML open-source", connectionType: "oauth" },
  { provider: "cohere",         name: "Cohere",           domain: "cohere.com",         color: "#39594D", initial: "C", category: "ai",              description: "NLP et embeddings enterprise", connectionType: "oauth" },
  { provider: "stability",      name: "Stability AI",     domain: "stability.ai",       color: "#7000E8", initial: "S", category: "ai",              description: "Stable Diffusion et génération d'images", connectionType: "oauth" },
  { provider: "groq",           name: "Groq",             domain: "groq.com",           color: "#F55036", initial: "G", category: "ai",              description: "Inférence LLM ultra-rapide", connectionType: "oauth" },

  // ── Infrastructure ─────────────────────────────────────────────────────────
  { provider: "supabase",       name: "Supabase",         domain: "supabase.com",       color: "#3ECF8E", initial: "S", category: "infrastructure",  description: "Base de données PostgreSQL cloud", connectionType: "oauth" },
  { provider: "github",         name: "GitHub",           domain: "github.com",         color: "#181717", initial: "G", category: "infrastructure",  description: "Code, issues et pull requests", connectionType: "oauth" },
  { provider: "gitlab",         name: "GitLab",           domain: "gitlab.com",         color: "#FC6D26", initial: "G", category: "infrastructure",  description: "DevOps et CI/CD",connectionType: "oauth" },
  { provider: "jira",           name: "Jira",             domain: "atlassian.com",      color: "#0052CC", initial: "J", category: "infrastructure",  description: "Tickets et gestion de projet Agile",connectionType: "oauth" },
  { provider: "linear",         name: "Linear",           domain: "linear.app",         color: "#5E6AD2", initial: "L", category: "infrastructure",  description: "Issues et roadmap produit", connectionType: "oauth" },
  { provider: "sentry",         name: "Sentry",           domain: "sentry.io",          color: "#362D59", initial: "S", category: "infrastructure",  description: "Monitoring d'erreurs en temps réel", connectionType: "oauth" },
  { provider: "datadog",        name: "Datadog",          domain: "datadoghq.com",      color: "#632CA6", initial: "D", category: "infrastructure",  description: "Observabilité et monitoring cloud", connectionType: "oauth" },
  { provider: "vercel",         name: "Vercel",           domain: "vercel.com",         color: "#000000", initial: "V", category: "infrastructure",  description: "Déploiement et hosting Next.js", connectionType: "oauth" },
  { provider: "aws",            name: "Amazon AWS",       domain: "aws.amazon.com",     color: "#FF9900", initial: "A", category: "infrastructure",  description: "Cloud computing et services AWS", connectionType: "oauth" },
  { provider: "cloudflare",     name: "Cloudflare",       domain: "cloudflare.com",     color: "#F38020", initial: "C", category: "infrastructure",  description: "CDN, DNS et sécurité web", connectionType: "oauth" },

  // ── Gestion de projet ──────────────────────────────────────────────────────
  { provider: "trello",         name: "Trello",           domain: "trello.com",         color: "#0079BF", initial: "T", category: "project",         description: "Kanban et gestion de tâches",connectionType: "oauth" },
  { provider: "asana",          name: "Asana",            domain: "asana.com",          color: "#273347", initial: "A", category: "project",         description: "Gestion de projets et tâches",connectionType: "oauth" },
  { provider: "clickup",        name: "ClickUp",          domain: "clickup.com",        color: "#7B68EE", initial: "C", category: "project",         description: "Productivité et gestion tout-en-un", connectionType: "oauth" },
  { provider: "basecamp",       name: "Basecamp",         domain: "basecamp.com",       color: "#1D2D35", initial: "B", category: "project",         description: "Gestion de projets d'équipe",connectionType: "oauth" },
  { provider: "todoist",        name: "Todoist",          domain: "todoist.com",        color: "#DB4035", initial: "T", category: "project",         description: "Gestion des tâches personnelles",connectionType: "oauth" },
  { provider: "smartsheet",     name: "Smartsheet",       domain: "smartsheet.com",     color: "#0073E6", initial: "S", category: "project",         description: "Tableurs collaboratifs avancés",connectionType: "oauth" },
  { provider: "miro",           name: "Miro",             domain: "miro.com",           color: "#FFD02F", initial: "M", category: "project",         description: "Tableau blanc collaboratif en ligne",connectionType: "oauth" },

  // ── Stockage & Documents ───────────────────────────────────────────────────
  { provider: "dropbox",        name: "Dropbox",          domain: "dropbox.com",        color: "#0061FF", initial: "D", category: "storage",         description: "Stockage et partage de fichiers",connectionType: "oauth" },
  { provider: "box",            name: "Box",              domain: "box.com",            color: "#0061D5", initial: "B", category: "storage",         description: "Stockage enterprise sécurisé",connectionType: "oauth" },
  { provider: "onedrive",       name: "OneDrive",         domain: "microsoft.com",      color: "#0078D4", initial: "O", category: "storage",         description: "Stockage Microsoft Cloud",connectionType: "oauth" },
  { provider: "docusign",       name: "DocuSign",         domain: "docusign.com",       color: "#FFCC00", initial: "D", category: "storage",         description: "Signature électronique avancée",connectionType: "oauth" },
  { provider: "pandadoc",       name: "PandaDoc",         domain: "pandadoc.com",       color: "#67D0A3", initial: "P", category: "storage",         description: "Documents, devis et contrats", connectionType: "oauth" },

  // ── RH & Recrutement ───────────────────────────────────────────────────────
  { provider: "workable",       name: "Workable",         domain: "workable.com",       color: "#0083B2", initial: "W", category: "hr",              description: "Recrutement et suivi candidats", connectionType: "oauth" },
  { provider: "lever",          name: "Lever",            domain: "lever.co",           color: "#00B5CC", initial: "L", category: "hr",              description: "ATS et gestion des talents",connectionType: "oauth" },
  { provider: "bamboohr",       name: "BambooHR",         domain: "bamboohr.com",       color: "#73B234", initial: "B", category: "hr",              description: "RH et gestion des employés", connectionType: "oauth" },
  { provider: "personio",       name: "Personio",         domain: "personio.com",       color: "#1D3640", initial: "P", category: "hr",              description: "SIRH pour PME européennes", connectionType: "oauth" },
  { provider: "factorial",      name: "Factorial",        domain: "factorialhr.com",    color: "#0F2942", initial: "F", category: "hr",              description: "RH simplifié pour PME",connectionType: "oauth" },

  // ── Calendriers ────────────────────────────────────────────────────────────
  { provider: "calendly",       name: "Calendly",         domain: "calendly.com",       color: "#006BFF", initial: "C", category: "calendar",        description: "Prise de RDV automatisée",connectionType: "oauth" },
  { provider: "cal",            name: "Cal.com",          domain: "cal.com",            color: "#292929", initial: "C", category: "calendar",        description: "Scheduling open-source",connectionType: "oauth" },
  { provider: "outlook",        name: "Outlook",          domain: "outlook.com",        color: "#0078D4", initial: "O", category: "calendar",        description: "Email et calendrier Microsoft",connectionType: "oauth" },
  { provider: "acuity",         name: "Acuity Scheduling",domain: "acuityscheduling.com",color: "#7B4397", initial: "A", category: "calendar",       description: "Réservation de créneaux en ligne",connectionType: "oauth" },

  // ── Formation & Collaboration ──────────────────────────────────────────────
  { provider: "zoom",           name: "Zoom",             domain: "zoom.us",            color: "#2D8CFF", initial: "Z", category: "collab",          description: "Visioconférences et webinaires",connectionType: "oauth" },
  { provider: "loom",           name: "Loom",             domain: "loom.com",           color: "#625DF5", initial: "L", category: "collab",          description: "Enregistrements vidéo asynchrones",connectionType: "oauth" },
  { provider: "typeform",       name: "Typeform",         domain: "typeform.com",       color: "#262627", initial: "T", category: "collab",          description: "Formulaires et enquêtes engageantes",connectionType: "oauth" },
  { provider: "surveymonkey",   name: "SurveyMonkey",     domain: "surveymonkey.com",   color: "#00BF6F", initial: "S", category: "collab",          description: "Enquêtes et sondages en ligne",connectionType: "oauth" },
  { provider: "notion_calendar",name: "Notion Calendar",  domain: "notion.so",          color: "#000000", initial: "N", category: "collab",          description: "Calendrier intégré dans Notion",connectionType: "oauth" },

  // ── Téléphonie avancée ─────────────────────────────────────────────────────
  { provider: "aircall",        name: "Aircall",          domain: "aircall.io",         color: "#00B388", initial: "A", category: "telephony",       description: "Téléphonie cloud pour équipes commerciales", connectionType: "oauth" },
  { provider: "ringcentral",    name: "RingCentral",      domain: "ringcentral.com",    color: "#F57C00", initial: "R", category: "telephony",       description: "UCaaS — voix, vidéo et messagerie",connectionType: "oauth" },
  { provider: "justcall",       name: "JustCall",         domain: "justcall.io",        color: "#6C5CE7", initial: "J", category: "telephony",       description: "Appels et SMS pour équipes de vente", connectionType: "oauth" },
  { provider: "cloudtalk",      name: "CloudTalk",        domain: "cloudtalk.io",       color: "#0099FF", initial: "C", category: "telephony",       description: "Call center cloud intelligent", connectionType: "oauth" },
  { provider: "dialpad",        name: "Dialpad",          domain: "dialpad.com",        color: "#7C4DFF", initial: "D", category: "telephony",       description: "Téléphonie IA avec transcription live",connectionType: "oauth" },
  { provider: "vonage",         name: "Vonage",           domain: "vonage.com",         color: "#343434", initial: "V", category: "telephony",       description: "API voix, SMS et vidéo", connectionType: "oauth" },
  { provider: "sinch",          name: "Sinch",            domain: "sinch.com",          color: "#00C4B3", initial: "S", category: "telephony",       description: "SMS, voix et vérification", connectionType: "oauth" },
  { provider: "messagebird",    name: "MessageBird",      domain: "messagebird.com",    color: "#2481D7", initial: "M", category: "telephony",       description: "API communication omnicanale", connectionType: "oauth" },
  { provider: "infobip",        name: "Infobip",          domain: "infobip.com",        color: "#FF4E2F", initial: "I", category: "telephony",       description: "Plateforme CPaaS enterprise globale", connectionType: "oauth" },
  { provider: "plivo",          name: "Plivo",            domain: "plivo.com",          color: "#17B978", initial: "P", category: "telephony",       description: "API voix et SMS cloud", connectionType: "oauth" },
  { provider: "bandwidth",      name: "Bandwidth",        domain: "bandwidth.com",      color: "#0065FF", initial: "B", category: "telephony",       description: "Réseau voix direct pour apps", connectionType: "oauth" },
  { provider: "telnyx",         name: "Telnyx",           domain: "telnyx.com",         color: "#00BFA5", initial: "T", category: "telephony",       description: "Téléphonie cloud elastic & API SIP", connectionType: "oauth" },

  // ── Marketing Email ────────────────────────────────────────────────────────
  { provider: "activecampaign", name: "ActiveCampaign",   domain: "activecampaign.com", color: "#356AE6", initial: "A", category: "email_marketing", description: "Email automation et CRM marketing", connectionType: "oauth" },
  { provider: "convertkit",     name: "Kit (ConvertKit)", domain: "kit.com",            color: "#FB6970", initial: "K", category: "email_marketing", description: "Email marketing pour créateurs", connectionType: "oauth" },
  { provider: "klaviyo",        name: "Klaviyo",          domain: "klaviyo.com",        color: "#000000", initial: "K", category: "email_marketing", description: "Email & SMS marketing e-commerce", connectionType: "oauth" },
  { provider: "getresponse",    name: "GetResponse",      domain: "getresponse.com",    color: "#00BAFF", initial: "G", category: "email_marketing", description: "Email marketing et landing pages", connectionType: "oauth" },
  { provider: "mailerlite",     name: "MailerLite",       domain: "mailerlite.com",     color: "#09B04D", initial: "M", category: "email_marketing", description: "Email marketing abordable et puissant", connectionType: "oauth" },
  { provider: "customerio",     name: "Customer.io",      domain: "customer.io",        color: "#F9C74F", initial: "C", category: "email_marketing", description: "Messages comportementaux multi-canaux", connectionType: "oauth" },
  { provider: "omnisend",       name: "Omnisend",         domain: "omnisend.com",       color: "#2BC0A0", initial: "O", category: "email_marketing", description: "Email & SMS marketing e-commerce", connectionType: "oauth" },
  { provider: "drip",           name: "Drip",             domain: "drip.com",           color: "#C73B7E", initial: "D", category: "email_marketing", description: "ECRM pour e-commerce", connectionType: "oauth" },
  { provider: "postmark",       name: "Postmark",         domain: "postmarkapp.com",    color: "#FFDE00", initial: "P", category: "email_marketing", description: "Emails transactionnels ultra-rapides", connectionType: "oauth" },
  { provider: "mailgun",        name: "Mailgun",          domain: "mailgun.com",        color: "#F7020A", initial: "M", category: "email_marketing", description: "API email pour développeurs", connectionType: "oauth" },
  { provider: "onesignal",      name: "OneSignal",        domain: "onesignal.com",      color: "#E54B4D", initial: "O", category: "email_marketing", description: "Push notifications multi-canaux", connectionType: "oauth" },
  { provider: "iterable",       name: "Iterable",         domain: "iterable.com",       color: "#5BB75B", initial: "I", category: "email_marketing", description: "Cross-channel marketing à grande échelle", connectionType: "oauth" },

  // ── E-commerce & Logistique ────────────────────────────────────────────────
  { provider: "woocommerce",    name: "WooCommerce",      domain: "woocommerce.com",    color: "#7F54B3", initial: "W", category: "ecommerce",       description: "E-commerce WordPress", connectionType: "oauth" },
  { provider: "prestashop",     name: "PrestaShop",       domain: "prestashop.com",     color: "#DF0067", initial: "P", category: "ecommerce",       description: "Solution e-commerce open-source", connectionType: "oauth" },
  { provider: "bigcommerce",    name: "BigCommerce",      domain: "bigcommerce.com",    color: "#34313F", initial: "B", category: "ecommerce",       description: "Plateforme e-commerce SaaS avancée", connectionType: "oauth" },
  { provider: "wix",            name: "Wix",              domain: "wix.com",            color: "#0C6EFC", initial: "W", category: "ecommerce",       description: "Sites web et boutiques en ligne", connectionType: "oauth" },
  { provider: "squarespace",    name: "Squarespace",      domain: "squarespace.com",    color: "#000000", initial: "S", category: "ecommerce",       description: "Sites élégants avec boutique intégrée",connectionType: "oauth" },
  { provider: "etsy",           name: "Etsy",             domain: "etsy.com",           color: "#F1641E", initial: "E", category: "ecommerce",       description: "Marketplace artisanat et créations",connectionType: "oauth" },
  { provider: "amazon_seller",  name: "Amazon Seller",    domain: "sellercentral.amazon.com", color: "#FF9900", initial: "A", category: "ecommerce", description: "Gestion boutique Amazon", connectionType: "oauth" },
  { provider: "shipstation",    name: "ShipStation",      domain: "shipstation.com",    color: "#2D9CDB", initial: "S", category: "ecommerce",       description: "Gestion expéditions multi-transporteurs", connectionType: "oauth" },
  { provider: "sendcloud",      name: "Sendcloud",        domain: "sendcloud.com",      color: "#F05B24", initial: "S", category: "ecommerce",       description: "Logistique e-commerce Europe", connectionType: "oauth" },
  { provider: "lightspeed",     name: "Lightspeed",       domain: "lightspeedhq.com",   color: "#FF4500", initial: "L", category: "ecommerce",       description: "POS et e-commerce omnicanal", connectionType: "oauth" },
  { provider: "sumup_pos",      name: "SumUp POS",        domain: "sumup.com",          color: "#0072EF", initial: "S", category: "ecommerce",       description: "Caisse et paiement en point de vente", connectionType: "oauth" },
  { provider: "lemon_squeezy",  name: "Lemon Squeezy",    domain: "lemonsqueezy.com",   color: "#FFC131", initial: "L", category: "ecommerce",       description: "Paiements SaaS et produits numériques", connectionType: "oauth" },

  // ── Comptabilité & Finance FR ──────────────────────────────────────────────
  { provider: "quickbooks",     name: "QuickBooks",       domain: "quickbooks.intuit.com", color: "#2CA01C", initial: "Q", category: "accounting",   description: "Comptabilité PME internationale",connectionType: "oauth" },
  { provider: "xero",           name: "Xero",             domain: "xero.com",           color: "#13B5EA", initial: "X", category: "accounting",      description: "Comptabilité cloud pour PME",connectionType: "oauth" },
  { provider: "freshbooks",     name: "FreshBooks",       domain: "freshbooks.com",     color: "#0075DD", initial: "F", category: "accounting",      description: "Facturation et comptabilité freelances", connectionType: "oauth" },
  { provider: "tiime",          name: "Tiime",            domain: "tiime.fr",           color: "#6C47FF", initial: "T", category: "accounting",      description: "Comptabilité et factures pour TPE FR", connectionType: "oauth" },
  { provider: "indy",           name: "Indy",             domain: "indy.fr",            color: "#6A67CE", initial: "I", category: "accounting",      description: "Compta automatisée auto-entrepreneurs FR", connectionType: "oauth" },
  { provider: "abby",           name: "Abby",             domain: "abby.fr",            color: "#FF6B6B", initial: "A", category: "accounting",      description: "Gestion administrative freelances FR", connectionType: "oauth" },
  { provider: "axonaut",        name: "Axonaut",          domain: "axonaut.com",        color: "#FF7043", initial: "A", category: "accounting",      description: "ERP PME — CRM, factures, compta", connectionType: "oauth" },
  { provider: "sellsy",         name: "Sellsy",           domain: "sellsy.com",         color: "#F5A623", initial: "S", category: "accounting",      description: "CRM et facturation pour TPE/PME FR",connectionType: "oauth" },
  { provider: "sage",           name: "Sage",             domain: "sage.com",           color: "#00DC2B", initial: "S", category: "accounting",      description: "ERP et compta Sage pour PME/ETI", connectionType: "oauth" },
  { provider: "cegid",          name: "Cegid",            domain: "cegid.com",          color: "#E30613", initial: "C", category: "accounting",      description: "Logiciels de gestion et paie", connectionType: "oauth" },
  { provider: "mollie",         name: "Mollie",           domain: "mollie.com",         color: "#000000", initial: "M", category: "accounting",      description: "Paiements en ligne Europe", connectionType: "oauth" },
  { provider: "adyen",          name: "Adyen",            domain: "adyen.com",          color: "#0ABF53", initial: "A", category: "accounting",      description: "Paiements enterprise multi-canaux", connectionType: "oauth" },
  { provider: "revolut_biz",    name: "Revolut Business", domain: "business.revolut.com",color: "#191C21", initial: "R", category: "accounting",    description: "Banque pro et cartes virtuelles", connectionType: "oauth" },
  { provider: "shine",          name: "Shine",            domain: "shine.fr",           color: "#5B5BE6", initial: "S", category: "accounting",      description: "Compte pro pour indépendants FR", connectionType: "oauth" },

  // ── Analytics & BI ─────────────────────────────────────────────────────────
  { provider: "power_bi",       name: "Power BI",         domain: "powerbi.microsoft.com",color: "#F2C811", initial: "P", category: "analytics",   description: "Visualisation de données Microsoft",connectionType: "oauth" },
  { provider: "tableau",        name: "Tableau",          domain: "tableau.com",        color: "#E97627", initial: "T", category: "analytics",       description: "Data viz enterprise leader",connectionType: "oauth" },
  { provider: "metabase",       name: "Metabase",         domain: "metabase.com",       color: "#509EE3", initial: "M", category: "analytics",       description: "Analytics SQL open-source", connectionType: "oauth" },
  { provider: "looker",         name: "Looker Studio",    domain: "lookerstudio.google.com", color: "#4285F4", initial: "L", category: "analytics", description: "Rapports et dashboards Google",connectionType: "oauth" },
  { provider: "plausible",      name: "Plausible",        domain: "plausible.io",       color: "#5850EC", initial: "P", category: "analytics",       description: "Analytics RGPD-friendly léger", connectionType: "oauth" },
  { provider: "amplitude",      name: "Amplitude",        domain: "amplitude.com",      color: "#1662C4", initial: "A", category: "analytics",       description: "Product analytics et funnels", connectionType: "oauth" },
  { provider: "mixpanel",       name: "Mixpanel",         domain: "mixpanel.com",       color: "#7856FF", initial: "M", category: "analytics",       description: "Analytics comportemental produit", connectionType: "oauth" },
  { provider: "segment",        name: "Segment",          domain: "segment.com",        color: "#52BD94", initial: "S", category: "analytics",       description: "CDP — centralise toutes vos données", connectionType: "oauth" },
  { provider: "posthog",        name: "PostHog",          domain: "posthog.com",        color: "#F54E00", initial: "P", category: "analytics",       description: "Analytics open-source tout-en-un", connectionType: "oauth" },
  { provider: "hotjar",         name: "Hotjar",           domain: "hotjar.com",         color: "#FF3C00", initial: "H", category: "analytics",       description: "Heatmaps et enregistrements sessions", connectionType: "oauth" },
  { provider: "clarity",        name: "Microsoft Clarity", domain: "clarity.microsoft.com", color: "#0078D4", initial: "C", category: "analytics", description: "Heatmaps et sessions Microsoft gratuit",connectionType: "oauth" },
  { provider: "fullstory",      name: "FullStory",        domain: "fullstory.com",      color: "#FF6B6B", initial: "F", category: "analytics",       description: "DX analytics et replay sessions", connectionType: "oauth" },
  { provider: "heap",           name: "Heap",             domain: "heap.io",            color: "#6941C6", initial: "H", category: "analytics",       description: "Analytics auto-capture sans code", connectionType: "oauth" },

  // ── Signature électronique ─────────────────────────────────────────────────
  { provider: "yousign",        name: "YouSign",          domain: "yousign.com",        color: "#7B61FF", initial: "Y", category: "signature",       description: "Signature électronique certifiée FR/EU", connectionType: "oauth" },
  { provider: "hellosign",      name: "Dropbox Sign",     domain: "hellosign.com",      color: "#0061FE", initial: "D", category: "signature",       description: "Signature électronique simple et rapide", connectionType: "oauth" },
  { provider: "adobe_sign",     name: "Adobe Acrobat Sign",domain: "acrobat.adobe.com", color: "#FF0000", initial: "A", category: "signature",       description: "Signature électronique Adobe",connectionType: "oauth" },
  { provider: "signaturit",     name: "Signaturit",       domain: "signaturit.com",     color: "#4A90D9", initial: "S", category: "signature",       description: "Signature électronique qualifiée eIDAS", connectionType: "oauth" },
  { provider: "signnow",        name: "SignNow",          domain: "signnow.com",        color: "#00A86B", initial: "S", category: "signature",       description: "Signature électronique & workflows", connectionType: "oauth" },
  { provider: "universign",     name: "Universign",       domain: "universign.com",     color: "#0050C8", initial: "U", category: "signature",       description: "Signature certifiée eIDAS niveau avancé", connectionType: "oauth" },

  // ── RH & Paie ─────────────────────────────────────────────────────────────
  { provider: "payfit",         name: "PayFit",           domain: "payfit.com",         color: "#5F2EEA", initial: "P", category: "hr",              description: "Paie et RH automatisés pour PME FR", connectionType: "oauth" },
  { provider: "silae",          name: "Silae",            domain: "silae.fr",           color: "#C00000", initial: "S", category: "hr",              description: "Logiciel de paie experts-comptables FR", connectionType: "oauth" },
  { provider: "lucca",          name: "Lucca",            domain: "lucca.fr",           color: "#00B050", initial: "L", category: "hr",              description: "Suite RH SIRH pour ETI et PME FR", connectionType: "oauth" },
  { provider: "elevo",          name: "Elevo",            domain: "elevo.fr",           color: "#5C6BC0", initial: "E", category: "hr",              description: "Performance et engagement collaborateurs",connectionType: "oauth" },
  { provider: "welcomejungle",  name: "Welcome to the Jungle", domain: "welcometothejungle.com", color: "#3D1DFF", initial: "W", category: "hr",   description: "Marque employeur et offres d'emploi", connectionType: "oauth" },
  { provider: "workday",        name: "Workday",          domain: "workday.com",        color: "#F05A28", initial: "W", category: "hr",              description: "SIRH enterprise cloud leader mondial",connectionType: "oauth" },
  { provider: "greenhouse",     name: "Greenhouse",       domain: "greenhouse.io",      color: "#48CB83", initial: "G", category: "hr",              description: "ATS et recrutement structuré", connectionType: "oauth" },
  { provider: "recruitee",      name: "Recruitee",        domain: "recruitee.com",      color: "#009EF7", initial: "R", category: "hr",              description: "ATS collaboratif pour PME",connectionType: "oauth" },

  // ── Prospection ────────────────────────────────────────────────────────────
  { provider: "lusha",          name: "Lusha",            domain: "lusha.com",          color: "#4B5EE4", initial: "L", category: "prospecting",     description: "Data B2B — emails et téléphones vérifiés", connectionType: "oauth" },
  { provider: "kaspr",          name: "Kaspr",            domain: "kaspr.io",           color: "#7C3AED", initial: "K", category: "prospecting",     description: "Enrichissement LinkedIn — numéros FR", connectionType: "oauth" },
  { provider: "cognism",        name: "Cognism",          domain: "cognism.com",        color: "#1F5CF0", initial: "C", category: "prospecting",     description: "Data B2B premium EMEA", connectionType: "oauth" },
  { provider: "phantombuster",  name: "PhantomBuster",    domain: "phantombuster.com",  color: "#6B00F5", initial: "P", category: "prospecting",     description: "Scraping LinkedIn et automatisation", connectionType: "oauth" },
  { provider: "waalaxy",        name: "Waalaxy",          domain: "waalaxy.com",        color: "#4747FF", initial: "W", category: "prospecting",     description: "Prospection LinkedIn et email multi-canal",connectionType: "oauth" },
  { provider: "snov",           name: "Snov.io",          domain: "snov.io",            color: "#DF3E3E", initial: "S", category: "prospecting",     description: "Email finder et drip campaigns", connectionType: "oauth" },
  { provider: "reply",          name: "Reply.io",         domain: "reply.io",           color: "#3C67FF", initial: "R", category: "prospecting",     description: "Séquences multicanal automatisées", connectionType: "oauth" },
  { provider: "overloop",       name: "Overloop",         domain: "overloop.com",       color: "#7D5FFF", initial: "O", category: "prospecting",     description: "Prospection email et LinkedIn automatisée", connectionType: "oauth" },
  { provider: "instantly",      name: "Instantly",        domain: "instantly.ai",       color: "#5B4FFF", initial: "I", category: "prospecting",     description: "Cold email à grande échelle", connectionType: "oauth" },
  { provider: "salesloft",      name: "Salesloft",        domain: "salesloft.com",      color: "#0049B8", initial: "S", category: "prospecting",     description: "Sales engagement platform enterprise",connectionType: "oauth" },
  { provider: "outreach",       name: "Outreach",         domain: "outreach.io",        color: "#4257E8", initial: "O", category: "prospecting",     description: "Plateforme revenue intelligence et sales",connectionType: "oauth" },

  // ── Vidéo & Médias ─────────────────────────────────────────────────────────
  { provider: "vidyard",        name: "Vidyard",          domain: "vidyard.com",        color: "#54C4AC", initial: "V", category: "video",           description: "Vidéos personnalisées pour ventes", connectionType: "oauth" },
  { provider: "wistia",         name: "Wistia",           domain: "wistia.com",         color: "#54BBFF", initial: "W", category: "video",           description: "Hébergement vidéo marketing B2B", connectionType: "oauth" },
  { provider: "vimeo",          name: "Vimeo",            domain: "vimeo.com",          color: "#1AB7EA", initial: "V", category: "video",           description: "Hébergement vidéo pro et portails",connectionType: "oauth" },
  { provider: "tiktok",         name: "TikTok Business",  domain: "business.tiktok.com",color: "#000000", initial: "T", category: "video",           description: "Publication et analytics TikTok",connectionType: "oauth" },
  { provider: "cloudinary",     name: "Cloudinary",       domain: "cloudinary.com",     color: "#3448C5", initial: "C", category: "video",           description: "DAM — images et vidéos optimisées", connectionType: "oauth" },
  { provider: "mux",            name: "Mux",              domain: "mux.com",            color: "#FA50B5", initial: "M", category: "video",           description: "Infrastructure vidéo pour développeurs", connectionType: "oauth" },
  { provider: "sprout_social",  name: "Sprout Social",    domain: "sproutsocial.com",   color: "#59CB59", initial: "S", category: "video",           description: "Gestion et analytics réseaux sociaux",connectionType: "oauth" },
  { provider: "later",          name: "Later",            domain: "later.com",          color: "#FF62A5", initial: "L", category: "video",           description: "Planification visuelle Instagram/TikTok",connectionType: "oauth" },

  // ── DevOps & Monitoring ────────────────────────────────────────────────────
  { provider: "pagerduty",      name: "PagerDuty",        domain: "pagerduty.com",      color: "#06AC38", initial: "P", category: "devops",          description: "Gestion des incidents et astreintes", connectionType: "oauth" },
  { provider: "betterstack",    name: "Better Stack",     domain: "betterstack.com",    color: "#1DB954", initial: "B", category: "devops",          description: "Monitoring uptime et logging", connectionType: "oauth" },
  { provider: "new_relic",      name: "New Relic",        domain: "newrelic.com",       color: "#1CE783", initial: "N", category: "devops",          description: "Observabilité full-stack", connectionType: "oauth" },
  { provider: "grafana",        name: "Grafana",          domain: "grafana.com",        color: "#F46800", initial: "G", category: "devops",          description: "Dashboards monitoring et alerting", connectionType: "oauth" },
  { provider: "uptime_robot",   name: "UptimeRobot",      domain: "uptimerobot.com",    color: "#3BD671", initial: "U", category: "devops",          description: "Monitoring disponibilité sites et APIs", connectionType: "oauth" },
  { provider: "circleci",       name: "CircleCI",         domain: "circleci.com",       color: "#343434", initial: "C", category: "devops",          description: "CI/CD cloud continu", connectionType: "oauth" },
  { provider: "bitbucket",      name: "Bitbucket",        domain: "bitbucket.org",      color: "#0052CC", initial: "B", category: "devops",          description: "Git et CI/CD Atlassian",connectionType: "oauth" },
  { provider: "render",         name: "Render",           domain: "render.com",         color: "#46E3B7", initial: "R", category: "devops",          description: "Hébergement cloud moderne", connectionType: "oauth" },
  { provider: "railway",        name: "Railway",          domain: "railway.app",        color: "#0B0D0E", initial: "R", category: "devops",          description: "Déploiement infra en 1 clic", connectionType: "oauth" },
  { provider: "fly",            name: "Fly.io",           domain: "fly.io",             color: "#8B5CF6", initial: "F", category: "devops",          description: "Edge computing et déploiement global", connectionType: "oauth" },

  // ── Médical & Santé ────────────────────────────────────────────────────────
  { provider: "doctolib",       name: "Doctolib",         domain: "doctolib.fr",        color: "#128FE8", initial: "D", category: "medical",         description: "Agendas médicaux et téléconsultations", connectionType: "oauth" },
  { provider: "clicrdv",        name: "Clicrdv",          domain: "clicrdv.com",        color: "#E1251B", initial: "C", category: "medical",         description: "Prise de RDV santé en ligne", connectionType: "oauth" },
  { provider: "planity",        name: "Planity",          domain: "planity.com",        color: "#0A0A0A", initial: "P", category: "medical",         description: "Réservation beauté et bien-être", connectionType: "oauth" },
  { provider: "treatwell",      name: "Treatwell",        domain: "treatwell.fr",       color: "#00C2B2", initial: "T", category: "medical",         description: "Marketplace beauté et bien-être",connectionType: "oauth" },
  { provider: "simplybook",     name: "SimplyBook.me",    domain: "simplybook.me",      color: "#4568DC", initial: "S", category: "medical",         description: "Réservation en ligne multi-secteurs", connectionType: "oauth" },
  { provider: "setmore",        name: "Setmore",          domain: "setmore.com",        color: "#009688", initial: "S", category: "medical",         description: "Prise de RDV gratuite pour indépendants", connectionType: "oauth" },

  // ── Support & Helpdesk ─────────────────────────────────────────────────────
  { provider: "crisp",          name: "Crisp",            domain: "crisp.chat",         color: "#1972F5", initial: "C", category: "support",         description: "Chat client + inbox équipe", connectionType: "oauth" },
  { provider: "helpscout",      name: "Help Scout",       domain: "helpscout.com",      color: "#1292EE", initial: "H", category: "support",         description: "Helpdesk email centré sur le client", connectionType: "oauth" },
  { provider: "gorgias",        name: "Gorgias",          domain: "gorgias.com",        color: "#5850EC", initial: "G", category: "support",         description: "Support e-commerce Shopify natif",connectionType: "oauth" },
  { provider: "front",          name: "Front",            domain: "front.com",          color: "#F16529", initial: "F", category: "support",         description: "Inbox partagée et collaboration équipe", connectionType: "oauth" },
  { provider: "freshservice",   name: "Freshservice",     domain: "freshservice.com",   color: "#22A4FF", initial: "F", category: "support",         description: "ITSM et gestion des services IT",connectionType: "oauth" },
  { provider: "tidio",          name: "Tidio",            domain: "tidio.com",          color: "#0B4DFF", initial: "T", category: "support",         description: "Chat live + chatbots IA pour PME", connectionType: "oauth" },
  { provider: "chatwoot",       name: "Chatwoot",         domain: "chatwoot.com",       color: "#1F93FF", initial: "C", category: "support",         description: "Support open-source omnicanal", connectionType: "oauth" },
  { provider: "livechat",       name: "LiveChat",         domain: "livechat.com",       color: "#FF5100", initial: "L", category: "support",         description: "Chat en direct et support client", connectionType: "oauth" },

  // ── IA supplémentaire ──────────────────────────────────────────────────────
  { provider: "gemini",         name: "Google Gemini",    domain: "ai.google.dev",      color: "#4285F4", initial: "G", category: "ai",              description: "Modèles IA multimodaux Google", connectionType: "oauth" },
  { provider: "mistral",        name: "Mistral AI",       domain: "mistral.ai",         color: "#F54E00", initial: "M", category: "ai",              description: "LLM français open-source et performant", connectionType: "oauth" },
  { provider: "together",       name: "Together AI",      domain: "together.ai",        color: "#0080FF", initial: "T", category: "ai",              description: "Inférence modèles open-source rapide", connectionType: "oauth" },
  { provider: "fireworks",      name: "Fireworks AI",     domain: "fireworks.ai",       color: "#FF6B35", initial: "F", category: "ai",              description: "Inférence LLM ultra-rapide et économique", connectionType: "oauth" },
  { provider: "assemblyai",     name: "AssemblyAI",       domain: "assemblyai.com",     color: "#F24E1E", initial: "A", category: "ai",              description: "Transcription et analyse audio IA", connectionType: "oauth" },
  { provider: "whisper",        name: "Whisper (OpenAI)", domain: "openai.com",         color: "#10A37F", initial: "W", category: "ai",              description: "Transcription vocale open-source OpenAI", connectionType: "oauth" },
  { provider: "azure_openai",   name: "Azure OpenAI",     domain: "azure.microsoft.com",color: "#0078D4", initial: "A", category: "ai",              description: "GPT-4 déployé sur Azure (RGPD)", connectionType: "oauth" },
  { provider: "bedrock",        name: "AWS Bedrock",      domain: "aws.amazon.com",     color: "#FF9900", initial: "B", category: "ai",              description: "Modèles IA fondationnels AWS", connectionType: "oauth" },
  { provider: "ollama",         name: "Ollama",           domain: "ollama.ai",          color: "#000000", initial: "O", category: "ai",              description: "LLMs open-source en local (Llama, Mistral)", connectionType: "oauth" },
  { provider: "fal",            name: "fal.ai",           domain: "fal.ai",             color: "#7C3AED", initial: "F", category: "ai",              description: "Génération images/vidéos IA ultra-rapide", connectionType: "oauth" },

  // ── Automatisation supplémentaire ──────────────────────────────────────────
  { provider: "integrately",    name: "Integrately",      domain: "integrately.com",    color: "#FF6B6B", initial: "I", category: "automation",      description: "1-click automations pour non-développeurs",connectionType: "oauth" },
  { provider: "pabbly",         name: "Pabbly Connect",   domain: "pabbly.com",         color: "#FF7F00", initial: "P", category: "automation",      description: "Automatisation sans limite de tâches",connectionType: "oauth" },
  { provider: "workato",        name: "Workato",          domain: "workato.com",        color: "#36A2EB", initial: "W", category: "automation",      description: "Automatisation enterprise no-code",connectionType: "oauth" },
  { provider: "microsoft_pa",   name: "Power Automate",   domain: "powerautomate.microsoft.com", color: "#0078D4", initial: "P", category: "automation", description: "Automatisation Microsoft 365 et Azure",connectionType: "oauth" },

  // ── CRM supplémentaire ─────────────────────────────────────────────────────
  { provider: "attio",          name: "Attio",            domain: "attio.com",          color: "#5E6AD2", initial: "A", category: "crm",             description: "CRM moderne piloté par les données", connectionType: "oauth" },
  { provider: "folk",           name: "Folk",             domain: "folk.app",           color: "#7C5CFC", initial: "F", category: "crm",             description: "CRM relationnel et networking", connectionType: "oauth" },
  { provider: "streak",         name: "Streak",           domain: "streak.com",         color: "#DE5C9D", initial: "S", category: "crm",             description: "CRM intégré directement dans Gmail",connectionType: "oauth" },
  { provider: "freshsales",     name: "Freshsales",       domain: "freshsales.com",     color: "#25C16F", initial: "F", category: "crm",             description: "CRM intelligent avec scoring IA",connectionType: "oauth" },

  // ── Calendrier supplémentaire ──────────────────────────────────────────────
  { provider: "tidycal",        name: "TidyCal",          domain: "tidycal.com",        color: "#A78BFA", initial: "T", category: "calendar",        description: "Scheduling simple et abordable",connectionType: "oauth" },
  { provider: "appointlet",     name: "Appointlet",       domain: "appointlet.com",     color: "#00C9B1", initial: "A", category: "calendar",        description: "Pages de réservation personnalisées",connectionType: "oauth" },

  // ── Infrastructure supplémentaire ──────────────────────────────────────────
  { provider: "neon",           name: "Neon",             domain: "neon.tech",          color: "#00E599", initial: "N", category: "infrastructure",  description: "PostgreSQL serverless avec branching", connectionType: "oauth" },
  { provider: "planetscale",    name: "PlanetScale",      domain: "planetscale.com",    color: "#000000", initial: "P", category: "infrastructure",  description: "MySQL serverless haute disponibilité", connectionType: "oauth" },
  { provider: "turso",          name: "Turso",            domain: "turso.tech",         color: "#4FF8D2", initial: "T", category: "infrastructure",  description: "SQLite distribué à la périphérie", connectionType: "oauth" },
  { provider: "upstash",        name: "Upstash",          domain: "upstash.com",        color: "#00E9A3", initial: "U", category: "infrastructure",  description: "Redis et Kafka serverless", connectionType: "oauth" },
  { provider: "resend",         name: "Resend",           domain: "resend.com",         color: "#000000", initial: "R", category: "communication",   description: "API email pour développeurs modernes", connectionType: "oauth" },

  // ── Collaboration supplémentaire ───────────────────────────────────────────
  { provider: "tally",          name: "Tally",            domain: "tally.so",           color: "#000000", initial: "T", category: "collab",          description: "Formulaires sans code et illimités", connectionType: "oauth" },
  { provider: "fillout",        name: "Fillout",          domain: "fillout.com",        color: "#6366F1", initial: "F", category: "collab",          description: "Formulaires puissants avec logic avancée", connectionType: "oauth" },
  { provider: "coda",           name: "Coda",             domain: "coda.io",            color: "#F46A54", initial: "C", category: "collab",          description: "Docs, tableurs et apps tout-en-un", connectionType: "oauth" },
  { provider: "gitbook",        name: "GitBook",          domain: "gitbook.com",        color: "#3884FF", initial: "G", category: "collab",          description: "Documentation et knowledge base équipe", connectionType: "oauth" },
  { provider: "confluence",     name: "Confluence",       domain: "atlassian.com",      color: "#0052CC", initial: "C", category: "collab",          description: "Wiki et documentation Atlassian",connectionType: "oauth" },
]

const CATEGORIES = [
  { id: "all",            label: "Toutes" },
  { id: "automation",     label: "Automatisation" },
  { id: "google",         label: "Google" },
  { id: "communication",  label: "Communication" },
  { id: "crm",            label: "CRM & Ventes" },
  { id: "prospecting",    label: "Prospection" },
  { id: "email_marketing",label: "Marketing Email" },
  { id: "payment",        label: "Paiements" },
  { id: "accounting",     label: "Comptabilité" },
  { id: "ecommerce",      label: "E-commerce" },
  { id: "content",        label: "Contenu & SEO" },
  { id: "video",          label: "Vidéo & Médias" },
  { id: "ai",             label: "IA & Modèles" },
  { id: "analytics",      label: "Analytics & BI" },
  { id: "telephony",      label: "Téléphonie" },
  { id: "support",        label: "Support Client" },
  { id: "signature",      label: "Signature" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "devops",         label: "DevOps" },
  { id: "project",        label: "Gestion de projet" },
  { id: "storage",        label: "Stockage" },
  { id: "hr",             label: "RH & Paie" },
  { id: "medical",        label: "Médical & Santé" },
  { id: "calendar",       label: "Calendriers" },
  { id: "collab",         label: "Collaboration" },
]

const PAGE_SIZE = 18

// ─── Logo component with Google Favicons + lettre fallback ───────────────────

function IntegrationLogo({ domain, name, color, initial, size = 40 }: {
  domain: string
  name: string
  color: string
  initial: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  const imgSize = size >= 40 ? 64 : 32

  if (failed) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.22,
        background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: size * 0.38, color: "white",
        flexShrink: 0,
      }}>
        {initial}
      </div>
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: "rgba(255,255,255,0.9)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, overflow: "hidden",
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${imgSize}`}
        alt={name}
        width={size * 0.6}
        height={size * 0.6}
        style={{ objectFit: "contain", display: "block", imageRendering: "auto" }}
        onError={() => setFailed(true)}
      />
    </div>
  )
}

// ─── Connection Modal ─────────────────────────────────────────────────────────

function ConnectModal({
  integration,
  isConnected,
  onClose,
  onSaved,
}: {
  integration: Integration
  isConnected: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [apiKey, setApiKey] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const isFormType = integration.connectionType === "form"

  function serializeError(err: unknown): string {
    if (typeof err === "string") return err
    if (err && typeof err === "object") {
      // Zod flatten() → { formErrors, fieldErrors }
      const flat = err as { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
      const fieldMsgs = flat.fieldErrors
        ? Object.entries(flat.fieldErrors).map(([k, v]) => `${k}: ${v.join(", ")}`).join(" — ")
        : null
      const formMsgs = flat.formErrors?.join(", ") ?? null
      return fieldMsgs ?? formMsgs ?? JSON.stringify(err)
    }
    return "Erreur lors de la connexion"
  }

  async function handleConnect() {
    if (integration.connectionType === "oauth") {
      setSaving(true)
      setError(null)
      try {
        // 1. Récupère un token Pipedream pour cet utilisateur
        const tokenRes = await fetch("/api/integrations/pipedream/token", { method: "POST" })
        if (!tokenRes.ok) throw new Error("Impossible d'initialiser la connexion")
        const { token } = await tokenRes.json() as { token: string }

        // 2. Ouvre le flow Pipedream Connect (popup)
        const { createFrontendClient } = await import("@pipedream/sdk/browser")
        const pd = createFrontendClient({
          externalUserId: "current-user",
          tokenCallback: async () => ({
            token,
            expiresAt: new Date(Date.now() + 3600_000),
            connectLinkUrl: "",
          }),
        })

        // Mapping slug Lynaris → slug Pipedream (importé depuis PIPEDREAM_APP_SLUGS)
        const { PIPEDREAM_APP_SLUGS } = await import("@/lib/integrations/pipedream")
        const appSlug = PIPEDREAM_APP_SLUGS[integration.provider] ?? integration.provider

        // Flag pour éviter double appel si onSuccess + onClose se chevauchent
        let completedSave = false

        await pd.connectAccount({
          token,
          app: appSlug,
          onSuccess: async ({ id: accountId }: { id: string }) => {
            const res = await fetch("/api/integrations/pipedream/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider: integration.provider, accountId }),
            })
            if (res.ok) {
              completedSave = true
              onSaved()
            } else {
              const body = await res.json().catch(() => ({})) as { error?: string }
              setError(body.error ?? "Erreur lors de la sauvegarde")
            }
          },
          onError: (err: { message?: string }) => {
            setError(err.message ?? "Connexion annulée")
          },
          onClose: (status: { successful: boolean }) => {
            if (completedSave) return
            if (status.successful) {
              // onSuccess a peut-être résolu mais sans accountId côté client
              // On sync depuis Pipedream server-side pour récupérer l'account
              void fetch("/api/integrations/pipedream/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider: integration.provider }),
              }).then(() => { onSaved() })
            } else {
              // Popup fermé sans succès — rafraîchir quand même pour synchro
              setTimeout(() => { onSaved() }, 400)
            }
          },
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur connexion")
      } finally {
        setSaving(false)
      }
      return
    }

    const value = isFormType ? webhookUrl.trim() : apiKey.trim()
    if (!value) return
    setSaving(true)
    setError(null)
    try {
      const body = isFormType
        ? { webhook_url: value }
        : { api_key: value }
      const res = await fetch(`/api/integrations/${integration.provider}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: unknown }
        throw new Error(serializeError(data.error) ?? "Erreur lors de la connexion")
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await fetch(`/api/integrations/${integration.provider}/disconnect`, { method: "DELETE" })
      onSaved()
    } catch {
      onSaved()
    } finally {
      setDisconnecting(false)
    }
  }

  const isOAuth = integration.connectionType === "oauth"

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(8,8,12,0.65)", backdropFilter: "blur(8px) saturate(1.2)", WebkitBackdropFilter: "blur(8px) saturate(1.2)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="lg-surface-2 lg-sheen" style={{ width: "min(440px,100%)", borderRadius: 22, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--glass-border, rgba(255,255,255,0.08))", display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <IntegrationLogo domain={integration.domain} name={integration.name} color={integration.color} initial={integration.initial} size={36} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#F5F5F7", margin: 0 }}>{integration.name}</p>
              <p style={{ fontSize: 12, color: "rgba(245,245,247,0.55)", margin: 0 }}>{integration.description}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="lg-focus" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(245,245,247,0.5)", display: "flex", padding: 4, borderRadius: 6 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "20px", position: "relative", zIndex: 1 }}>
          {isConnected ? (
            <>
              <div style={{ padding: "12px 14px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.24)", borderRadius: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} color="#10B981" />
                <p style={{ fontSize: 13, color: "#10B981", margin: 0, fontWeight: 500 }}>{integration.name} est connecté et actif.</p>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={onClose} className="ly-surface lg-focus" style={{ height: 36, padding: "0 14px", borderRadius: 10, color: "rgba(245,245,247,0.75)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Fermer</button>
                <button type="button" onClick={() => void handleDisconnect()} disabled={disconnecting} className="lg-focus" style={{ height: 36, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.32)", background: "rgba(239,68,68,0.16)", color: "#F87171", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  {disconnecting ? "Déconnexion..." : "Déconnecter"}
                </button>
              </div>
            </>
          ) : isOAuth ? (
            <>
              <div className="ly-surface" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, marginBottom: 20 }}>
                <IntegrationLogo domain={integration.domain} name={integration.name} color={integration.color} initial={integration.initial} size={32} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#F5F5F7", margin: "0 0 2px" }}>Autorisation sécurisée</p>
                  <p style={{ fontSize: 12, color: "rgba(245,245,247,0.55)", margin: 0, lineHeight: 1.5 }}>
                    Vous serez redirigé vers {integration.name} pour accorder l&apos;accès. Vos identifiants ne transitent jamais par Lynaris.
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={onClose} className="ly-surface lg-focus" style={{ height: 36, padding: "0 14px", borderRadius: 10, color: "rgba(245,245,247,0.75)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Annuler</button>
                <button
                  type="button"
                  onClick={() => void handleConnect()}
                  className="lg-focus"
                  style={{ height: 36, padding: "0 16px", borderRadius: 10, border: "none", background: integration.color, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: `0 8px 24px ${hexToRgba(integration.color.startsWith("#") ? integration.color : "#E86F4D", 0.35)}` }}
                >
                  <ExternalLink size={13} />
                  Se connecter avec {integration.name}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(245,245,247,0.65)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {isFormType ? "Webhook URL" : (integration.apiKeyLabel ?? `${integration.name} API Key`)}
                </label>
                {isFormType ? (
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleConnect() }}
                    placeholder="https://..."
                    autoFocus
                    className="ly-input"
                    style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 10, color: "#F5F5F7", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                ) : (
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleConnect() }}
                    placeholder="sk-... ou votre clé API"
                    autoFocus
                    className="ly-input"
                    style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 10, color: "#F5F5F7", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                )}
              </div>
              {error && <p style={{ fontSize: 12, color: "#EF4444", marginBottom: 12 }}>{error}</p>}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={onClose} className="ly-surface lg-focus" style={{ height: 36, padding: "0 14px", borderRadius: 10, color: "rgba(245,245,247,0.75)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Annuler</button>
                <button
                  type="button"
                  onClick={() => void handleConnect()}
                  disabled={saving || !apiKey.trim()}
                  className="lg-focus"
                  style={{
                    height: 36,
                    padding: "0 16px",
                    borderRadius: 10,
                    border: "1px solid rgba(232,111,77,0.4)",
                    background: saving || !apiKey.trim() ? "rgba(232,111,77,0.4)" : "var(--accent, #E86F4D)",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: saving || !apiKey.trim() ? "not-allowed" : "pointer",
                    boxShadow: saving || !apiKey.trim() ? undefined : "0 8px 24px var(--accent-glow, rgba(232,111,77,0.35))",
                  }}
                >
                  {saving ? "Connexion..." : "Connecter"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function IntegCard({
  integration,
  connected,
  onConnect,
}: {
  integration: Integration
  connected: boolean
  onConnect: (i: Integration) => void
}) {
  // Tint léger depuis la couleur de l'intégration (alpha 0.14)
  const tint = integration.color.startsWith("#")
    ? hexToRgba(integration.color, 0.14)
    : "rgba(232,111,77,0.12)"

  return (
    <GlassCard
      tint={tint}
      radius={20}
      padding={0}
      hover
      style={connected ? { borderColor: "rgba(16,185,129,0.32)" } : undefined}
    >
      <div
        style={{
          padding: "18px 18px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          height: "100%",
          boxSizing: "border-box",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo + connected badge */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <IntegrationLogo domain={integration.domain} name={integration.name} color={integration.color} initial={integration.initial} size={40} />
          {connected && (
            <span
              className="ly-badge"
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#10B981",
                background: "rgba(16,185,129,0.12)",
                borderColor: "rgba(16,185,129,0.28)",
                padding: "2px 7px",
                gap: 4,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
              Connecté
            </span>
          )}
          {integration.comingSoon && !connected && (
            <span className="ly-badge" style={{ fontSize: 10, color: "rgba(245,245,247,0.45)", padding: "2px 6px" }}>
              Bientôt
            </span>
          )}
        </div>

        {/* Name + description */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#F5F5F7", margin: "0 0 4px" }}>{integration.name}</p>
          <p style={{ fontSize: 12, color: "rgba(245,245,247,0.6)", margin: 0, lineHeight: 1.5 }}>
            Connectez votre compte {integration.name}
          </p>
        </div>

        {/* Button */}
        <button
          type="button"
          onClick={() => onConnect(integration)}
          disabled={integration.comingSoon && !connected}
          className="lg-focus"
          style={{
            height: 34,
            width: "100%",
            borderRadius: 10,
            border: connected
              ? "1px solid rgba(16,185,129,0.32)"
              : integration.comingSoon
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(255,255,255,0.14)",
            background: connected
              ? "rgba(16,185,129,0.12)"
              : integration.comingSoon
              ? "transparent"
              : "rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px) saturate(1.4)",
            WebkitBackdropFilter: "blur(12px) saturate(1.4)",
            color: connected ? "#10B981" : integration.comingSoon ? "#52525B" : "#F5F5F7",
            fontSize: 12,
            fontWeight: 600,
            cursor: integration.comingSoon && !connected ? "not-allowed" : "pointer",
            transition: "all 220ms cubic-bezier(0.32, 0.72, 0, 1)",
            marginTop: "auto",
          }}
          onMouseEnter={(e) => {
            if (!integration.comingSoon || connected) {
              (e.currentTarget as HTMLButtonElement).style.background = connected ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.12)"
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = connected ? "rgba(16,185,129,0.12)" : integration.comingSoon ? "transparent" : "rgba(255,255,255,0.06)"
          }}
        >
          {connected ? "Gérer la connexion" : integration.comingSoon ? "Bientôt disponible" : `Connecter ${integration.name}`}
        </button>
      </div>
    </GlassCard>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [connectedMap, setConnectedMap] = useState<Record<string, IntegrationStatus>>({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"catalogue" | "connected">("catalogue")
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [page, setPage] = useState(1)
  const [connectModal, setConnectModal] = useState<Integration | null>(null)

  // Special modals for existing providers
  const [configModal, setConfigModal] = useState<ConfigModalState>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/status")
      if (!res.ok) throw new Error(`Status API ${res.status}`)
      const data = await res.json() as { integrations: IntegrationStatus[] }
      const map: Record<string, IntegrationStatus> = {}
      for (const item of data.integrations ?? []) {
        map[item.provider] = item
      }
      setConnectedMap(map)
    } catch (e) {
      logger.error("[integrations] fetchStatus failed", { err: String(e) })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  function isConnected(provider: string) {
    return connectedMap[provider]?.status === "connected"
  }

  function handleConnect(integration: Integration) {
    // Google → OAuth natif (stocke access_token + refresh_token utilisables directement par les agents)
    if (integration.provider === "google") {
      window.location.href = "/api/integrations/google/connect"
      return
    }
    // Providers avec formulaire dédié dans ConfigModal
    if (["twilio", "elevenlabs", "stripe", "n8n", "make", "whatsapp"].includes(integration.provider)) {
      setConfigModal({ provider: integration.provider, name: integration.name, color: integration.color, initial: integration.initial, domain: integration.domain })
      return
    }
    setConnectModal(integration)
  }

  // Filter
  const filtered = ALL_INTEGRATIONS
    .filter(i => activeCategory === "all" || i.category === activeCategory)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()))

  const connectedList = ALL_INTEGRATIONS.filter(i => isConnected(i.provider))
  const connectedCount = connectedList.length

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearch(v: string) {
    setSearch(v)
    setPage(1)
  }

  function handleCategory(id: string) {
    setActiveCategory(id)
    setPage(1)
  }

  return (
    <div style={{ maxWidth: 1200, padding: "32px 32px 60px", margin: "0 auto" }}>
      {/* Header */}
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F5F5F7", margin: "0 0 20px", letterSpacing: "-0.02em" }}>
        Intégrations
      </h1>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--glass-border, rgba(255,255,255,0.08))", marginBottom: 24, gap: 0 }}>
        {[
          { id: "catalogue", label: "Catalogue" },
          { id: "connected", label: `Comptes connectés${connectedCount > 0 ? ` ${connectedCount}` : ""}` },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className="lg-focus"
            style={{
              padding: "10px 0", marginRight: 24, fontSize: 14,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "#F5F5F7" : "rgba(245,245,247,0.5)",
              background: "none", border: "none",
              borderBottom: tab === t.id ? "2px solid var(--accent, #E86F4D)" : "2px solid transparent",
              marginBottom: -1,
              cursor: "pointer",
              transition: "color 220ms cubic-bezier(0.32, 0.72, 0, 1), border-color 220ms cubic-bezier(0.32, 0.72, 0, 1)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CATALOGUE TAB ── */}
      {tab === "catalogue" && (
        <>
          {/* Search + count */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 16, flexWrap: "wrap" }}>
            <div
              className="ly-input"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 38,
                padding: "0 14px",
                borderRadius: 12,
                minWidth: 260,
                flex: 1,
                maxWidth: 340,
              }}
            >
              <Search size={14} color="rgba(245,245,247,0.45)" />
              <input
                type="search"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Rechercher dans les intégrations..."
                style={{ background: "transparent", border: "none", outline: "none", color: "#F5EFE6", fontSize: 13, flex: 1 }}
              />
            </div>
            <span style={{ fontSize: 13, color: "rgba(245,245,247,0.5)", whiteSpace: "nowrap" }}>
              {filtered.length} apps disponibles
            </span>
          </div>

          {/* Category pills */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, marginBottom: 20, scrollbarWidth: "none" }}>
            {CATEGORIES.map(cat => {
              const active = activeCategory === cat.id
              return (
                <GlassChip
                  key={cat.id}
                  onClick={() => handleCategory(cat.id)}
                  active={active}
                  style={{
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    flexShrink: 0,
                  }}
                >
                  {cat.label}
                </GlassChip>
              )
            })}
          </div>

          {/* Grid */}
          {paginated.length === 0 ? (
            <GlassPanel level={2} radius={20} padding={48} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, margin: 0, color: "rgba(245,245,247,0.55)" }}>Aucune intégration trouvée pour &quot;{search}&quot;</p>
              <button
                type="button"
                onClick={() => { setSearch(""); setActiveCategory("all"); setPage(1) }}
                style={{ marginTop: 12, fontSize: 12, color: "var(--accent, #E86F4D)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Réinitialiser
              </button>
            </GlassPanel>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {paginated.map(i => (
                <IntegCard
                  key={i.provider}
                  integration={i}
                  connected={isConnected(i.provider)}
                  onConnect={handleConnect}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 32 }}>
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="ly-surface lg-focus"
                style={{
                  height: 36, padding: "0 14px", borderRadius: 10,
                  color: page === 1 ? "rgba(245,245,247,0.35)" : "#F5F5F7",
                  fontSize: 13, fontWeight: 500,
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <ChevronLeft size={14} /> Précédent
              </button>

              <span className="ly-surface" style={{ fontSize: 13, color: "rgba(245,245,247,0.7)", padding: "0 12px", height: 36, display: "flex", alignItems: "center", borderRadius: 10 }}>
                Page {page} sur {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="ly-surface lg-focus"
                style={{
                  height: 36, padding: "0 14px", borderRadius: 10,
                  color: page === totalPages ? "rgba(245,245,247,0.35)" : "#F5F5F7",
                  fontSize: 13, fontWeight: 500,
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── COMPTES CONNECTÉS TAB ── */}
      {tab === "connected" && (
        <>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="ly-surface" style={{ height: 140, borderRadius: 20, animation: "pulse 1.5s ease infinite" }} />
              ))}
            </div>
          ) : connectedList.length === 0 ? (
            <GlassPanel level={2} radius={22} padding={48} style={{ textAlign: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div className="ly-surface" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plug size={24} color="rgba(245,245,247,0.55)" />
                </div>
                <p style={{ fontSize: 15, color: "rgba(245,245,247,0.7)", margin: 0, fontWeight: 500 }}>Aucun compte connecté</p>
                <p style={{ fontSize: 13, color: "rgba(245,245,247,0.45)", margin: 0, textAlign: "center", maxWidth: 320, lineHeight: 1.5 }}>
                  Configurez vos premières intégrations dans le Catalogue pour connecter vos outils.
                </p>
                <button
                  type="button"
                  onClick={() => setTab("catalogue")}
                  className="lg-focus"
                  style={{
                    height: 36,
                    padding: "0 18px",
                    borderRadius: 10,
                    border: "1px solid rgba(232,111,77,0.4)",
                    background: "var(--accent, #E86F4D)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginTop: 8,
                    boxShadow: "0 8px 24px var(--accent-glow, rgba(232,111,77,0.35))",
                    transition: "all 220ms cubic-bezier(0.32, 0.72, 0, 1)",
                  }}
                >
                  Voir le Catalogue
                </button>
              </div>
            </GlassPanel>
          ) : (
            <>
              <p style={{ fontSize: 13, color: "rgba(245,245,247,0.55)", marginBottom: 20 }}>
                {connectedList.length} compte{connectedList.length > 1 ? "s" : ""} connecté{connectedList.length > 1 ? "s" : ""}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {connectedList.map(i => (
                  <IntegCard
                    key={i.provider}
                    integration={i}
                    connected={true}
                    onConnect={handleConnect}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Modales ── */}
      {connectModal && (
        <ConnectModal
          integration={connectModal}
          isConnected={isConnected(connectModal.provider)}
          onClose={() => setConnectModal(null)}
          onSaved={() => { setConnectModal(null); void fetchStatus() }}
        />
      )}

      {configModal && (
        <ConfigModal
          provider={configModal.provider}
          name={configModal.name}
          color={configModal.color}
          domain={configModal.domain}
          initial={configModal.initial}
          isOpen={true}
          isConnected={isConnected(configModal.provider)}
          onClose={() => setConfigModal(null)}
          onSaved={() => { setConfigModal(null); void fetchStatus() }}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:.5; } 50% { opacity:.2; } }
        input[type="search"]::-webkit-search-cancel-button { display: none; }
      `}</style>
    </div>
  )
}
