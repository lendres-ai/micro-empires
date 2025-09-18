import { NextResponse } from 'next/server';
import { getUser } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { getCurrentTurnNumber } from '../../../lib/time';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const empire = await db.empire.findUnique({
      where: { userId: user.id },
      include: {
        tiles: true,
        orders: {
          where: {
            turn: getCurrentTurnNumber(),
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
        latestTurn: getCurrentTurnNumber(),
      });
    }

    const actionsRemaining = Math.max(0, 3 - empire.orders.length);

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
      latestTurn: getCurrentTurnNumber(),
    });
  } catch (error) {
    console.error('Error in /api/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
