import bcrypt from 'bcryptjs';
import { PrismaClient, TransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

const seed = async () => {
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      phone: '+15550000001',
      passwordHash,
    },
  });

  const customers = await Promise.all(
    Array.from({ length: 8 }).map((_, index) =>
      prisma.customer.create({
        data: {
          name: `Customer ${index + 1}`,
          avatarUrl: `https://i.pravatar.cc/150?img=${index + 1}`,
        },
      }),
    ),
  );

  const statuses: TransactionStatus[] = ['completed', 'pending', 'failed'];
  const now = new Date();

  for (let i = 0; i < 40; i += 1) {
    const customer = customers[i % customers.length];
    const amount = Number((Math.random() * 900 + 50).toFixed(2));
    const status = statuses[i % statuses.length];
    const paidAt = new Date(now.getTime() - i * 86_400_000);

    await prisma.transaction.create({
      data: {
        amount,
        status,
        paidAt,
        customerId: customer.id,
      },
    });
  }

  return { adminId: admin.id, customerCount: customers.length };
};

seed()
  .then((result) => {
    console.log('Seed complete', result);
  })
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
