import { supabase } from "./lib/supabase";
import {
  type User,
  type InsertUser,
  type Task,
  type InsertTask,
  type TaskHistory,
  type InsertTaskHistory,
  type Notification,
  type InsertNotification,
  type UserDeviceToken,
  type InsertUserDeviceToken,
  type Room,
  type InsertRoom,
  type RoomStatusHistory,
  type InsertRoomStatusHistory,
  type HousekeepingTask,
  type InsertHousekeepingTask,
  type InventoryItem,
  type InsertInventoryItem,
  type RoomInventory,
  type InsertRoomInventory,
  type GuestServiceRequest,
  type InsertGuestServiceRequest,
  type GuestRequestMessage,
  type InsertGuestRequestMessage
} from "@shared/schema";

export interface IStorage {
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser>): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsers(): Promise<User[]>;
  getTechnicians(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  getTasks(): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | undefined>;
  getTasksByUserId(userId: string): Promise<Task[]>;
  getRecurringTasks(): Promise<Task[]>;
  getChildTasksByParentId(parentId: string): Promise<Task[]>;
  getTasksScheduledBetween(startDate: string, endDate: string): Promise<Task[]>;
  createTask(task: Partial<InsertTask>): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  
  createTaskHistory(history: Partial<InsertTaskHistory>): Promise<TaskHistory>;
  getTaskHistory(taskId: string): Promise<TaskHistory[]>;
  getTaskHistoriesForTasks(taskIds: string[]): Promise<TaskHistory[]>;
  
  createNotification(notification: Partial<InsertNotification>): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  saveDeviceToken(token: Partial<InsertUserDeviceToken>): Promise<UserDeviceToken>;
  getDeviceTokensForUser(userId: string): Promise<UserDeviceToken[]>;
  deactivateDeviceToken(fcmToken: string): Promise<void>;

  // Housekeeping - Rooms
  getRooms(): Promise<Room[]>;
  getRoomById(id: string): Promise<Room | undefined>;
  getRoomByNumber(roomNumber: string): Promise<Room | undefined>;
  getRoomsByFloor(floor: number): Promise<Room[]>;
  getRoomsByStatus(status: string): Promise<Room[]>;
  createRoom(room: Partial<InsertRoom>): Promise<Room>;
  updateRoom(id: string, data: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<boolean>;

  // Housekeeping - Room Status History
  createRoomStatusHistory(history: Partial<InsertRoomStatusHistory>): Promise<RoomStatusHistory>;
  getRoomStatusHistory(roomId: string): Promise<RoomStatusHistory[]>;

  // Housekeeping - Tasks
  getHousekeepingTasks(): Promise<HousekeepingTask[]>;
  getHousekeepingTaskById(id: string): Promise<HousekeepingTask | undefined>;
  getHousekeepingTasksByRoom(roomId: string): Promise<HousekeepingTask[]>;
  getHousekeepingTasksByAssignee(userId: string): Promise<HousekeepingTask[]>;
  getHousekeepingTasksByDate(date: string): Promise<HousekeepingTask[]>;
  createHousekeepingTask(task: Partial<InsertHousekeepingTask>): Promise<HousekeepingTask>;
  updateHousekeepingTask(id: string, data: Partial<HousekeepingTask>): Promise<HousekeepingTask | undefined>;
  deleteHousekeepingTask(id: string): Promise<boolean>;

  // Housekeeping - Inventory
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemById(id: string): Promise<InventoryItem | undefined>;
  getInventoryItemsByCategory(category: string): Promise<InventoryItem[]>;
  getLowStockItems(): Promise<InventoryItem[]>;
  createInventoryItem(item: Partial<InsertInventoryItem>): Promise<InventoryItem>;
  updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;

  // Housekeeping - Room Inventory
  getRoomInventory(roomId: string): Promise<RoomInventory[]>;
  updateRoomInventory(roomId: string, itemId: string, quantity: number, userId: string): Promise<RoomInventory>;

  // Guest Service Requests (QR code system)
  createGuestServiceRequest(request: Partial<InsertGuestServiceRequest>): Promise<GuestServiceRequest>;
  getGuestServiceRequests(filters?: { status?: string; roomId?: string; request_type?: string }): Promise<GuestServiceRequest[]>;
  getGuestServiceRequestById(id: string): Promise<GuestServiceRequest | undefined>;
  getGuestServiceRequestsByRoom(roomId: string): Promise<GuestServiceRequest[]>;
  getGuestServiceRequestsByToken(sessionToken: string): Promise<GuestServiceRequest[]>;
  updateGuestServiceRequest(id: string, data: Partial<GuestServiceRequest>): Promise<GuestServiceRequest | undefined>;
  getPendingGuestRequestCounts(): Promise<Record<string, number>>;

  // Guest Request Messages (chat between guest and staff)
  createGuestRequestMessage(message: Partial<InsertGuestRequestMessage>): Promise<GuestRequestMessage>;
  getGuestRequestMessages(requestId: string): Promise<GuestRequestMessage[]>;
  markGuestRequestMessagesAsRead(requestId: string, senderType: 'guest' | 'staff'): Promise<void>;
}

export class SupabaseStorage implements IStorage {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data as User;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data as User;
  }

  async createUser(userData: Partial<InsertUser>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    console.log(`[STORAGE] updateUser called with id: ${id}, data keys: ${Object.keys(data).join(', ')}`);
    
    const { data: updated, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`[STORAGE] updateUser error for ${id}:`, error);
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    
    console.log(`[STORAGE] updateUser success for ${id}, returning user with fcm_token: ${updated?.fcm_token ? 'YES' : 'NO'}`);
    return updated as User;
  }

  async deleteUser(id: string): Promise<boolean> {
    // Soft delete: mark user as inactive instead of deleting
    // This preserves all foreign key references in tasks and task_history
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) {
      console.error('[STORAGE] Error deactivating user:', error);
      return false;
    }
    return true;
  }

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as User[];
  }

  async getTechnicians(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['serviser', 'radnik'])
      .eq('is_active', true)
      .order('full_name', { ascending: true });
    
    if (error) throw error;
    return (data || []) as User[];
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .eq('is_active', true);
    
    if (error) throw error;
    return (data || []) as User[];
  }

  async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Task[];
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return data as Task;
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Task[];
  }

  async getRecurringTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_recurring', true)
      .not('next_occurrence', 'is', null)
      .neq('recurrence_pattern', 'once');
    
    if (error) throw error;
    return (data || []) as Task[];
  }

  async getChildTasksByParentId(parentId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_task_id', parentId);
    
    if (error) throw error;
    return (data || []) as Task[];
  }

  async getTasksScheduledBetween(startDate: string, endDate: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .gte('scheduled_for', startDate)
      .lt('scheduled_for', endDate);
    
    if (error) throw error;
    return (data || []) as Task[];
  }

  async createTask(taskData: Partial<InsertTask>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Task;
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | undefined> {
    const { data: updated, error } = await supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return updated as Task;
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async createTaskHistory(historyData: Partial<InsertTaskHistory>): Promise<TaskHistory> {
    const { data, error } = await supabase
      .from('task_history')
      .insert(historyData)
      .select()
      .single();
    
    if (error) throw error;
    return data as TaskHistory;
  }

  async getTaskHistory(taskId: string): Promise<TaskHistory[]> {
    const { data, error } = await supabase
      .from('task_history')
      .select('*')
      .eq('task_id', taskId)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return (data || []) as TaskHistory[];
  }

  async getTaskHistoriesForTasks(taskIds: string[]): Promise<TaskHistory[]> {
    if (taskIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('task_history')
      .select('*')
      .in('task_id', taskIds)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    return (data || []) as TaskHistory[];
  }

  async createNotification(notificationData: Partial<InsertNotification>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();
    
    if (error) throw error;
    return data as Notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Notification[];
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  async saveDeviceToken(token: {
    user_id: string;
    fcm_token: string;
    platform?: string;
  }): Promise<UserDeviceToken> {
    console.log(`[STORAGE] saveDeviceToken called - user: ${token.user_id.substring(0, 8)}..., platform: ${token.platform}, token length: ${token.fcm_token.length}`);
    
    // STEP 1: Device Token Invalidation - Deactivate ALL other users with same FCM token
    // This ensures only the currently logged-in user receives notifications on shared devices
    console.log(`[STORAGE] Deactivating other users with same FCM token: ${token.fcm_token.substring(0, 20)}...`);
    const { error: deactivateError } = await supabase
      .from('user_device_tokens')
      .update({ is_active: false })
      .eq('fcm_token', token.fcm_token)
      .neq('user_id', token.user_id);
    
    if (deactivateError) {
      console.error(`[STORAGE] Error deactivating other tokens:`, deactivateError);
      // Continue anyway - this is not critical for current user's token save
    } else {
      console.log(`[STORAGE] Successfully deactivated other users' tokens on this device`);
    }
    
    // STEP 2: Save/update token for current user with is_active=true
    const { data, error } = await supabase
      .from('user_device_tokens')
      .upsert({
        user_id: token.user_id,
        fcm_token: token.fcm_token,
        platform: token.platform || 'web',
        last_updated: new Date().toISOString(),
        is_active: true,
      }, { onConflict: 'user_id,fcm_token,platform' })
      .select()
      .single();
    
    if (error) {
      console.error(`[STORAGE] saveDeviceToken error:`, error);
      throw error;
    }
    
    console.log(`[STORAGE] Device token saved successfully - ID: ${data.id}, user is now the ONLY active user on this device`);
    return data as UserDeviceToken;
  }

  async getDeviceTokensForUser(userId: string): Promise<UserDeviceToken[]> {
    console.log(`[STORAGE] getDeviceTokensForUser called - user: ${userId.substring(0, 8)}...`);
    
    const { data, error } = await supabase
      .from('user_device_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      console.error(`[STORAGE] getDeviceTokensForUser error:`, error);
      throw error;
    }
    
    console.log(`[STORAGE] Found ${data?.length || 0} active tokens for user`);
    return (data || []) as UserDeviceToken[];
  }

  async deactivateDeviceToken(fcmToken: string): Promise<void> {
    const { error } = await supabase
      .from('user_device_tokens')
      .update({ is_active: false })
      .eq('fcm_token', fcmToken);

    if (error) throw error;
  }

  // =============================================
  // HOUSEKEEPING - ROOMS
  // =============================================

  async getRooms(): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('floor', { ascending: true })
      .order('room_number', { ascending: true });

    if (error) throw error;
    return (data || []) as Room[];
  }

  async getRoomById(id: string): Promise<Room | undefined> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Room;
  }

  async getRoomByNumber(roomNumber: string): Promise<Room | undefined> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_number', roomNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as Room;
  }

  async getRoomsByFloor(floor: number): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('floor', floor)
      .eq('is_active', true)
      .order('room_number', { ascending: true });

    if (error) throw error;
    return (data || []) as Room[];
  }

  async getRoomsByStatus(status: string): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', status)
      .eq('is_active', true)
      .order('priority_score', { ascending: false });

    if (error) throw error;
    return (data || []) as Room[];
  }

  async createRoom(roomData: Partial<InsertRoom>): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .insert(roomData)
      .select()
      .single();

    if (error) throw error;
    return data as Room;
  }

  async updateRoom(id: string, data: Partial<Room>): Promise<Room | undefined> {
    const updateData = { ...data, updated_at: new Date().toISOString() };
    const { data: updated, error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return updated as Room;
  }

  async deleteRoom(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('[STORAGE] Error deactivating room:', error);
      return false;
    }
    return true;
  }

  // =============================================
  // HOUSEKEEPING - ROOM STATUS HISTORY
  // =============================================

  async createRoomStatusHistory(historyData: Partial<InsertRoomStatusHistory>): Promise<RoomStatusHistory> {
    const { data, error } = await supabase
      .from('room_status_history')
      .insert(historyData)
      .select()
      .single();

    if (error) throw error;
    return data as RoomStatusHistory;
  }

  async getRoomStatusHistory(roomId: string): Promise<RoomStatusHistory[]> {
    const { data, error } = await supabase
      .from('room_status_history')
      .select('*')
      .eq('room_id', roomId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return (data || []) as RoomStatusHistory[];
  }

  // =============================================
  // HOUSEKEEPING - TASKS
  // =============================================

  async getHousekeepingTasks(): Promise<HousekeepingTask[]> {
    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .select('*')
      .order('scheduled_date', { ascending: true })
      .order('priority', { ascending: false });

    if (error) throw error;
    return (data || []) as HousekeepingTask[];
  }

  async getHousekeepingTaskById(id: string): Promise<HousekeepingTask | undefined> {
    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as HousekeepingTask;
  }

  async getHousekeepingTasksByRoom(roomId: string): Promise<HousekeepingTask[]> {
    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .select('*')
      .eq('room_id', roomId)
      .order('scheduled_date', { ascending: false });

    if (error) throw error;
    return (data || []) as HousekeepingTask[];
  }

  async getHousekeepingTasksByAssignee(userId: string): Promise<HousekeepingTask[]> {
    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .select('*')
      .eq('assigned_to', userId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return (data || []) as HousekeepingTask[];
  }

  async getHousekeepingTasksByDate(date: string): Promise<HousekeepingTask[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .select('*')
      .gte('scheduled_date', startOfDay.toISOString())
      .lte('scheduled_date', endOfDay.toISOString())
      .order('priority', { ascending: false });

    if (error) throw error;
    return (data || []) as HousekeepingTask[];
  }

  async createHousekeepingTask(taskData: Partial<InsertHousekeepingTask>): Promise<HousekeepingTask> {
    const { data, error } = await supabase
      .from('housekeeping_tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) throw error;
    return data as HousekeepingTask;
  }

  async updateHousekeepingTask(id: string, data: Partial<HousekeepingTask>): Promise<HousekeepingTask | undefined> {
    const updateData = { ...data, updated_at: new Date().toISOString() };
    const { data: updated, error } = await supabase
      .from('housekeeping_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return updated as HousekeepingTask;
  }

  async deleteHousekeepingTask(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('housekeeping_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[STORAGE] Error deleting housekeeping task:', error);
      return false;
    }
    return true;
  }

  // =============================================
  // HOUSEKEEPING - INVENTORY
  // =============================================

  async getInventoryItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as InventoryItem[];
  }

  async getInventoryItemById(id: string): Promise<InventoryItem | undefined> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as InventoryItem;
  }

  async getInventoryItemsByCategory(category: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as InventoryItem[];
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    // Filter items where current_stock <= minimum_stock
    const lowStock = (data || []).filter(
      (item: any) => item.current_stock <= item.minimum_stock
    );
    return lowStock as InventoryItem[];
  }

  async createInventoryItem(itemData: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(itemData)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryItem;
  }

  async updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const updateData = { ...data, updated_at: new Date().toISOString() };
    const { data: updated, error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return updated as InventoryItem;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('inventory_items')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('[STORAGE] Error deactivating inventory item:', error);
      return false;
    }
    return true;
  }

  // =============================================
  // HOUSEKEEPING - ROOM INVENTORY
  // =============================================

  async getRoomInventory(roomId: string): Promise<RoomInventory[]> {
    const { data, error } = await supabase
      .from('room_inventory')
      .select('*')
      .eq('room_id', roomId);

    if (error) throw error;
    return (data || []) as RoomInventory[];
  }

  async updateRoomInventory(roomId: string, itemId: string, quantity: number, userId: string): Promise<RoomInventory> {
    // Try to update existing record
    const { data: existing } = await supabase
      .from('room_inventory')
      .select('*')
      .eq('room_id', roomId)
      .eq('item_id', itemId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('room_inventory')
        .update({
          quantity,
          last_restocked_at: new Date().toISOString(),
          last_restocked_by: userId
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data as RoomInventory;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('room_inventory')
        .insert({
          room_id: roomId,
          item_id: itemId,
          quantity,
          last_restocked_at: new Date().toISOString(),
          last_restocked_by: userId
        })
        .select()
        .single();

      if (error) throw error;
      return data as RoomInventory;
    }
  }

  // =============================================
  // GUEST SERVICE REQUESTS (QR CODE SYSTEM)
  // =============================================

  async createGuestServiceRequest(requestData: Partial<InsertGuestServiceRequest>): Promise<GuestServiceRequest> {
    const { data, error } = await supabase
      .from('guest_service_requests')
      .insert(requestData)
      .select()
      .single();

    if (error) throw error;
    return data as GuestServiceRequest;
  }

  async getGuestServiceRequests(filters?: { status?: string; roomId?: string; request_type?: string; forwarded_to_department?: string }): Promise<GuestServiceRequest[]> {
    let query = supabase
      .from('guest_service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.roomId) {
      query = query.eq('room_id', filters.roomId);
    }
    if (filters?.request_type) {
      query = query.eq('request_type', filters.request_type);
    }
    if (filters?.forwarded_to_department) {
      query = query.eq('forwarded_to_department', filters.forwarded_to_department);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as GuestServiceRequest[];
  }

  async getGuestServiceRequestById(id: string): Promise<GuestServiceRequest | undefined> {
    const { data, error } = await supabase
      .from('guest_service_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return data as GuestServiceRequest;
  }

  async getGuestServiceRequestsByRoom(roomId: string): Promise<GuestServiceRequest[]> {
    const { data, error } = await supabase
      .from('guest_service_requests')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as GuestServiceRequest[];
  }

  async updateGuestServiceRequest(id: string, data: Partial<GuestServiceRequest>): Promise<GuestServiceRequest | undefined> {
    const updateData = { ...data, updated_at: new Date().toISOString() };
    const { data: updated, error } = await supabase
      .from('guest_service_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      throw error;
    }
    return updated as GuestServiceRequest;
  }

  async getPendingGuestRequestCounts(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('guest_service_requests')
      .select('room_id')
      .in('status', ['new', 'seen', 'in_progress']);

    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.room_id] = (counts[row.room_id] || 0) + 1;
    }
    return counts;
  }

  async getGuestServiceRequestsByToken(sessionToken: string): Promise<GuestServiceRequest[]> {
    const { data, error } = await supabase
      .from('guest_service_requests')
      .select('*')
      .eq('session_token', sessionToken)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as GuestServiceRequest[];
  }

  // Guest Request Messages methods
  async createGuestRequestMessage(message: Partial<InsertGuestRequestMessage>): Promise<GuestRequestMessage> {
    const { data, error } = await supabase
      .from('guest_request_messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data as GuestRequestMessage;
  }

  async getGuestRequestMessages(requestId: string): Promise<GuestRequestMessage[]> {
    const { data, error } = await supabase
      .from('guest_request_messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as GuestRequestMessage[];
  }

  async markGuestRequestMessagesAsRead(requestId: string, senderType: 'guest' | 'staff'): Promise<void> {
    const { error } = await supabase
      .from('guest_request_messages')
      .update({ is_read: true })
      .eq('request_id', requestId)
      .eq('sender_type', senderType);

    if (error) throw error;
  }
}

export const storage = new SupabaseStorage();
