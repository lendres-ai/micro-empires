import { db } from '@/lib/db';
import { processUpkeepPhase } from './phases/1_upkeep';
import { processProductionPhase } from './phases/2_production';
import { processExpansionPhase } from './phases/3_expansion';
import { processConflictPhase } from './phases/4_conflict';
import { processBuildPhase } from './phases/5_build';
import { processEventsPhase } from './phases/6_events';

export async function processTurn(targetTurn: number): Promise<void> {
  console.log(`Starting turn processing for turn ${targetTurn}`);

  // Check if turn already processed
  const existingTurn = await db.turn.findUnique({
    where: { id: targetTurn },
  });

  if (existingTurn?.processedAt) {
    console.log(`Turn ${targetTurn} already processed`);
    return;
  }

  const seed = process.env.GAME_WORLD_SEED || 'micro-empires-001';
  
  try {
    // Create or update turn record
    await db.turn.upsert({
      where: { id: targetTurn },
      update: {},
      create: {
        id: targetTurn,
        seed,
      },
    });

    // Fetch all pending orders for this turn
    const pendingOrders = await db.order.findMany({
      where: {
        turn: targetTurn,
        status: 'PENDING',
      },
    });

    console.log(`Found ${pendingOrders.length} pending orders for turn ${targetTurn}`);

    // Process phases in order
    await processUpkeepPhase(targetTurn);
    await processProductionPhase(targetTurn);
    await processExpansionPhase(targetTurn, seed);
    await processConflictPhase(targetTurn, seed);
    await processBuildPhase(targetTurn);
    await processEventsPhase(targetTurn, seed);

    // Mark all orders as applied
    await db.order.updateMany({
      where: {
        turn: targetTurn,
        status: 'PENDING',
      },
      data: {
        status: 'APPLIED',
      },
    });

    // Mark turn as processed
    await db.turn.update({
      where: { id: targetTurn },
      data: {
        processedAt: new Date(),
      },
    });

    console.log(`Turn ${targetTurn} processed successfully`);
  } catch (error) {
    console.error(`Error processing turn ${targetTurn}:`, error);
    throw error;
  }
}
