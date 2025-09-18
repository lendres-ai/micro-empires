import { db } from '@/lib/db';

/**
 * Returns the last processed turn record (if any).
 */
export async function getLastProcessedTurn() {
  return db.turn.findFirst({
    where: { processedAt: { not: null } },
    orderBy: { id: 'desc' },
  });
}

/**
 * Returns the active turn number players should submit orders for.
 * If no turns have been processed yet, this is 1.
 */
export async function getActiveTurnNumber(): Promise<number> {
  const lastTurn = await getLastProcessedTurn();
  return (lastTurn?.id ?? 0) + 1;
}

