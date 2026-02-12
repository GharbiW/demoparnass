"use client";

import { PlanningHealthMetrics } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Truck,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Clock,
  Shield,
  Package,
  CalendarX,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthTilesProps {
  metrics: PlanningHealthMetrics;
  onTileClick?: (filter: string) => void;
}

function Tile({
  icon: Icon,
  label,
  value,
  detail,
  color,
  onClick,
  tooltip,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  detail?: string;
  color: string;
  onClick?: () => void;
  tooltip?: string;
}) {
  const colorMap: Record<string, string> = {
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };

  const iconColorMap: Record<string, string> = {
    rose: "text-rose-500",
    amber: "text-amber-500",
    sky: "text-sky-500",
    emerald: "text-emerald-500",
    violet: "text-violet-500",
    slate: "text-slate-500",
    orange: "text-orange-500",
  };

  const content = (
    <Card
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 border cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
        colorMap[color] || colorMap.slate
      )}
      onClick={onClick}
    >
      <div className={cn("shrink-0", iconColorMap[color] || iconColorMap.slate)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide font-medium opacity-70 truncate">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold leading-tight">{value}</span>
          {detail && <span className="text-[10px] opacity-60 truncate">{detail}</span>}
        </div>
      </div>
    </Card>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export function HealthTiles({ metrics, onTileClick }: HealthTilesProps) {
  const totalAbsent = metrics.absentDrivers.reduce((sum, d) => sum + d.count, 0);
  const totalImpactedByAbsence = metrics.absentDrivers.reduce((sum, d) => sum + d.impactedCourses, 0);
  const placedPercent = metrics.coursesTotal > 0
    ? Math.round((metrics.coursesPlaced / metrics.coursesTotal) * 100)
    : 0;
  const remainingCourses = metrics.coursesTotal - metrics.coursesPlaced;

  // Dynamic colors based on progression
  // Green if all issues resolved (impactedCourses === 0)
  const absentDriversColor = totalImpactedByAbsence === 0 ? "emerald" : "rose";
  const unavailableVehiclesColor = metrics.unavailableVehicles.impactedCourses === 0 ? "emerald" : "amber";
  const placedCoursesColor = placedPercent > 80 ? "emerald" : placedPercent > 60 ? "amber" : "rose";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
      {/* Resources */}
      <Tile
        icon={Users}
        label="Conducteurs absents"
        value={totalAbsent}
        detail={`${totalImpactedByAbsence} courses`}
        color={absentDriversColor}
        onClick={() => onTileClick?.("absent_drivers")}
        tooltip={metrics.absentDrivers.map(d => `${d.type}: ${d.count} (${d.impactedCourses} courses)`).join(' | ')}
      />

      <Tile
        icon={Truck}
        label="Véhicules indispos"
        value={metrics.unavailableVehicles.count}
        detail={`${metrics.unavailableVehicles.impactedCourses} courses`}
        color={unavailableVehiclesColor}
        onClick={() => onTileClick?.("unavailable_vehicles")}
        tooltip={`${metrics.unavailableVehicles.count} véhicules initialement planifiés sont indisponibles`}
      />

      {/* Demand */}
      <Tile
        icon={Package}
        label="Courses placées"
        value={`${placedPercent}%`}
        detail={`${remainingCourses} restantes`}
        color={placedCoursesColor}
        onClick={() => onTileClick?.("unplaced")}
        tooltip={`${metrics.coursesPlaced}/${metrics.coursesTotal} | SUP: ${metrics.coursesSupToPlace} | Rég: ${metrics.coursesRegToPlace} | Sensibles: ${metrics.sensitivesToPlace}`}
      />

      <Tile
        icon={CalendarX}
        label="Modifications"
        value={metrics.modifications.annulations + metrics.modifications.changements}
        detail={`${metrics.modifications.annulations} annul. / ${metrics.modifications.changements} modif.`}
        color="orange"
        onClick={() => onTileClick?.("modifications")}
        tooltip="Annulations et modifications sur les prestations régulières"
      />

      <Tile
        icon={Clock}
        label="Prestas échéance"
        value={metrics.prestationsExpiring4Weeks}
        detail="dans 4 sem."
        color="violet"
        onClick={() => onTileClick?.("expiring")}
        tooltip="Prestations arrivant à échéance dans les 4 prochaines semaines"
      />

      {/* Rules / Compliance */}
      <Tile
        icon={AlertTriangle}
        label="Alertes"
        value={metrics.alertsByLevel.critical + metrics.alertsByLevel.warning}
        detail={`${metrics.alertsByLevel.critical} crit.`}
        color={metrics.alertsByLevel.critical > 0 ? "rose" : "amber"}
        onClick={() => onTileClick?.("alerts")}
        tooltip={`Critiques: ${metrics.alertsByLevel.critical} | Warnings: ${metrics.alertsByLevel.warning} | Info: ${metrics.alertsByLevel.info}`}
      />

      <Tile
        icon={Shield}
        label="Hors amplitude"
        value={metrics.driversOutOfAmplitude.above + metrics.driversOutOfAmplitude.below}
        detail={`${metrics.driversOutOfAmplitude.above}↑ ${metrics.driversOutOfAmplitude.below}↓`}
        color="sky"
        onClick={() => onTileClick?.("amplitude")}
        tooltip={`${metrics.driversOutOfAmplitude.above} au-dessus de l'amplitude max | ${metrics.driversOutOfAmplitude.below} en-dessous du min`}
      />
    </div>
  );
}
