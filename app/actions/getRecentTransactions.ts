"use server";

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function getRecentTransactions() {
  // Fetch the most recent 5 transactions
  const transactions = await prisma.order.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      customer: true, // Include customer data
    },
  });

  // Map the transactions to the desired format
  return transactions.map((transaction) => ({
    customer: transaction.customer.fullName,
    email: transaction.customer.email || '',
    type: transaction.type,
    status: transaction.status,
    date: transaction.createdAt.toISOString().split('T')[0],
    amount: `$${transaction.totalAmount.toFixed(2)}`,
  }));
}
