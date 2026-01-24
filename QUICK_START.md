# Quick Start - Novi Hotel za 30 minuta

## Checklist

### 1. SUPABASE (10 min)
- [ ] Kreirajte novi projekat u postojecem Supabase nalogu
- [ ] Pokrenite `supabase-migration.sql` u SQL Editoru
- [ ] Sacuvajte: URL, ANON_KEY, SERVICE_ROLE_KEY, DATABASE_URL

### 2. FIREBASE (10 min)
- [ ] Kreirajte novi Firebase projekat
- [ ] Dodajte Web aplikaciju
- [ ] Omogucite Cloud Messaging
- [ ] Generisite VAPID key
- [ ] Preuzmite Service Account JSON
- [ ] Sacuvajte: API_KEY, SENDER_ID, APP_ID, VAPID_KEY, PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY

### 3. GITHUB (5 min)
- [ ] Kreirajte novi privatni repo
- [ ] Kopirajte kod iz originala (bez .env fajlova!)
- [ ] Dodajte Railway fajlove (railway.json, nixpacks.toml)
- [ ] Dodajte health check endpoint (vidi PATCH_health_endpoint.md)
- [ ] Push na GitHub

### 4. RAILWAY (5 min)
- [ ] Kreirajte projekat iz GitHub repoa
- [ ] Dodajte SVE environment varijable
- [ ] Sacekajte deploy
- [ ] Testirajte: `https://vas-url.up.railway.app/api/health`

### 5. WEBHOOK (2 min)
- [ ] U Supabase dodajte webhook za `tasks` tabelu
- [ ] URL: `https://vas-url.up.railway.app/api/webhooks/tasks`

### 6. ADMIN USER (1 min)
- [ ] Kreirajte admin korisnika u bazi (SQL)

---

## Environment Varijable - Copy/Paste Template

```env
PORT=5000
NODE_ENV=production
SESSION_SECRET=
JWT_SECRET=
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_WEBHOOK_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
VITE_API_URL=
```

---

## Generisanje Secret Kljuceva

Windows PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

ili online: https://generate-secret.vercel.app/32

---

## Procijenjeni Mjesecni Troskovi

| Servis | Cijena |
|--------|--------|
| Railway | ~$10/mj |
| Supabase | $0 (vec placate) |
| Firebase | $0 (free tier) |
| **UKUPNO** | **~$10/mj** |
