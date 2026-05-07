// Génère les clés VAPID pour les notifications push.
// Usage : node scripts/generate-vapid.mjs
import webpush from "web-push"
const keys = webpush.generateVAPIDKeys()
console.log("\n✅ Clés VAPID générées — ajoute ces lignes dans ton .env :\n")
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`)
console.log(`VAPID_SUBJECT=mailto:support@lynarisai.com\n`)
