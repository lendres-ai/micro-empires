import { NextResponse } from 'next/server';
import { getMapState } from '../../../lib/game/map';

export async function GET() {
  try {
    const mapState = await getMapState();
    return NextResponse.json(mapState);
  } catch (error) {
    console.error('Error in /api/map:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
