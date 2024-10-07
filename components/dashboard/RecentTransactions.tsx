// app/components/RecentTransactions.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getRecentTransactions } from "@/app/actions/getRecentTransactions";

interface Transaction {
  customer: string;
  email: string;
  type: string;
  status: string;
  date: string;
  amount: string;
}

export default async function RecentTransactions() {


  let transactions: Transaction[] = [];
  let error = null;

  try {
    transactions = await getRecentTransactions();
  } catch (err) {
    error = 'Failed to fetch transactions';
  }

  if (error) return <div>{error}</div>;
  if (transactions.length === 0) return <div>No transactions found</div>;

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Recent transactions from your store.</CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
          <Link href="#">
            View All
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden xl:table-cell">Type</TableHead>
              <TableHead className="hidden xl:table-cell">Status</TableHead>
              <TableHead className="hidden xl:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="font-medium">{transaction.customer}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {transaction.email}
                  </div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">{transaction.type}</TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Badge className="text-xs" variant="outline">
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell lg:hidden xl:table-cell">
                  {transaction.date}
                </TableCell>
                <TableCell className="text-right">{transaction.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
