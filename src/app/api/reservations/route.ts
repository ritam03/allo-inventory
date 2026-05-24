import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const idempotencyKey = req.headers.get('idempotency-key');
    if (idempotencyKey) {
      const existing = await redis.get(`idem:${idempotencyKey}`);
      if (existing) {
        return NextResponse.json(typeof existing === 'string' ? JSON.parse(existing) : existing);
      }
    }

    const { productId, warehouseId, quantity = 1 } = await req.json();

    if (!productId || !warehouseId) {
      return NextResponse.json({ error: 'Missing productId or warehouseId' }, { status: 400 });
    }

    // Atomic decrement
    const result = await prisma.stock.updateMany({
      where: {
        productId,
        warehouseId,
        availableUnits: {
          gte: quantity
        }
      },
      data: {
        availableUnits: {
          decrement: quantity
        }
      }
    });

    if (result.count === 0) {
      const resp = { error: 'Not enough stock available' };
      if (idempotencyKey) {
        // Optionally cache failure? Usually we cache successful idempotent requests, but caching 409 is fine too.
      }
      return NextResponse.json(resp, { status: 409 });
    }

    // Get the stock ID to create the reservation
    const stock = await prisma.stock.findUnique({
      where: {
        productId_warehouseId: { productId, warehouseId }
      }
    });

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const reservation = await prisma.reservation.create({
      data: {
        stockId: stock.id,
        quantity,
        status: 'pending',
        expiresAt,
      }
    });

    if (idempotencyKey) {
      await redis.set(`idem:${idempotencyKey}`, JSON.stringify(reservation), { ex: 86400 });
    }

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
