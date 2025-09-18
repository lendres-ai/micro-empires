import type { Prisma } from '@prisma/client';
import { COSTS } from '@/lib/game/constants';

export async function processUpkeepPhase(tx: Prisma.TransactionClient, turn: number): Promise<void> {
  console.log(`Processing upkeep phase for turn ${turn}`);

  const empires = await tx.empire.findMany({
    where: { isEliminated: false },
  });

  for (const empire of empires) {
    const upkeepCost = empire.army * COSTS.ARMY_PER_TURN_UPKEEP;
    
    if (empire.food >= upkeepCost) {
      // Sufficient food
      await tx.empire.update({
        where: { id: empire.id },
        data: { food: empire.food - upkeepCost },
      });

      await tx.log.create({
        data: {
          turn,
          empireId: empire.id,
          scope: 'EMPIRE',
          message: `Army upkeep: -${upkeepCost} food`,
        },
      });
    } else {
      // Insufficient food - reduce army
      const armyReduction = Math.ceil((upkeepCost - empire.food) / COSTS.ARMY_PER_TURN_UPKEEP);
      const newArmySize = Math.max(0, empire.army - armyReduction);
      
      await tx.empire.update({
        where: { id: empire.id },
        data: { 
          food: 0,
          army: newArmySize,
        },
      });

      await tx.log.create({
        data: {
          turn,
          empireId: empire.id,
          scope: 'EMPIRE',
          message: `Insufficient food! Army reduced from ${empire.army} to ${newArmySize}`,
        },
      });

      // Check if empire is eliminated
      if (newArmySize === 0) {
        await tx.empire.update({
          where: { id: empire.id },
          data: { isEliminated: true },
        });

        await tx.log.create({
          data: {
            turn,
            empireId: empire.id,
            scope: 'EMPIRE',
            message: 'Empire eliminated due to starvation!',
          },
        });
      }
    }
  }
}
