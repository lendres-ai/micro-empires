import { generateMap } from '@/lib/game/map';

async function seed() {
  const seed = process.env.GAME_WORLD_SEED || 'micro-empires-001';
  console.log('Seeding map with seed:', seed);
  
  try {
    await generateMap(seed);
    console.log('Map seeded successfully!');
  } catch (error) {
    console.error('Error seeding map:', error);
  }
}

seed();
