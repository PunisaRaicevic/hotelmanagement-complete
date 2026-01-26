-- Add guest QR code system columns to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS guest_count integer DEFAULT 1;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS guest_phone varchar;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS guest_email varchar;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS guest_session_token varchar;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS token_created_at timestamp with time zone;

-- Create guest service requests table
CREATE TABLE IF NOT EXISTS guest_service_requests (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id varchar NOT NULL,
  room_number varchar NOT NULL,
  session_token varchar NOT NULL,
  request_type varchar NOT NULL,
  category varchar,
  description text NOT NULL,
  guest_name text,
  guest_phone varchar,
  priority varchar NOT NULL DEFAULT 'normal',
  status varchar NOT NULL DEFAULT 'new',
  assigned_to varchar,
  assigned_to_name text,
  images text[],
  staff_notes text,
  resolved_at timestamp with time zone,
  resolved_by varchar,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups by room and token
CREATE INDEX IF NOT EXISTS idx_guest_service_requests_room ON guest_service_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_guest_service_requests_token ON guest_service_requests(session_token);
CREATE INDEX IF NOT EXISTS idx_guest_service_requests_status ON guest_service_requests(status);
CREATE INDEX IF NOT EXISTS idx_rooms_session_token ON rooms(guest_session_token);
