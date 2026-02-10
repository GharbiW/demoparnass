
"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardCharts = dynamic(
  () => import('@/components/dashboard/dashboard-charts').then(mod => mod.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="xl:col-span-2 h-[380px]" />
        <Skeleton className="h-[380px]" />
        <Skeleton className="h-[360px]" />
        <Skeleton className="xl:col-span-2 h-[280px]" />
        <Skeleton className="h-[280px]" />
      </div>
    )
  }
);

export function DashboardLoader() {
    return <DashboardCharts />;
}
