import { Server as SocketIOServer } from 'socket.io';
import type { Server } from 'http';
import { verifyToken, type JWTPayload } from './auth';

let io: SocketIOServer | null = null;

// Isti env-driven allowlist kao Express CORS. Bez Origin headera (npr. native
// WebSocket iz Capacitora / server-to-server) je dozvoljeno — pravi gate je JWT.
const socketCorsAllowlist = new Set<string>([
  'https://hotelmanagement-complete-production.up.railway.app',
  'http://localhost:5173',
  'http://localhost:5000',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
  ...(process.env.CORS_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) ?? []),
]);

/**
 * Initialize Socket.IO server for real-time notifications
 * @param server - HTTP server instance
 */
export function initializeSocket(server: Server): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (socketCorsAllowlist.has(origin)) return callback(null, true);
        console.warn(`[SOCKET.IO] blocked origin: ${origin}`);
        return callback(new Error('origin not allowed'), false);
      },
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  // Auth handshake: svaki socket MORA nositi validan JWT (isti kao REST bearer).
  // Bez ovoga je bilo ko mogao emitovati display:join i skupljati guest tokene,
  // ili worker:join sa tuđim userId-jem i slušati tuđe taskove.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('unauthorized: missing token'));
    const payload = verifyToken(token);
    if (!payload) return next(new Error('unauthorized: invalid token'));
    (socket.data as { user?: JWTPayload }).user = payload;
    next();
  });

  io.on('connection', (socket) => {
    const user = (socket.data as { user?: JWTPayload }).user!;
    console.log(`[SOCKET.IO] Client connected: ${socket.id} (user ${user.userId}/${user.role})`);

    // Svaki autentifikovani korisnik se pridružuje ISKLJUČIVO svojoj sobi —
    // userId iz tokena, ne iz payload-a klijenta (koji je mogao biti lažiran).
    socket.join(`user:${user.userId}`);

    socket.on('worker:join', () => {
      socket.join(`user:${user.userId}`);
      socket.emit('worker:connected', { userId: user.userId, socketId: socket.id });
    });

    socket.on('worker:leave', () => {
      socket.leave(`user:${user.userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET.IO] Client disconnected: ${socket.id}`);
    });

    // Guest Display soba prima {room_number, guest_session_token} za svakog gosta.
    // Samo 'guest_display' nalog (App.tsx gate) i admin smiju u nju.
    socket.on('display:join', () => {
      if (user.role !== 'guest_display' && user.role !== 'admin') {
        console.warn(`[SOCKET.IO] display:join odbijen za rolu ${user.role}`);
        return;
      }
      socket.join('guest-display-room');
      socket.emit('display:paired', { success: true });
    });

    socket.on('display:leave', () => {
      socket.leave('guest-display-room');
    });
  });

  console.log('[SOCKET.IO] Server initialized and ready');
  return io;
}

/**
 * Get Socket.IO instance
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Emit notification to specific worker(s) when task is assigned
 * FULL TASK PAYLOAD - Send complete task data for instant UI updates
 * @param workerIds - Comma-separated user IDs or single user ID
 * @param task - Complete task data (NOT partial!)
 */
export function notifyWorkers(workerIds: string, task: Record<string, any>) {
  if (!io) {
    console.error('[SOCKET.IO] ERROR: Not initialized, cannot send notification. Missing io instance!');
    return;
  }

  // Handle multiple workers (comma-separated IDs, already normalized without spaces)
  const ids = workerIds.split(',').map(id => id.trim()).filter(id => id);
  
  if (ids.length === 0) {
    console.warn('[SOCKET.IO] No worker IDs provided, skipping notification');
    return;
  }
  
  console.log(`[SOCKET.IO] Sending FULL task payload to ${ids.length} worker(s): ${ids.join(', ')}`);
  
  ids.forEach(userId => {
    const room = `user:${userId}`;
    console.log(`[SOCKET.IO] Emitting task:assigned to room: ${room}`);
    
    // ✅ SEND COMPLETE TASK OBJECT - All fields for instant UI rendering!
    io!.to(room).emit('task:assigned', {
      // Core task identification
      id: task.id,
      taskId: task.id, // Keep for backward compatibility
      
      // Task content
      title: task.title,
      description: task.description,
      location: task.location,
      hotel: task.hotel,
      blok: task.blok,
      soba: task.soba,
      room_number: task.room_number,
      
      // Priority and status
      priority: task.priority,
      status: task.status,
      
      // Assignment fields - CRITICAL for filtering!
      assigned_to: task.assigned_to,           // ✅ REQUIRED by WorkerDashboard filter
      assigned_to_name: task.assigned_to_name,
      assigned_to_type: task.assigned_to_type,
      
      // Creator fields
      created_by: task.created_by,
      created_by_name: task.created_by_name,
      created_by_department: task.created_by_department,
      assignedBy: task.created_by_name, // Keep for backward compatibility
      
      // Operator/Supervisor fields
      operator_id: task.operator_id,
      operator_name: task.operator_name,
      sef_id: task.sef_id,
      sef_name: task.sef_name,
      
      // External company
      external_company_id: task.external_company_id,
      external_company_name: task.external_company_name,
      
      // Timing fields
      created_at: task.created_at,
      updated_at: task.updated_at,
      completed_at: task.completed_at,
      deadline_at: task.deadline_at,
      estimated_arrival_time: task.estimated_arrival_time,
      actual_arrival_time: task.actual_arrival_time,
      estimated_completion_time: task.estimated_completion_time,
      actual_completion_time: task.actual_completion_time,
      time_spent_minutes: task.time_spent_minutes,
      
      // Worker fields
      worker_report: task.worker_report,
      worker_images: task.worker_images,
      receipt_confirmed_at: task.receipt_confirmed_at,
      
      // Media
      images: task.images,
      
      // Flags
      is_overdue: task.is_overdue,
      is_recurring: task.is_recurring,
      recurrence_pattern: task.recurrence_pattern,
      recurrence_end_date: task.recurrence_end_date,
      
      // Timestamp for event ordering
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Emit task update notification
 * FULL TASK PAYLOAD - Send complete task data for instant UI updates
 * @param task - Complete updated task data (NOT partial!)
 */
export function notifyTaskUpdate(task: Record<string, any>) {
  if (!io) return;
  
  console.log(`[SOCKET.IO] Broadcasting FULL task update: ${task.id} -> ${task.status}`);
  
  // ✅ SEND COMPLETE TASK OBJECT - All fields for instant UI rendering!
  io.emit('task:updated', {
    // Core task identification
    id: task.id,
    taskId: task.id, // Keep for backward compatibility
    
    // All task fields (same as task:assigned)
    title: task.title,
    description: task.description,
    location: task.location,
    hotel: task.hotel,
    blok: task.blok,
    soba: task.soba,
    room_number: task.room_number,
    priority: task.priority,
    status: task.status,
    assigned_to: task.assigned_to,
    assigned_to_name: task.assigned_to_name,
    assigned_to_type: task.assigned_to_type,
    created_by: task.created_by,
    created_by_name: task.created_by_name,
    created_by_department: task.created_by_department,
    operator_id: task.operator_id,
    operator_name: task.operator_name,
    sef_id: task.sef_id,
    sef_name: task.sef_name,
    external_company_id: task.external_company_id,
    external_company_name: task.external_company_name,
    created_at: task.created_at,
    updated_at: task.updated_at,
    completed_at: task.completed_at,
    deadline_at: task.deadline_at,
    estimated_arrival_time: task.estimated_arrival_time,
    actual_arrival_time: task.actual_arrival_time,
    estimated_completion_time: task.estimated_completion_time,
    actual_completion_time: task.actual_completion_time,
    time_spent_minutes: task.time_spent_minutes,
    worker_report: task.worker_report,
    worker_images: task.worker_images,
    receipt_confirmed_at: task.receipt_confirmed_at,
    images: task.images,
    is_overdue: task.is_overdue,
    is_recurring: task.is_recurring,
    recurrence_pattern: task.recurrence_pattern,
    recurrence_end_date: task.recurrence_end_date,
    timestamp: new Date().toISOString()
  });
}

// ============================================================
// HOUSEKEEPING TASK NOTIFICATIONS
// Mirror of notifyWorkers / notifyTaskUpdate but for the
// housekeeping_tasks table (different shape than maintenance tasks).
// The housekeeper dashboard listens for these to update its list in
// real time instead of relying on tab focus / app resume.
// ============================================================

/**
 * Notify a specific housekeeper that a task was assigned to them.
 * @param housekeeperId - users.id of the assigned housekeeper
 * @param task - the full housekeeping_tasks row that was just inserted/assigned
 */
export function notifyHousekeepingAssigned(
  housekeeperId: string | null | undefined,
  task: Record<string, any>
) {
  if (!io) {
    console.error('[SOCKET.IO] ERROR: Not initialized, cannot send housekeeping notification');
    return;
  }
  if (!housekeeperId) {
    // Unassigned tasks still go through notifyHousekeepingUpdate broadcast below.
    return;
  }
  const room = `user:${housekeeperId}`;
  console.log(`[SOCKET.IO] Emitting housekeeping-task:assigned to ${room} (task ${task.id})`);
  io.to(room).emit('housekeeping-task:assigned', { ...task, timestamp: new Date().toISOString() });
}

/**
 * Broadcast a housekeeping task update (status, assignment, issues_found, …)
 * to every connected client. Supervisor dashboards and the assignee dashboard
 * both want to know about changes.
 */
export function notifyHousekeepingUpdate(task: Record<string, any>) {
  if (!io) return;
  console.log(`[SOCKET.IO] Broadcasting housekeeping-task:updated (task ${task.id} -> ${task.status})`);
  io.emit('housekeeping-task:updated', { ...task, timestamp: new Date().toISOString() });
}

// ============================================================
// GUEST DISPLAY FUNCTIONS - Za prikaz QR koda na ekranu recepcije
// ============================================================

export interface GuestDisplayQRData {
  room_number: string;
  guest_name: string;
  qr_url: string;
  token: string;
}

/**
 * Pošalji QR kod na guest display ekran (globalna soba)
 * Bilo koji recepcioner može poslati QR na display
 * @param qrData - Podaci za QR kod
 */
export function notifyGuestDisplay(qrData: GuestDisplayQRData) {
  if (!io) {
    console.error('[SOCKET.IO] ERROR: Not initialized, cannot send to guest display');
    return;
  }

  console.log(`[SOCKET.IO] Sending QR to guest display for room: ${qrData.room_number}`);
  io.to('guest-display-room').emit('guest-display:show-qr', qrData);
}

/**
 * Sakrij QR kod sa guest display ekrana (globalna soba)
 */
export function hideGuestDisplay() {
  if (!io) {
    console.error('[SOCKET.IO] ERROR: Not initialized, cannot hide guest display');
    return;
  }

  // Provjeri koliko klijenata je u sobi
  const room = io.sockets.adapter.rooms.get('guest-display-room');
  const clientCount = room ? room.size : 0;
  console.log(`[SOCKET.IO] Hiding QR from guest display. Clients in room: ${clientCount}`);

  io.to('guest-display-room').emit('guest-display:hide-qr');
  console.log(`[SOCKET.IO] guest-display:hide-qr event emitted`);
}

/**
 * Sakrij QR kod sa svih display-a koji prikazuju određeni token
 * Koristi se kada gost pristupi portalu
 * @param token - Session token koji je gost iskoristio
 */
export function hideGuestDisplayByToken(token: string) {
  if (!io) return;

  // Broadcast svim display-ima da sakriju ako prikazuju ovaj token
  console.log(`[SOCKET.IO] Broadcasting hide-qr for token: ${token.substring(0, 8)}...`);
  io.emit('guest-display:hide-qr-if-token', { token });
}
