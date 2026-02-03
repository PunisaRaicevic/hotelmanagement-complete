import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  full_name: text("full_name").notNull(),
  role: varchar("role").notNull(),
  job_title: text("job_title"),
  department: text("department"),
  phone: varchar("phone"),
  password_hash: text("password_hash").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  shift: text("shift"),
  push_token: text("push_token"),
  onesignal_player_id: text("onesignal_player_id"),
  fcm_token: text("fcm_token"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const user_device_tokens = pgTable("user_device_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull(),
  fcm_token: text("fcm_token").notNull().unique(),
  platform: text("platform"),
  last_updated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  is_active: boolean("is_active").notNull().default(true),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  room_number: varchar("room_number"),
  priority: varchar("priority").notNull(),
  status: varchar("status").notNull(),
  created_by: varchar("created_by").notNull(),
  created_by_name: text("created_by_name").notNull(),
  created_by_department: text("created_by_department").notNull(),
  operator_id: varchar("operator_id"),
  operator_name: text("operator_name"),
  assigned_to: text("assigned_to"),
  assigned_to_name: text("assigned_to_name"),
  assigned_to_type: varchar("assigned_to_type"),
  receipt_confirmed_at: timestamp("receipt_confirmed_at", { withTimezone: true }),
  receipt_confirmed_by: varchar("receipt_confirmed_by"),
  receipt_confirmed_by_name: text("receipt_confirmed_by_name"),
  sef_id: varchar("sef_id"),
  sef_name: text("sef_name"),
  external_company_id: varchar("external_company_id"),
  external_company_name: text("external_company_name"),
  deadline_at: timestamp("deadline_at", { withTimezone: true }),
  is_overdue: boolean("is_overdue").notNull().default(false),
  estimated_arrival_time: timestamp("estimated_arrival_time", { withTimezone: true }),
  actual_arrival_time: timestamp("actual_arrival_time", { withTimezone: true }),
  estimated_completion_time: timestamp("estimated_completion_time", { withTimezone: true }),
  actual_completion_time: timestamp("actual_completion_time", { withTimezone: true }),
  time_spent_minutes: integer("time_spent_minutes").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  completed_at: timestamp("completed_at", { withTimezone: true }),
  completed_by: varchar("completed_by"),
  completed_by_name: text("completed_by_name"),
  images: text("images").array(),
  is_recurring: boolean("is_recurring").notNull().default(false),
  recurrence_pattern: varchar("recurrence_pattern").default("once"),
  recurrence_start_date: timestamp("recurrence_start_date", { withTimezone: true }),
  next_occurrence: timestamp("next_occurrence", { withTimezone: true }),
  recurrence_week_days: integer("recurrence_week_days").array(),
  recurrence_month_days: integer("recurrence_month_days").array(),
  recurrence_year_dates: jsonb("recurrence_year_dates"),
  execution_hour: integer("execution_hour"),
  execution_minute: integer("execution_minute"),
  parent_task_id: varchar("parent_task_id"),
  scheduled_for: timestamp("scheduled_for", { withTimezone: true }),
  worker_report: text("worker_report"),
  worker_images: text("worker_images").array(),
});

export const task_history = pgTable("task_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  task_id: varchar("task_id").notNull(),
  user_id: varchar("user_id").notNull(),
  user_name: text("user_name").notNull(),
  user_role: text("user_role").notNull(),
  action: text("action").notNull(),
  original_message: text("original_message"),
  notes: text("notes"),
  status_from: varchar("status_from"),
  status_to: varchar("status_to"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  assigned_to: text("assigned_to"),
  assigned_to_name: text("assigned_to_name"),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull(),
  task_id: varchar("task_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").notNull(),
  is_read: boolean("is_read").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  read_at: timestamp("read_at", { withTimezone: true }),
});

// =============================================
// ADDITIONAL TECHNICAL SERVICE TABLES
// =============================================

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  manager_id: varchar("manager_id"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const external_companies = pgTable("external_companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  company_name: text("company_name").notNull(),
  service_type: text("service_type").notNull(),
  contact_person: text("contact_person"),
  phone: varchar("phone"),
  email: text("email"),
  address: text("address"),
  average_rating: integer("average_rating").notNull().default(0),
  total_jobs: integer("total_jobs").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guest_reports = pgTable("guest_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  task_id: varchar("task_id"),
  room_number: varchar("room_number"),
  guest_name: text("guest_name"),
  report_type: varchar("report_type").notNull(), // complaint, suggestion, compliment
  description: text("description").notNull(),
  status: varchar("status").notNull().default("new"), // new, in_progress, resolved
  resolved_by: varchar("resolved_by"),
  resolved_at: timestamp("resolved_at", { withTimezone: true }),
  resolution_notes: text("resolution_notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const maintenance_plans = pgTable("maintenance_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  equipment_type: text("equipment_type"),
  location: text("location"),
  frequency: varchar("frequency").notNull(), // daily, weekly, monthly, quarterly, yearly
  last_performed_at: timestamp("last_performed_at", { withTimezone: true }),
  next_scheduled_at: timestamp("next_scheduled_at", { withTimezone: true }),
  assigned_to: varchar("assigned_to"),
  assigned_to_name: text("assigned_to_name"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const service_ratings = pgTable("service_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  task_id: varchar("task_id").notNull(),
  rated_by: varchar("rated_by").notNull(),
  rated_by_name: text("rated_by_name").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  service_type: varchar("service_type"), // internal, external
  external_company_id: varchar("external_company_id"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const task_assignments = pgTable("task_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  task_id: varchar("task_id").notNull(),
  assigned_to: varchar("assigned_to").notNull(),
  assigned_to_name: text("assigned_to_name").notNull(),
  assigned_by: varchar("assigned_by").notNull(),
  assigned_by_name: text("assigned_by_name").notNull(),
  assignment_type: varchar("assignment_type").notNull(), // primary, helper, supervisor
  status: varchar("status").notNull().default("active"), // active, completed, removed
  notes: text("notes"),
  assigned_at: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  completed_at: timestamp("completed_at", { withTimezone: true }),
});

export const task_costs = pgTable("task_costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  task_id: varchar("task_id").notNull(),
  cost_type: varchar("cost_type").notNull(), // material, labor, external, other
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // u centima
  quantity: integer("quantity").notNull().default(1),
  added_by: varchar("added_by").notNull(),
  added_by_name: text("added_by_name").notNull(),
  receipt_image: text("receipt_image"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const task_messages = pgTable("task_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  task_id: varchar("task_id").notNull(),
  sender_id: varchar("sender_id").notNull(),
  sender_name: text("sender_name").notNull(),
  sender_role: varchar("sender_role").notNull(),
  message: text("message").notNull(),
  is_internal: boolean("is_internal").notNull().default(false), // internal notes vs public
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const task_photos = pgTable("task_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  task_id: varchar("task_id").notNull(),
  photo_url: text("photo_url").notNull(),
  photo_type: varchar("photo_type").notNull(), // before, during, after
  description: text("description"),
  uploaded_by: varchar("uploaded_by").notNull(),
  uploaded_by_name: text("uploaded_by_name").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const task_templates = pgTable("task_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  default_priority: varchar("default_priority").notNull().default("normal"),
  estimated_duration_minutes: integer("estimated_duration_minutes"),
  required_skills: text("required_skills").array(),
  checklist_items: text("checklist_items").array(),
  is_active: boolean("is_active").notNull().default(true),
  created_by: varchar("created_by"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const task_timeline = pgTable("task_timeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  task_id: varchar("task_id").notNull(),
  event_type: varchar("event_type").notNull(), // created, assigned, started, paused, resumed, completed, etc.
  event_description: text("event_description").notNull(),
  user_id: varchar("user_id").notNull(),
  user_name: text("user_name").notNull(),
  user_role: varchar("user_role").notNull(),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const daily_stats = pgTable("daily_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date", { withTimezone: true }).notNull(),
  department: varchar("department"),
  total_tasks_created: integer("total_tasks_created").notNull().default(0),
  total_tasks_completed: integer("total_tasks_completed").notNull().default(0),
  total_tasks_overdue: integer("total_tasks_overdue").notNull().default(0),
  average_completion_time_minutes: integer("average_completion_time_minutes").notNull().default(0),
  total_costs: integer("total_costs").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const user_activity_log = pgTable("user_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull(),
  user_name: text("user_name").notNull(),
  action: text("action").notNull(),
  entity_type: varchar("entity_type"), // task, user, room, etc.
  entity_id: varchar("entity_id"),
  details: jsonb("details"),
  ip_address: varchar("ip_address"),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const user_sessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull(),
  token: text("token").notNull().unique(),
  device_info: text("device_info"),
  ip_address: varchar("ip_address"),
  is_active: boolean("is_active").notNull().default(true),
  last_activity_at: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const work_sessions = pgTable("work_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull(),
  user_name: text("user_name").notNull(),
  shift_type: varchar("shift_type").notNull(), // morning, afternoon, night
  started_at: timestamp("started_at", { withTimezone: true }).notNull(),
  ended_at: timestamp("ended_at", { withTimezone: true }),
  break_duration_minutes: integer("break_duration_minutes").notNull().default(0),
  tasks_completed: integer("tasks_completed").notNull().default(0),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inventory_requests = pgTable("inventory_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requested_by: varchar("requested_by").notNull(),
  requested_by_name: text("requested_by_name").notNull(),
  item_id: varchar("item_id").notNull(),
  item_name: text("item_name").notNull(),
  quantity_requested: integer("quantity_requested").notNull(),
  reason: text("reason"),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected, fulfilled
  approved_by: varchar("approved_by"),
  approved_at: timestamp("approved_at", { withTimezone: true }),
  fulfilled_at: timestamp("fulfilled_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inventory_transactions = pgTable("inventory_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  item_id: varchar("item_id").notNull(),
  item_name: text("item_name").notNull(),
  transaction_type: varchar("transaction_type").notNull(), // in, out, adjustment, transfer
  quantity: integer("quantity").notNull(),
  quantity_before: integer("quantity_before").notNull(),
  quantity_after: integer("quantity_after").notNull(),
  reason: text("reason"),
  reference_type: varchar("reference_type"), // task, request, manual
  reference_id: varchar("reference_id"),
  performed_by: varchar("performed_by").notNull(),
  performed_by_name: text("performed_by_name").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// =============================================
// HOUSEKEEPING TABLES
// =============================================

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  room_number: varchar("room_number").notNull().unique(),
  floor: integer("floor").notNull(),
  category: varchar("category").notNull().default("standard"), // standard, superior, deluxe, suite, apartment
  status: varchar("status").notNull().default("clean"), // clean, dirty, in_cleaning, inspected, out_of_order, do_not_disturb
  occupancy_status: varchar("occupancy_status").notNull().default("vacant"), // vacant, occupied, checkout, checkin_expected, checkout_expected
  assigned_housekeeper_id: varchar("assigned_housekeeper_id"),
  assigned_housekeeper_name: text("assigned_housekeeper_name"),
  last_cleaned_at: timestamp("last_cleaned_at", { withTimezone: true }),
  last_inspected_at: timestamp("last_inspected_at", { withTimezone: true }),
  last_inspected_by: varchar("last_inspected_by"),
  guest_name: text("guest_name"),
  guest_count: integer("guest_count").default(1),
  guest_phone: varchar("guest_phone"),
  guest_email: varchar("guest_email"),
  checkout_date: timestamp("checkout_date", { withTimezone: true }),
  checkin_date: timestamp("checkin_date", { withTimezone: true }),
  notes: text("notes"),
  priority_score: integer("priority_score").notNull().default(0),
  has_minibar: boolean("has_minibar").notNull().default(true),
  needs_minibar_check: boolean("needs_minibar_check").notNull().default(false),
  bed_type: varchar("bed_type").default("double"), // single, double, twin, king, queen
  max_occupancy: integer("max_occupancy").notNull().default(2),
  // Dynamic QR code token - changes on each check-in, invalidated on check-out
  guest_session_token: varchar("guest_session_token"),
  token_created_at: timestamp("token_created_at", { withTimezone: true }),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const room_status_history = pgTable("room_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  room_id: varchar("room_id").notNull(),
  status_from: varchar("status_from").notNull(),
  status_to: varchar("status_to").notNull(),
  changed_by: varchar("changed_by").notNull(),
  changed_by_name: text("changed_by_name").notNull(),
  notes: text("notes"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

// Guest requests via QR code - submitted by guests without login
export const guest_service_requests = pgTable("guest_service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  room_id: varchar("room_id").notNull(),
  room_number: varchar("room_number").notNull(),
  session_token: varchar("session_token").notNull(), // Token used to submit request
  request_type: varchar("request_type").notNull(), // maintenance, housekeeping, amenities, other
  category: varchar("category"), // For maintenance: plumbing, electrical, hvac, etc.
  description: text("description").notNull(),
  guest_name: text("guest_name"),
  guest_phone: varchar("guest_phone"),
  priority: varchar("priority").notNull().default("normal"), // low, normal, urgent
  status: varchar("status").notNull().default("new"), // new, seen, in_progress, completed, cancelled
  assigned_to: varchar("assigned_to"),
  assigned_to_name: text("assigned_to_name"),
  images: text("images").array(),
  staff_notes: text("staff_notes"),
  resolved_at: timestamp("resolved_at", { withTimezone: true }),
  resolved_by: varchar("resolved_by"),
  // Forwarding fields
  forwarded_to_department: varchar("forwarded_to_department"), // 'housekeeping' or 'maintenance'
  forwarded_at: timestamp("forwarded_at", { withTimezone: true }),
  forwarded_by: varchar("forwarded_by"),
  forwarded_by_name: text("forwarded_by_name"),
  linked_task_id: varchar("linked_task_id"), // Links to tasks table for maintenance
  linked_housekeeping_task_id: varchar("linked_housekeeping_task_id"), // Links to housekeeping_tasks
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Guest request messages - chat between guest and staff
export const guest_request_messages = pgTable("guest_request_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  request_id: varchar("request_id").notNull(),
  sender_type: varchar("sender_type").notNull(), // 'guest' or 'staff'
  sender_id: varchar("sender_id"), // NULL for guest, user_id for staff
  sender_name: text("sender_name").notNull(),
  message: text("message").notNull(),
  is_read: boolean("is_read").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const housekeeping_tasks = pgTable("housekeeping_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  room_id: varchar("room_id").notNull(),
  room_number: varchar("room_number").notNull(),
  cleaning_type: varchar("cleaning_type").notNull().default("daily"), // daily, checkout, deep_clean, turndown, touch_up
  assigned_to: varchar("assigned_to"),
  assigned_to_name: text("assigned_to_name"),
  supervisor_id: varchar("supervisor_id"),
  supervisor_name: text("supervisor_name"),
  status: varchar("status").notNull().default("pending"), // pending, in_progress, completed, inspected, needs_rework
  priority: varchar("priority").notNull().default("normal"),
  scheduled_date: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  started_at: timestamp("started_at", { withTimezone: true }),
  completed_at: timestamp("completed_at", { withTimezone: true }),
  inspected_at: timestamp("inspected_at", { withTimezone: true }),
  inspection_notes: text("inspection_notes"),
  inspection_passed: boolean("inspection_passed"),
  guest_requests: text("guest_requests"),
  minibar_items_used: text("minibar_items_used").array(),
  linens_changed: boolean("linens_changed").notNull().default(false),
  towels_changed: boolean("towels_changed").notNull().default(false),
  amenities_restocked: boolean("amenities_restocked").notNull().default(false),
  issues_found: text("issues_found"),
  images: text("images").array(),
  time_spent_minutes: integer("time_spent_minutes").notNull().default(0),
  notification_sent_at: timestamp("notification_sent_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inventory_items = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: varchar("category").notNull(), // linen, amenity, minibar, cleaning_supply
  unit: varchar("unit").notNull().default("kom"), // kom, pakovanje, litar, etc.
  current_stock: integer("current_stock").notNull().default(0),
  minimum_stock: integer("minimum_stock").notNull().default(10),
  reorder_quantity: integer("reorder_quantity").notNull().default(50),
  cost_per_unit: integer("cost_per_unit").notNull().default(0), // u centima/feninga
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const room_inventory = pgTable("room_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  room_id: varchar("room_id").notNull(),
  item_id: varchar("item_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  last_restocked_at: timestamp("last_restocked_at", { withTimezone: true }),
  last_restocked_by: varchar("last_restocked_by"),
});

export const usersRelations = relations(users, ({ many }) => ({
  createdTasks: many(tasks, { relationName: "created_by" }),
  notifications: many(notifications),
  taskHistoryChanges: many(task_history),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  creator: one(users, {
    fields: [tasks.created_by],
    references: [users.id],
    relationName: "created_by",
  }),
  parentTask: one(tasks, {
    fields: [tasks.parent_task_id],
    references: [tasks.id],
    relationName: "recurring_tasks",
  }),
  childTasks: many(tasks, { relationName: "recurring_tasks" }),
  history: many(task_history),
  notifications: many(notifications),
}));

export const taskHistoryRelations = relations(task_history, ({ one }) => ({
  task: one(tasks, {
    fields: [task_history.task_id],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [task_history.user_id],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [notifications.task_id],
    references: [tasks.id],
  }),
}));

// Housekeeping relations
export const roomsRelations = relations(rooms, ({ one, many }) => ({
  assignedHousekeeper: one(users, {
    fields: [rooms.assigned_housekeeper_id],
    references: [users.id],
  }),
  statusHistory: many(room_status_history),
  housekeepingTasks: many(housekeeping_tasks),
  inventory: many(room_inventory),
}));

export const roomStatusHistoryRelations = relations(room_status_history, ({ one }) => ({
  room: one(rooms, {
    fields: [room_status_history.room_id],
    references: [rooms.id],
  }),
  changedByUser: one(users, {
    fields: [room_status_history.changed_by],
    references: [users.id],
  }),
}));

export const housekeepingTasksRelations = relations(housekeeping_tasks, ({ one }) => ({
  room: one(rooms, {
    fields: [housekeeping_tasks.room_id],
    references: [rooms.id],
  }),
  assignedHousekeeper: one(users, {
    fields: [housekeeping_tasks.assigned_to],
    references: [users.id],
  }),
  supervisor: one(users, {
    fields: [housekeeping_tasks.supervisor_id],
    references: [users.id],
  }),
}));

export const inventoryItemsRelations = relations(inventory_items, ({ many }) => ({
  roomInventory: many(room_inventory),
}));

export const roomInventoryRelations = relations(room_inventory, ({ one }) => ({
  room: one(rooms, {
    fields: [room_inventory.room_id],
    references: [rooms.id],
  }),
  item: one(inventory_items, {
    fields: [room_inventory.item_id],
    references: [inventory_items.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertUserDeviceTokenSchema = createInsertSchema(user_device_tokens);
export const insertTaskSchema = createInsertSchema(tasks);
export const insertTaskHistorySchema = createInsertSchema(task_history);
export const insertNotificationSchema = createInsertSchema(notifications);
export const insertRoomSchema = createInsertSchema(rooms);
export const insertRoomStatusHistorySchema = createInsertSchema(room_status_history);
export const insertGuestServiceRequestSchema = createInsertSchema(guest_service_requests);
export const insertGuestRequestMessageSchema = createInsertSchema(guest_request_messages);
export const insertHousekeepingTaskSchema = createInsertSchema(housekeeping_tasks);
export const insertInventoryItemSchema = createInsertSchema(inventory_items);
export const insertRoomInventorySchema = createInsertSchema(room_inventory);

// New table schemas
export const insertDepartmentSchema = createInsertSchema(departments);
export const insertExternalCompanySchema = createInsertSchema(external_companies);
export const insertGuestReportSchema = createInsertSchema(guest_reports);
export const insertMaintenancePlanSchema = createInsertSchema(maintenance_plans);
export const insertServiceRatingSchema = createInsertSchema(service_ratings);
export const insertTaskAssignmentSchema = createInsertSchema(task_assignments);
export const insertTaskCostSchema = createInsertSchema(task_costs);
export const insertTaskMessageSchema = createInsertSchema(task_messages);
export const insertTaskPhotoSchema = createInsertSchema(task_photos);
export const insertTaskTemplateSchema = createInsertSchema(task_templates);
export const insertTaskTimelineSchema = createInsertSchema(task_timeline);
export const insertDailyStatsSchema = createInsertSchema(daily_stats);
export const insertUserActivityLogSchema = createInsertSchema(user_activity_log);
export const insertUserSessionSchema = createInsertSchema(user_sessions);
export const insertWorkSessionSchema = createInsertSchema(work_sessions);
export const insertInventoryRequestSchema = createInsertSchema(inventory_requests);
export const insertInventoryTransactionSchema = createInsertSchema(inventory_transactions);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUserDeviceToken = z.infer<typeof insertUserDeviceTokenSchema>;
export type UserDeviceToken = typeof user_device_tokens.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTaskHistory = z.infer<typeof insertTaskHistorySchema>;
export type TaskHistory = typeof task_history.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoomStatusHistory = z.infer<typeof insertRoomStatusHistorySchema>;
export type RoomStatusHistory = typeof room_status_history.$inferSelect;
export type InsertGuestServiceRequest = z.infer<typeof insertGuestServiceRequestSchema>;
export type GuestServiceRequest = typeof guest_service_requests.$inferSelect;
export type InsertGuestRequestMessage = z.infer<typeof insertGuestRequestMessageSchema>;
export type GuestRequestMessage = typeof guest_request_messages.$inferSelect;
export type InsertHousekeepingTask = z.infer<typeof insertHousekeepingTaskSchema>;
export type HousekeepingTask = typeof housekeeping_tasks.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventory_items.$inferSelect;
export type InsertRoomInventory = z.infer<typeof insertRoomInventorySchema>;
export type RoomInventory = typeof room_inventory.$inferSelect;

// New types
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertExternalCompany = z.infer<typeof insertExternalCompanySchema>;
export type ExternalCompany = typeof external_companies.$inferSelect;
export type InsertGuestReport = z.infer<typeof insertGuestReportSchema>;
export type GuestReport = typeof guest_reports.$inferSelect;
export type InsertMaintenancePlan = z.infer<typeof insertMaintenancePlanSchema>;
export type MaintenancePlan = typeof maintenance_plans.$inferSelect;
export type InsertServiceRating = z.infer<typeof insertServiceRatingSchema>;
export type ServiceRating = typeof service_ratings.$inferSelect;
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;
export type TaskAssignment = typeof task_assignments.$inferSelect;
export type InsertTaskCost = z.infer<typeof insertTaskCostSchema>;
export type TaskCost = typeof task_costs.$inferSelect;
export type InsertTaskMessage = z.infer<typeof insertTaskMessageSchema>;
export type TaskMessage = typeof task_messages.$inferSelect;
export type InsertTaskPhoto = z.infer<typeof insertTaskPhotoSchema>;
export type TaskPhoto = typeof task_photos.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;
export type TaskTemplate = typeof task_templates.$inferSelect;
export type InsertTaskTimeline = z.infer<typeof insertTaskTimelineSchema>;
export type TaskTimeline = typeof task_timeline.$inferSelect;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;
export type DailyStats = typeof daily_stats.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type UserActivityLog = typeof user_activity_log.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof user_sessions.$inferSelect;
export type InsertWorkSession = z.infer<typeof insertWorkSessionSchema>;
export type WorkSession = typeof work_sessions.$inferSelect;
export type InsertInventoryRequest = z.infer<typeof insertInventoryRequestSchema>;
export type InventoryRequest = typeof inventory_requests.$inferSelect;
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InventoryTransaction = typeof inventory_transactions.$inferSelect;
