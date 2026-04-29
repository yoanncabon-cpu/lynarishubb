import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compression gzip
  compress: true,

  // Tree-shake grandes librairies : évite d'importer tout le barrel
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "gsap"],
  },

  // Baileys (WhatsApp) et ses dépendances natives ne doivent pas être bundlés
  serverExternalPackages: [
    "@whiskeysockets/baileys",
    "jimp",
    "sharp",
    "@hapi/boom",
    "pino",
  ],

  async redirects() {
    return [
      {
        source: "/confidentialite",
        destination: "/legal/confidentialite",
        permanent: true,
      },
      {
        source: "/mentions-legales",
        destination: "/legal/mentions-legales",
        permanent: true,
      },
      {
        source: "/cgu",
        destination: "/legal/cgu",
        permanent: true,
      },
    ]
  },

  // Désactive le bouton DevTools Next.js en dev
  devIndicators: false,

  // Images externes autorisées
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  async headers() {
    // React en dev mode a besoin de 'unsafe-eval' pour reconstruire les
    // callstacks de debug. En prod, React n'utilise jamais eval() — on
    // peut donc le retirer uniquement pour le build de production.
    const isDev = process.env.NODE_ENV !== "production"
    const scriptSrcEval = isDev ? " 'unsafe-eval'" : ""

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // 'unsafe-eval' présent en DEV uniquement (React debug callstacks).
              // En PROD : retiré → renforce CSP contre XSS.
              // 'unsafe-inline' conservé pour les inline scripts Next.js
              // (à durcir avec nonce-based CSP en v2 long terme).
              `script-src 'self' 'unsafe-inline'${scriptSrcEval} https://js.stripe.com https://pipedream.com https://*.pipedream.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob: https://lynarisai.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.anthropic.com https://api.elevenlabs.io https://api.deepgram.com https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.pipedream.com https://*.pipedream.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://pipedream.com https://*.pipedream.com",
              "worker-src 'self' blob:",
              "object-src 'none'",         // Bloque <object>, <embed>, <applet>
              "base-uri 'self'",            // Bloque <base> injection
              "form-action 'self'",         // Bloque submit forms vers domaine externe
              "frame-ancestors 'none'",     // Renforce X-Frame-Options DENY
              "upgrade-insecure-requests",  // Force HTTPS sur toutes les ressources
            ].join("; "),
          },
        ],
      },
      {
        // Cache assets statiques 1 an
        source: "/:path*.(svg|png|jpg|jpeg|webp|ico|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
