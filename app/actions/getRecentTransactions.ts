"use server";

import { supabase } from '@/lib/supabase';

// Define a type for the transaction
interface Transaction {
  customer: {
    full_name: string;
    email: string | null;
  };
  type: string;
  status: string;
  created_at: Date;
  total_amount: number;
}

// **Export the MappedTransaction interface**
export interface MappedTransaction {
  customer: string;
  email: string;
  type: string;
  status: string;
  date: string;
  amount: string;
}

// Update the getRecentTransactions function
export async function getRecentTransactions(): Promise<MappedTransaction[]> {
  const { data: transactions, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(`Failed to fetch recent transactions: ${error.message}`);
  }

  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Map the transactions to the desired format
  return transactions.map((transaction: Transaction): MappedTransaction => ({
    customer: transaction.customer.full_name,
    email: transaction.customer.email || '',
    type: transaction.type,
    status: transaction.status,
    date: new Date(transaction.created_at).toISOString().split('T')[0],
    amount: `$${transaction.total_amount.toFixed(2)}`,
  }));
}

// Update the mapTransactions function
export async function mapTransactions(transactions: Transaction[]): Promise<Pick<MappedTransaction, 'customer' | 'email'>[]> {
  if (!transactions) {
    throw new Error('No transactions provided to map');
  }

  return transactions.map((transaction: Transaction) => ({
    customer: transaction.customer.full_name,
    email: transaction.customer.email || '',
  }));
}
