# Pi to Hetzner Migration Playbook

Sections in Greek; commands in English. Treat both as canonical.

## 1. Πότε κάνεις migration

Μεταφέρεις από Raspberry Pi σε Hetzner όταν ισχύει ένα από αυτά:

- Ρεύμα ή internet στο σπίτι είναι ασταθές.
- Ο ISP κάνει throttling ή αλλάζει συχνά routing.
- Υπάρχουν 20+ πραγματικοί χρήστες.
- Το κόστος Hetzner Storage Box είναι μικρότερο από τον χρόνο συντήρησης του Pi.
- Θέλεις πιο καθαρό uptime για επιχειρήσεις που δουλεύουν καθημερινά.

## 2. Pre-migration checklist

Στο Pi:

```bash
cd ~/radevu
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env ps
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env exec postgres sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > radevu-postgres.sql.gz
sudo tar -czf radevu-uploads.tar.gz -C /srv/radevu uploads
cp infra/.env radevu.env.backup
```

Κράτα σημειωμένα:

```text
CLOUDFLARE_TUNNEL_TOKEN
POSTGRES_PASSWORD
BETTER_AUTH_SECRET
RESEND_API_KEY
```

## 3. Provision Hetzner CAX21 + Storage Box

Δημιούργησε Hetzner CAX21 με Ubuntu LTS.

```bash
ssh root@<hetzner-ip>
apt update && apt upgrade -y
apt install -y docker.io docker-compose-plugin git ufw
systemctl enable --now docker
ufw allow OpenSSH
ufw enable
```

Clone:

```bash
git clone https://github.com/wannabexaker/Radevu.git /opt/radevu
cd /opt/radevu
cp infra/.env.example infra/.env
```

Το `.env` mapping είναι ίδιο με το Pi. Το `DATABASE_URL` μέσα στο compose συνεχίζει να δείχνει `postgres`, γιατί και στο Hetzner τρέχει στο ίδιο Docker bridge network.

## 4. Μεταφορά δεδομένων και secrets

Από το Pi προς το Hetzner:

```bash
scp radevu-postgres.sql.gz root@<hetzner-ip>:/opt/radevu/
scp radevu-uploads.tar.gz root@<hetzner-ip>:/opt/radevu/
scp radevu.env.backup root@<hetzner-ip>:/opt/radevu/infra/.env
```

Στο Hetzner:

```bash
mkdir -p /srv/radevu
tar -xzf /opt/radevu/radevu-uploads.tar.gz -C /srv/radevu
chown -R 1001:1001 /srv/radevu
```

## 5. Docker compose up στο Hetzner

```bash
cd /opt/radevu
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d postgres redis
sleep 15
zcat radevu-postgres.sql.gz | docker compose -f infra/docker-compose.prod.yml --env-file infra/.env exec -T postgres sh -lc 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"'
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d web
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env ps
curl -s http://localhost:3000/api/health
```

Αν το restore τρέξει σε database που έχει ήδη tables, κάνε fresh volume πριν το restore:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env down -v
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d postgres redis
```

## 6. Cloudflare Tunnel στο νέο host

Προτεινόμενο: κράτα το Pi ενεργό μέχρι να δεις ότι το Hetzner δουλεύει.

Στο Hetzner:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d cloudflared
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env logs -f cloudflared
```

Μετά σταματάς το tunnel στο Pi:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env stop cloudflared
```

## 7. DNS verification

Από laptop και από κινητό σε 4G/5G:

```bash
curl -I https://radevu.gr
curl -I https://despoina.radevu.gr
curl -I https://ioannis.radevu.gr
curl -s https://radevu.gr/api/health
```

Αν βλέπεις `db:"ok"` και `redis:"ok"`, το app μιλάει με τα νέα containers.

## 8. Rollback

Αν κάτι πάει στραβά, σταματάς tunnel στο Hetzner:

```bash
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env stop cloudflared
```

Και το ανοίγεις πάλι στο Pi:

```bash
ssh radevu@radevu.local
cd ~/radevu
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env up -d cloudflared
```

Για το migration window, μην γράφεις νέες κρατήσεις και στα δύο hosts. Διάλεξε έναν ενεργό host κάθε φορά.

## 9. Τελικό κόστος

Εκτίμηση:

```text
Hetzner CAX21: περίπου €7 / μήνα
Hetzner Storage Box: περίπου €4 / μήνα
Σύνολο: περίπου €11 / μήνα
```

Το Pi μένει ως fallback ή dev/staging μηχάνημα.
