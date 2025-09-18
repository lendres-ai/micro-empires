import { NextResponse } from 'next/server';
import { getMapState } from '../../../lib/game/map';

export async function GET() {
  try {
    const mapState = await getMapState();
    return new NextResponse(JSON.stringify(mapState), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error in /api/map:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
