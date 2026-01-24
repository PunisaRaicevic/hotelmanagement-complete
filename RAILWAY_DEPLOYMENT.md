# Railway Deployment Guide - HGBRTehnickaSluzba

Ovaj vodic objasnjava kako deployovati novu instancu aplikacije za drugi hotel.

## Preduslovi

- GitHub nalog
- Railway nalog (https://railway.app)
- Postojeci Supabase nalog (Pro plan)
- Firebase nalog

---

## KORAK 1: Kreiranje GitHub Repozitorijuma

### 1.1 Kreirajte novi privatni repo

```bash
# Na GitHub.com kreirajte novi PRIVATNI repo, npr:
# hotel-xyz-tehnicka-sluzba
```

### 1.2 Kopirajte kod (BEZ .env fajlova!)

```bash
# Kopirajte sve fajlove OSIM:
# - .env
# - .env.local
# - google-services.json (android)
# - bilo koji fajl sa API kljucevima

# Dodajte nove Railway fajlove:
# - railway.json
# - nixpacks.toml
# - .env.example
```

### 1.3 Push na GitHub

```bash
git init
git add .
git commit -m "Initial commit for Hotel XYZ"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hotel-xyz-tehnicka-sluzba.git
git push -u origin main
```

---

## KORAK 2: Kreiranje Supabase Projekta

### 2.1 Novi projekat u Supabase

1. Idite na https://supabase.com/dashboard
2. Kliknite "New Project"
3. Izaberite organizaciju (isti nalog koji vec placate)
4. Unesite ime: `hotel-xyz-tehnika`
5. Izaberite regiju blizu hotela (Frankfurt za Evropu)
6. Sacekajte da se projekat kreira

### 2.2 Pokrenite SQL migraciju

1. U Supabase, idite na **SQL Editor**
2. Kopirajte sadrzaj iz `supabase-migration.sql` fajla
3. Pokrenite SQL

### 2.3 Sacuvajte API kljuceve

Idite na **Settings > API** i sacuvajte:
- `Project URL` → SUPABASE_URL
- `anon public` → SUPABASE_ANON_KEY
- `service_role` → SUPABASE_SERVICE_ROLE_KEY

Idite na **Settings > Database** i sacuvajte:
- `Connection string (URI)` → DATABASE_URL

---

## KORAK 3: Kreiranje Firebase Projekta

### 3.1 Novi projekat

1. Idite na https://console.firebase.google.com
2. "Add project" → `hotel-xyz-tehnika`
3. Omogucite Google Analytics (opciono)

### 3.2 Dodajte Web aplikaciju

1. Project Settings > Your apps > Add app > Web
2. Registrujte app: `Hotel XYZ Tehnika Web`
3. Sacuvajte:
   - `apiKey` → VITE_FIREBASE_API_KEY
   - `messagingSenderId` → VITE_FIREBASE_MESSAGING_SENDER_ID
   - `appId` → VITE_FIREBASE_APP_ID

### 3.3 Omogucite Cloud Messaging

1. Project Settings > Cloud Messaging
2. Generisite Web Push certificate (VAPID key)
3. Sacuvajte → VITE_FIREBASE_VAPID_KEY

### 3.4 Kreirajte Service Account

1. Project Settings > Service Accounts
2. "Generate new private key"
3. Sacuvajte JSON fajl
4. Iz JSON fajla uzmite:
   - `project_id` → FIREBASE_PROJECT_ID
   - `client_email` → FIREBASE_CLIENT_EMAIL
   - `private_key` → FIREBASE_PRIVATE_KEY

---

## KORAK 4: Railway Deployment

### 4.1 Kreirajte Railway projekat

1. Idite na https://railway.app
2. "New Project" > "Deploy from GitHub repo"
3. Izaberite vas repo: `hotel-xyz-tehnicka-sluzba`
4. Railway ce automatski detektovati Node.js

### 4.2 Dodajte Environment Variables

1. U Railway projektu, idite na **Variables**
2. Dodajte SVE varijable iz `.env.example`:

```
PORT=5000
NODE_ENV=production
SESSION_SECRET=<generisano>
JWT_SECRET=<generisano>
SUPABASE_URL=<iz koraka 2>
SUPABASE_ANON_KEY=<iz koraka 2>
SUPABASE_SERVICE_ROLE_KEY=<iz koraka 2>
DATABASE_URL=<iz koraka 2>
SUPABASE_WEBHOOK_SECRET=<generisano>
FIREBASE_PROJECT_ID=<iz koraka 3>
FIREBASE_CLIENT_EMAIL=<iz koraka 3>
FIREBASE_PRIVATE_KEY=<iz koraka 3>
VITE_SUPABASE_URL=<iz koraka 2>
VITE_SUPABASE_ANON_KEY=<iz koraka 2>
VITE_FIREBASE_API_KEY=<iz koraka 3>
VITE_FIREBASE_MESSAGING_SENDER_ID=<iz koraka 3>
VITE_FIREBASE_APP_ID=<iz koraka 3>
VITE_FIREBASE_VAPID_KEY=<iz koraka 3>
VITE_API_URL=<Railway URL - dodajte nakon prvog deploya>
```

**VAZNO za FIREBASE_PRIVATE_KEY:**
- Kopirajte cijeli kljuc ukljucujuci `-----BEGIN PRIVATE KEY-----` i `-----END PRIVATE KEY-----`
- Zadrzite `\n` karaktere

### 4.3 Generisite tajne kljuceve

```bash
# Za SESSION_SECRET:
openssl rand -hex 32

# Za JWT_SECRET:
openssl rand -hex 32

# Za SUPABASE_WEBHOOK_SECRET:
openssl rand -hex 32
```

### 4.4 Deploy

1. Railway automatski pokrece deploy kada dodate varijable
2. Pratite logove u "Deployments" tabu
3. Kada zavrsi, dobicete URL: `https://hotel-xyz-tehnika.up.railway.app`

### 4.5 Azurirajte VITE_API_URL

1. Kopirajte Railway URL
2. Dodajte/azurirajte varijablu: `VITE_API_URL=https://hotel-xyz-tehnika.up.railway.app`
3. Railway ce automatski redeploy

---

## KORAK 5: Konfiguracija Supabase Webhooks

### 5.1 Postavite webhook za real-time notifikacije

1. U Supabase idite na **Database > Webhooks**
2. "Create a new hook"
3. Konfiguracija:
   - Name: `task_notifications`
   - Table: `tasks`
   - Events: INSERT, UPDATE
   - Type: HTTP Request
   - Method: POST
   - URL: `https://hotel-xyz-tehnika.up.railway.app/api/webhooks/tasks`
   - HTTP Headers:
     ```
     x-webhook-secret: <vas SUPABASE_WEBHOOK_SECRET>
     Content-Type: application/json
     ```

---

## KORAK 6: Kreiranje Admin Korisnika

### 6.1 Preko SQL Editora

U Supabase SQL Editor pokrenite:

```sql
INSERT INTO users (username, email, full_name, role, department, password_hash, is_active)
VALUES (
  'admin',
  'admin@hotel-xyz.com',
  'Administrator',
  'admin',
  'tehnicka',
  '$2b$10$YOUR_BCRYPT_HASH',  -- Generisati sa bcrypt
  true
);
```

### 6.2 Generisanje lozinke

Koristite online bcrypt generator ili:

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('VasaLozinka123!', 10);
console.log(hash);
```

---

## KORAK 7: Android Aplikacija (Opciono)

Ako hotel zeli mobilnu aplikaciju:

### 7.1 Azurirajte Firebase za Android

1. Firebase Console > Project Settings > Add app > Android
2. Package name: `com.hotelxyz.tehnika` (promijenite za svaki hotel)
3. Preuzmite `google-services.json`
4. Stavite u `android/app/` folder

### 7.2 Azurirajte Capacitor config

U `capacitor.config.json`:

```json
{
  "appId": "com.hotelxyz.tehnika",
  "appName": "Hotel XYZ Tehnika",
  "server": {
    "url": "https://hotel-xyz-tehnika.up.railway.app",
    "cleartext": false
  }
}
```

### 7.3 Build APK

```bash
npm run build:android
cd android
./gradlew assembleRelease
```

---

## Troubleshooting

### Build failed

- Provjerite da li su sve VITE_ varijable postavljene
- Provjerite Node.js verziju (treba >=20)

### Cannot connect to database

- Provjerite DATABASE_URL format
- Provjerite da li je Supabase projekat aktivan

### Push notifications not working

- Provjerite FIREBASE_PRIVATE_KEY format (sa \n)
- Provjerite da li je FCM omogucen u Firebase konzoli

### 502 Bad Gateway

- Provjerite logove u Railway
- Najcesce je problem sa environment varijablama

---

## Kontakt za Podrsku

Za tehnicku podrsku kontaktirajte razvojni tim.
