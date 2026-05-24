import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.status === 'released') {
      return NextResponse.json({ message: 'Already released' }, { status: 200 }); // Idempotent
    }

    if (reservation.status === 'confirmed') {
      return NextResponse.json({ error: 'Cannot release a confirmed reservation' }, { status: 400 });
    }

    // Atomic update
    const { count } = await prisma.reservation.updateMany({
      where: {
        id,
        status: 'pending'
      },
      data: {
        status: 'released'
      }
    });

    if (count === 0) {
      return NextResponse.json({ error: 'Failed to release reservation' }, { status: 409 });
    }

    // Increment available units back
    await prisma.stock.update({
      where: { id: reservation.stockId },
      data: {
        availableUnits: { increment: reservation.quantity }
      }
    });

    return NextResponse.json({ message: 'Reservation released successfully' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
