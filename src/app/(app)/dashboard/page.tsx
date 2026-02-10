
import { KpiCard } from "@/components/dashboard/kpi-card";
import { kpiData } from "@/lib/data";
import { DashboardLoader } from "@/components/dashboard/dashboard-loader";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <DashboardLoader />
    </div>
  );
}
