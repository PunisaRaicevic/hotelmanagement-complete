# VODIČ ZA SCREENSHOT-OVE
## Za prezentaciju Hotel Management aplikacije

---

## KORAK 1: Pokrenite aplikaciju

```bash
cd C:\Users\DESKTOP\Desktop\ClaudeCodeTest\HotelManagement-Complete
npm install   # ako niste već
npm run dev   # pokreće development server
```

Aplikacija će biti dostupna na: `http://localhost:5000` (ili sličan port)

---

## KORAK 2: Napravite folder za screenshot-ove

Kreirajte folder: `PREZENTACIJA-SLIKE` u projektu

---

## KORAK 3: Lista screenshot-ova koje trebate

### A) ADMIN/MENADŽMENT PRIKAZI (ulogujte se kao Admin)

| # | Ekran | Naziv fajla | Napomena |
|---|-------|-------------|----------|
| 1 | **Dashboard** - glavni pregled | `01-dashboard.png` | Sa statistikama (Total Users, Tasks, itd.) |
| 2 | **Lista zadataka** | `02-tasks-lista.png` | Sa nekoliko zadataka različitih statusa |
| 3 | **Kreiranje zadatka** - forma | `03-task-kreiranje.png` | Otvorena forma za novi zadatak |
| 4 | **Detalji zadatka** | `04-task-detalji.png` | Jedan otvoren zadatak sa svim informacijama |
| 5 | **Lista korisnika** | `05-users-lista.png` | Pregled svih korisnika/osoblja |
| 6 | **Statistike** | `06-statistike.png` | Grafikon ili tabela sa statistikama |
| 7 | **Notifikacije** | `07-notifikacije.png` | Notification center otvoren |

### B) HOUSEKEEPING PRIKAZI

| # | Ekran | Naziv fajla | Napomena |
|---|-------|-------------|----------|
| 8 | **Status soba** | `08-sobe-status.png` | Pregled soba sa statusima (čista/prljava/u čišćenju) |
| 9 | **Housekeeping zadatak** | `09-housekeeping-task.png` | Jedan housekeeping zadatak |
| 10 | **Checklist sobe** | `10-checklist.png` | Ako postoji checklist za čišćenje |

### C) GUEST/GOST PRIKAZI (simulirajte kao gost)

| # | Ekran | Naziv fajla | Napomena |
|---|-------|-------------|----------|
| 11 | **QR kod stranica** | `11-qr-kod.png` | Gdje se prikazuje QR kod za sobu |
| 12 | **Guest request forma** | `12-guest-request.png` | Forma koju gost vidi kad skenira QR |
| 13 | **Guest chat** | `13-guest-chat.png` | Ako postoji chat između gosta i osoblja |

### D) MOBILNI PRIKAZI (koristite browser Developer Tools)

**Kako simulirati mobilni prikaz:**
1. Otvorite Chrome/Edge
2. Pritisnite F12 (Developer Tools)
3. Kliknite na ikonu telefona (Toggle device toolbar)
4. Izaberite "iPhone 12 Pro" ili slično

| # | Ekran | Naziv fajla | Napomena |
|---|-------|-------------|----------|
| 14 | **Mobile - Dashboard** | `14-mobile-dashboard.png` | Dashboard na telefonu |
| 15 | **Mobile - Tasks** | `15-mobile-tasks.png` | Lista zadataka na telefonu |
| 16 | **Mobile - Task detalji** | `16-mobile-task-detalj.png` | Jedan zadatak na telefonu |

### E) DODATNI SCREENSHOT-OVI (ako postoje)

| # | Ekran | Naziv fajla | Napomena |
|---|-------|-------------|----------|
| 17 | **Inventar** | `17-inventar.png` | Ako postoji modul za inventar |
| 18 | **Izvještaji** | `18-izvjestaji.png` | Dnevni/sedmični izvještaji |
| 19 | **Rekurentni zadaci** | `19-recurring.png` | Postavljanje ponavljajućih zadataka |
| 20 | **External companies** | `20-external.png` | Ako imate vanjske firme |

---

## KORAK 4: Savjeti za kvalitetne screenshot-ove

### Prije screenshot-a:

1. **Unesite realne podatke**
   - Zadaci: "Popravka klime u sobi 305", "Zamjena sijalice u hodniku"
   - Korisnici: Realna imena (Marko, Ana, Jovan...)
   - Sobe: 101, 102, 201, 202...

2. **Napravite raznolikost u statusima**
   - Neki zadaci: Hitno (crveno)
   - Neki: U toku (žuto)
   - Neki: Završeno (zeleno)

3. **Sakrijte osjetljive podatke**
   - Email adrese
   - Prave brojeve telefona
   - API ključeve

### Tehnički savjeti:

1. **Rezolucija:** Koristite 1920x1080 (Full HD)
2. **Format:** PNG (bolja kvaliteta)
3. **Alat za screenshot:**
   - Windows: `Win + Shift + S` (Snipping Tool)
   - Ili koristite "Full page screenshot" ekstenziju za Chrome

4. **Za mobilne screenshot-ove:**
   - Chrome DevTools ima opciju "Capture screenshot"
   - Desni klik → "Capture screenshot" u device mode

---

## KORAK 5: Organizacija za Canvu

Nakon što napravite sve screenshot-ove:

```
PREZENTACIJA-SLIKE/
├── 01-dashboard.png
├── 02-tasks-lista.png
├── 03-task-kreiranje.png
├── ...
└── 20-external.png
```

### U Canvi:
1. Upload-ujte sve slike odjednom
2. Koristite "Frames" za mockup telefona/laptopa
3. Canva ima gotove device mockups - samo ubacite screenshot

---

## BONUS: Mockup alati

Ako želite profesionalnije screenshot-ove u device frame-ovima:

1. **Canva** - ima ugrađene mockups
2. **Smartmockups.com** - besplatni online alat
3. **Shotsnapp** - https://shotsnapp.com/

---

## DEMO PODACI - Primjeri

### Primjer zadataka za unos:

```
1. Hitno - Klima ne radi - Soba 305
   Status: Novi
   Prioritet: Hitno

2. Zamjena sijalice - Hodnik 2. sprat
   Status: U toku
   Prioritet: Normalno
   Tehničar: Marko Petrović

3. Servis lifta - Mjesečni pregled
   Status: Završeno
   Prioritet: Može čekati
   Tip: Rekurentni

4. Popravka brave - Soba 201
   Status: Čeka odobrenje
   Prioritet: Normalno
```

### Primjer soba:

```
101 - ✅ Čista - Vacant
102 - 🧹 U čišćenju - Ana radi
103 - ❌ Prljava - Checkout
201 - ✅ Čista - Occupied (Gost: Petar Nikolić)
202 - 🔧 Van funkcije - Popravka kupatila
```

### Primjer korisnika:

```
- Admin Admin (Administrator)
- Jovan Jovanović (Supervisor)
- Marko Petrović (Tehničar)
- Ana Marković (Sobarica)
- Milica Stanković (Recepcija)
```

---

## CHECKLIST

- [ ] Dashboard screenshot
- [ ] Tasks lista
- [ ] Task kreiranje
- [ ] Task detalji
- [ ] Users lista
- [ ] Statistike
- [ ] Notifikacije
- [ ] Status soba
- [ ] Housekeeping task
- [ ] QR kod stranica
- [ ] Guest request forma
- [ ] Mobile dashboard
- [ ] Mobile tasks
- [ ] Inventar (ako postoji)
- [ ] Izvještaji

---

*Kada završite sa screenshot-ovima, javite mi i pomoći ću vam da ih organizujete ili da uredimo prezentaciju!*
