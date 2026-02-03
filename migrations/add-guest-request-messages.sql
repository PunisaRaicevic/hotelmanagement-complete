-- Create guest_request_messages table for chat between guest and staff
CREATE TABLE IF NOT EXISTS guest_request_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR NOT NULL REFERENCES guest_service_requests(id) ON DELETE CASCADE,
  sender_type VARCHAR NOT NULL CHECK (sender_type IN ('guest', 'staff')),
  sender_id VARCHAR,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guest_request_messages_request_id ON guest_request_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_guest_request_messages_created_at ON guest_request_messages(created_at);

-- Add forwarding columns to guest_service_requests if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_service_requests' AND column_name = 'forwarded_to_department') THEN
    ALTER TABLE guest_service_requests ADD COLUMN forwarded_to_department VARCHAR;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_service_requests' AND column_name = 'forwarded_at') THEN
    ALTER TABLE guest_service_requests ADD COLUMN forwarded_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_service_requests' AND column_name = 'forwarded_by') THEN
    ALTER TABLE guest_service_requests ADD COLUMN forwarded_by VARCHAR;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_service_requests' AND column_name = 'forwarded_by_name') THEN
    ALTER TABLE guest_service_requests ADD COLUMN forwarded_by_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_service_requests' AND column_name = 'linked_task_id') THEN
    ALTER TABLE guest_service_requests ADD COLUMN linked_task_id VARCHAR;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_service_requests' AND column_name = 'linked_housekeeping_task_id') THEN
    ALTER TABLE guest_service_requests ADD COLUMN linked_housekeeping_task_id VARCHAR;
  END IF;
END $$;

-- Enable RLS on new table
ALTER TABLE guest_request_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read messages (for public guest access)
CREATE POLICY IF NOT EXISTS "Anyone can read guest request messages" ON guest_request_messages
  FOR SELECT USING (true);

-- Policy: Anyone can insert messages (for public guest access)
CREATE POLICY IF NOT EXISTS "Anyone can insert guest request messages" ON guest_request_messages
  FOR INSERT WITH CHECK (true);

-- Policy: Staff can update messages (mark as read)
CREATE POLICY IF NOT EXISTS "Anyone can update guest request messages" ON guest_request_messages
  FOR UPDATE USING (true);
