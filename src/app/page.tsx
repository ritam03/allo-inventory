"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Warehouse = { id: string; name: string; location: string };
type Stock = { id: string; warehouseId: string; totalUnits: number; availableUnits: number; warehouse: Warehouse };
type Product = { id: string; name: string; description: string; price: number; imageUrl: string; stocks: Stock[] };

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleReserve = async (productId: string, warehouseId: string) => {
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify({ productId, warehouseId, quantity: 1 })
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.error("Not enough stock available. Someone else might have grabbed the last unit!");
        fetchProducts(); // Refresh to show correct stock
        return;
      }

      if (res.ok) {
        toast.success("Item reserved successfully!");
        router.push(`/checkout/${data.id}`);
      } else {
        toast.error(data.error || "Failed to reserve item");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading products...</div>;

  return (
    <main className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8">Allo Store</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader>
              {product.imageUrl && (
                <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-md mb-4" />
              )}
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-2xl font-bold mb-4">${product.price.toFixed(2)}</p>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm uppercase text-gray-500">Availability</h4>
                {product.stocks.map(stock => (
                  <div key={stock.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{stock.warehouse.name}</p>
                      <p className="text-xs text-gray-500">{stock.warehouse.location}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge variant={stock.availableUnits > 0 ? "default" : "destructive"}>
                        {stock.availableUnits} left
                      </Badge>
                      <Button 
                        size="sm" 
                        className="mt-2" 
                        disabled={stock.availableUnits === 0}
                        onClick={() => handleReserve(product.id, stock.warehouseId)}
                      >
                        Reserve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
