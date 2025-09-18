import type { NextRequest } from 'next/server';
import { processTurn } from '@/lib/game/processor';
import { generateMap } from '@/lib/game/map';
import { db } from '@/lib/db';
import { getCurrentTurnNumber } from '@/lib/time';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret via Authorization header (Vercel sends Bearer token)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Determine current target turn based on time and catch up any missed turns
    const lastTurn = await db.turn.findFirst({
      orderBy: { id: 'desc' },
    });
    const currentTurn = getCurrentTurnNumber();

    // Ensure map exists
    const seed = process.env.GAME_WORLD_SEED || 'micro-empires-001';
    await generateMap(seed);

    // Process all unprocessed turns up to the current turn (inclusive)
    const startTurn = (lastTurn?.id ?? 0) + 1;
    const processedTurns: number[] = [];

    for (let turn = startTurn; turn <= currentTurn; turn++) {
      await processTurn(turn);
      processedTurns.push(turn);
    }

    return Response.json({
      message: processedTurns.length > 0
        ? `Processed turns: ${processedTurns.join(', ')}`
        : 'No turns to process',
      processedAt: new Date().toISOString(),
      currentTurn,
    });
  } catch (error) {
    console.error('Error in /api/cron/process-turn:', error);
    return new Response('Turn processing failed', { status: 500 });
  }
}
