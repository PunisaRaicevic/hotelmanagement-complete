import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createRooms() {
  console.log('Kreiranje soba za hotel (3 sprata x 5 soba)...\n');

  const rooms = [];

  // 3 sprata, 5 soba po spratu
  for (let floor = 1; floor <= 3; floor++) {
    for (let roomNum = 1; roomNum <= 5; roomNum++) {
      const roomNumber = `${floor}0${roomNum}`; // 101, 102... 301, 302...

      // Varijacija kategorija i tipova kreveta po sobama
      let category, bedType, maxOccupancy;

      if (roomNum === 1) {
        category = 'standard';
        bedType = 'single';
        maxOccupancy = 1;
      } else if (roomNum === 2) {
        category = 'standard';
        bedType = 'double';
        maxOccupancy = 2;
      } else if (roomNum === 3) {
        category = 'superior';
        bedType = 'queen';
        maxOccupancy = 2;
      } else if (roomNum === 4) {
        category = 'deluxe';
        bedType = 'king';
        maxOccupancy = 2;
      } else {
        category = floor === 3 ? 'suite' : 'superior';
        bedType = 'king';
        maxOccupancy = floor === 3 ? 4 : 3;
      }

      rooms.push({
        room_number: roomNumber,
        floor: floor,
        category: category,
        status: 'clean',
        occupancy_status: 'vacant',
        bed_type: bedType,
        max_occupancy: maxOccupancy,
        has_minibar: category !== 'standard',
        is_active: true,
      });
    }
  }

  console.log('Sobe za kreiranje:');
  console.log('==================');

  for (const room of rooms) {
    const { error } = await supabase.from('rooms').upsert(
      room,
      { onConflict: 'room_number' }
    );

    if (error) {
      console.log(`  ${room.room_number}: GREŠKA - ${error.message}`);
    } else {
      console.log(`  ${room.room_number}: OK (${room.category}, ${room.bed_type}, kapacitet: ${room.max_occupancy})`);
    }
  }

  console.log('\n=== Sobe kreirane! ===');
  console.log('\nPregled po spratovima:');
  console.log('  Sprat 1: 101-105 (standard/superior)');
  console.log('  Sprat 2: 201-205 (standard/superior/deluxe)');
  console.log('  Sprat 3: 301-305 (standard/superior/deluxe/suite)');
}

createRooms().catch(console.error);
