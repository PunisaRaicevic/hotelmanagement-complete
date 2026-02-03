import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('Running guest_request_messages migration...\n');

  // 1. Create guest_request_messages table
  console.log('1. Creating guest_request_messages table...');
  const { error: tableError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS guest_request_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id VARCHAR NOT NULL,
        sender_type VARCHAR NOT NULL,
        sender_id VARCHAR,
        sender_name TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `
  });

  if (tableError) {
    // Try direct SQL if rpc doesn't work
    console.log('   Using direct table creation...');

    // Check if table exists by trying to select from it
    const { error: checkError } = await supabase
      .from('guest_request_messages')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('   Table does not exist, creating via REST...');
      // Table doesn't exist - we need to create it via SQL editor in Supabase dashboard
      console.log('\n⚠️  VAŽNO: Tabela guest_request_messages ne postoji.');
      console.log('   Molimo kreirajte je ručno u Supabase SQL Editoru sa sljedećim SQL-om:\n');
      console.log(`
CREATE TABLE guest_request_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR NOT NULL,
  sender_type VARCHAR NOT NULL,
  sender_id VARCHAR,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guest_request_messages_request_id ON guest_request_messages(request_id);
CREATE INDEX idx_guest_request_messages_created_at ON guest_request_messages(created_at);
      `);
      return;
    } else if (!checkError) {
      console.log('   ✓ Tabela već postoji');
    }
  } else {
    console.log('   ✓ Tabela kreirana');
  }

  // 2. Add forwarding columns to guest_service_requests
  console.log('\n2. Adding forwarding columns to guest_service_requests...');

  const columnsToAdd = [
    { name: 'forwarded_to_department', type: 'VARCHAR' },
    { name: 'forwarded_at', type: 'TIMESTAMP WITH TIME ZONE' },
    { name: 'forwarded_by', type: 'VARCHAR' },
    { name: 'forwarded_by_name', type: 'TEXT' },
    { name: 'linked_task_id', type: 'VARCHAR' },
    { name: 'linked_housekeeping_task_id', type: 'VARCHAR' },
  ];

  for (const col of columnsToAdd) {
    // Try to select the column - if it fails, it doesn't exist
    const { data, error } = await supabase
      .from('guest_service_requests')
      .select(col.name)
      .limit(1);

    if (error && error.message.includes(col.name)) {
      console.log(`   Kolona ${col.name} ne postoji - dodajte je ručno`);
    } else {
      console.log(`   ✓ ${col.name} - OK`);
    }
  }

  console.log('\n=== Migracija završena ===\n');
  console.log('Ako neke kolone nedostaju, dodajte ih ručno u Supabase SQL Editor:');
  console.log(`
ALTER TABLE guest_service_requests
ADD COLUMN IF NOT EXISTS forwarded_to_department VARCHAR,
ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS forwarded_by VARCHAR,
ADD COLUMN IF NOT EXISTS forwarded_by_name TEXT,
ADD COLUMN IF NOT EXISTS linked_task_id VARCHAR,
ADD COLUMN IF NOT EXISTS linked_housekeeping_task_id VARCHAR;
  `);
}

runMigration().catch(console.error);
