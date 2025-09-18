import type { Prisma } from '@prisma/client';
import { COSTS } from '@/lib/game/constants';
import { createRNG } from '@/lib/rng';
import type { SeededRNG } from '@/lib/rng';

interface ExpansionOrder {
  targetX: number | null;
  targetY: number | null;
  empire: {
    id: string;
    wood: number;
    stone: number;
    army: number;
    tilesOwned: number;
  };
}

export async function processExpansionPhase(tx: Prisma.TransactionClient, turn: number, seed: string): Promise<void> {
  console.log(`Processing expansion phase for turn ${turn}`);

  const expansionOrders = await tx.order.findMany({
    where: {
      turn,
      type: 'EXPAND',
      status: 'PENDING',
    },
    include: {
      empire: true,
    },
  });

  // Group orders by target tile to handle conflicts
  const ordersByTile = new Map<string, ExpansionOrder[]>();
  
  for (const order of expansionOrders) {
    if (order.targetX !== null && order.targetY !== null) {
      const key = `${order.targetX},${order.targetY}`;
      if (!ordersByTile.has(key)) {
        ordersByTile.set(key, []);
      }
      ordersByTile.get(key)!.push(order);
    }
  }

  const rng = createRNG(seed, turn, 'expansion');

  for (const [, orders] of ordersByTile) {
    if (orders.length === 1) {
      // Single order - process directly
      await processSingleExpansion(tx, orders[0] as ExpansionOrder, turn);
    } else {
      // Multiple orders - resolve conflict
      await resolveExpansionConflict(tx, orders as ExpansionOrder[], turn, rng);
    }
  }
}

async function processSingleExpansion(tx: Prisma.TransactionClient, order: ExpansionOrder, turn: number): Promise<void> {
  const empire = order.empire;
  
  // Double-check resources
  if (empire.wood < COSTS.EXPAND.wood || empire.stone < COSTS.EXPAND.stone) {
    await tx.log.create({
      data: {
        turn,
        empireId: empire.id,
        scope: 'EMPIRE',
        message: `Expansion failed: insufficient resources`,
      },
    });
    return;
  }

  // Update tile ownership
  await tx.tile.update({
    where: { x_y: { x: order.targetX!, y: order.targetY! } },
    data: { ownerId: empire.id },
  });

  // Deduct resources and increment tilesOwned atomically
  await tx.empire.update({
    where: { id: empire.id },
    data: {
      wood: { decrement: COSTS.EXPAND.wood },
      stone: { decrement: COSTS.EXPAND.stone },
      tilesOwned: { increment: 1 },
    },
  });

  await tx.log.create({
    data: {
      turn,
      empireId: empire.id,
      scope: 'EMPIRE',
      message: `Expanded to (${order.targetX}, ${order.targetY})`,
    },
  });
}

async function resolveExpansionConflict(tx: Prisma.TransactionClient, orders: ExpansionOrder[], turn: number, rng: SeededRNG): Promise<void> {
  // For MVP, simple resolution: highest army wins, then random tie-break
  orders.sort((a, b) => {
    if (a.empire.army !== b.empire.army) {
      return b.empire.army - a.empire.army; // Higher army first
    }
    return rng.nextFloat() - 0.5; // Random tie-break
  });

  const winner = orders[0];
  await processSingleExpansion(tx, winner, turn);

  // Log conflicts for losers
  for (let i = 1; i < orders.length; i++) {
    const loser = orders[i];
    await tx.log.create({
      data: {
        turn,
        empireId: loser.empire.id,
        scope: 'EMPIRE',
        message: `Expansion conflict lost at (${loser.targetX}, ${loser.targetY})`,
      },
    });
  }
}
