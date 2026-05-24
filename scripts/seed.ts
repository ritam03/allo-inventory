import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clear existing
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const warehouse1 = await prisma.warehouse.create({
    data: { name: 'East Coast Hub', location: 'New York, NY' }
  });

  const warehouse2 = await prisma.warehouse.create({
    data: { name: 'West Coast Hub', location: 'Los Angeles, CA' }
  });

  const product1 = await prisma.product.create({
    data: {
      name: 'Premium Wireless Headphones',
      description: 'Noise-cancelling over-ear headphones with 40-hour battery life.',
      price: 299.99,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    }
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Mechanical Keyboard',
      description: 'Hot-swappable mechanical keyboard with RGB backlighting.',
      price: 149.99,
      imageUrl: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80',
    }
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Limited Edition Sneakers',
      description: 'Extremely limited run sneakers. Get them before they are gone.',
      price: 199.99,
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    }
  });

  // Stock
  await prisma.stock.createMany({
    data: [
      { productId: product1.id, warehouseId: warehouse1.id, totalUnits: 10, availableUnits: 10 },
      { productId: product1.id, warehouseId: warehouse2.id, totalUnits: 5, availableUnits: 5 },
      { productId: product2.id, warehouseId: warehouse1.id, totalUnits: 0, availableUnits: 0 },
      { productId: product2.id, warehouseId: warehouse2.id, totalUnits: 20, availableUnits: 20 },
      { productId: product3.id, warehouseId: warehouse1.id, totalUnits: 2, availableUnits: 2 }, // High concurrency testing
    ]
  });

  console.log('Database seeded!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
