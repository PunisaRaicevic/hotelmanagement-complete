import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUsers() {
  console.log('Creating production users...\n');

  // ============================================
  // IZMIJENI PODATKE ISPOD PREMA POTREBI
  // ============================================

  const users = [
    // ========== ADMIN ==========
    {
      username: 'admin',
      email: 'admin@hotel.com',
      full_name: 'Administrator',
      role: 'admin',
      department: 'tehnicka',
      password: '111111',
    },

    // ========== TEHNICKA SLUZBA ==========
    {
      username: 'operater',
      email: 'operater@hotel.com',
      full_name: 'Operater',
      role: 'operater',
      department: 'tehnicka',
      password: '111111',
    },
    {
      username: 'sef_tehnicke',
      email: 'sef.tehnicke@hotel.com',
      full_name: 'Šef tehničke službe',
      role: 'sef',
      department: 'tehnicka',
      password: '111111',
    },
    {
      username: 'serviser1',
      email: 'serviser1@hotel.com',
      full_name: 'Serviser 1',
      role: 'serviser',
      department: 'tehnicka',
      job_title: 'Serviser',
      password: '111111',
    },
    {
      username: 'radnik1',
      email: 'radnik1@hotel.com',
      full_name: 'Radnik 1',
      role: 'radnik',
      department: 'tehnicka',
      password: '111111',
    },

    // ========== DOMACINSTVO ==========
    {
      username: 'sef_domacinstva',
      email: 'sef.domacinstva@hotel.com',
      full_name: 'Šef domaćinstva',
      role: 'sef_domacinstva',
      department: 'domacinstvo',
      password: '111111',
    },
    {
      username: 'sobarica1',
      email: 'sobarica1@hotel.com',
      full_name: 'Sobarica 1',
      role: 'sobarica',
      department: 'domacinstvo',
      password: '111111',
    },

    // ========== RECEPCIJA ==========
    {
      username: 'recepcioner',
      email: 'recepcija@hotel.com',
      full_name: 'Recepcioner',
      role: 'recepcioner',
      department: 'recepcija',
      password: '111111',
    },

    // ========== GUEST DISPLAY ==========
    {
      username: 'guest_display',
      email: 'display@hotel.com',
      full_name: 'Guest Display',
      role: 'guest_display',
      department: 'recepcija',
      password: '111111',
    },
  ];

  // ============================================
  // NE MIJENJAJ ISPOD OVE LINIJE
  // ============================================

  for (const user of users) {
    const { password, ...userData } = user;
    const passwordHash = await bcrypt.hash(password, 10);

    const { error } = await supabase.from('users').upsert(
      { ...userData, password_hash: passwordHash, is_active: true },
      { onConflict: 'username' }
    );

    if (error) {
      console.log(`  ${user.username}: GREŠKA - ${error.message}`);
    } else {
      console.log(`  ${user.username}: OK`);
    }
  }

  console.log('\n=== Korisnici kreirani! ===\n');
  console.log('VAŽNO: Obriši ovaj fajl nakon upotrebe ili promijeni lozinke!');
}

createUsers().catch(console.error);
