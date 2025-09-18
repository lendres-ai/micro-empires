import { NextRequest, NextResponse } from 'next/server';
import { processTurn } from '@/lib/game/processor';
import { generateMap } from '@/lib/game/map';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret using Authorization: Bearer <CRON_SECRET>
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine next turn as last processed turn id + 1
    const lastTurn = await db.turn.findFirst({
      orderBy: { id: 'desc' },
    });
    const nextTurn = (lastTurn?.id ?? 0) + 1;
    
    // Ensure map exists
    const seed = process.env.GAME_WORLD_SEED || 'micro-empires-001';
    await generateMap(seed);

    // Process the turn
    await processTurn(nextTurn);

    return NextResponse.json({ 
      message: `Turn ${nextTurn} processed successfully`,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/cron/process-turn:', error);
    return NextResponse.json({ 
      error: 'Turn processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
