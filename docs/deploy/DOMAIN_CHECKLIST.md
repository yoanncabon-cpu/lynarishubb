# Checklist déploiement — lynarisai.com

## DNS IONOS → Vercel

| Type  | Hôte | Valeur                  | TTL  |
|-------|------|-------------------------|------|
| A     | @    | 76.76.21.21             | 300s |
| CNAME | www  | cname.vercel-dns.com    | 300s |

## Étapes Vercel

1. Dashboard Vercel → projet Lynaris → **Settings → Domains**
2. Ajouter `lynarisai.com` + `www.lynarisai.com`
3. Vercel affiche les records DNS à configurer (TXT si vérification requise)
4. SSL Let's Encrypt automatique — actif en 5-10 min après propagation DNS

## Variables d'env Vercel (prod)

```
NEXT_PUBLIC_APP_URL=https://lynarisai.com
NEXT_PUBLIC_SITE_URL=https://lynarisai.com
NODE_ENV=production
```

(+ toutes les variables de `.env.example`)

## Vérification finale

```bash
curl https://lynarisai.com/api/health
# attendu: {"status":"ok","domain":"lynarisai.com",...}
```

## Statut

- [ ] Records DNS configurés sur IONOS
- [ ] Domaine vérifié dans Vercel
- [ ] SSL actif (https fonctionne)
- [ ] Variables d'env production configurées
- [ ] Health check OK : `curl lynarisai.com/api/health`
- [ ] Lighthouse mobile > 85
