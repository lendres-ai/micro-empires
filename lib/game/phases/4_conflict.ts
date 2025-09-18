import type { Prisma } from '@prisma/client';
import { COMBAT } from '@/lib/game/constants';
import { createRNG } from '@/lib/rng';
import type { SeededRNG } from '@/lib/rng';

interface AttackOrder {
  targetX: number | null;
  targetY: number | null;
  amount: number;
  empire: {
    id: string;
    name: string;
    army: number;
    tilesOwned: number;
    gold: number;
  };
}

export async function processConflictPhase(tx: Prisma.TransactionClient, turn: number, seed: string): Promise<void> {
  console.log(`Processing conflict phase for turn ${turn}`);

  const attackOrders = await tx.order.findMany({
    where: {
      turn,
      type: 'ATTACK',
      status: 'PENDING',
    },
    include: {
      empire: true,
    },
  });

  const rng = createRNG(seed, turn, 'conflict');

  for (const order of attackOrders) {
    if (order.targetX !== null && order.targetY !== null && order.amount !== null) {
      await processAttack(tx, order as unknown as AttackOrder, turn, rng);
    }
  }
}

async function processAttack(tx: Prisma.TransactionClient, order: AttackOrder, turn: number, rng: SeededRNG): Promise<void> {
  const attacker = order.empire;
  
  // Get target tile and defender
  const targetTile = await tx.tile.findUnique({
    where: { x_y: { x: order.targetX!, y: order.targetY! } },
    include: { owner: true },
  });

  if (!targetTile || !targetTile.owner) {
    await tx.log.create({
      data: {
        turn,
        empireId: attacker.id,
        scope: 'EMPIRE',
        message: `Attack failed: target tile not found or unowned`,
      },
    });
    return;
  }

  const defender = targetTile.owner;

  // Calculate combat power
  const attackerPower = order.amount + attacker.army;
  const defenderPower = defender.army + targetTile.level;

  // Apply variance
  const attackerVariance = 1 + (rng.nextFloat() - 0.5) * 2 * COMBAT.variancePct;
  const defenderVariance = 1 + (rng.nextFloat() - 0.5) * 2 * COMBAT.variancePct;

  const finalAttackerPower = attackerPower * attackerVariance;
  const finalDefenderPower = defenderPower * defenderVariance;

  if (finalAttackerPower > finalDefenderPower) {
    // Attacker wins
    await tx.tile.update({
      where: { id: targetTile.id },
      data: {
        ownerId: attacker.id,
        level: Math.max(1, targetTile.level - 1), // Reduce level on capture
      },
    });

    // Update empire stats
    await tx.empire.update({
      where: { id: attacker.id },
      data: {
        tilesOwned: { increment: 1 },
        gold: { increment: COMBAT.captureBonusGold },
        army: { decrement: order.amount }, // Deduct committed army
      },
    });

    await tx.empire.update({
      where: { id: defender.id },
      data: {
        tilesOwned: { decrement: 1 },
      },
    });

    // Log results
    await tx.log.create({
      data: {
        turn,
        empireId: attacker.id,
        scope: 'EMPIRE',
        message: `Captured (${order.targetX}, ${order.targetY}) from ${defender.name}! +${COMBAT.captureBonusGold} gold`,
      },
    });

    await tx.log.create({
      data: {
        turn,
        empireId: defender.id,
        scope: 'EMPIRE',
        message: `Lost (${order.targetX}, ${order.targetY}) to ${attacker.name}`,
      },
    });
  } else {
    // Defender wins
    await tx.empire.update({
      where: { id: attacker.id },
      data: {
        army: { decrement: order.amount }, // Deduct committed army
      },
    });

    await tx.log.create({
      data: {
        turn,
        empireId: attacker.id,
        scope: 'EMPIRE',
        message: `Attack on (${order.targetX}, ${order.targetY}) failed`,
      },
    });

    await tx.log.create({
      data: {
        turn,
        empireId: defender.id,
        scope: 'EMPIRE',
        message: `Defended (${order.targetX}, ${order.targetY}) from ${attacker.name}`,
      },
    });
  }
}
