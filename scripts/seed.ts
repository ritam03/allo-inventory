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
      name: 'Omron Hem 7120 Blood Pressure Monitor',
      description: 'Fully automatic blood pressure monitor with Intellisense technology.',
      price: 1899.00,
      imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80',
    }
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Accu-Chek Active Blood Glucose Meter',
      description: 'Accurate and easy-to-use blood glucose monitoring system.',
      price: 949.00,
      imageUrl: 'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?w=800&q=80',
    }
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Pulse Oximeter Fingertip',
      description: 'High-accuracy SpO2 and pulse rate measurement device.',
      price: 499.00,
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5e4a81411?w=800&q=80',
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
