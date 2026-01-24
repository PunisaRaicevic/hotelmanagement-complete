import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedTestData() {
  console.log('Creating test data...\n');

  // 1. Create test users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('test123', 10);

  const users = [
    {
      username: 'admin',
      email: 'admin@hotel.com',
      full_name: 'Admin User',
      role: 'admin',
      department: 'tehnicka',
      password_hash: passwordHash,
      is_active: true,
    },
    {
      username: 'sef_domacinstva',
      email: 'sef@hotel.com',
      full_name: 'Marija Petrović',
      role: 'sef_domacinstva',
      department: 'domacinstvo',
      password_hash: passwordHash,
      is_active: true,
    },
    {
      username: 'sobarica1',
      email: 'sobarica1@hotel.com',
      full_name: 'Ana Marić',
      role: 'sobarica',
      department: 'domacinstvo',
      password_hash: passwordHash,
      is_active: true,
    },
    {
      username: 'sobarica2',
      email: 'sobarica2@hotel.com',
      full_name: 'Ivana Horvat',
      role: 'sobarica',
      department: 'domacinstvo',
      password_hash: passwordHash,
      is_active: true,
    },
    {
      username: 'recepcioner',
      email: 'recepcija@hotel.com',
      full_name: 'Petar Nikolić',
      role: 'recepcioner',
      department: 'recepcija',
      password_hash: passwordHash,
      is_active: true,
    },
  ];

  for (const user of users) {
    const { error } = await supabase.from('users').upsert(user, { onConflict: 'username' });
    if (error) {
      console.log(`  User ${user.username}: ERROR - ${error.message}`);
    } else {
      console.log(`  User ${user.username}: OK`);
    }
  }

  // Get created users for references
  const { data: createdUsers } = await supabase.from('users').select('id, full_name, role');
  const sobarica1 = createdUsers?.find(u => u.role === 'sobarica');
  const sobarica2 = createdUsers?.find(u => u.role === 'sobarica' && u.id !== sobarica1?.id);

  // 2. Create test rooms
  console.log('\nCreating rooms...');
  const rooms = [];

  // Floor 1: 101-110
  for (let i = 1; i <= 10; i++) {
    rooms.push({
      room_number: `10${i}`,
      floor: 1,
      category: i <= 5 ? 'standard' : 'superior',
      status: i <= 3 ? 'dirty' : i <= 6 ? 'clean' : 'inspected',
      occupancy_status: i <= 4 ? 'occupied' : i <= 7 ? 'vacant' : 'checkout',
      bed_type: i % 2 === 0 ? 'double' : 'twin',
      max_occupancy: 2,
      has_minibar: true,
      needs_minibar_check: i <= 3,
      assigned_housekeeper_id: i <= 5 ? sobarica1?.id : sobarica2?.id,
      assigned_housekeeper_name: i <= 5 ? sobarica1?.full_name : sobarica2?.full_name,
      guest_name: i <= 4 ? `Gost ${i}` : null,
      priority_score: i <= 3 ? 8 : 3,
    });
  }

  // Floor 2: 201-210
  for (let i = 1; i <= 10; i++) {
    rooms.push({
      room_number: `20${i}`,
      floor: 2,
      category: i <= 3 ? 'deluxe' : i <= 6 ? 'suite' : 'standard',
      status: i <= 2 ? 'dirty' : i <= 5 ? 'in_cleaning' : 'clean',
      occupancy_status: i <= 5 ? 'occupied' : 'vacant',
      bed_type: 'king',
      max_occupancy: i <= 3 ? 4 : 2,
      has_minibar: true,
      needs_minibar_check: i <= 2,
      guest_name: i <= 5 ? `VIP Gost ${i}` : null,
      priority_score: i <= 2 ? 10 : 5,
    });
  }

  for (const room of rooms) {
    const { error } = await supabase.from('rooms').upsert(room, { onConflict: 'room_number' });
    if (error) {
      console.log(`  Room ${room.room_number}: ERROR - ${error.message}`);
    } else {
      console.log(`  Room ${room.room_number}: OK`);
    }
  }

  // 3. Create inventory items
  console.log('\nCreating inventory items...');
  const inventoryItems = [
    { name: 'Posteljina - set', category: 'linen', unit: 'set', current_stock: 100, minimum_stock: 20 },
    { name: 'Peškir veliki', category: 'linen', unit: 'kom', current_stock: 200, minimum_stock: 50 },
    { name: 'Peškir mali', category: 'linen', unit: 'kom', current_stock: 300, minimum_stock: 75 },
    { name: 'Šampon', category: 'amenity', unit: 'kom', current_stock: 500, minimum_stock: 100 },
    { name: 'Sapun', category: 'amenity', unit: 'kom', current_stock: 600, minimum_stock: 100 },
    { name: 'Losion za tijelo', category: 'amenity', unit: 'kom', current_stock: 400, minimum_stock: 80 },
    { name: 'Coca-Cola', category: 'minibar', unit: 'kom', current_stock: 150, minimum_stock: 30, cost_per_unit: 300 },
    { name: 'Voda 0.5L', category: 'minibar', unit: 'kom', current_stock: 200, minimum_stock: 50, cost_per_unit: 150 },
    { name: 'Čokolada', category: 'minibar', unit: 'kom', current_stock: 100, minimum_stock: 25, cost_per_unit: 250 },
    { name: 'Sredstvo za čišćenje', category: 'cleaning_supply', unit: 'litar', current_stock: 50, minimum_stock: 10 },
  ];

  for (const item of inventoryItems) {
    const { error } = await supabase.from('inventory_items').insert(item);
    if (error && !error.message.includes('duplicate')) {
      console.log(`  ${item.name}: ERROR - ${error.message}`);
    } else {
      console.log(`  ${item.name}: OK`);
    }
  }

  // 4. Create some housekeeping tasks
  console.log('\nCreating housekeeping tasks...');
  const { data: roomData } = await supabase.from('rooms').select('id, room_number').limit(5);

  const today = new Date().toISOString();

  if (roomData) {
    for (let i = 0; i < Math.min(5, roomData.length); i++) {
      const room = roomData[i];
      const task = {
        room_id: room.id,
        room_number: room.room_number,
        cleaning_type: i < 2 ? 'checkout' : 'daily',
        assigned_to: i % 2 === 0 ? sobarica1?.id : sobarica2?.id,
        assigned_to_name: i % 2 === 0 ? sobarica1?.full_name : sobarica2?.full_name,
        status: i === 0 ? 'pending' : i === 1 ? 'in_progress' : i === 2 ? 'completed' : 'pending',
        priority: i < 2 ? 'urgent' : 'normal',
        scheduled_date: today,
        linens_changed: i === 2,
        towels_changed: i === 2,
        amenities_restocked: i === 2,
      };

      const { error } = await supabase.from('housekeeping_tasks').insert(task);
      if (error) {
        console.log(`  Task for ${room.room_number}: ERROR - ${error.message}`);
      } else {
        console.log(`  Task for ${room.room_number}: OK`);
      }
    }
  }

  console.log('\n=== Test data created successfully! ===');
  console.log('\nTest login credentials (password for all: test123):');
  console.log('  - admin / test123 (Administrator)');
  console.log('  - sef_domacinstva / test123 (Šef domaćinstva)');
  console.log('  - sobarica1 / test123 (Sobarica Ana)');
  console.log('  - sobarica2 / test123 (Sobarica Ivana)');
  console.log('  - recepcioner / test123 (Recepcioner)');
}

seedTestData().catch(console.error);
