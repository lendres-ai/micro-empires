import { NextRequest, NextResponse } from 'next/server';
import { processTurn } from '@/lib/game/processor';
import { generateMap } from '@/lib/game/map';
import { db } from '@/lib/db';

async function handle(request: NextRequest) {
  try {
    // Accept either Authorization: Bearer <CRON_SECRET> or X-CRON-KEY: <CRON_SECRET>
    const authHeader = request.headers.get('authorization');
    const xCronKey = request.headers.get('x-cron-key');
    const bearer = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;

    const provided = bearer ?? xCronKey;
    if (!process.env.CRON_SECRET || provided !== process.env.CRON_SECRET) {
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

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
