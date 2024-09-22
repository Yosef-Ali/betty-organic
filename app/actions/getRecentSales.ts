'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getRecentSales() {
  try {
    const recentSales = await prisma.order.findMany({
      where: {
        status: 'paid',
      },
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return recentSales;
  } catch (error) {
    console.error('Failed to fetch recent sales:', error);
    throw error;
  }
}
