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
  checkout_date: timestamp("checkout_date", { withTimezone: true }),
  checkin_date: timestamp("checkin_date", { withTimezone: true }),
  notes: text("notes"),
  priority_score: integer("priority_score").notNull().default(0),
  has_minibar: boolean("has_minibar").notNull().default(true),
  needs_minibar_check: boolean("needs_minibar_check").notNull().default(false),
  bed_type: varchar("bed_type").default("double"), // single, double, twin, king, queen
  max_occupancy: integer("max_occupancy").notNull().default(2),
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
export const insertHousekeepingTaskSchema = createInsertSchema(housekeeping_tasks);
export const insertInventoryItemSchema = createInsertSchema(inventory_items);
export const insertRoomInventorySchema = createInsertSchema(room_inventory);

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
export type InsertHousekeepingTask = z.infer<typeof insertHousekeepingTaskSchema>;
export type HousekeepingTask = typeof housekeeping_tasks.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventory_items.$inferSelect;
export type InsertRoomInventory = z.infer<typeof insertRoomInventorySchema>;
export type RoomInventory = typeof room_inventory.$inferSelect;
