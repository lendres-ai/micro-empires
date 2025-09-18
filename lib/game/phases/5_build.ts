import type { Prisma } from '@prisma/client';
import { COSTS } from '@/lib/game/constants';

export async function processBuildPhase(tx: Prisma.TransactionClient, turn: number): Promise<void> {
  console.log(`Processing build phase for turn ${turn}`);

  const buildOrders = await tx.order.findMany({
    where: {
      turn,
      type: 'BUILD',
      status: 'PENDING',
    },
    include: {
      empire: true,
    },
  });

  for (const order of buildOrders) {
    if (order.targetX !== null && order.targetY !== null) {
      await processBuild(tx, order, turn);
    }
  }
}

interface BuildOrder {
  targetX: number | null;
  targetY: number | null;
  empire: {
    id: string;
    wood: number;
    stone: number;
  };
}

async function processBuild(tx: Prisma.TransactionClient, order: BuildOrder, turn: number): Promise<void> {
  const empire = order.empire;
  
  // Get target tile
  const targetTile = await tx.tile.findUnique({
    where: { x_y: { x: order.targetX!, y: order.targetY! } },
  });

  if (!targetTile || targetTile.ownerId !== empire.id) {
    await tx.log.create({
      data: {
        turn,
        empireId: empire.id,
        scope: 'EMPIRE',
        message: `Build failed: tile not found or not owned`,
      },
    });
    return;
  }

  if (targetTile.level >= 3) {
    await tx.log.create({
      data: {
        turn,
        empireId: empire.id,
        scope: 'EMPIRE',
        message: `Build failed: tile already at maximum level`,
      },
    });
    return;
  }

  const nextLevel = targetTile.level + 1;
  const costKey = nextLevel === 2 ? 'level2' : 'level3';
  const cost = COSTS.BUILD[costKey as keyof typeof COSTS.BUILD] as { wood: number; stone: number };

  // Check resources
  if (empire.wood < cost.wood || empire.stone < cost.stone) {
    await tx.log.create({
      data: {
        turn,
        empireId: empire.id,
        scope: 'EMPIRE',
        message: `Build failed: insufficient resources`,
      },
    });
    return;
  }

  // Upgrade tile
  await tx.tile.update({
    where: { id: targetTile.id },
    data: { level: nextLevel },
  });

  // Deduct resources
  await tx.empire.update({
    where: { id: empire.id },
    data: {
      wood: { decrement: cost.wood },
      stone: { decrement: cost.stone },
    },
  });

  await tx.log.create({
    data: {
      turn,
      empireId: empire.id,
      scope: 'EMPIRE',
      message: `Upgraded (${order.targetX}, ${order.targetY}) to level ${nextLevel}`,
    },
  });
}
