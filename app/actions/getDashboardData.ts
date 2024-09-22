import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDashboardData() {
  // Calculate total revenue from orders
  const totalRevenueResult = await prisma.order.aggregate({
    _sum: {
      totalAmount: true,
    },
  });
  const totalRevenue = totalRevenueResult._sum.totalAmount || 0;

  // Count total number of subscriptions (customers)
  const subscriptions = await prisma.customer.count();

  // Count total number of sales (orders)
  const sales = await prisma.order.count();

  // Define the time frame (customers who have placed an order in the last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Count number of active customers based on recent orders
  const activeNow = await prisma.customer.count({
    where: {
      orders: {
        some: {
          createdAt: {
            gte: oneHourAgo,
          },
        },
      },
    },
  });

  return {
    totalRevenue,
    subscriptions,
    sales,
    activeNow,
  };
}
