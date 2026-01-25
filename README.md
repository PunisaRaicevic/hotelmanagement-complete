# HotelManagement-Complete

Kompletan sistem za upravljanje hotelom sa modulima za tehnicku sluzbu i domacinstvo.

## Funkcionalnosti

### Tehnicka sluzba
- Kreiranje i pracenje radnih naloga
- Dodjela zadataka radnicima
- Real-time notifikacije (Socket.IO + Firebase Push)
- Evidencija opreme i lokacija

### Domacinstvo (Housekeeping)
- Upravljanje sobama (status cistoce, zauzetost)
- Rasporedivanje sobarica
- Pracenje zadataka ciscenja
- Inspekcija soba
- Inventar (posteljina, amenities, minibar)

## Tehnologije

- **Frontend:** React + Ionic Framework + TailwindCSS
- **Backend:** Express.js + Node.js
- **Baza:** PostgreSQL (Supabase)
- **ORM:** Drizzle ORM
- **Real-time:** Socket.IO
- **Push notifikacije:** Firebase Cloud Messaging
- **Autentikacija:** JWT + Express Sessions

## Instalacija

### 1. Kloniraj repozitorij

```bash
git clone https://github.com/PunisaRaicevic/hotelmanagement-complete.git
cd hotelmanagement-complete
```

### 2. Instaliraj dependencies

```bash
npm install
```

### 3. Kreiraj Supabase projekat

1. Idi na [supabase.com](https://supabase.com) i kreiraj novi projekat
2. Sacekaj da se projekat inicijalizuje
3. Idi u **Settings > API** i kopiraj:
   - Project URL
   - anon/public key
   - service_role key
4. Idi u **Settings > Database** i kopiraj:
   - Session pooler connection string

### 4. Konfiguriši environment varijable

Kreiraj `.env` fajl u root direktoriju:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Session Pooler URL)
DATABASE_URL=postgresql://postgres.your-project:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres

# Security
JWT_SECRET=your-jwt-secret-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars

# Firebase (opcionalno - za push notifikacije)
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 5. Kreiraj tabele u bazi

Pokreni Drizzle push da kreira tabele:

```bash
npm run db:push
```

### 6. Dodaj test podatke (opcionalno)

```bash
node seed-test-data.js
```

### 7. Pokreni aplikaciju

```bash
npm run dev
```

Aplikacija ce biti dostupna na: http://localhost:5000

## Test korisnici

Nakon pokretanja seed skripte, dostupni su sljedeci korisnici:

| Username | Lozinka | Uloga | Opis |
|----------|---------|-------|------|
| admin | test123 | admin | Administrator sistema |
| sef_domacinstva | test123 | sef_domacinstva | Sef domacinstva |
| sobarica1 | test123 | sobarica | Sobarica Ana |
| sobarica2 | test123 | sobarica | Sobarica Ivana |
| recepcioner | test123 | recepcioner | Recepcioner |

## Korisnicke uloge

### Admin
- Puni pristup svim funkcionalnostima
- Upravljanje korisnicima
- Sistemske postavke

### Sef domacinstva (sef_domacinstva)
- Pregled svih soba i njihovog statusa
- Kreiranje i dodjela zadataka ciscenja
- Inspekcija ociscenih soba
- Statistike tima

### Sobarica (sobarica)
- Pregled dodijeljenih zadataka
- Oznacavanje pocetka i zavrsetka ciscenja
- Checklist za posteljinu, peskirе, amenities
- Prijavljivanje problema

### Recepcioner
- Pregled statusa soba
- Evidencija check-in/check-out
- Kreiranje zahtjeva za ciscenje

## API Endpoints

### Sobe
- `GET /api/rooms` - Lista soba
- `POST /api/rooms` - Kreiraj sobu
- `PUT /api/rooms/:id` - Azuriraj sobu
- `PATCH /api/rooms/:id/status` - Promijeni status

### Housekeeping zadaci
- `GET /api/housekeeping/tasks` - Lista zadataka
- `POST /api/housekeeping/tasks` - Kreiraj zadatak
- `PUT /api/housekeeping/tasks/:id` - Azuriraj zadatak
- `POST /api/housekeeping/tasks/:id/start` - Zapocni ciscenje
- `POST /api/housekeeping/tasks/:id/complete` - Zavrsi ciscenje

### Inventar
- `GET /api/inventory` - Lista artikala
- `POST /api/inventory` - Dodaj artikal
- `PUT /api/inventory/:id` - Azuriraj artikal

## Struktura projekta

```
HotelManagement-Complete/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI komponente
│   │   ├── pages/          # Stranice/Dashboard-i
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility funkcije
├── server/                 # Express backend
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   └── services/           # External services (Firebase)
├── shared/                 # Shared code
│   ├── schema.ts           # Drizzle ORM schema
│   └── types.ts            # TypeScript types
├── .env                    # Environment variables
└── package.json
```

## Razvoj

### Pokretanje u development modu

```bash
npm run dev
```

### Database migracije

```bash
npm run db:push    # Push schema changes
npm run db:studio  # Open Drizzle Studio
```

## Licenca

MIT
