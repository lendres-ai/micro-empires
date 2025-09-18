import { NextResponse } from 'next/server';
import { getUser } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { getActiveTurnNumber } from '@/lib/turns';
import { MAX_DAILY_ORDERS } from '@/lib/game/constants';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }

    // Ensure user exists in local database
    let localUser = await db.user.findUnique({
      where: { id: user.id },
    });

    if (!localUser) {
      // Create user in local database if they don't exist
      localUser = await db.user.create({
        data: {
          id: user.id,
          email: user.email!,
        },
      });
    }

    const activeTurn = await getActiveTurnNumber();

    const empire = await db.empire.findUnique({
      where: { userId: user.id },
      include: {
        tiles: true,
        orders: {
          where: {
            turn: activeTurn,
            status: 'PENDING',
          },
        },
      },
    });

    if (!empire) {
      return NextResponse.json({ 
        user: { id: user.id, email: user.email },
        empire: null,
        resources: null,
        actionsRemaining: 0,
        latestTurn: activeTurn,
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const actionsRemaining = Math.max(0, MAX_DAILY_ORDERS - empire.orders.length);

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      empire: {
        id: empire.id,
        name: empire.name,
        color: empire.color,
        tilesOwned: empire.tilesOwned,
        isEliminated: empire.isEliminated,
      },
      resources: {
        food: empire.food,
        wood: empire.wood,
        stone: empire.stone,
        gold: empire.gold,
        army: empire.army,
      },
      orders: empire.orders,
      actionsRemaining,
      latestTurn: activeTurn,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error in /api/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
