import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params; // Needs to be awaited in Next.js 15+ if using App router properly, but params is a Promise in 15. We are on Next 15.

    // Try to atomically mark as confirmed if it is still pending and not expired.
    const now = new Date();
    
    // First fetch to get quantity and stockId, and check current status
    const reservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.status === 'confirmed') {
      return NextResponse.json({ message: 'Already confirmed' }, { status: 200 });
    }

    if (reservation.status === 'released') {
      return NextResponse.json({ error: 'Reservation already released' }, { status: 410 });
    }

    if (now > reservation.expiresAt) {
      return NextResponse.json({ error: 'Reservation expired' }, { status: 410 });
    }

    // Atomic update to prevent race conditions with release/cron jobs
    const { count } = await prisma.reservation.updateMany({
      where: {
        id,
        status: 'pending',
      },
      data: {
        status: 'confirmed'
      }
    });

    if (count === 0) {
      // Must have been modified concurrently
      return NextResponse.json({ error: 'Failed to confirm reservation' }, { status: 409 });
    }

    // Decrement totalUnits since it's confirmed
    await prisma.stock.update({
      where: { id: reservation.stockId },
      data: {
        totalUnits: { decrement: reservation.quantity }
      }
    });

    return NextResponse.json({ message: 'Reservation confirmed successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
