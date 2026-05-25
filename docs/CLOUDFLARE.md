# Cloudflare Tunnel Runbook

Sections in Greek; commands in English. Treat both as canonical.

## 1. Πότε χρησιμοποιείς αυτό

Χρησιμοποίησε αυτό το runbook αφού αγοραστεί το `radevu.gr` και οι nameservers αλλάξουν σε Cloudflare.

Στόχος: το Radevu να μένει πίσω από Cloudflare Tunnel. Δεν ανοίγεις ports στο router. Το Pi κάνει μόνο outbound σύνδεση προς Cloudflare.

## 2. Δημιουργία Tunnel `radevu-home`

Στο Cloudflare Dashboard:

1. Zero Trust → Networks → Tunnels.
2. Create tunnel.
3. Name: `radevu-home`.
4. Connector: Docker.
5. Αντιγράφεις το `CLOUDFLARE_TUNNEL_TOKEN`.

Στο Pi:

```bash
cd ~/radevu
nano infra/.env
```

Βάζεις:

```bash
CLOUDFLARE_TUNNEL_TOKEN=<token-from-cloudflare>
BOOKING_BASE_DOMAIN=radevu.gr
ROUTING_MODE=subdomain
BETTER_AUTH_URL=https://dashboard.radevu.gr
RESEND_FROM_EMAIL=noreply@radevu.gr
```

## 3. DNS records

Στο ίδιο tunnel, πρόσθεσε public hostnames:

```text
radevu.gr       → http://web:3000
*.radevu.gr     → http://web:3000
```

Το Cloudflare θα δημιουργήσει CNAME records προς το Tunnel UUID. Μην βάλεις A record στο public IP του σπιτιού.

## 4. Cloudflared με Docker

Στο `infra/docker-compose.prod.yml` υπάρχει έτοιμο `cloudflared` block σε σχόλια. Το ξεσχολιάζεις και τρέχεις:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d cloudflared
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env logs -f cloudflared
```

Αν δεις `Registered tunnel connection`, το tunnel είναι ενεργό.

## 5. Cloudflare Access για dashboard

Προστάτευσε το dashboard πριν το δείξεις δημόσια.

Cloudflare Zero Trust → Access → Applications → Add application:

```text
Type: Self-hosted
Name: Radevu Dashboard
Domain: dashboard.radevu.gr
Path: /dashboard*
```

Policy:

```text
Action: Allow
Include: Emails → founder email
Include: Login Methods → Google
Fallback: One-time PIN / magic link to founder email
```

Το public booking path για επιχειρήσεις μένει ανοιχτό. Το Access μπαίνει μόνο στο dashboard.

## 6. Bot Fight Mode και Rate Limiting

Cloudflare Security → Bots:

```text
Bot Fight Mode: On
```

Cloudflare Security → WAF → Rate limiting rules:

```text
Rule name: Radevu API basic limit
Expression: (http.request.uri.path wildcard "/api/v1/*")
Action: Block
Threshold: more than 60 requests per 1 minute from the same IP
```

Αυτό προστατεύει τα public API routes χωρίς να εμποδίζει κανονική χρήση.

## 7. Smoke test από εξωτερικό δίκτυο

Κλείσε WiFi στο κινητό και δοκίμασε με 4G/5G:

```bash
curl -I https://radevu.gr
curl -I https://despoina.radevu.gr
curl -I https://ioannis.radevu.gr
curl -s https://radevu.gr/api/health
```

Αναμενόμενο:

```text
HTTP 200/308 for pages
{"status":"ok","db":"ok","redis":"ok"}
```

## 8. Killswitch και rollback

Για άμεσο κλείσιμο public πρόσβασης:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env stop cloudflared
```

Για rollback σε LAN-only:

```bash
nano infra/.env
```

```bash
BOOKING_BASE_DOMAIN=radevu.local
ROUTING_MODE=subpath
BETTER_AUTH_URL=http://radevu.local:3000
```

Μετά:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d web
```

## 9. Κόστος

Cloudflare DNS, Tunnel, Access με μικρή χρήση, Bot Fight Mode και βασικό rate limiting μένουν στο free tier.

Τρέχον κόστος για αυτή τη φάση: `€0`.
