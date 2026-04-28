export interface OAuthProviderConfig {
  authUrl: string
  tokenUrl: string
  clientIdEnv: string
  clientSecretEnv: string
  scopes: string
  scopeSeparator?: string       // espace par défaut
  tokenAuthMethod?: "body" | "basic"  // comment envoyer client_id/secret à l'échange
  extraAuthParams?: Record<string, string>
  pkce?: boolean                // code_challenge PKCE (ex: Airtable)
}

export const OAUTH_CONFIGS: Record<string, OAuthProviderConfig> = {

  // ── Communication & Productivité ─────────────────────────────────────────────
  slack: {
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    clientIdEnv: "SLACK_CLIENT_ID",
    clientSecretEnv: "SLACK_CLIENT_SECRET",
    scopes: "channels:read channels:history chat:write incoming-webhook users:read",
    tokenAuthMethod: "basic",
  },
  discord: {
    authUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    clientIdEnv: "DISCORD_CLIENT_ID",
    clientSecretEnv: "DISCORD_CLIENT_SECRET",
    scopes: "identify guilds bot messages.read",
    tokenAuthMethod: "body",
  },
  telegram: {
    authUrl: "https://oauth.telegram.org/auth",
    tokenUrl: "https://oauth.telegram.org/auth/request",
    clientIdEnv: "TELEGRAM_BOT_TOKEN",
    clientSecretEnv: "TELEGRAM_BOT_TOKEN",
    scopes: "",
    tokenAuthMethod: "body",
  },
  zoom: {
    authUrl: "https://zoom.us/oauth/authorize",
    tokenUrl: "https://zoom.us/oauth/token",
    clientIdEnv: "ZOOM_CLIENT_ID",
    clientSecretEnv: "ZOOM_CLIENT_SECRET",
    scopes: "meeting:read:admin meeting:write:admin user:read:admin",
    tokenAuthMethod: "basic",
  },

  // ── Microsoft (Teams, Outlook, OneDrive, Excel) ───────────────────────────
  microsoft: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    clientIdEnv: "MICROSOFT_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
    scopes: "User.Read Mail.ReadWrite Mail.Send Calendars.ReadWrite Files.ReadWrite Team.ReadBasic.All offline_access",
    tokenAuthMethod: "body",
  },
  microsoft_teams: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    clientIdEnv: "MICROSOFT_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
    scopes: "User.Read Team.ReadBasic.All Channel.ReadBasic.All ChannelMessage.Send offline_access",
    tokenAuthMethod: "body",
  },
  outlook: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    clientIdEnv: "MICROSOFT_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
    scopes: "User.Read Mail.ReadWrite Mail.Send Calendars.ReadWrite offline_access",
    tokenAuthMethod: "body",
  },

  // ── CRM & Ventes ───────────────────────────────────────────────────────────
  notion: {
    authUrl: "https://www.notion.so/install-integration",
    tokenUrl: "https://api.notion.com/v1/oauth/token",
    clientIdEnv: "NOTION_CLIENT_ID",
    clientSecretEnv: "NOTION_CLIENT_SECRET",
    scopes: "",
    tokenAuthMethod: "basic",
    extraAuthParams: { owner: "user" },
  },
  hubspot: {
    authUrl: "https://app.hubspot.com/oauth/authorize",
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
    clientIdEnv: "HUBSPOT_CLIENT_ID",
    clientSecretEnv: "HUBSPOT_CLIENT_SECRET",
    scopes: "crm.objects.contacts.read crm.objects.contacts.write crm.objects.deals.read crm.objects.deals.write oauth",
    tokenAuthMethod: "body",
  },
  pipedrive: {
    authUrl: "https://oauth.pipedrive.com/oauth/authorize",
    tokenUrl: "https://oauth.pipedrive.com/oauth/token",
    clientIdEnv: "PIPEDRIVE_CLIENT_ID",
    clientSecretEnv: "PIPEDRIVE_CLIENT_SECRET",
    scopes: "deals:read deals:write persons:read persons:write activities:read activities:write",
    tokenAuthMethod: "basic",
  },
  monday: {
    authUrl: "https://auth.monday.com/oauth2/authorize",
    tokenUrl: "https://auth.monday.com/oauth2/token",
    clientIdEnv: "MONDAY_CLIENT_ID",
    clientSecretEnv: "MONDAY_CLIENT_SECRET",
    scopes: "me:read boards:read boards:write updates:write",
    tokenAuthMethod: "body",
  },
  salesforce: {
    authUrl: "https://login.salesforce.com/services/oauth2/authorize",
    tokenUrl: "https://login.salesforce.com/services/oauth2/token",
    clientIdEnv: "SALESFORCE_CLIENT_ID",
    clientSecretEnv: "SALESFORCE_CLIENT_SECRET",
    scopes: "api refresh_token offline_access",
    tokenAuthMethod: "body",
  },
  intercom: {
    authUrl: "https://app.intercom.com/oauth",
    tokenUrl: "https://api.intercom.io/auth/eagle/token",
    clientIdEnv: "INTERCOM_CLIENT_ID",
    clientSecretEnv: "INTERCOM_CLIENT_SECRET",
    scopes: "",
    tokenAuthMethod: "body",
  },
  zendesk: {
    authUrl: "https://lynaris.zendesk.com/oauth/authorizations/new",
    tokenUrl: "https://lynaris.zendesk.com/oauth/tokens",
    clientIdEnv: "ZENDESK_CLIENT_ID",
    clientSecretEnv: "ZENDESK_CLIENT_SECRET",
    scopes: "read write",
    tokenAuthMethod: "body",
  },

  // ── Paiements & Finance ───────────────────────────────────────────────────
  quickbooks: {
    authUrl: "https://appcenter.intuit.com/connect/oauth2",
    tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    clientIdEnv: "QUICKBOOKS_CLIENT_ID",
    clientSecretEnv: "QUICKBOOKS_CLIENT_SECRET",
    scopes: "com.intuit.quickbooks.accounting openid profile email",
    tokenAuthMethod: "basic",
  },
  xero: {
    authUrl: "https://login.xero.com/identity/connect/authorize",
    tokenUrl: "https://identity.xero.com/connect/token",
    clientIdEnv: "XERO_CLIENT_ID",
    clientSecretEnv: "XERO_CLIENT_SECRET",
    scopes: "openid profile email accounting.transactions accounting.contacts accounting.reports.read offline_access",
    tokenAuthMethod: "basic",
  },
  paypal: {
    authUrl: "https://www.paypal.com/signin/authorize",
    tokenUrl: "https://api.paypal.com/v1/oauth2/token",
    clientIdEnv: "PAYPAL_CLIENT_ID",
    clientSecretEnv: "PAYPAL_CLIENT_SECRET",
    scopes: "openid email",
    tokenAuthMethod: "basic",
  },
  gocardless: {
    authUrl: "https://connect.gocardless.com/oauth/authorize",
    tokenUrl: "https://connect.gocardless.com/oauth/access_token",
    clientIdEnv: "GOCARDLESS_CLIENT_ID",
    clientSecretEnv: "GOCARDLESS_CLIENT_SECRET",
    scopes: "read_only",
    tokenAuthMethod: "body",
  },

  // ── Contenu & Réseaux sociaux ─────────────────────────────────────────────
  mailchimp: {
    authUrl: "https://login.mailchimp.com/oauth2/authorize",
    tokenUrl: "https://login.mailchimp.com/oauth2/token",
    clientIdEnv: "MAILCHIMP_CLIENT_ID",
    clientSecretEnv: "MAILCHIMP_CLIENT_SECRET",
    scopes: "",
    tokenAuthMethod: "body",
  },
  buffer: {
    authUrl: "https://api.bufferapp.com/1/oauth2/authorize",
    tokenUrl: "https://api.bufferapp.com/1/oauth2/token.json",
    clientIdEnv: "BUFFER_CLIENT_ID",
    clientSecretEnv: "BUFFER_CLIENT_SECRET",
    scopes: "",
    tokenAuthMethod: "body",
  },
  twitter: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    clientIdEnv: "TWITTER_CLIENT_ID",
    clientSecretEnv: "TWITTER_CLIENT_SECRET",
    scopes: "tweet.read tweet.write users.read offline.access",
    tokenAuthMethod: "basic",
    pkce: true,
  },
  youtube: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    scopes: "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload",
    tokenAuthMethod: "body",
  },
  shopify: {
    authUrl: "https://shopify.com/admin/oauth/authorize",
    tokenUrl: "https://shopify.com/admin/oauth/access_token",
    clientIdEnv: "SHOPIFY_CLIENT_ID",
    clientSecretEnv: "SHOPIFY_CLIENT_SECRET",
    scopes: "read_products write_products read_orders read_customers",
    tokenAuthMethod: "body",
  },
  figma: {
    authUrl: "https://www.figma.com/oauth",
    tokenUrl: "https://www.figma.com/api/oauth/token",
    clientIdEnv: "FIGMA_CLIENT_ID",
    clientSecretEnv: "FIGMA_CLIENT_SECRET",
    scopes: "file_read",
    tokenAuthMethod: "body",
  },
  substack: {
    authUrl: "https://substack.com/oauth/authorize",
    tokenUrl: "https://substack.com/oauth/token",
    clientIdEnv: "SUBSTACK_CLIENT_ID",
    clientSecretEnv: "SUBSTACK_CLIENT_SECRET",
    scopes: "read write",
    tokenAuthMethod: "body",
  },

  // ── Gestion de projet & Collaboration ────────────────────────────────────
  clickup: {
    authUrl: "https://app.clickup.com/api",
    tokenUrl: "https://api.clickup.com/api/v2/oauth/token",
    clientIdEnv: "CLICKUP_CLIENT_ID",
    clientSecretEnv: "CLICKUP_CLIENT_SECRET",
    scopes: "",
    tokenAuthMethod: "body",
  },
  asana: {
    authUrl: "https://app.asana.com/-/oauth_authorize",
    tokenUrl: "https://app.asana.com/-/oauth_token",
    clientIdEnv: "ASANA_CLIENT_ID",
    clientSecretEnv: "ASANA_CLIENT_SECRET",
    scopes: "default",
    tokenAuthMethod: "body",
  },
  trello: {
    authUrl: "https://trello.com/1/authorize",
    tokenUrl: "https://trello.com/1/OAuthGetAccessToken",
    clientIdEnv: "TRELLO_API_KEY",
    clientSecretEnv: "TRELLO_API_SECRET",
    scopes: "read write",
    tokenAuthMethod: "body",
    extraAuthParams: { expiration: "never", response_type: "token" },
  },
  miro: {
    authUrl: "https://miro.com/oauth/authorize",
    tokenUrl: "https://api.miro.com/v1/oauth/token",
    clientIdEnv: "MIRO_CLIENT_ID",
    clientSecretEnv: "MIRO_CLIENT_SECRET",
    scopes: "boards:read boards:write",
    tokenAuthMethod: "body",
  },
  basecamp: {
    authUrl: "https://launchpad.37signals.com/authorization/new",
    tokenUrl: "https://launchpad.37signals.com/authorization/token",
    clientIdEnv: "BASECAMP_CLIENT_ID",
    clientSecretEnv: "BASECAMP_CLIENT_SECRET",
    scopes: "",
    tokenAuthMethod: "body",
    extraAuthParams: { type: "web_server" },
  },
  todoist: {
    authUrl: "https://todoist.com/oauth/authorize",
    tokenUrl: "https://todoist.com/oauth/access_token",
    clientIdEnv: "TODOIST_CLIENT_ID",
    clientSecretEnv: "TODOIST_CLIENT_SECRET",
    scopes: "data:read_write data:delete",
    tokenAuthMethod: "body",
  },
  loom: {
    authUrl: "https://www.loom.com/oauth2/authorize",
    tokenUrl: "https://www.loom.com/oauth2/token",
    clientIdEnv: "LOOM_CLIENT_ID",
    clientSecretEnv: "LOOM_CLIENT_SECRET",
    scopes: "recordings.read spaces.read",
    tokenAuthMethod: "body",
  },
  typeform: {
    authUrl: "https://api.typeform.com/oauth/authorize",
    tokenUrl: "https://api.typeform.com/oauth/token",
    clientIdEnv: "TYPEFORM_CLIENT_ID",
    clientSecretEnv: "TYPEFORM_CLIENT_SECRET",
    scopes: "responses:read forms:read",
    tokenAuthMethod: "body",
  },

  // ── Stockage ──────────────────────────────────────────────────────────────
  dropbox: {
    authUrl: "https://www.dropbox.com/oauth2/authorize",
    tokenUrl: "https://api.dropboxapi.com/oauth2/token",
    clientIdEnv: "DROPBOX_CLIENT_ID",
    clientSecretEnv: "DROPBOX_CLIENT_SECRET",
    scopes: "files.content.read files.content.write sharing.read",
    tokenAuthMethod: "basic",
  },
  box: {
    authUrl: "https://account.box.com/api/oauth2/authorize",
    tokenUrl: "https://api.box.com/oauth2/token",
    clientIdEnv: "BOX_CLIENT_ID",
    clientSecretEnv: "BOX_CLIENT_SECRET",
    scopes: "root_readwrite manage_groups",
    tokenAuthMethod: "body",
  },
  onedrive: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    clientIdEnv: "MICROSOFT_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
    scopes: "Files.ReadWrite offline_access User.Read",
    tokenAuthMethod: "body",
  },

  // ── Signature ─────────────────────────────────────────────────────────────
  docusign: {
    authUrl: "https://account.docusign.com/oauth/auth",
    tokenUrl: "https://account.docusign.com/oauth/token",
    clientIdEnv: "DOCUSIGN_CLIENT_ID",
    clientSecretEnv: "DOCUSIGN_CLIENT_SECRET",
    scopes: "signature impersonation",
    tokenAuthMethod: "body",
  },

  // ── RH ────────────────────────────────────────────────────────────────────
  lever: {
    authUrl: "https://auth.lever.co/authorize",
    tokenUrl: "https://auth.lever.co/oauth/token",
    clientIdEnv: "LEVER_CLIENT_ID",
    clientSecretEnv: "LEVER_CLIENT_SECRET",
    scopes: "applications:read candidates:read postings:read",
    tokenAuthMethod: "basic",
  },
  factorial: {
    authUrl: "https://api.factorialhr.com/oauth/authorize",
    tokenUrl: "https://api.factorialhr.com/oauth/token",
    clientIdEnv: "FACTORIAL_CLIENT_ID",
    clientSecretEnv: "FACTORIAL_CLIENT_SECRET",
    scopes: "read",
    tokenAuthMethod: "body",
  },

  // ── Calendriers ───────────────────────────────────────────────────────────
  calendly: {
    authUrl: "https://auth.calendly.com/oauth/authorize",
    tokenUrl: "https://auth.calendly.com/oauth/token",
    clientIdEnv: "CALENDLY_CLIENT_ID",
    clientSecretEnv: "CALENDLY_CLIENT_SECRET",
    scopes: "",
    tokenAuthMethod: "basic",
  },
  cal: {
    authUrl: "https://app.cal.com/oauth/authorize",
    tokenUrl: "https://app.cal.com/oauth/token",
    clientIdEnv: "CALCOM_CLIENT_ID",
    clientSecretEnv: "CALCOM_CLIENT_SECRET",
    scopes: "",
    tokenAuthMethod: "body",
  },
  acuity: {
    authUrl: "https://acuityscheduling.com/oauth2/authorize",
    tokenUrl: "https://acuityscheduling.com/oauth2/token",
    clientIdEnv: "ACUITY_CLIENT_ID",
    clientSecretEnv: "ACUITY_CLIENT_SECRET",
    scopes: "api-v1",
    tokenAuthMethod: "basic",
  },

  // ── Infrastructure ────────────────────────────────────────────────────────
  gitlab: {
    authUrl: "https://gitlab.com/oauth/authorize",
    tokenUrl: "https://gitlab.com/oauth/token",
    clientIdEnv: "GITLAB_CLIENT_ID",
    clientSecretEnv: "GITLAB_CLIENT_SECRET",
    scopes: "api read_user read_repository write_repository",
    tokenAuthMethod: "body",
  },
  jira: {
    authUrl: "https://auth.atlassian.com/authorize",
    tokenUrl: "https://auth.atlassian.com/oauth/token",
    clientIdEnv: "ATLASSIAN_CLIENT_ID",
    clientSecretEnv: "ATLASSIAN_CLIENT_SECRET",
    scopes: "read:jira-work manage:jira-project write:jira-work offline_access",
    tokenAuthMethod: "body",
    extraAuthParams: { audience: "api.atlassian.com", prompt: "consent" },
  },
  confluence: {
    authUrl: "https://auth.atlassian.com/authorize",
    tokenUrl: "https://auth.atlassian.com/oauth/token",
    clientIdEnv: "ATLASSIAN_CLIENT_ID",
    clientSecretEnv: "ATLASSIAN_CLIENT_SECRET",
    scopes: "read:confluence-content.all write:confluence-content offline_access",
    tokenAuthMethod: "body",
    extraAuthParams: { audience: "api.atlassian.com", prompt: "consent" },
  },

  // ── Bases de données ──────────────────────────────────────────────────────
  airtable: {
    authUrl: "https://airtable.com/oauth2/v1/authorize",
    tokenUrl: "https://airtable.com/oauth2/v1/token",
    clientIdEnv: "AIRTABLE_CLIENT_ID",
    clientSecretEnv: "AIRTABLE_CLIENT_SECRET",
    scopes: "data.records:read data.records:write schema.bases:read schema.bases:write",
    tokenAuthMethod: "basic",
    pkce: true,
  },

  // ── Support ───────────────────────────────────────────────────────────────
  freshdesk: {
    authUrl: "https://accounts.freshdesk.com/oauth/authorize",
    tokenUrl: "https://accounts.freshdesk.com/oauth/token",
    clientIdEnv: "FRESHDESK_CLIENT_ID",
    clientSecretEnv: "FRESHDESK_CLIENT_SECRET",
    scopes: "tickets.read tickets.write contacts.read",
    tokenAuthMethod: "body",
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  google_analytics: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    scopes: "https://www.googleapis.com/auth/analytics.readonly",
    tokenAuthMethod: "body",
  },
  google_ads: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    scopes: "https://www.googleapis.com/auth/adwords",
    tokenAuthMethod: "body",
  },
}
