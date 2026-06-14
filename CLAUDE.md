# CLAUDE.md — HotelManagement

Capacitor (Ionic React + Vite) + Express + Supabase + Appflow Live Update.

## ⚠️ Appflow Live-Update — APK „bijeli ekran" (PROČITAJ PRIJE OTA DEPLOYA)

**Simptom:** poslije Live Update-a APK pokaže **bijeli ekran**, a web radi normalno.
WebView konzola: `Uncaught SyntaxError: Unexpected end of input @ .../assets/index-….js`.

**Uzrok:** Appflow Live-Update **trunkira (odsijeca) prevelik pojedinačni JS chunk** (~1 MB+). Web servira cijeli fajl; samo OTA isporuka korumpira bundle → prazan WebView.

**Fix (provjereno na Posejdon-u 2026-06-14):** drži Vite chunk-ove malim preko `manualChunks` u `vite.config.ts`:
- Izdvoj samo **čiste (ne-React) libove**: `leaflet`, `firebase`, `@capacitor`.
- **KRITIČNO:** React + SVE što importuje React (`react-dom`, `@ionic/react`, `@radix-ui`, `@tanstack`, `wouter`, `recharts`, `react-i18next`…) moraju ostati u **JEDNOM** chunk-u — inače: `Cannot read properties of undefined (reading 'useState')`.
- Cilj: nijedan chunk blizu ~1 MB.

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (!id.includes("node_modules")) return undefined;
        if (id.includes("/leaflet/")) return "vendor-leaflet";
        if (id.includes("firebase") || id.includes("@firebase")) return "vendor-firebase";
        if (id.includes("@capacitor")) return "vendor-capacitor";
        return "vendor"; // react + svi React-potrošači zajedno
      },
    },
  },
},
```

**Gotcha-i kod deploya:**
- Uređaj **kešira** Live Update bundle → poslije deploya **OBRIŠI PODATKE APLIKACIJE** (ili reinstaliraj); inače telefon uporno vrti stari (pokvareni) bundle.
- `autoUpdateMethod: background` traži **dva hladna starta** da se primijeni.
- **Railway/web i Appflow/APK su nezavisni** build-ovi iz istog gita — u Appflow-u izaberi **tačan commit**.
- **Dijagnostika bez USB-a:** privremeni inline `<script>` u `index.html` koji hvata `window.error`/`unhandledrejection` i ispiše grešku na ekran (ograđeno na `location.hostname==='localhost'` da gosti ne vide).
