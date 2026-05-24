"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Reservation = {
  id: string;
  status: string;
  expiresAt: string;
  quantity: number;
  stock: {
    product: {
      name: string;
      price: number;
      imageUrl: string;
    };
    warehouse: {
      name: string;
    }
  }
};

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const res = await fetch(`/api/reservations/${id}`);
        if (!res.ok) {
          toast.error("Reservation not found");
          router.push('/');
          return;
        }
        const data = await res.json();
        setReservation(data);
      } catch (err) {
        toast.error("Failed to load reservation");
      } finally {
        setLoading(false);
      }
    };
    fetchReservation();
  }, [id, router]);

  useEffect(() => {
    if (!reservation || reservation.status !== 'pending') return;

    const interval = setInterval(() => {
      const remaining = new Date(reservation.expiresAt).getTime() - new Date().getTime();
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        // Inform user it expired
        if (reservation.status === 'pending') {
          toast.error("Reservation expired. Returning to store.");
          router.push('/');
        }
      } else {
        setTimeLeft(Math.floor(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation, router]);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/reservations/${id}/confirm`, {
        method: 'POST',
      });
      
      const data = await res.json();

      if (res.status === 410) {
        toast.error("Reservation has expired. Someone else may have grabbed it.");
        router.push('/');
        return;
      }

      if (res.ok) {
        toast.success("Payment successful! Order confirmed.");
        setReservation(prev => prev ? { ...prev, status: 'confirmed' } : prev);
      } else {
        toast.error(data.error || "Failed to confirm order");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/reservations/${id}/release`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.info("Reservation cancelled.");
        router.push('/');
      } else {
        toast.error("Failed to cancel reservation");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading checkout...</div>;
  if (!reservation) return null;

  const isExpired = timeLeft !== null && timeLeft <= 0;
  const isPending = reservation.status === 'pending';
  const isConfirmed = reservation.status === 'confirmed';

  return (
    <main className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Checkout</CardTitle>
          <CardDescription>
            {isConfirmed ? 'Your order is complete!' : 'Complete your purchase to secure your item.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 items-center border p-4 rounded-lg bg-gray-50 mb-6">
            {reservation.stock.product.imageUrl && (
              <img 
                src={reservation.stock.product.imageUrl} 
                alt={reservation.stock.product.name} 
                className="w-24 h-24 object-cover rounded-md"
              />
            )}
            <div>
              <h3 className="font-bold text-xl">{reservation.stock.product.name}</h3>
              <p className="text-gray-500">Ships from {reservation.stock.warehouse.name}</p>
              <p className="font-semibold mt-2">${reservation.stock.product.price.toFixed(2)} x {reservation.quantity}</p>
            </div>
          </div>

          {isPending && !isExpired && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">Item Reserved!</p>
                <p className="text-sm">We are holding this item for you.</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase font-bold text-orange-600 mb-1">Time Remaining</p>
                <p className="text-3xl font-mono tabular-nums font-bold">
                  {Math.floor((timeLeft || 0) / 60)}:{(timeLeft || 0) % 60 < 10 ? '0' : ''}{(timeLeft || 0) % 60}
                </p>
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-2">🎉 Order Confirmed!</h2>
              <p>Thank you for your purchase. We'll email you shipping details soon.</p>
              <Button className="mt-4" onClick={() => router.push('/')}>Continue Shopping</Button>
            </div>
          )}
        </CardContent>
        {isPending && !isExpired && (
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" onClick={handleCancel} disabled={processing}>
              Cancel & Release
            </Button>
            <Button onClick={handleConfirm} disabled={processing || isExpired} size="lg" className="px-8">
              {processing ? 'Processing...' : 'Pay Now'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
