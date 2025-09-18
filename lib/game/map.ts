import { db } from '@/lib/db';
import { TileType } from '@prisma/client';
import { WORLD } from '@/lib/game/constants';
import { SeededRNG } from '@/lib/rng';

const TILE_DISTRIBUTION = {
  PLAIN: 0.40,
  FARM: 0.20,
  FOREST: 0.20,
  MINE: 0.15,
  HARBOR: 0.04,
  RUIN: 0.01,
};

export async function generateMap(seed: string): Promise<void> {
  // Check if map already exists
  const existingTiles = await db.tile.count();
  if (existingTiles > 0) {
    console.log('Map already exists, skipping generation');
    return;
  }

  const rng = new SeededRNG(seed);
  const tiles = [];

  for (let x = 0; x < WORLD.width; x++) {
    for (let y = 0; y < WORLD.height; y++) {
      const tileType = generateTileType(rng);
      tiles.push({
        x,
        y,
        type: tileType,
        level: 1,
      });
    }
  }

  await db.tile.createMany({
    data: tiles,
  });

  console.log(`Generated ${tiles.length} tiles`);
}

function generateTileType(rng: SeededRNG): TileType {
  const roll = rng.nextFloat();
  let cumulative = 0;

  for (const [type, probability] of Object.entries(TILE_DISTRIBUTION)) {
    cumulative += probability;
    if (roll <= cumulative) {
      return type as TileType;
    }
  }

  return TileType.PLAIN; // fallback
}

export async function getMapState() {
  const tiles = await db.tile.findMany({
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: [
      { y: 'asc' },
      { x: 'asc' },
    ],
  });

  return tiles.map(tile => ({
    x: tile.x,
    y: tile.y,
    type: tile.type,
    ownerId: tile.ownerId,
    ownerName: tile.owner?.name,
    ownerColor: tile.owner?.color,
    level: tile.level,
  }));
}
