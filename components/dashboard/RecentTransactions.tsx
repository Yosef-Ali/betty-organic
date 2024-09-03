import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const transactions = [
  { customer: "Liam Johnson", email: "liam@example.com", type: "Sale", status: "Approved", date: "2023-06-23", amount: "$250.00" },
  { customer: "Olivia Smith", email: "olivia@example.com", type: "Refund", status: "Declined", date: "2023-06-24", amount: "$150.00" },
  { customer: "Noah Williams", email: "noah@example.com", type: "Subscription", status: "Approved", date: "2023-06-25", amount: "$350.00" },
  { customer: "Emma Brown", email: "emma@example.com", type: "Sale", status: "Approved", date: "2023-06-26", amount: "$450.00" },
  { customer: "Liam Johnson", email: "liam@example.com", type: "Sale", status: "Approved", date: "2023-06-27", amount: "$550.00" },
];

export function RecentTransactions() {
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
              <TableHead className="hidden xl:table-column">Type</TableHead>
              <TableHead className="hidden xl:table-column">Status</TableHead>
              <TableHead className="hidden xl:table-column">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="font-medium">{transaction.customer}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">{transaction.email}</div>
                </TableCell>
                <TableCell className="hidden xl:table-column">{transaction.type}</TableCell>
                <TableCell className="hidden xl:table-column">
                  <Badge className="text-xs" variant="outline">{transaction.status}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell lg:hidden xl:table-column">{transaction.date}</TableCell>
                <TableCell className="text-right">{transaction.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}