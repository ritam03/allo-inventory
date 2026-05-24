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
    data: { name: 'North India Fulfillment Center', location: 'New Delhi, DL' }
  });

  const warehouse2 = await prisma.warehouse.create({
    data: { name: 'South India Hub', location: 'Bengaluru, KA' }
  });

  const product1 = await prisma.product.create({
    data: {
      name: 'Paracetamol 500mg (10 Tablets)',
      description: 'Effective pain relief and fever reduction medication.',
      price: 25.00,
      imageUrl: '/medicine.png',
    }
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Vitamin C 1000mg (20 Tablets)',
      description: 'Daily immunity booster with natural citrus extract.',
      price: 150.00,
      imageUrl: '/medicine.png',
    }
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Aspirin 75mg (15 Tablets)',
      description: 'Low-dose aspirin for daily heart health support.',
      price: 45.00,
      imageUrl: '/medicine.png',
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
