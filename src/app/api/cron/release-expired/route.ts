import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    
    // Find all expired pending reservations
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'pending',
        expiresAt: { lt: now }
      }
    });

    let releasedCount = 0;

    for (const res of expiredReservations) {
      // Try to release them atomically
      const { count } = await prisma.reservation.updateMany({
        where: {
          id: res.id,
          status: 'pending',
          expiresAt: { lt: now }
        },
        data: {
          status: 'released'
        }
      });

      if (count > 0) {
        // Increment stock
        await prisma.stock.update({
          where: { id: res.stockId },
          data: { availableUnits: { increment: res.quantity } }
        });
        releasedCount++;
      }
    }

    return NextResponse.json({ message: `Released ${releasedCount} expired reservations.` }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
