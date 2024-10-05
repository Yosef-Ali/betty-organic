"use server";

import { PrismaClient } from '@prisma/client';

// Define a type for the transaction
interface Transaction {
  customer: {
    fullName: string;
    email: string | null;
  };
  type: string;
  status: string;
  createdAt: Date;
  totalAmount: number;
}

// Define a type for the mapped transaction
interface MappedTransaction {
  customer: string;
  email: string;
  type: string;
  status: string;
  date: string;
  amount: string;
}

const prisma = new PrismaClient();

// Update the getRecentTransactions function
export async function getRecentTransactions(): Promise<MappedTransaction[]> {
  const transactions: Transaction[] = await prisma.order.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      customer: true, // Include customer data
    },
  });

  // Map the transactions to the desired format
  return transactions.map((transaction: Transaction): MappedTransaction => ({
    customer: transaction.customer.fullName,
    email: transaction.customer.email || '',
    type: transaction.type,
    status: transaction.status,
    date: transaction.createdAt.toISOString().split('T')[0],
    amount: `$${transaction.totalAmount.toFixed(2)}`,
  }));
}

// Update the mapTransactions function
export async function mapTransactions(transactions: Transaction[]): Promise<Pick<MappedTransaction, 'customer' | 'email'>[]> {
  return transactions.map((transaction: Transaction) => ({
    customer: transaction.customer.fullName,
    email: transaction.customer.email || '',
  }));
}
