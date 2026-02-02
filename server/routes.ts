import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { processRecurringTasks, ensureChildTasksExist } from "./services/recurringTaskProcessor";
import { initializeSocket, notifyWorkers, notifyTaskUpdate, notifyGuestDisplay, hideGuestDisplay, hideGuestDisplayByToken } from "./socket";
import { z } from "zod";
import { generateToken, verifyToken, extractTokenFromHeader } from "./auth";
// Firebase Cloud Messaging for push notifications
import { sendPushToAllUserDevices, initializeFirebase } from "./services/firebase";
import { sendPushNotification } from "./services/notificationService";

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  full_name: z.string().min(1, "Full name is required"),
  role: z.enum([
    "admin",
    "operater",
    "sef",
    "radnik",
    "serviser",
    "recepcioner",
    "menadzer",
    "sobarica",
    "sef_domacinstva",
  ]),
  job_title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  is_active: z.boolean().optional(),
});

const updateUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  email: z.string().email().optional(),
  password: z.string().min(4, "Password must be at least 4 characters").optional(),
  full_name: z.string().min(1).optional(),
  role: z.enum([
    "admin",
    "operater",
    "sef",
    "radnik",
    "serviser",
    "recepcioner",
    "menadzer",
    "sobarica",
    "sef_domacinstva",
  ]).optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  is_active: z.boolean().optional(),
});

// Housekeeping validation schemas
const createRoomSchema = z.object({
  room_number: z.string().min(1, "Room number is required"),
  floor: z.number().int().min(0, "Floor must be 0 or higher"),
  category: z.enum(["standard", "superior", "deluxe", "suite", "apartment"]).optional(),
  bed_type: z.enum(["single", "double", "twin", "king", "queen"]).optional(),
  max_occupancy: z.number().int().min(1).optional(),
  has_minibar: z.boolean().optional(),
});

const updateRoomSchema = z.object({
  room_number: z.string().min(1).optional(),
  floor: z.number().int().min(0).optional(),
  category: z.enum(["standard", "superior", "deluxe", "suite", "apartment"]).optional(),
  status: z.enum(["clean", "dirty", "in_cleaning", "inspected", "out_of_order", "do_not_disturb"]).optional(),
  occupancy_status: z.enum(["vacant", "occupied", "checkout", "checkin_expected", "checkout_expected"]).optional(),
  assigned_housekeeper_id: z.string().nullable().optional(),
  assigned_housekeeper_name: z.string().nullable().optional(),
  guest_name: z.string().nullable().optional(),
  checkout_date: z.string().nullable().optional(),
  checkin_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  priority_score: z.number().int().optional(),
  has_minibar: z.boolean().optional(),
  needs_minibar_check: z.boolean().optional(),
  bed_type: z.enum(["single", "double", "twin", "king", "queen"]).optional(),
  max_occupancy: z.number().int().min(1).optional(),
});

const createHousekeepingTaskSchema = z.object({
  room_id: z.string().min(1, "Room ID is required"),
  room_number: z.string().min(1, "Room number is required"),
  cleaning_type: z.enum(["daily", "checkout", "deep_clean", "turndown", "touch_up"]).optional(),
  assigned_to: z.string().nullable().optional(),
  assigned_to_name: z.string().nullable().optional(),
  supervisor_id: z.string().nullable().optional(),
  supervisor_name: z.string().nullable().optional(),
  priority: z.enum(["urgent", "normal", "can_wait"]).optional(),
  scheduled_date: z.string().min(1, "Scheduled date is required"),
  guest_requests: z.string().nullable().optional(),
});

const updateHousekeepingTaskSchema = z.object({
  cleaning_type: z.enum(["daily", "checkout", "deep_clean", "turndown", "touch_up"]).optional(),
  assigned_to: z.string().nullable().optional(),
  assigned_to_name: z.string().nullable().optional(),
  supervisor_id: z.string().nullable().optional(),
  supervisor_name: z.string().nullable().optional(),
  status: z.enum(["pending", "in_progress", "completed", "inspected", "needs_rework"]).optional(),
  priority: z.enum(["urgent", "normal", "can_wait"]).optional(),
  scheduled_date: z.string().optional(),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  inspected_at: z.string().nullable().optional(),
  inspection_notes: z.string().nullable().optional(),
  inspection_passed: z.boolean().nullable().optional(),
  guest_requests: z.string().nullable().optional(),
  minibar_items_used: z.array(z.string()).nullable().optional(),
  linens_changed: z.boolean().optional(),
  towels_changed: z.boolean().optional(),
  amenities_restocked: z.boolean().optional(),
  issues_found: z.string().nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  time_spent_minutes: z.number().int().optional(),
});

const createInventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["linen", "amenity", "minibar", "cleaning_supply"]),
  unit: z.string().optional(),
  current_stock: z.number().int().min(0).optional(),
  minimum_stock: z.number().int().min(0).optional(),
  reorder_quantity: z.number().int().min(1).optional(),
  cost_per_unit: z.number().int().min(0).optional(),
});

// Authentication middleware
async function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  // Initialize session if it doesn't exist
  if (!req.session) {
    req.session = {};
  }

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.session.userId = payload.userId;
      req.session.userRole = payload.role;
      req.session.username = payload.username;
      req.session.fullName = payload.fullName;
      console.log(`[AUTH] User authenticated via JWT: ${payload.userId}`);
      return next();
    }
  }

  if (req.session.userId) {
    console.log(`[AUTH] User authenticated via session: ${req.session.userId}`);
    return next();
  }

  console.log('[AUTH] Authentication failed - no token or session');
  return res.status(401).json({ error: "Authentication required" });
}

// Admin authorization middleware
async function requireAdmin(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.session.userId = payload.userId;
      req.session.userRole = payload.role;
      req.session.username = payload.username;
      req.session.fullName = payload.fullName;

      if (payload.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      return next();
    }
  }

  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.session.userRole !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);

  // Health check endpoint za Railway
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Middleware to log ALL requests to /api/users/fcm-token
  app.use("/api/users/fcm-token", (req, res, next) => {
    console.log(`[MIDDLEWARE] SVEPOSTUPAK NA /api/users/fcm-token - Method: ${req.method}, IP: ${req.ip}`);
    console.log(`[MIDDLEWARE] Auth header: ${req.headers.authorization ? "EXISTS" : "MISSING"}`);
    console.log(`[MIDDLEWARE] Body: ${JSON.stringify(req.body)}`);
    next();
  });

  initializeSocket(server);
  console.log("[INIT] Socket.IO initialized for real-time notifications");

  // Supabase Webhook - Task notification (SUPPORTS WORKERS, OPERATORS, SUPERVISORS)
  app.post("/api/webhooks/tasks", async (req, res) => {
    try {
      // Verify webhook secret
      const webhookSecret = req.headers['x-supabase-webhook-secret'];
      const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;

      if (!expectedSecret || webhookSecret !== expectedSecret) {
        console.error('❌ Unauthorized webhook access - invalid secret');
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const webhookData = req.body;
      console.log('📥 Webhook primljen:', JSON.stringify(webhookData, null, 2));

      const newRecord = webhookData.record;
      const oldRecord = webhookData.old_record;
      const eventType = webhookData.type; // INSERT or UPDATE
      
      if (!newRecord) {
        console.error('❌ Missing record in webhook data');
        return res.status(400).json({ error: 'Missing record data' });
      }

      // IMPORTANT: Skip notification for future scheduled tasks (recurring task children)
      // These will be notified by the daily scheduler at 8:00 AM on their scheduled date
      if (newRecord.scheduled_for) {
        const scheduledDate = new Date(newRecord.scheduled_for);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        scheduledDate.setHours(0, 0, 0, 0);
        
        if (scheduledDate > today) {
          console.log(`⏰ Zadatak ${newRecord.id} je zakazan za ${newRecord.scheduled_for} - notifikacija ce biti poslana tog dana u 8h`);
          return res.status(200).json({ 
            message: 'Scheduled task - notification will be sent on scheduled date',
            scheduled_for: newRecord.scheduled_for
          });
        }
      }

      const taskTitle = newRecord.title || 'Novi zadatak!';
      const taskDescription = newRecord.description || 'Imate novi zadatak.';
      const taskId = newRecord.id;
      const taskStatus = newRecord.status;
      const oldStatus = oldRecord?.status;

      // Import Firebase push function
      const { sendPushToAllUserDevices } = await import('./services/firebase');
      
      let totalSent = 0;
      let totalFailed = 0;
      let recipientCount = 0;

      // Determine recipients based on task status
      // 1. NEW COMPLAINTS: status 'new' → notify all Operators
      if (taskStatus === 'new' && (eventType === 'INSERT' || oldStatus !== 'new')) {
        console.log('📢 Nova reklamacija - slanje notifikacija operaterima');
        const operators = await storage.getUsersByRole('operater');
        
        for (const operator of operators) {
          const result = await sendPushToAllUserDevices(
            operator.id,
            'Nova reklamacija!',
            taskDescription.substring(0, 200),
            taskId,
            'urgent'
          );
          totalSent += result.sent;
          totalFailed += result.failed;
        }
        recipientCount = operators.length;
        console.log(`📨 Notifikacije poslane ${operators.length} operaterima`);
      }
      
      // 2. TASKS SENT TO SUPERVISOR: status 'with_sef' → notify all Supervisors
      else if (taskStatus === 'with_sef' && oldStatus !== 'with_sef') {
        console.log('📢 Zadatak proslijedjen sefu - slanje notifikacija sefovima');
        const supervisors = await storage.getUsersByRole('sef');
        
        for (const supervisor of supervisors) {
          const result = await sendPushToAllUserDevices(
            supervisor.id,
            'Novi zadatak od operatera!',
            `${taskTitle}: ${taskDescription.substring(0, 150)}`,
            taskId,
            'urgent'
          );
          totalSent += result.sent;
          totalFailed += result.failed;
        }
        recipientCount = supervisors.length;
        console.log(`📨 Notifikacije poslane ${supervisors.length} sefovima`);
      }
      
      // 3. TASKS RETURNED TO SUPERVISOR: status 'returned_to_sef' → notify all Supervisors
      else if (taskStatus === 'returned_to_sef' && oldStatus !== 'returned_to_sef') {
        console.log('📢 Zadatak vracen sefu - slanje notifikacija sefovima');
        const supervisors = await storage.getUsersByRole('sef');
        
        for (const supervisor of supervisors) {
          const result = await sendPushToAllUserDevices(
            supervisor.id,
            'Zadatak vracen od majstora!',
            `${taskTitle}: ${taskDescription.substring(0, 150)}`,
            taskId,
            'urgent'
          );
          totalSent += result.sent;
          totalFailed += result.failed;
        }
        recipientCount = supervisors.length;
        console.log(`📨 Notifikacije poslane ${supervisors.length} sefovima`);
      }
      
      // 4. TASKS ASSIGNED TO WORKERS: has assigned_to field → notify assigned workers
      else if (newRecord.assigned_to) {
        const assignedTo = newRecord.assigned_to;
        
        // Support multiple recipients (comma-separated IDs)
        const recipientUserIds = assignedTo.split(',').map((id: string) => id.trim()).filter(Boolean);

        if (recipientUserIds.length > 0) {
          console.log(`📨 Slanje notifikacija za ${recipientUserIds.length} radnika: ${recipientUserIds.join(', ')}`);

          for (const userId of recipientUserIds) {
            const result = await sendPushToAllUserDevices(
              userId,
              taskTitle,
              taskDescription.substring(0, 200),
              taskId,
              'urgent'
            );
            totalSent += result.sent;
            totalFailed += result.failed;
          }
          recipientCount = recipientUserIds.length;
        }
      }

      if (recipientCount === 0) {
        console.log('ℹ️ Nema primaoca za notifikaciju za ovaj status:', taskStatus);
        return res.status(200).json({ message: 'No recipients for this status', status: taskStatus });
      }

      console.log(`✅ Webhook processed: ${totalSent} sent, ${totalFailed} failed (${recipientCount} recipients)`);
      res.status(200).json({ 
        message: 'Webhook processed', 
        sent: totalSent, 
        failed: totalFailed,
        recipients: recipientCount
      });

    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Authentication endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("Login attempt for:", username);

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);

      if (!user || !user.is_active) {
        console.log("User not found:", username);
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const isBcryptHash =
        user.password_hash?.startsWith("$2a$") ||
        user.password_hash?.startsWith("$2b$") ||
        user.password_hash?.startsWith("$2y$");

      let isValidPassword = false;

      if (isBcryptHash) {
        isValidPassword = await bcrypt.compare(password, user.password_hash);
      } else {
        isValidPassword = password === user.password_hash;
        if (isValidPassword) {
          const hashedPassword = await bcrypt.hash(password, 10);
          await storage.updateUser(user.id, { password_hash: hashedPassword });
        }
      }

      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      req.session.regenerate((err: any) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Internal server error" });
        }

        req.session.userId = user.id;
        req.session.userRole = user.role;

        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Internal server error" });
          }

          const jwtToken = generateToken({
            userId: user.id,
            username: user.username,
            role: user.role,
            fullName: user.full_name,
          });

          const { password_hash, ...userWithoutPassword } = user;

          res.json({
            user: userWithoutPassword,
            token: jwtToken,
          });
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get current user session
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = extractTokenFromHeader(authHeader);

      let userId: string | undefined;

      if (token) {
        const payload = verifyToken(token);
        if (payload) {
          userId = payload.userId;
          req.session.userId = payload.userId;
          req.session.userRole = payload.role;
          req.session.username = payload.username;
          req.session.fullName = payload.fullName;
        }
      } else if (req.session.userId) {
        userId = req.session.userId;
      }

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUserById(userId);

      if (!user || !user.is_active) {
        if (!token && req.session.userId) {
          req.session.destroy(() => {});
        }
        return res.status(401).json({ error: "Session invalid" });
      }

      if (!token && req.session.userId) {
        req.session.touch();
      }

      const { password_hash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Session validation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Register FCM Token - Save to user_device_tokens table
  app.post("/api/users/fcm-token", async (req, res) => {
    console.log('[FCM TOKEN ENDPOINT] === START ===');
    
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    let userId: string | null = null;
    
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        userId = payload.userId;
      }
    }
    
    if (!userId) {
      console.error('[FCM TOKEN ENDPOINT] No valid JWT token');
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { fcmToken, token: bodyToken, platform } = req.body;
      const tokenValue = fcmToken || bodyToken;

      if (!tokenValue) {
        console.error('[FCM TOKEN ENDPOINT] No token in body');
        return res.status(400).json({ error: "Token required" });
      }

      const detectedPlatform = platform || 'web';
      console.log(`[FCM TOKEN ENDPOINT] Saving FCM token for user ${userId} on platform ${detectedPlatform}, token length: ${tokenValue.length}`);
      
      // Koristi novu saveDeviceToken metodu
      const deviceToken = await storage.saveDeviceToken({
        user_id: userId,
        fcm_token: tokenValue,
        platform: detectedPlatform
      });
      
      console.log(`[FCM TOKEN ENDPOINT] Token saved successfully, device ID: ${deviceToken.id}`);

      console.log(`[FCM TOKEN ENDPOINT] SUCCESS! Token stored in user_device_tokens table`);
      console.log('[FCM TOKEN ENDPOINT] === END ===');
      res.json({ 
        success: true, 
        userId,
        tokenId: deviceToken.id,
        message: "FCM token registered successfully"
      });
    } catch (error) {
      console.error('[FCM TOKEN ENDPOINT] CATCH ERROR:', error);
      res.status(500).json({ error: "Internal server error", details: String(error) });
    }
  });

  // Debug Logger
  app.post("/api/debug/log", (req, res) => {
    try {
      const { level, args, timestamp, platform } = req.body;
      const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📱';
      console.log(`${prefix} [APP ${platform?.toUpperCase() || 'UNKNOWN'}] [${timestamp}]:`, ...args);
      res.json({ ok: true });
    } catch (error) {
      res.json({ ok: false });
    }
  });

  // Admin: Get all users
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const usersWithoutPasswords = users.map(({ password_hash, ...user }) => user);
      res.json({ users: usersWithoutPasswords });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Create new user
  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const validationResult = createUserSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.errors[0].message });
      }

      const userData = validationResult.data;
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const newUser = await storage.createUser({
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        job_title: userData.job_title || null,
        department: userData.department || null,
        phone: userData.phone || null,
        password_hash: hashedPassword,
        is_active: userData.is_active !== undefined ? userData.is_active : true,
      });

      const { password_hash, ...userWithoutPassword } = newUser;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update user
  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = updateUserSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.errors[0].message });
      }

      const validatedData = validationResult.data;
      const updates: any = {};

      if (validatedData.username !== undefined) updates.username = validatedData.username;
      if (validatedData.email !== undefined) updates.email = validatedData.email;
      if (validatedData.full_name !== undefined) updates.full_name = validatedData.full_name;
      if (validatedData.role !== undefined) updates.role = validatedData.role;
      if (validatedData.job_title !== undefined) updates.job_title = validatedData.job_title;
      if (validatedData.department !== undefined) updates.department = validatedData.department;
      if (validatedData.phone !== undefined) updates.phone = validatedData.phone;
      if (validatedData.is_active !== undefined) updates.is_active = validatedData.is_active;

      if (validatedData.password) {
        updates.password_hash = await bcrypt.hash(validatedData.password, 10);
      }

      const updatedUser = await storage.updateUser(id, updates);

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password_hash, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Deactivate user
  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = req.session.userId;

      if (id === currentUserId) {
        return res.status(400).json({ error: "Ne možete deaktivirati svoj nalog dok ste prijavljeni." });
      }

      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: "Korisnik nije pronađen." });
      }

      const deactivated = await storage.deleteUser(id);

      if (!deactivated) {
        return res.status(500).json({ error: "Nije moguće deaktivirati korisnika." });
      }

      console.log(`[USER DEACTIVATE] User ${user.full_name} (${id}) deactivated by admin ${currentUserId}`);

      res.json({ success: true, message: "Korisnik je uspešno deaktiviran." });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  function calculateAssignmentPath(history: any[]): string {
    if (!history || history.length === 0) return "";

    const names: string[] = [];
    let lastAddedName: string | null = null;

    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 0; i < sortedHistory.length; i++) {
      const entry = sortedHistory[i];
      if (entry.action === "task_created") continue;

      const statusTo = entry.status_to;

      if (statusTo === "assigned_to_radnik" || statusTo === "with_external") {
        if (entry.user_name && entry.user_name !== lastAddedName) {
          names.push(entry.user_name);
          lastAddedName = entry.user_name;
        }
        if (entry.assigned_to_name && entry.assigned_to_name !== lastAddedName) {
          names.push(entry.assigned_to_name);
          lastAddedName = entry.assigned_to_name;
        }
      } else if (statusTo === "returned_to_sef" || statusTo === "returned_to_operator") {
        if (entry.user_name && entry.user_name !== lastAddedName) {
          names.push(entry.user_name);
          lastAddedName = entry.user_name;
        }
        for (let j = i + 1; j < sortedHistory.length; j++) {
          const nextEntry = sortedHistory[j];
          if (nextEntry.status_to !== statusTo) {
            if (nextEntry.user_name && nextEntry.user_name !== lastAddedName) {
              names.push(nextEntry.user_name);
              lastAddedName = nextEntry.user_name;
            }
            break;
          }
        }
      } else if (statusTo === "with_operator" || statusTo === "with_sef") {
        if (entry.user_name && entry.user_name !== lastAddedName) {
          names.push(entry.user_name);
          lastAddedName = entry.user_name;
        }
      } else if (statusTo === "completed") {
        if (entry.user_name && entry.user_name !== lastAddedName) {
          names.push(entry.user_name);
          lastAddedName = entry.user_name;
        }
      }
    }
    return names.join(" → ");
  }

  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      const taskIds = tasks.map((task) => task.id);
      const allHistories = await storage.getTaskHistoriesForTasks(taskIds);

      const historiesByTaskId = new Map<string, any[]>();
      for (const history of allHistories) {
        if (!historiesByTaskId.has(history.task_id)) {
          historiesByTaskId.set(history.task_id, []);
        }
        historiesByTaskId.get(history.task_id)!.push(history);
      }

      const tasksWithPaths = tasks.map((task) => ({
        ...task,
        assignment_path: calculateAssignmentPath(historiesByTaskId.get(task.id) || []),
      }));

      res.json({ tasks: tasksWithPaths });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  function extractReturnReasons(history: any[]): Array<{ user_name: string; reason: string; timestamp: string }> {
    const reasons: Array<{ user_name: string; reason: string; timestamp: string }> = [];
    for (const entry of history) {
      if ((entry.status_to === "returned_to_sef" || entry.status_to === "returned_to_operator") && entry.notes) {
        const match = entry.notes.match(/Returned to (?:Supervisor|Operator):\s*([\s\S]+)/);
        if (match && match[1]) {
          reasons.push({
            user_name: entry.user_name || "Unknown",
            reason: match[1].trim(),
            timestamp: entry.timestamp,
          });
        }
      }
    }
    return reasons.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  app.get("/api/tasks/:id/history", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getTaskHistory(id);
      const return_reasons = extractReturnReasons(history);
      res.json({ history, return_reasons });
    } catch (error) {
      console.error("Error fetching task history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/tasks/my", requireAuth, async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: "User ID is required" });

      const tasks = await storage.getTasksByUserId(userId);
      res.json({ tasks });
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    console.log("📥 [POST /api/tasks] Request received");
    try {
      const {
        title, description, hotel, blok, soba, priority, userId, userName, userDepartment,
        images, status, assigned_to, assigned_to_name, is_recurring, recurrence_pattern, recurrence_start_date,
      } = req.body;

      if (!title || !description || !hotel || !blok || !userId || !userName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const locationParts = [hotel, blok];
      if (soba) locationParts.push(soba);
      const location = locationParts.join(", ");

      const taskData: any = {
        title, description, location,
        room_number: soba || null,
        priority: priority || "normal",
        status: status || "new",
        created_by: userId,
        created_by_name: userName,
        created_by_department: userDepartment || null,
        images: images || null,
      };

      if (assigned_to) {
        taskData.assigned_to = assigned_to;
        taskData.assigned_to_name = assigned_to_name;
      }

      if (is_recurring !== undefined) {
        taskData.is_recurring = is_recurring;
        taskData.recurrence_pattern = recurrence_pattern || "once";
        if (recurrence_start_date) taskData.recurrence_start_date = recurrence_start_date;
        if (is_recurring && recurrence_pattern !== "once") {
          taskData.next_occurrence = recurrence_start_date || new Date();
        }
      }

      const task = await storage.createTask(taskData);
      const creator = await storage.getUserById(userId);
      const userRole = creator?.role || "unknown";

      await storage.createTaskHistory({
        task_id: task.id,
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        action: "task_created",
        status_to: status || "new",
        notes: description,
        assigned_to: assigned_to || null,
        assigned_to_name: assigned_to_name || null,
      });

      if (is_recurring && recurrence_pattern && recurrence_pattern !== 'once' && assigned_to) {
        try {
          await ensureChildTasksExist(task);
        } catch (childError) {
          console.error('[RECURRING] Error creating child tasks:', childError);
        }
      }

      // 🔥 SLANJE PUSH NOTIFIKACIJE KADA SE KREIRA ZADATAK SA DODELJENIM RADNIKOM
      if (assigned_to && (status === "assigned_to_radnik" || status === "with_sef")) {
        console.log(`📱 [POST /api/tasks] Šaljem push notifikaciju radniku: ${assigned_to}`);
        const workerIds = assigned_to.split(",").map((id: string) => id.trim());

        for (const workerId of workerIds) {
          sendPushToAllUserDevices(
            workerId,
            `Nova reklamacija #${task.id.slice(0, 8)}`,
            `${task.location || task.title} - ${task.priority === "urgent" ? "HITNO" : task.description || "Kliknite za detalje"}`,
            task.id,
            task.priority as "urgent" | "normal" | "can_wait"
          ).then((result) => {
            console.log(`✅ [POST /api/tasks] Push poslat radniku ${workerId}:`, result);
          }).catch((error) => {
            console.error(`⚠️ [POST /api/tasks] Greška pri slanju FCM push-a radniku ${workerId}:`, error);
          });
        }
      }

      res.json({ task });
    } catch (error) {
      console.error("❌ [ERROR] Error creating task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // Update task status/assignment
  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        status, assigned_to, assigned_to_name, worker_report,
        worker_images, external_company_name, receipt_confirmed_at,
        title, description, hotel, blok, soba, room_number, priority, images,
        is_recurring, recurrence_pattern, recurrence_week_days, recurrence_month_days,
        recurrence_year_dates, execution_hour, execution_minute,
      } = req.body;

      if (!id) return res.status(400).json({ error: "Task ID is required" });

      const sessionUser = await storage.getUserById(req.session.userId);
      if (!sessionUser) return res.status(401).json({ error: "Invalid session" });

      const currentTask = await storage.getTaskById(id);
      if (!currentTask) return res.status(404).json({ error: "Task not found" });

      const updateData: any = {};

      // Basic task details (only sef and admin can edit)
      const isEditingDetails = title !== undefined || description !== undefined || hotel !== undefined || 
          blok !== undefined || soba !== undefined || room_number !== undefined || 
          priority !== undefined || images !== undefined;
      const isEditingRecurrence = is_recurring !== undefined || recurrence_pattern !== undefined ||
          recurrence_week_days !== undefined || recurrence_month_days !== undefined ||
          recurrence_year_dates !== undefined || execution_hour !== undefined || execution_minute !== undefined;
      
      if (isEditingDetails || isEditingRecurrence) {
        if (sessionUser.role !== 'sef' && sessionUser.role !== 'admin') {
          return res.status(403).json({ error: "Only supervisors and admins can edit task details" });
        }
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        // Note: hotel, blok, soba are not separate columns in DB - only location exists
        if (room_number !== undefined) updateData.room_number = room_number;
        if (priority !== undefined) updateData.priority = priority;
        if (images !== undefined) updateData.images = images;
        // Update location based on hotel+blok+soba from request body
        if (hotel !== undefined && blok !== undefined) {
          updateData.location = soba ? `${hotel}, ${blok}, Soba ${soba}` : `${hotel}, ${blok}`;
        }
        if (is_recurring !== undefined) updateData.is_recurring = is_recurring;
        if (recurrence_pattern !== undefined) updateData.recurrence_pattern = recurrence_pattern;
        if (recurrence_week_days !== undefined) updateData.recurrence_week_days = recurrence_week_days;
        if (recurrence_month_days !== undefined) updateData.recurrence_month_days = recurrence_month_days;
        if (recurrence_year_dates !== undefined) updateData.recurrence_year_dates = recurrence_year_dates;
        if (execution_hour !== undefined) updateData.execution_hour = execution_hour;
        if (execution_minute !== undefined) updateData.execution_minute = execution_minute;
      }

      if (status !== undefined) updateData.status = status;
      if (assigned_to !== undefined) {
        updateData.assigned_to = assigned_to ? assigned_to.replace(/\s/g, "") : null;
      }
      if (assigned_to_name !== undefined) updateData.assigned_to_name = assigned_to_name || null;
      if (worker_report) updateData.worker_report = worker_report;
      if (worker_images !== undefined) updateData.worker_images = worker_images.length > 0 ? worker_images : [];
      if (external_company_name !== undefined) updateData.external_company_name = external_company_name || null;

      if (receipt_confirmed_at) {
        const assignedIds = currentTask?.assigned_to ? currentTask.assigned_to.split(",").map((id) => id.trim()) : [];
        if (!assignedIds.includes(sessionUser.id)) {
          return res.status(403).json({ error: "Only assigned worker can confirm receipt" });
        }
        updateData.receipt_confirmed_at = new Date(receipt_confirmed_at);
        updateData.receipt_confirmed_by = sessionUser.id;
        updateData.receipt_confirmed_by_name = sessionUser.full_name;
      }

      if (assigned_to !== undefined) {
        const normalizedCurrentAssignment = currentTask?.assigned_to?.replace(/\s/g, "") || null;
        const normalizedNewAssignment = assigned_to ? assigned_to.replace(/\s/g, "") : null;
        if (normalizedCurrentAssignment !== normalizedNewAssignment) {
          updateData.receipt_confirmed_at = null;
          updateData.receipt_confirmed_by = null;
          updateData.receipt_confirmed_by_name = null;
        }
      }

      if (status !== undefined && status !== "assigned_to_radnik" && currentTask?.status === "assigned_to_radnik") {
        updateData.receipt_confirmed_at = null;
        updateData.receipt_confirmed_by = null;
        updateData.receipt_confirmed_by_name = null;
      }

      if (status === "completed" && currentTask?.status !== "completed") {
        updateData.completed_at = new Date();
        updateData.completed_by = sessionUser.id;
        updateData.completed_by_name = sessionUser.full_name;
      }

      if (status !== "completed" && currentTask?.status === "completed") {
        updateData.completed_at = null;
        updateData.completed_by = null;
        updateData.completed_by_name = null;
      }

      const task = await storage.updateTask(id, updateData);
      if (!task) return res.status(404).json({ error: "Task not found" });

      let actionMessage = null;
      if (receipt_confirmed_at) actionMessage = `Receipt confirmed by ${sessionUser.full_name}`;
      else if (worker_report) {
        if (status === "completed") actionMessage = `Completed: ${worker_report}`;
        else if (status === "returned_to_sef") actionMessage = `Returned to Supervisor: ${worker_report}`;
        else if (status === "returned_to_operator") actionMessage = `Returned to Operator: ${worker_report}`;
      } else if (assigned_to !== undefined) {
        actionMessage = assigned_to ? `Assigned to ${assigned_to_name || "technician(s)"}` : "Cleared technician assignment";
      }

      await storage.createTaskHistory({
        task_id: id,
        user_id: sessionUser.id,
        user_name: sessionUser.full_name,
        user_role: sessionUser.role,
        action: "status_changed",
        status_from: currentTask?.status,
        status_to: status || currentTask.status,
        notes: actionMessage,
        assigned_to: updateData.assigned_to !== undefined ? updateData.assigned_to : currentTask.assigned_to,
        assigned_to_name: updateData.assigned_to_name !== undefined ? updateData.assigned_to_name : currentTask.assigned_to_name,
      });

      // POSTOJEĆA LOGIKA ZA NOTIFIKACIJE KOD DODELJIVANJA (Ostaje jer radi)
      if (assigned_to && (status === "assigned_to_radnik" || status === "with_sef")) {
        notifyWorkers(assigned_to, task);
        const workerIds = assigned_to.split(",").map((id: string) => id.trim());

        for (const workerId of workerIds) {
          // Firebase Cloud Messaging push notifikacija
          sendPushToAllUserDevices(
            workerId,
            `Nova reklamacija #${task.id.slice(0, 8)}`,
            `${task.location || task.title} - ${task.priority === "urgent" ? "HITNO" : task.description || "Kliknite za detalje"}`,
            task.id,
            task.priority as "urgent" | "normal" | "can_wait"
          ).catch((error) => {
            console.error(`⚠️ Greška pri slanju FCM push-a radniku ${workerId}:`, error);
          });
        }
      }

      notifyTaskUpdate(task);
      res.json({ task });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: "Task ID is required" });

      const sessionUser = await storage.getUserById(req.session.userId);
      if (!sessionUser) return res.status(401).json({ error: "Invalid session" });

      if (sessionUser.role !== 'sef' && sessionUser.role !== 'admin') {
        return res.status(403).json({ error: "Only supervisors and admins can delete tasks" });
      }

      const task = await storage.getTaskById(id);
      if (!task) return res.status(404).json({ error: "Task not found" });

      const isRecurringTemplate = task.is_recurring && !task.parent_task_id;
      let deletedChildCount = 0;

      if (isRecurringTemplate) {
        const childTasks = await storage.getChildTasksByParentId(id);
        const finalizedStatuses = ['completed', 'cancelled'];
        const pendingChildTasks = childTasks.filter(child => !finalizedStatuses.includes(child.status));
        const completedChildTasks = childTasks.filter(child => finalizedStatuses.includes(child.status));

        // Brisemo samo pending child taskove
        for (const childTask of pendingChildTasks) {
          await storage.createTaskHistory({
            task_id: childTask.id,
            user_id: sessionUser.id,
            user_name: sessionUser.full_name,
            user_role: sessionUser.role,
            action: "task_deleted",
            status_to: "deleted",
            notes: `Child task auto-deleted due to recurring template deletion by ${sessionUser.full_name}`,
          });
          await storage.deleteTask(childTask.id);
          deletedChildCount++;
        }

        // Za completed child taskove - sacuvaj is_recurring=true i oznaci kao ukinut
        // da bi ostali vidljivi u istoriji kao periodicni zadaci sa oznakom "ukinut"
        for (const childTask of completedChildTasks) {
          await storage.updateTask(childTask.id, {
            is_recurring: true,  // Oznaci kao periodicni da bi bio vidljiv u istoriji
            parent_task_id: null, // Ukloni referencu na obrisani parent
            recurrence_pattern: 'cancelled' // Marker da je periodični zadatak ukinut
          });
        }
      }

      await storage.createTaskHistory({
        task_id: id,
        user_id: sessionUser.id,
        user_name: sessionUser.full_name,
        user_role: sessionUser.role,
        action: "task_deleted",
        status_to: "deleted",
        notes: `Task deleted by ${sessionUser.full_name}${isRecurringTemplate ? ` (recurring template, ${deletedChildCount} future tasks deleted)` : task.parent_task_id ? ' (recurring instance)' : ''}`,
      });

      await storage.deleteTask(id);
      res.json({ message: "Task deleted successfully", deletedChildTasks: deletedChildCount });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get technicians
  app.get("/api/technicians", requireAuth, async (req, res) => {
    try {
      const technicians = await storage.getTechnicians();
      res.json({ technicians });
    } catch (error) {
      console.error("Error fetching technicians:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Cron jobs
  app.post("/api/cron/trigger-now", requireAdmin, async (req, res) => {
    try {
      const result = await processRecurringTasks();
      res.json({ message: "Manual trigger executed", result });
    } catch (error) {
      console.error("[MANUAL TRIGGER] Error:", error);
      res.status(500).json({ error: "Failed to trigger cron job" });
    }
  });

  app.post("/api/cron/process-recurring-tasks", requireAdmin, async (req, res) => {
    try {
      const result = await processRecurringTasks();
      res.json(result);
    } catch (error) {
      console.error("[CRON] Error in process-recurring-tasks:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // AI Analysis endpoint - only for admins
  app.post("/api/admin/analyze", requireAuth, async (req, res) => {
    try {
      const { question } = req.body;
      const sessionUser = await storage.getUserById(req.session.userId);
      
      if (!sessionUser || sessionUser.role !== 'admin') {
        return res.status(403).json({ error: "Only admins can use AI analysis" });
      }

      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      // Initialize Supabase client for additional queries
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch data from Supabase for context
      const allTasks = await storage.getTasks();
      const allUsers = await storage.getUsers();
      
      const now = new Date();

      // Fetch ALL data from Supabase tables - NO predefined period filters
      // AI will extract period from user's question
      const [
        { data: taskHistory },
        { data: departments },
        { data: taskAssignments },
        { data: taskCosts },
        { data: taskMessages },
        { data: taskPhotos },
        { data: taskTemplates },
        { data: taskTimeline },
        { data: inventoryItems },
        { data: inventoryRequests },
        { data: inventoryTransactions },
        { data: externalCompanies },
        { data: workSessions },
        { data: userActivityLog },
        { data: dailyStats },
        { data: notifications },
        { data: allScheduledTasks }
      ] = await Promise.all([
        supabase.from('task_history').select('*').order('timestamp', { ascending: false }).limit(500),
        supabase.from('departments').select('*'),
        supabase.from('task_assignments').select('*'),
        supabase.from('task_costs').select('*'),
        supabase.from('task_messages').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('task_photos').select('*'),
        supabase.from('task_templates').select('*'),
        supabase.from('task_timeline').select('*').order('timestamp', { ascending: false }).limit(500),
        supabase.from('inventory_items').select('*'),
        supabase.from('inventory_requests').select('*'),
        supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('external_companies').select('*'),
        supabase.from('work_sessions').select('*').order('start_time', { ascending: false }).limit(200),
        supabase.from('user_activity_log').select('*').order('timestamp', { ascending: false }).limit(200),
        supabase.from('daily_stats').select('*').order('date', { ascending: false }).limit(90),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('tasks').select('*').not('scheduled_for', 'is', null).order('scheduled_for', { ascending: true })
      ]);
      
      // Calculate statistics
      const tasksByStatus = allTasks.reduce((acc: any, task: any) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});
      
      const tasksByPriority = allTasks.reduce((acc: any, task: any) => {
        acc[task.priority || 'normal'] = (acc[task.priority || 'normal'] || 0) + 1;
        return acc;
      }, {});

      const usersByRole = allUsers.reduce((acc: any, user: any) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});

      // Group completed tasks by department
      const completedByDept = allTasks
        .filter((t: any) => t.status === 'completed')
        .reduce((acc: any, task: any) => {
          const dept = task.department || 'Unknown';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {});

      // Prepare context for AI - ALL tasks with full date info for AI to filter by period from question
      const allTasksFormatted = allTasks.map((t: any) => {
        const createdDate = new Date(t.created_at).toLocaleDateString('sr-RS');
        const scheduledDate = t.scheduled_for ? new Date(t.scheduled_for).toLocaleDateString('sr-RS') : null;
        const completedDate = t.completed_at ? new Date(t.completed_at).toLocaleDateString('sr-RS') : null;
        const isRecurring = t.is_recurring || t.parent_task_id ? 'Periodican' : 'Jednokratan';
        return `- ${t.title} | Status: ${t.status} | Prioritet: ${t.priority || 'normal'} | Kreiran: ${createdDate} | Zakazan: ${scheduledDate || 'N/A'} | Zavrsen: ${completedDate || 'Nije'} | Tip: ${isRecurring} | Tehnicar: ${t.assigned_to_name || 'Nije dodeljen'} | Lokacija: ${t.location || 'N/A'}`;
      }).join('\n');

      // Format ALL scheduled tasks (future)
      const scheduledTasksFormatted = allScheduledTasks && allScheduledTasks.length > 0
        ? allScheduledTasks.map((task: any) => {
            const scheduledDate = new Date(task.scheduled_for);
            const dateStr = scheduledDate.toLocaleDateString('sr-RS');
            const timeStr = scheduledDate.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
            const isRecurring = task.is_recurring || task.recurrence_pattern ? 'Periodican' : 'Jednokratan';
            const isPast = scheduledDate < now ? 'PROSAO' : 'PREDSTOJI';
            return `- ${task.title} | Datum: ${dateStr} ${timeStr} | ${isPast} | Lokacija: ${task.location || 'N/A'} | Tehnicar: ${task.assigned_to_name || 'Nije dodeljen'} | Status: ${task.status} | Tip: ${isRecurring}`;
          }).join('\n')
        : 'Nema zakazanih zadataka.';

      // Calculate total costs if available
      const totalCosts = taskCosts && taskCosts.length > 0
        ? taskCosts.reduce((sum: number, c: any) => sum + (parseFloat(c.amount) || 0), 0).toFixed(2)
        : 'N/A';

      // Calculate inventory stats
      const inventoryStats = {
        items: inventoryItems?.length || 0,
        requests: inventoryRequests?.length || 0,
        transactions: inventoryTransactions?.length || 0
      };

      const systemPrompt = `Ti si helpful assistant za analizu podataka hotelskog sistema. Odgovaraj na srpskom jeziku.

DANASNJI DATUM: ${now.toLocaleDateString('sr-RS')} ${now.toLocaleTimeString('sr-RS')}

DOSTUPNE TABELE U SUPABASE:
- tasks: ${allTasks.length} zadataka
- task_history: ${taskHistory?.length || 0} zapisa o promjenama statusa
- task_assignments: ${taskAssignments?.length || 0} dodjela tehnicarima
- task_costs: ${taskCosts?.length || 0} zapisa o troskovima (Ukupno: ${totalCosts} EUR)
- users: ${allUsers.length} korisnika (Uloge: ${JSON.stringify(usersByRole)})

===== PODACI O ZADACIMA =====
${allTasksFormatted}

===== ZAKAZANI ZADACI =====
${scheduledTasksFormatted}`;

      // Call OpenAI API
      const OpenAI = await import('openai').then(m => m.default);
      const client = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
      });

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      });

      const analysis = response.choices[0]?.message?.content || 'Nije moguće generisati analizu';

      res.json({ analysis });
    } catch (error) {
      console.error('[AI ANALYSIS] Error:', error);
      res.status(500).json({ error: 'Greška pri analizi. Pokušajte ponovo.' });
    }
  });

  // =============================================
  // HOUSEKEEPING API ROUTES
  // =============================================

  // Middleware for housekeeping access (admin, sef_domacinstva, sobarica)
  async function requireHousekeepingAccess(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        req.session.userId = payload.userId;
        req.session.userRole = payload.role;
        req.session.username = payload.username;
        req.session.fullName = payload.fullName;

        const allowedRoles = ['admin', 'sef_domacinstva', 'sobarica', 'recepcioner'];
        if (!allowedRoles.includes(payload.role)) {
          return res.status(403).json({ error: "Housekeeping access required" });
        }
        return next();
      }
    }

    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const allowedRoles = ['admin', 'sef_domacinstva', 'sobarica', 'recepcioner'];
    if (!allowedRoles.includes(req.session.userRole)) {
      return res.status(403).json({ error: "Housekeeping access required" });
    }
    next();
  }

  // ----- ROOMS -----

  // Get all rooms
  app.get("/api/rooms", requireHousekeepingAccess, async (req, res) => {
    try {
      const { floor, status } = req.query;

      let rooms;
      if (floor) {
        rooms = await storage.getRoomsByFloor(parseInt(floor as string));
      } else if (status) {
        rooms = await storage.getRoomsByStatus(status as string);
      } else {
        rooms = await storage.getRooms();
      }

      res.json({ rooms });
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get room by ID
  app.get("/api/rooms/:id", requireHousekeepingAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const room = await storage.getRoomById(id);

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      res.json({ room });
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create room (admin/sef_domacinstva only)
  app.post("/api/rooms", requireAdmin, async (req, res) => {
    try {
      const validationResult = createRoomSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.errors[0].message });
      }

      const existingRoom = await storage.getRoomByNumber(validationResult.data.room_number);
      if (existingRoom) {
        return res.status(409).json({ error: "Room with this number already exists" });
      }

      const room = await storage.createRoom(validationResult.data);
      res.status(201).json({ room });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update room
  app.patch("/api/rooms/:id", requireHousekeepingAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = updateRoomSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.errors[0].message });
      }

      const currentRoom = await storage.getRoomById(id);
      if (!currentRoom) {
        return res.status(404).json({ error: "Room not found" });
      }

      const sessionUser = await storage.getUserById(req.session.userId);
      if (!sessionUser) {
        return res.status(401).json({ error: "Invalid session" });
      }

      // Track status change in history
      if (validationResult.data.status && validationResult.data.status !== currentRoom.status) {
        await storage.createRoomStatusHistory({
          room_id: id,
          status_from: currentRoom.status,
          status_to: validationResult.data.status,
          changed_by: sessionUser.id,
          changed_by_name: sessionUser.full_name,
          notes: req.body.notes || null,
        });

        // Update last_cleaned_at if status changes to clean/inspected
        if (validationResult.data.status === 'clean' || validationResult.data.status === 'inspected') {
          (validationResult.data as any).last_cleaned_at = new Date().toISOString();
        }
        if (validationResult.data.status === 'inspected') {
          (validationResult.data as any).last_inspected_at = new Date().toISOString();
          (validationResult.data as any).last_inspected_by = sessionUser.id;
        }
      }

      const room = await storage.updateRoom(id, validationResult.data as any);
      res.json({ room });
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete room (admin only)
  app.delete("/api/rooms/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteRoom(id);

      if (!deleted) {
        return res.status(404).json({ error: "Room not found" });
      }

      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("Error deleting room:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get room status history
  app.get("/api/rooms/:id/history", requireHousekeepingAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getRoomStatusHistory(id);
      res.json({ history });
    } catch (error) {
      console.error("Error fetching room history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ----- GUEST QR CODE SYSTEM -----

  // Generate new session token for room (on guest check-in)
  app.post("/api/rooms/:id/checkin", requireHousekeepingAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const { guest_name, guest_count, guest_phone, guest_email, checkin_date, checkout_date } = req.body;

      const room = await storage.getRoomById(id);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Generate unique session token
      const crypto = await import('crypto');
      const sessionToken = crypto.randomBytes(32).toString('hex');

      // Update room with guest info and token
      const updatedRoom = await storage.updateRoom(id, {
        guest_name,
        guest_count: guest_count || 1,
        guest_phone,
        guest_email,
        checkin_date: checkin_date || new Date().toISOString(),
        checkout_date,
        occupancy_status: 'occupied',
        guest_session_token: sessionToken,
        token_created_at: new Date().toISOString(),
      } as any);

      res.json({
        room: updatedRoom,
        session_token: sessionToken,
        qr_url: `/guest/${room.room_number}/${sessionToken}`
      });
    } catch (error) {
      console.error("Error checking in guest:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Checkout guest and invalidate token
  app.post("/api/rooms/:id/checkout", requireHousekeepingAccess, async (req, res) => {
    try {
      const { id } = req.params;

      const room = await storage.getRoomById(id);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Clear guest info and invalidate token
      const updatedRoom = await storage.updateRoom(id, {
        guest_name: null,
        guest_count: null,
        guest_phone: null,
        guest_email: null,
        checkin_date: null,
        checkout_date: null,
        occupancy_status: 'checkout',
        guest_session_token: null,
        token_created_at: null,
        status: 'dirty', // Mark room as needing cleaning
      } as any);

      res.json({ room: updatedRoom, message: "Guest checked out, QR code invalidated" });
    } catch (error) {
      console.error("Error checking out guest:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================================
  // GUEST DISPLAY - QR kod na ekranu recepcije za goste
  // ============================================================

  // Set aktivnih tokena koji su prikazani na display-u
  const activeDisplayTokens = new Set<string>();

  // POST /api/rooms/:id/show-qr-to-display - Pošalji QR kod na guest display
  app.post("/api/rooms/:id/show-qr-to-display", requireHousekeepingAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const sessionUser = await storage.getUserById(req.session.userId);

      if (!sessionUser) {
        return res.status(401).json({ error: "Invalid session" });
      }

      // Samo recepcioner i admin mogu slati QR na display
      if (sessionUser.role !== 'recepcioner' && sessionUser.role !== 'admin' && sessionUser.role !== 'sef_domacinstva') {
        return res.status(403).json({ error: "Only receptionist, admin or housekeeping supervisor can send QR to display" });
      }

      const room = await storage.getRoomById(id);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      if (!room.guest_session_token) {
        return res.status(400).json({ error: "Room has no active QR code. Please check-in a guest first." });
      }

      // Konstruiši punu URL adresu
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const qrUrl = `${protocol}://${host}/guest/${room.room_number}/${room.guest_session_token}`;

      // Zapamti token koji je prikazan na display-u
      activeDisplayTokens.add(room.guest_session_token);

      // Pošalji QR na display preko Socket.IO (globalna soba)
      notifyGuestDisplay({
        room_number: room.room_number,
        guest_name: room.guest_name || 'Gost',
        qr_url: qrUrl,
        token: room.guest_session_token
      });

      console.log(`[GUEST DISPLAY] QR sent to display for room ${room.room_number} by ${sessionUser.full_name}`);

      res.json({
        success: true,
        message: "QR kod je poslat na guest display",
        room_number: room.room_number
      });
    } catch (error) {
      console.error("Error sending QR to display:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Funkcija za brisanje QR-a sa display-a kada gost pristupi
  function clearDisplayForToken(token: string) {
    console.log(`[GUEST DISPLAY] clearDisplayForToken called, token: ${token?.substring(0, 8)}...`);
    console.log(`[GUEST DISPLAY] activeDisplayTokens size: ${activeDisplayTokens.size}`);
    console.log(`[GUEST DISPLAY] Token in set: ${activeDisplayTokens.has(token)}`);

    if (activeDisplayTokens.has(token)) {
      console.log(`[GUEST DISPLAY] Calling hideGuestDisplay()...`);
      hideGuestDisplay();
      activeDisplayTokens.delete(token);
      console.log(`[GUEST DISPLAY] QR cleared for token ${token.substring(0, 8)}...`);
    } else {
      // Čak i ako token nije u setu, pokušaj sakriti display
      console.log(`[GUEST DISPLAY] Token not in set, but calling hideGuestDisplay() anyway...`);
      hideGuestDisplay();
    }
  }

  // PUBLIC: Validate room token and get room info (no auth required)
  app.get("/api/public/room/:roomNumber/:token", async (req, res) => {
    try {
      const { roomNumber, token } = req.params;
      console.log(`[GUEST PORTAL] Validating token for room: ${roomNumber}, token: ${token?.substring(0, 8)}...`);

      const room = await storage.getRoomByNumber(roomNumber);
      if (!room) {
        console.log(`[GUEST PORTAL] Room ${roomNumber} not found`);
        return res.status(404).json({ error: "Room not found", valid: false });
      }

      console.log(`[GUEST PORTAL] Room found: ${room.room_number}, occupancy: ${room.occupancy_status}, has_token: ${!!room.guest_session_token}`);

      // Check if token matches and room is occupied
      if (!room.guest_session_token || room.guest_session_token !== token) {
        return res.status(403).json({
          error: "Invalid or expired QR code. Please contact the front desk.",
          valid: false,
          reason: "token_invalid"
        });
      }

      if (room.occupancy_status !== 'occupied') {
        return res.status(403).json({
          error: "This room is not currently occupied. QR code is no longer valid.",
          valid: false,
          reason: "not_occupied"
        });
      }

      // Gost je uspješno pristupio - sakrij QR sa guest display-a
      clearDisplayForToken(token);

      // Return limited room info for guest
      res.json({
        valid: true,
        room: {
          room_number: room.room_number,
          floor: room.floor,
          category: room.category,
          guest_name: room.guest_name,
        }
      });
    } catch (error: any) {
      console.error("[GUEST PORTAL] Error validating room token:", error?.message || error);
      console.error("[GUEST PORTAL] Stack:", error?.stack);
      res.status(500).json({ error: "Internal server error", valid: false });
    }
  });

  // PUBLIC: Submit guest service request (no auth required, but needs valid token)
  app.post("/api/public/room/:roomNumber/:token/request", async (req, res) => {
    try {
      const { roomNumber, token } = req.params;
      const { request_type, category, description, guest_name, guest_phone, priority, images } = req.body;

      // Validate required fields
      if (!request_type || !description) {
        return res.status(400).json({ error: "Request type and description are required" });
      }

      const room = await storage.getRoomByNumber(roomNumber);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Validate token
      if (!room.guest_session_token || room.guest_session_token !== token) {
        return res.status(403).json({ error: "Invalid or expired QR code" });
      }

      if (room.occupancy_status !== 'occupied') {
        return res.status(403).json({ error: "Room is not occupied" });
      }

      // Create guest service request
      const request = await storage.createGuestServiceRequest({
        room_id: room.id,
        room_number: roomNumber,
        session_token: token,
        request_type,
        category,
        description,
        guest_name: guest_name || room.guest_name,
        guest_phone: guest_phone || room.guest_phone,
        priority: priority || 'normal',
        images,
      });

      // TODO: Send notification to relevant staff (operater for maintenance, sef_domacinstva for housekeeping)

      res.status(201).json({
        success: true,
        message: "Your request has been submitted. Hotel staff will attend to it shortly.",
        request_id: request.id
      });
    } catch (error) {
      console.error("Error creating guest request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all guest service requests (staff only)
  app.get("/api/guest-requests", requireAuth, async (req, res) => {
    try {
      const { status, room_id, request_type } = req.query;
      const requests = await storage.getGuestServiceRequests({
        status: status as string,
        room_id: room_id as string,
        request_type: request_type as string,
      });
      res.json({ requests });
    } catch (error) {
      console.error("Error fetching guest requests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update guest service request (staff only)
  app.patch("/api/guest-requests/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const sessionUser = await storage.getUserById(req.session.userId);
      if (!sessionUser) {
        return res.status(401).json({ error: "Invalid session" });
      }

      const updateData = { ...req.body };
      if (updateData.status === 'completed') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = sessionUser.id;
      }

      const request = await storage.updateGuestServiceRequest(id, updateData);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      res.json({ request });
    } catch (error) {
      console.error("Error updating guest request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ----- HOUSEKEEPING TASKS -----

  // Get all housekeeping tasks
  app.get("/api/housekeeping/tasks", requireHousekeepingAccess, async (req, res) => {
    try {
      const { room_id, assigned_to, date } = req.query;

      let tasks;
      if (room_id) {
        tasks = await storage.getHousekeepingTasksByRoom(room_id as string);
      } else if (assigned_to) {
        tasks = await storage.getHousekeepingTasksByAssignee(assigned_to as string);
      } else if (date) {
        tasks = await storage.getHousekeepingTasksByDate(date as string);
      } else {
        tasks = await storage.getHousekeepingTasks();
      }

      res.json({ tasks });
    } catch (error) {
      console.error("Error fetching housekeeping tasks:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get housekeeping task by ID
  app.get("/api/housekeeping/tasks/:id", requireHousekeepingAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.getHousekeepingTaskById(id);

      if (!task) {
        return res.status(404).json({ error: "Housekeeping task not found" });
      }

      res.json({ task });
    } catch (error) {
      console.error("Error fetching housekeeping task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create housekeeping task
  app.post("/api/housekeeping/tasks", requireHousekeepingAccess, async (req, res) => {
    try {
      const validationResult = createHousekeepingTaskSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.errors[0].message });
      }

      const task = await storage.createHousekeepingTask(validationResult.data);

      // Update room status to dirty if creating a checkout cleaning
      if (validationResult.data.cleaning_type === 'checkout') {
        await storage.updateRoom(validationResult.data.room_id, { status: 'dirty' });
      }

      // 🔥 SLANJE PUSH NOTIFIKACIJE KADA SE KREIRA HOUSEKEEPING TASK SA DODELJENOM SOBARICOM
      if (validationResult.data.assigned_to) {
        const cleaningTypeLabels: Record<string, string> = {
          'daily': 'Dnevno čišćenje',
          'checkout': 'Checkout čišćenje',
          'deep_clean': 'Dubinsko čišćenje',
          'turndown': 'Turndown servis',
          'touch_up': 'Brzo sređivanje'
        };
        const cleaningLabel = cleaningTypeLabels[validationResult.data.cleaning_type] || validationResult.data.cleaning_type;
        const priorityLabel = validationResult.data.priority === 'urgent' ? ' - HITNO!' : '';

        console.log(`📱 [POST /api/housekeeping/tasks] Šaljem push notifikaciju sobarici: ${validationResult.data.assigned_to}`);

        sendPushToAllUserDevices(
          validationResult.data.assigned_to,
          `Nova cleaning task - Soba ${validationResult.data.room_number}`,
          `${cleaningLabel}${priorityLabel}`,
          task.id,
          validationResult.data.priority as 'urgent' | 'normal' | 'can_wait'
        ).then((result) => {
          console.log(`✅ [POST /api/housekeeping/tasks] Push poslat sobarici:`, result);
        }).catch((error) => {
          console.error(`⚠️ [POST /api/housekeeping/tasks] Greška pri slanju push-a:`, error);
        });
      }

      res.status(201).json({ task });
    } catch (error) {
      console.error("Error creating housekeeping task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update housekeeping task
  app.patch("/api/housekeeping/tasks/:id", requireHousekeepingAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const validationResult = updateHousekeepingTaskSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.errors[0].message });
      }

      const currentTask = await storage.getHousekeepingTaskById(id);
      if (!currentTask) {
        return res.status(404).json({ error: "Housekeeping task not found" });
      }

      const sessionUser = await storage.getUserById(req.session.userId);
      if (!sessionUser) {
        return res.status(401).json({ error: "Invalid session" });
      }

      const updateData: any = { ...validationResult.data };

      // Handle status transitions
      if (updateData.status) {
        if (updateData.status === 'in_progress' && currentTask.status === 'pending') {
          updateData.started_at = new Date().toISOString();
          // Update room status
          await storage.updateRoom(currentTask.room_id, { status: 'in_cleaning' });
        }

        if (updateData.status === 'completed' && currentTask.status !== 'completed') {
          updateData.completed_at = new Date().toISOString();
          // Update room status to clean
          await storage.updateRoom(currentTask.room_id, { status: 'clean' });
        }

        if (updateData.status === 'inspected') {
          updateData.inspected_at = new Date().toISOString();
          // Update room status to inspected
          await storage.updateRoom(currentTask.room_id, {
            status: 'inspected',
            last_inspected_at: new Date().toISOString(),
            last_inspected_by: sessionUser.id
          } as any);
        }

        if (updateData.status === 'needs_rework') {
          // Room stays in cleaning state
          await storage.updateRoom(currentTask.room_id, { status: 'dirty' });
        }
      }

      // 🔥 SLANJE PUSH NOTIFIKACIJE ZA HOUSEKEEPING TASK UPDATES
      const cleaningTypeLabels: Record<string, string> = {
        'daily': 'Dnevno čišćenje',
        'checkout': 'Checkout čišćenje',
        'deep_clean': 'Dubinsko čišćenje',
        'turndown': 'Turndown servis',
        'touch_up': 'Brzo sređivanje'
      };

      // Notifikacija kada se task dodijeli novoj sobarici
      if (updateData.assigned_to && updateData.assigned_to !== currentTask.assigned_to) {
        const cleaningLabel = cleaningTypeLabels[currentTask.cleaning_type] || currentTask.cleaning_type;
        const priorityLabel = (updateData.priority || currentTask.priority) === 'urgent' ? ' - HITNO!' : '';

        console.log(`📱 [PATCH /api/housekeeping/tasks] Nova dodjela - šaljem push sobarici: ${updateData.assigned_to}`);

        sendPushToAllUserDevices(
          updateData.assigned_to,
          `Nova cleaning task - Soba ${currentTask.room_number}`,
          `${cleaningLabel}${priorityLabel}`,
          id,
          (updateData.priority || currentTask.priority) as 'urgent' | 'normal' | 'can_wait'
        ).then((result) => {
          console.log(`✅ [PATCH /api/housekeeping/tasks] Push poslat novoj sobarici:`, result);
        }).catch((error) => {
          console.error(`⚠️ [PATCH /api/housekeeping/tasks] Greška pri slanju push-a:`, error);
        });
      }

      // Notifikacija kada se task vrati na popravak (needs_rework)
      if (updateData.status === 'needs_rework' && currentTask.assigned_to) {
        const cleaningLabel = cleaningTypeLabels[currentTask.cleaning_type] || currentTask.cleaning_type;

        console.log(`📱 [PATCH /api/housekeeping/tasks] Needs rework - šaljem push sobarici: ${currentTask.assigned_to}`);

        sendPushToAllUserDevices(
          currentTask.assigned_to,
          `⚠️ Potrebna dorada - Soba ${currentTask.room_number}`,
          `${cleaningLabel} - Molimo pregledajte napomene`,
          id,
          'urgent'
        ).then((result) => {
          console.log(`✅ [PATCH /api/housekeeping/tasks] Push poslat za needs_rework:`, result);
        }).catch((error) => {
          console.error(`⚠️ [PATCH /api/housekeeping/tasks] Greška pri slanju push-a:`, error);
        });
      }

      const task = await storage.updateHousekeepingTask(id, updateData);
      res.json({ task });
    } catch (error) {
      console.error("Error updating housekeeping task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete housekeeping task
  app.delete("/api/housekeeping/tasks/:id", requireHousekeepingAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const sessionUser = await storage.getUserById(req.session.userId);

      if (!sessionUser || (sessionUser.role !== 'admin' && sessionUser.role !== 'sef_domacinstva')) {
        return res.status(403).json({ error: "Only admin or supervisor can delete tasks" });
      }

      const deleted = await storage.deleteHousekeepingTask(id);

      if (!deleted) {
        return res.status(404).json({ error: "Housekeeping task not found" });
      }

      res.json({ message: "Housekeeping task deleted successfully" });
    } catch (error) {
      console.error("Error deleting housekeeping task:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ----- INVENTORY -----

  // Get all inventory items
  app.get("/api/inventory", requireHousekeepingAccess, async (req, res) => {
    try {
      const { category, low_stock } = req.query;

      let items;
      if (low_stock === 'true') {
        items = await storage.getLowStockItems();
      } else if (category) {
        items = await storage.getInventoryItemsByCategory(category as string);
      } else {
        items = await storage.getInventoryItems();
      }

      res.json({ items });
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create inventory item (admin only)
  app.post("/api/inventory", requireAdmin, async (req, res) => {
    try {
      const validationResult = createInventoryItemSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: validationResult.error.errors[0].message });
      }

      const item = await storage.createInventoryItem(validationResult.data);
      res.status(201).json({ item });
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update inventory item
  app.patch("/api/inventory/:id", requireHousekeepingAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.updateInventoryItem(id, req.body);

      if (!item) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      res.json({ item });
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete inventory item (admin only)
  app.delete("/api/inventory/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteInventoryItem(id);

      if (!deleted) {
        return res.status(404).json({ error: "Inventory item not found" });
      }

      res.json({ message: "Inventory item deleted successfully" });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get room inventory
  app.get("/api/rooms/:id/inventory", requireHousekeepingAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const inventory = await storage.getRoomInventory(id);
      res.json({ inventory });
    } catch (error) {
      console.error("Error fetching room inventory:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update room inventory
  app.put("/api/rooms/:roomId/inventory/:itemId", requireHousekeepingAccess, async (req, res) => {
    try {
      const { roomId, itemId } = req.params;
      const { quantity } = req.body;

      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ error: "Valid quantity is required" });
      }

      const sessionUser = await storage.getUserById(req.session.userId);
      if (!sessionUser) {
        return res.status(401).json({ error: "Invalid session" });
      }

      const inventory = await storage.updateRoomInventory(roomId, itemId, quantity, sessionUser.id);
      res.json({ inventory });
    } catch (error) {
      console.error("Error updating room inventory:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get housekeepers (sobarica role)
  app.get("/api/housekeepers", requireHousekeepingAccess, async (req, res) => {
    try {
      const housekeepers = await storage.getUsersByRole('sobarica');
      const usersWithoutPasswords = housekeepers.map(({ password_hash, ...user }) => user);
      res.json({ housekeepers: usersWithoutPasswords });
    } catch (error) {
      console.error("Error fetching housekeepers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return server;
}