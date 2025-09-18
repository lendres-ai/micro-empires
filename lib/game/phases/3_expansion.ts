import { db } from '@/lib/db';
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

export async function processExpansionPhase(turn: number, seed: string): Promise<void> {
  console.log(`Processing expansion phase for turn ${turn}`);

  const expansionOrders = await db.order.findMany({
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
      await processSingleExpansion(orders[0] as ExpansionOrder, turn);
    } else {
      // Multiple orders - resolve conflict
      await resolveExpansionConflict(orders as ExpansionOrder[], turn, rng);
    }
  }
}

async function processSingleExpansion(order: ExpansionOrder, turn: number): Promise<void> {
  const empire = order.empire;
  
  // Double-check resources
  if (empire.wood < COSTS.EXPAND.wood || empire.stone < COSTS.EXPAND.stone) {
    await db.log.create({
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
  await db.tile.update({
    where: { x_y: { x: order.targetX!, y: order.targetY! } },
    data: { ownerId: empire.id },
  });

  // Deduct resources
  await db.empire.update({
    where: { id: empire.id },
    data: {
      wood: empire.wood - COSTS.EXPAND.wood,
      stone: empire.stone - COSTS.EXPAND.stone,
      tilesOwned: empire.tilesOwned + 1,
    },
  });

  await db.log.create({
    data: {
      turn,
      empireId: empire.id,
      scope: 'EMPIRE',
      message: `Expanded to (${order.targetX}, ${order.targetY})`,
    },
  });
}

async function resolveExpansionConflict(orders: ExpansionOrder[], turn: number, rng: SeededRNG): Promise<void> {
  // For MVP, simple resolution: highest army wins, then random tie-break
  orders.sort((a, b) => {
    if (a.empire.army !== b.empire.army) {
      return b.empire.army - a.empire.army; // Higher army first
    }
    return rng.nextFloat() - 0.5; // Random tie-break
  });

  const winner = orders[0];
  await processSingleExpansion(winner, turn);

  // Log conflicts for losers
  for (let i = 1; i < orders.length; i++) {
    const loser = orders[i];
    await db.log.create({
      data: {
        turn,
        empireId: loser.empire.id,
        scope: 'EMPIRE',
        message: `Expansion conflict lost at (${loser.targetX}, ${loser.targetY})`,
      },
    });
  }
}
