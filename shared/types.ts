// Database types for hotel task management

export type UserRole = 'admin' | 'recepcioner' | 'operater' | 'radnik' | 'sef' | 'serviser' | 'menadzer' | 'sobarica' | 'sef_domacinstva';
export type Department = 'recepcija' | 'restoran' | 'bazen' | 'domacinstvo' | 'tehnicka' | 'eksterni';
export type Priority = 'urgent' | 'normal' | 'can_wait';

// Housekeeping types
export type RoomStatus = 'clean' | 'dirty' | 'in_cleaning' | 'inspected' | 'out_of_order' | 'do_not_disturb';
export type RoomCategory = 'standard' | 'superior' | 'deluxe' | 'suite' | 'apartment';
export type OccupancyStatus = 'vacant' | 'occupied' | 'checkout' | 'checkin_expected' | 'checkout_expected';
export type CleaningType = 'daily' | 'checkout' | 'deep_clean' | 'turndown' | 'touch_up';
export type TaskStatus = 
  | 'new' 
  | 'with_operator' 
  | 'assigned_to_radnik' 
  | 'with_sef' 
  | 'with_external' 
  | 'returned_to_operator' 
  | 'returned_to_sef' 
  | 'completed' 
  | 'cancelled';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  department: Department;
  phone?: string;
  company_name?: string;
  is_active: boolean;
  first_login: boolean;
  notification_preference: 'instant' | 'hourly' | 'daily';
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  location?: string;
  room_number?: string;
  priority: Priority;
  status: TaskStatus;
  created_by: string;
  created_by_name: string;
  created_by_department: string;
  operator_id?: string;
  operator_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_type?: 'radnik' | 'serviser';
  receipt_confirmed_at?: string;
  receipt_confirmed_by?: string;
  receipt_confirmed_by_name?: string;
  sef_id?: string;
  sef_name?: string;
  external_company_id?: string;
  external_company_name?: string;
  deadline_at?: string;
  is_overdue: boolean;
  estimated_arrival_time?: string;
  actual_arrival_time?: string;
  estimated_completion_time?: string;
  actual_completion_time?: string;
  time_spent_minutes: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  completed_by?: string;
  completed_by_name?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  cancelled_by_name?: string;
  cancellation_reason?: string;
  images?: string[];
  is_recurring?: boolean;
  recurrence_pattern?: string;
  next_occurrence?: string;
  parent_task_id?: string;
  worker_report?: string;
  worker_images?: string[];
}

export interface Notification {
  id: string;
  user_id: string;
  task_id?: string;
  title: string;
  message: string;
  type: 'task_created' | 'task_assigned' | 'task_returned' | 'task_completed' | 'info' | 'warning';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  created_at: string;
}

export interface TaskTimeline {
  id: string;
  task_id: string;
  timestamp: string;
  user_name: string;
  user_role: string;
  action_type: string;
  action_description: string;
}

export interface ExternalCompany {
  id: string;
  company_name: string;
  service_type: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  average_rating: number;
  total_jobs: number;
  is_active: boolean;
  created_at: string;
}

// Housekeeping interfaces
export interface Room {
  id: string;
  room_number: string;
  floor: number;
  category: RoomCategory;
  status: RoomStatus;
  occupancy_status: OccupancyStatus;
  assigned_housekeeper_id?: string;
  assigned_housekeeper_name?: string;
  last_cleaned_at?: string;
  last_inspected_at?: string;
  last_inspected_by?: string;
  guest_name?: string;
  checkout_date?: string;
  checkin_date?: string;
  notes?: string;
  priority_score: number;
  has_minibar: boolean;
  needs_minibar_check: boolean;
  bed_type: string;
  max_occupancy: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomStatusHistory {
  id: string;
  room_id: string;
  status_from: RoomStatus;
  status_to: RoomStatus;
  changed_by: string;
  changed_by_name: string;
  notes?: string;
  timestamp: string;
}

export interface HousekeepingTask {
  id: string;
  room_id: string;
  room_number: string;
  cleaning_type: CleaningType;
  assigned_to?: string;
  assigned_to_name?: string;
  supervisor_id?: string;
  supervisor_name?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'inspected' | 'needs_rework';
  priority: Priority;
  scheduled_date: string;
  started_at?: string;
  completed_at?: string;
  inspected_at?: string;
  inspection_notes?: string;
  inspection_passed?: boolean;
  guest_requests?: string;
  minibar_items_used?: string[];
  linens_changed: boolean;
  towels_changed: boolean;
  amenities_restocked: boolean;
  issues_found?: string;
  images?: string[];
  time_spent_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'linen' | 'amenity' | 'minibar' | 'cleaning_supply';
  unit: string;
  current_stock: number;
  minimum_stock: number;
  reorder_quantity: number;
  cost_per_unit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomInventory {
  id: string;
  room_id: string;
  item_id: string;
  quantity: number;
  last_restocked_at: string;
  last_restocked_by: string;
}
