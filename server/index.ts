import 'dotenv/config';

// TODO(security): scope this. Globalni NODE_TLS_REJECT_UNAUTHORIZED='0' gasi
// validaciju certifikata za SAV odlazni saobraćaj (Supabase, Firebase, Google).
// Prod je pucao sa "self-signed certificate in certificate chain" na / kad je
// ovo bilo uklonjeno — pg session pool već ima ssl:{rejectUnauthorized:false},
// pa nešto drugo (supabase-js egress preko Railway proxyja?) baca. Pravi fix:
// dodati `undici` dep + scoped Agent na supabase-js `global.fetch`, pa OVO ukloniti
// i testirati na živom Railway-u prije nego se ukloni globalni flag.
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startCronScheduler } from "./cron";
import { initializeFirebase } from "./services/firebase";

// Hard-fail on missing/weak SESSION_SECRET so we never sign sessions with
// a known fallback. JWT_SECRET is validated in ./auth at module load.
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error(
    'SESSION_SECRET environment variable must be set and at least 32 characters long. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"'
  );
}

const app = express();

// Trust Railway's proxy so req.ip reflects the real client IP (used by
// the rate limiter and access logs).
app.set('trust proxy', 1);

// ULTRA-VERBOSE GLOBAL LOGGING - hvata SVE zahtjeve
app.use((req, res, next) => {
  console.log(`[PRE-CORS] ${req.method} ${req.path} - Origin: ${req.headers.origin} - IP: ${req.ip}`);
  if (req.path.includes('fcm-token')) {
    console.log(`[PRE-CORS FCM] Auth header: ${req.headers.authorization ? 'YES' : 'NO'}`);
  }
  next();
});

// ==========================================
// 1. SECURITY HEADERS (helmet) + CORS
// ==========================================
app.use(
  helmet({
    // CSP is intentionally disabled — the SPA inlines styles/scripts and
    // loads from several CDNs (Supabase, Firebase, Google Maps, Translate).
    // Re-enable with a tested directive list once the asset inventory is known.
    contentSecurityPolicy: false,
    // Allow cross-origin image loads (Supabase Storage URLs are loaded by the SPA).
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS allowlist — extra origins can be added via comma-separated CORS_ORIGINS env.
const corsAllowlist = new Set<string>([
  'https://hotelmanagement-complete-production.up.railway.app',
  'http://localhost:5173',
  'http://localhost:5000',
  // Capacitor mobile builds. iOS sends capacitor://localhost; Android sends
  // http(s)://localhost depending on the `server.androidScheme` setting in
  // capacitor.config.json (currently "https"). Keep all variants so a scheme
  // change here doesn't break login.
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
  ...(process.env.CORS_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) ?? []),
]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin / server-to-server / curl requests (no Origin header)
    if (!origin) return callback(null, true);
    if (corsAllowlist.has(origin)) return callback(null, true);
    console.warn(`[CORS] blocked origin: ${origin}`);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Explicit OPTIONS handler za pre-flight zahteve
app.options('*', cors());

// Rate limit login attempts to slow down credential stuffing / brute force.
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in a minute.' },
});
app.use('/api/auth/login', loginLimiter);

// Rate limit javnih (neautentifikovanih) guest endpointa. Guest chat polluje
// /requests i /messages na ~5s, pa limit mora biti dovoljno visok za polling
// ali blokira flood submisija (svaka može nositi Base64 slike). Po IP-u.
const guestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Previše zahtjeva. Pokušajte ponovo za minut.' },
});
app.use('/api/public', guestLimiter);

// Session store setup
import pg from "pg";

// Use transaction pooler (port 6543) if available, fallback to session pooler (5432)
const dbUrl = process.env.DATABASE_URL || '';
const transactionPoolerUrl = dbUrl.replace(':5432/', ':6543/');

const sessionPool = new pg.Pool({
  connectionString: process.env.DATABASE_POOLER_URL || transactionPoolerUrl || dbUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5,
});

sessionPool.on('error', (err) => {
  console.error('Session pool error (non-fatal):', err.message);
});

const PgSession = ConnectPgSimple(session);
const pgStore = new PgSession({
  pool: sessionPool,
  createTableIfMissing: true,
  errorLog: (err: Error) => {
    console.error('PgSession store error:', err.message);
  },
});

app.use(
  session({
    store: pgStore,
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      // Prod (Railway) servira web preko HTTPS → cookie mora biti secure da se ne
      // šalje u cleartextu. APK ne zavisi od cookie-ja (koristi JWT bearer header).
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
    },
  })
);

// Extend session type
declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: string;
    username?: string;
    fullName?: string;
  }
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// ==========================================
// 2. BODY PARSERI (JSON & URL)
// ==========================================
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Inicijalizuj Firebase za push notifikacije
  initializeFirebase();

  const server = await registerRoutes(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ==========================================
  // 3. GLOBAL ERROR HANDLER (MORA biti POSLIJE serveStatic)
  // ==========================================
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Ignoriši greške "stream not readable" da ne ruše logove bezveze
    if (err.code === 'stream is not readable' || err.type === 'stream.not.readable') {
      console.warn("Network interruption detected (client disconnected during upload)");
      return res.status(400).json({ message: "Bad Request - Connection Interrupted" });
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Server Error:", err); // Loguj grešku u konzolu da vidiš šta je
    res.status(status).json({ message });
  });

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
    startCronScheduler();
  });
})();