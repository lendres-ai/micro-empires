import { db } from '@/lib/db';
import { YIELDS } from '@/lib/game/constants';

export async function processProductionPhase(turn: number): Promise<void> {
  console.log(`Processing production phase for turn ${turn}`);

  const empires = await db.empire.findMany({
    where: { isEliminated: false },
    include: {
      tiles: true,
    },
  });

  for (const empire of empires) {
    let totalFood = 0;
    let totalWood = 0;
    let totalStone = 0;
    let totalGold = 0;

    // Calculate production from all owned tiles
    for (const tile of empire.tiles) {
      const tileYield = YIELDS[tile.type];
      const multiplier = tile.level; // Higher level = more production
      
      totalFood += tileYield.food * multiplier;
      totalWood += tileYield.wood * multiplier;
      totalStone += tileYield.stone * multiplier;
      totalGold += tileYield.gold * multiplier;
    }

    if (totalFood > 0 || totalWood > 0 || totalStone > 0 || totalGold > 0) {
      await db.empire.update({
        where: { id: empire.id },
        data: {
          food: empire.food + totalFood,
          wood: empire.wood + totalWood,
          stone: empire.stone + totalStone,
          gold: empire.gold + totalGold,
        },
      });

      await db.log.create({
        data: {
          turn,
          empireId: empire.id,
          scope: 'EMPIRE',
          message: `Production: +${totalFood} food, +${totalWood} wood, +${totalStone} stone, +${totalGold} gold`,
        },
      });
    }
  }
}
