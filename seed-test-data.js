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
    // ========== ADMIN ==========
    {
      username: 'admin',
      email: 'admin@hotel.com',
      full_name: 'Admin User',
      role: 'admin',
      department: 'tehnicka',
      password_hash: passwordHash,
      is_active: true,
    },

    // ========== TEHNICKA SLUZBA ==========
    {
      username: 'operater',
      email: 'operater@hotel.com',
      full_name: 'Milica Jovanović',
      role: 'operater',
      department: 'tehnicka',
      password_hash: passwordHash,
      is_active: true,
    },
    {
      username: 'sef_tehnicke',
      email: 'sef.tehnicke@hotel.com',
      full_name: 'Dragan Milić',
      role: 'sef',
      department: 'tehnicka',
      password_hash: passwordHash,
      is_active: true,
    },
    {
      username: 'majstor1',
      email: 'majstor1@hotel.com',
      full_name: 'Zoran Pavlović',
      role: 'serviser',
      department: 'tehnicka',
      job_title: 'Vodoinstalater',
      password_hash: passwordHash,
      is_active: true,
    },
    {
      username: 'majstor2',
      email: 'majstor2@hotel.com',
      full_name: 'Nenad Stojanović',
      role: 'serviser',
      department: 'tehnicka',
      job_title: 'Električar',
      password_hash: passwordHash,
      is_active: true,
    },
    {
      username: 'radnik1',
      email: 'radnik1@hotel.com',
      full_name: 'Milan Ristić',
      role: 'radnik',
      department: 'tehnicka',
      password_hash: passwordHash,
      is_active: true,
    },
    {
      username: 'radnik2',
      email: 'radnik2@hotel.com',
      full_name: 'Dejan Tomić',
      role: 'radnik',
      department: 'tehnicka',
      password_hash: passwordHash,
      is_active: true,
    },

    // ========== DOMACINSTVO ==========
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

    // ========== RECEPCIJA ==========
    {
      username: 'recepcioner',
      email: 'recepcija@hotel.com',
      full_name: 'Petar Nikolić',
      role: 'recepcioner',
      department: 'recepcija',
      password_hash: passwordHash,
      is_active: true,
    },

    // ========== GUEST DISPLAY ==========
    {
      username: 'guest_display',
      email: 'display@hotel.com',
      full_name: 'Guest Display',
      role: 'guest_display',
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

  // 5. Create some technical service tasks
  console.log('\nCreating technical service tasks...');
  const { data: allUsers } = await supabase.from('users').select('id, full_name, role, department');

  const operater = allUsers?.find(u => u.role === 'operater');
  const sefTehnicke = allUsers?.find(u => u.role === 'sef');
  const serviser1 = allUsers?.find(u => u.role === 'serviser');
  const radnik1 = allUsers?.find(u => u.role === 'radnik');

  if (operater && sefTehnicke) {
    const techTasks = [
      {
        title: 'Curenje vode u kupatilu',
        description: 'Gost prijavio curenje vode ispod lavaboa',
        location: 'Soba 105',
        room_number: '105',
        priority: 'urgent',
        status: 'new',
        created_by: operater.id,
        created_by_name: operater.full_name,
        created_by_department: 'recepcija',
      },
      {
        title: 'Klima ne radi',
        description: 'Klima uredaj se ne ukljucuje',
        location: 'Soba 203',
        room_number: '203',
        priority: 'normal',
        status: 'with_operator',
        created_by: operater.id,
        created_by_name: operater.full_name,
        created_by_department: 'recepcija',
        operator_id: operater.id,
        operator_name: operater.full_name,
      },
      {
        title: 'Zamjena sijalice',
        description: 'Sijalica u hodniku pregorela',
        location: 'Hodnik 2. sprat',
        priority: 'can_wait',
        status: 'assigned_to_radnik',
        created_by: operater.id,
        created_by_name: operater.full_name,
        created_by_department: 'tehnicka',
        operator_id: operater.id,
        operator_name: operater.full_name,
        assigned_to: radnik1?.id,
        assigned_to_name: radnik1?.full_name,
        assigned_to_type: 'radnik',
      },
      {
        title: 'Popravka brave',
        description: 'Brava na vratima se tesko zakljucava',
        location: 'Soba 108',
        room_number: '108',
        priority: 'normal',
        status: 'with_sef',
        created_by: operater.id,
        created_by_name: operater.full_name,
        created_by_department: 'recepcija',
        operator_id: operater.id,
        operator_name: operater.full_name,
        sef_id: sefTehnicke.id,
        sef_name: sefTehnicke.full_name,
        assigned_to: serviser1?.id,
        assigned_to_name: serviser1?.full_name,
        assigned_to_type: 'serviser',
      },
    ];

    for (const task of techTasks) {
      const { error } = await supabase.from('tasks').insert(task);
      if (error) {
        console.log(`  Task "${task.title}": ERROR - ${error.message}`);
      } else {
        console.log(`  Task "${task.title}": OK`);
      }
    }
  }

  console.log('\n=== Test data created successfully! ===');
  console.log('\n========================================');
  console.log('Test login credentials (password: test123)');
  console.log('========================================');
  console.log('\n--- TEHNICKA SLUZBA ---');
  console.log('  operater / test123 (Operater - prima reklamacije)');
  console.log('  sef_tehnicke / test123 (Šef tehničke službe)');
  console.log('  majstor1 / test123 (Serviser - Vodoinstalater)');
  console.log('  majstor2 / test123 (Serviser - Električar)');
  console.log('  radnik1 / test123 (Radnik)');
  console.log('  radnik2 / test123 (Radnik)');
  console.log('\n--- DOMAĆINSTVO ---');
  console.log('  sef_domacinstva / test123 (Šef domaćinstva)');
  console.log('  sobarica1 / test123 (Sobarica Ana)');
  console.log('  sobarica2 / test123 (Sobarica Ivana)');
  console.log('\n--- OSTALI ---');
  console.log('  admin / test123 (Administrator - oba modula)');
  console.log('  recepcioner / test123 (Recepcioner)');
  console.log('  guest_display / test123 (Guest Display ekran)');
}

seedTestData().catch(console.error);
