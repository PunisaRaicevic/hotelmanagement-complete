# HotelPark Setup Status

## ZAVRŠENI KORACI ✅

### 1. Kod kopiran i prilagođen ✅
- Folder: `C:\Users\DESKTOP\Desktop\ClaudeCodeTest\HGBRTehnickaSluzba-HotelPark`
- Uklonjeni Replit fajlovi
- Dodan Railway config (railway.json, nixpacks.toml)
- Dodan health check endpoint
- Ažuriran package.json (uklonjeni Replit plugini)
- Ažuriran vite.config.ts

### 2. Supabase projekat ✅
- URL: https://supabase.com/dashboard/project/dxlftowmgzialzsaadlb
- Tabele kreirane (SQL migracija izvršena)

### 3. Firebase projekat ✅
- Projekat: hotelpark-tehnika
- Web app registrovana
- Android app registrovana (com.hotelpark.tehnika)
- Service Account generisan
- VAPID key generisan

### 4. GitHub repo ✅
- URL: https://github.com/PunisaRaicevic/hotelpark-tehnika
- Kod push-ovan

---

## PREOSTALI KORACI ⏳

### 5. Railway deploy ⏳ ← OVDJE SMO STALI!
- Idite na: https://railway.app/
- "Start a New Project" → "Deploy from GitHub repo"
- Izaberite: hotelpark-tehnika
- Dodati environment varijable (lista ispod)
- Testirati deployment

NAPOMENA: Fly.io nije radio, prebacili smo se na Railway.

### 6. Supabase Webhook ⏳
- Konfigurisati webhook za tasks tabelu

### 7. Admin korisnik ⏳
- Kreirati prvog admin korisnika u bazi

### 8. Mobilna aplikacija (Appflow) ⏳
- Povezati sa Ionic Appflow
- Build Android APK

---

## ENVIRONMENT VARIJABLE ZA RAILWAY

```env
# Server
PORT=5000
NODE_ENV=production
SESSION_SECRET=GENERISATI_NOVI_32_CHAR
JWT_SECRET=GENERISATI_NOVI_32_CHAR

# Supabase
SUPABASE_URL=https://dxlftowmgzialzsaadlb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bGZ0b3dtZ3ppYWx6c2FhZGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDI2NzIsImV4cCI6MjA4NDQxODY3Mn0.6_GAPAg7aXUZO1JFW75m3fDlpLbiDuhLzpFOh5q9djc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bGZ0b3dtZ3ppYWx6c2FhZGxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg0MjY3MiwiZXhwIjoyMDg0NDE4NjcyfQ._H-Zg5GXescYSl_RQBovCiTvr4mjFYRvAlopt19PbOQ
DATABASE_URL=postgresql://postgres.dxlftowmgzialzsaadlb:067540258Punisa$@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
SUPABASE_WEBHOOK_SECRET=GENERISATI_NOVI_32_CHAR

# Firebase
FIREBASE_PROJECT_ID=hotelpark-tehnika
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@hotelpark-tehnika.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC8JHGqM1LKtXEu\nb5o9pg9BUrRQjLAMz0VwgzXpTFOzGiwlExYpsvlTgHWc5xmLH6K4PKSj39SVRbjt\n+kNdJAXUmaV5wjQ34azqtbrS3A2NUNcYfiwI+xoBgb+948KzmwXplm37OCtA/dC5\nwNBwKVYxWjhpayXyfY0KvLouC/rfseJc7HEJLi3Q7Ear3xJEkVE9KznnOh7dNKCX\n9VbuN8lVoK2NOHZ6hYXa4SqhzQR+rGn8JNHocEtCkMLsIm3jhQR5Cb64hdw0+29N\nzvdclQJ+aVwuFSyX3hMs8Pc/zvE1ATgf5BPfbQBhoJrRKDVwM60ztAdg5+DZvArQ\nqLcD/1xnAgMBAAECggEATuEGqKF46hTVHW9b3tHi3nPCtmytmMlDpy7TqPq/srzb\n2jVc2uG253vZk41OZ8Y9Lfn62tvKYEUJifidSo0CRsaeGmTCCNW8bfEAIUxyABfu\n/k1Tv/Yqyovv7Dhz1mI9wde4R5WeiNKBMoe0u/mQsgNN2GC8WaSqv+AtPIX4SdUs\nsTaA+ra9d6NYBQ9/+kobEjg1F2moOZKW9+uwIeuhrVeCiEQjjXqTEEBrFuy/a8L8\no4Ng2hoAYIaNU8pPvCs/iqUlnR3c2C2gNoryemLOKmZf5rPS7TB0HxFXuwK6UE/f\nisJ+07M9pRUmgg9CFjhhaef2nxouyS+Z3pbZPD/gYQKBgQD26X7cbda/ThhAETQW\nzU8gS7ukO5yjDgKQU6ocG0KXx570ueldOvU9BAPrVwsbD1/CU9tOHR/iFQO39IiI\n60buywRbW2XG+zt6PUcYGqHXClq6jiomczHsC+YgTdBoiqjzzQ8Wrhq2tKMjxzQk\nzeTaNUGHro1CM/3FhEgfYSobIQKBgQDDETJQHEc2ssjsTZLiJOGNJXNMnA2qEP6L\nZWyBUNx/cNx6bTJ4ERy9G8Jln7PaloQJUZeCVhVqXGcEQ9nCBrndS0D917u5ghVC\ntOfFt2qpE/JcUHzzfYolugYmfuMbKDUFlzINNiWkVRJWyTO47Zqd/vE0sGwqLkuG\nqQ1QQKdOhwKBgQD1BFv5TZ4OlOaHnQq9ndrpR33aybT0MVDl+8AQyBRbHaJlY59p\n/rmhZLym6ueAYM87vY8ggtJCvWvFPgnHJQJssFWQerAStvgco3ZLOxJinEnQWocF\nRMbDYENqxw0K0J474L8aWIb1y2cgd+sMoqx4xORUSiivC3zGZjBTw03PQQKBgA3u\nBHHEEzHMwpxdTcfoalLyAbHO0wr5+7Noor75T0WqgZQciCYa0rqOaOto5CcP6I3h\nzbf4/b6CqribP8mjQVKUNSfrZ/RvXaVN1d9AodVBH2WIOeQJavwWtKm7FeyyilbD\n3UckPrvld1HLPG5QSWJO+lqQ3qiEddA/8jtw4oGxAoGBAIrR4omhU69oTziYJz0f\nFDmWTeZVvQMZGsrKZSGylBJ892eKBWv1ZnDH3WPzzFAits/fX6nNrJM5i3P584Lr\nKC/dPZb1ZaYIUw7hcfR2c2UkR/SUWn96MZXAehyNAT6EtMu0X0Rx6GFm8tS6LRlL\nA1OpSCW4gYEl07opNdT5wie+\n-----END PRIVATE KEY-----\n"

# Frontend (VITE)
VITE_SUPABASE_URL=https://dxlftowmgzialzsaadlb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4bGZ0b3dtZ3ppYWx6c2FhZGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDI2NzIsImV4cCI6MjA4NDQxODY3Mn0.6_GAPAg7aXUZO1JFW75m3fDlpLbiDuhLzpFOh5q9djc
VITE_FIREBASE_API_KEY=AIzaSyCnuos4xgks1AkDaLfmpJD01lFp9ZTrkT0
VITE_FIREBASE_MESSAGING_SENDER_ID=615826196463
VITE_FIREBASE_APP_ID=1:615826196463:web:0c8c1b6ec36bb96973181a
VITE_FIREBASE_VAPID_KEY=BEbwDUVHltdKvbkkmT7QGkTMpOX-r3Iqo3BFS9eyr6EJ0jlu-Jq02fFpkmGWX_kqw0xXm4rWXZYYknzBDLUcZ50
VITE_API_URL=https://RAILWAY_URL_OVDJE
```

---

## LINKOVI

- Supabase: https://supabase.com/dashboard/project/dxlftowmgzialzsaadlb
- Firebase: https://console.firebase.google.com/project/hotelpark-tehnika
- GitHub: https://github.com/PunisaRaicevic/hotelpark-tehnika
- Railway: (još nije kreiran)

---

## NAPOMENE

1. `SESSION_SECRET`, `JWT_SECRET`, `SUPABASE_WEBHOOK_SECRET` treba generisati:
   ```
   openssl rand -hex 32
   ```
   Ili online: https://generate-secret.vercel.app/32

2. Nakon Railway deploya, ažurirati `VITE_API_URL` sa Railway URL-om

3. Za mobilnu app koristiti Ionic Appflow ili lokalni build

---

Datum kreiranja: 2026-01-19
