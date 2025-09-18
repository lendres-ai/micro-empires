import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { getCurrentTurnNumber } from '../../../lib/time';
import { validateOrder } from '../../../lib/game/rules';
import { OrderType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const empire = await db.empire.findUnique({
      where: { userId: user.id },
    });

    if (!empire) {
      return NextResponse.json({ error: 'Empire not found' }, { status: 404 });
    }

    const body = await request.json();
    const { type, targetX, targetY, amount, metadata } = body;

    if (!type || !Object.values(OrderType).includes(type)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 });
    }

    const currentTurn = getCurrentTurnNumber();

    // Validate the order
    const validation = await validateOrder(
      empire.id,
      currentTurn,
      type,
      targetX,
      targetY,
      amount
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Create the order
    const order = await db.order.create({
      data: {
        empireId: empire.id,
        turn: currentTurn,
        type,
        targetX,
        targetY,
        amount,
        metadata,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error in /api/orders POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const empire = await db.empire.findUnique({
      where: { userId: user.id },
    });

    if (!empire) {
      return NextResponse.json({ error: 'Empire not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const currentTurn = getCurrentTurnNumber();

    // Delete the order (only if it belongs to this empire and is pending)
    const deletedOrder = await db.order.deleteMany({
      where: {
        id: orderId,
        empireId: empire.id,
        turn: currentTurn,
        status: 'PENDING',
      },
    });

    if (deletedOrder.count === 0) {
      return NextResponse.json({ error: 'Order not found or cannot be deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/orders DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
