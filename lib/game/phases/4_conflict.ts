import { db } from '@/lib/db';
import { COMBAT } from '@/lib/game/constants';
import { createRNG } from '@/lib/rng';

export async function processConflictPhase(turn: number, seed: string): Promise<void> {
  console.log(`Processing conflict phase for turn ${turn}`);

  const attackOrders = await db.order.findMany({
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
      await processAttack(order, turn, rng);
    }
  }
}

async function processAttack(order: any, turn: number, rng: any): Promise<void> {
  const attacker = order.empire;
  
  // Get target tile and defender
  const targetTile = await db.tile.findUnique({
    where: { x_y: { x: order.targetX!, y: order.targetY! } },
    include: { owner: true },
  });

  if (!targetTile || !targetTile.owner) {
    await db.log.create({
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
    await db.tile.update({
      where: { id: targetTile.id },
      data: {
        ownerId: attacker.id,
        level: Math.max(1, targetTile.level - 1), // Reduce level on capture
      },
    });

    // Update empire stats
    await db.empire.update({
      where: { id: attacker.id },
      data: {
        tilesOwned: attacker.tilesOwned + 1,
        gold: attacker.gold + COMBAT.captureBonusGold,
        army: attacker.army - order.amount, // Deduct committed army
      },
    });

    await db.empire.update({
      where: { id: defender.id },
      data: {
        tilesOwned: defender.tilesOwned - 1,
      },
    });

    // Log results
    await db.log.create({
      data: {
        turn,
        empireId: attacker.id,
        scope: 'EMPIRE',
        message: `Captured (${order.targetX}, ${order.targetY}) from ${defender.name}! +${COMBAT.captureBonusGold} gold`,
      },
    });

    await db.log.create({
      data: {
        turn,
        empireId: defender.id,
        scope: 'EMPIRE',
        message: `Lost (${order.targetX}, ${order.targetY}) to ${attacker.name}`,
      },
    });
  } else {
    // Defender wins
    await db.empire.update({
      where: { id: attacker.id },
      data: {
        army: attacker.army - order.amount, // Deduct committed army
      },
    });

    await db.log.create({
      data: {
        turn,
        empireId: attacker.id,
        scope: 'EMPIRE',
        message: `Attack on (${order.targetX}, ${order.targetY}) failed`,
      },
    });

    await db.log.create({
      data: {
        turn,
        empireId: defender.id,
        scope: 'EMPIRE',
        message: `Defended (${order.targetX}, ${order.targetY}) from ${attacker.name}`,
      },
    });
  }
}
