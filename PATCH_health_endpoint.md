# Patch: Dodavanje Health Check Endpointa

Railway koristi health check da provjeri da li je aplikacija pokrenuta.
Dodajte ovaj kod u `server/routes.ts` fajl.

## Gdje dodati

Na pocetku fajla, odmah nakon importa i prije ostalih ruta, dodajte:

```typescript
// Health check endpoint za Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## Primjer lokacije u kodu

```typescript
import express from 'express';
// ... ostali importi ...

export function registerRoutes(app: Express) {

  // === DODAJTE OVDJE ===
  // Health check endpoint za Railway
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });
  // === KRAJ DODATKA ===

  // ... ostale rute ...
}
```

## Testiranje

Nakon dodavanja, testirajte lokalno:

```bash
curl http://localhost:5000/api/health
```

Ocekivani odgovor:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456
}
```
