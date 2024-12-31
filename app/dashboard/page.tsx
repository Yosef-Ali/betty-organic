'use client'

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <DashboardHeader />
      <DashboardClient />
    </main>
  );
}
