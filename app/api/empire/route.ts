import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { STARTING } from '../../../lib/game/constants';

export async function POST(request: NextRequest) {
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
      // Check if user exists with same email but different ID
      const existingUserByEmail = await db.user.findUnique({
        where: { email: user.email! },
      });

      if (existingUserByEmail) {
        // Update the existing user's ID to match the current Supabase user
        localUser = await db.user.update({
          where: { email: user.email! },
          data: { id: user.id },
        });
      } else {
        // Create user in local database if they don't exist
        localUser = await db.user.create({
          data: {
            id: user.id,
            email: user.email!,
          },
        });
      }
    }

    // Check if user already has an empire
    const existingEmpire = await db.empire.findUnique({
      where: { userId: user.id },
    });

    if (existingEmpire) {
      return NextResponse.json({ error: 'User already has an empire' }, { status: 400 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 });
    }

    // Check if name is already taken
    const nameExists = await db.empire.findFirst({
      where: { name },
    });

    if (nameExists) {
      return NextResponse.json({ error: 'Empire name already taken' }, { status: 400 });
    }

    // Find an unclaimed tile for the starting territory
    const startingTile = await db.tile.findFirst({
      where: { ownerId: null },
      orderBy: { id: 'asc' }, // Simple deterministic selection
    });

    if (!startingTile) {
      return NextResponse.json({ error: 'No available starting territory' }, { status: 400 });
    }

    // Create empire with starting resources
    const empire = await db.empire.create({
      data: {
        userId: user.id,
        name,
        color,
        food: STARTING.food,
        wood: STARTING.wood,
        stone: STARTING.stone,
        gold: STARTING.gold,
        army: STARTING.army,
        tilesOwned: 1, // Start with 1 tile
      },
    });

    // Assign the starting tile to the empire
    await db.tile.update({
      where: { id: startingTile.id },
      data: { ownerId: empire.id },
    });

    return NextResponse.json({ 
      empire: {
        ...empire,
        startingTile: {
          x: startingTile.x,
          y: startingTile.y,
          type: startingTile.type,
        },
      },
    });
  } catch (error) {
    console.error('Error creating empire:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
