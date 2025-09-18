import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const turns = await db.turn.findMany({
      where: {
        processedAt: { not: null },
      },
      orderBy: { id: 'desc' },
      take: limit,
    });

    return NextResponse.json(turns);
  } catch (error) {
    console.error('Error in /api/turns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
