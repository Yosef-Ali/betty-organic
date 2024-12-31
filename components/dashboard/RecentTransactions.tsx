'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getRecentTransactions } from '@/app/actions/getRecentTransactions';
import { MappedTransaction } from '@/app/actions/getRecentTransactions'; // Import the interface

interface RecentTransactionsProps {
  data: MappedTransaction[]; // Update the prop type
}

export function RecentTransactions({ data }: RecentTransactionsProps) {
  if (!data) return <div>No transactions available</div>;

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
            {data.map((transaction, index) => (
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
