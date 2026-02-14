"use client";

import React, { useState, useMemo, useCallback, memo } from "react";
import { Course, Tournee } from "@/lib/types";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Shield,
  Zap,
  Truck,
  User,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  Fuel,
  UserPlus,
  Package,
  Route,
  ArrowRight,
  CircleDot,
  Expand,
  Shrink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GroupingMode = "tournee" | "vehicle" | "driver" | "none";
type ViewMode = "vehicles" | "drivers" | "tournees";
type SortColumn = "time" | "date" | "client" | "vehicleType" | "status" | "tournee";
type SortDirection = "asc" | "desc";

interface ListViewGroupedProps {
  courses: Course[];
  tournees?: Tournee[];
  viewMode: ViewMode;
  onCourseClick: (course: Course) => void;
}

interface GroupedCourses {
  groupKey: string;
  groupLabel: string;
  groupSubLabel?: string;
  courses: Course[];
  tourneeCode?: string;
  tournee?: Tournee;
  // Extra metadata for rich headers
  vehicleImmat?: string;
  vehicleType?: string;
  vehicleEnergy?: string;
  driverName?: string;
  driverType?: string;
  driver2Name?: string;
  isDualDriver?: boolean;
  serviceLocation?: string;
  serviceTime?: string;
}

// ─── Day pills ──────────────────────────────────────────────────────────────

const DAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"] as const;
const DAY_MAP: Record<number, string> = { 1: "Lu", 2: "Ma", 3: "Me", 4: "Je", 5: "Ve", 6: "Sa", 0: "Di" };

function DayPills({ days, size = "sm" }: { days: string[]; size?: "sm" | "xs" }) {
  return (
    <div className="flex items-center gap-[2px]">
      {DAY_LABELS.map((d) => {
        const active = days.includes(d);
        return (
          <span
            key={d}
            className={cn(
              "inline-flex items-center justify-center rounded font-semibold leading-none",
              size === "sm" ? "w-[22px] h-[18px] text-[9px]" : "w-[18px] h-[14px] text-[8px]",
              active
                ? "bg-sky-100 text-sky-700 border border-sky-300"
                : "bg-slate-50/50 text-slate-300 border border-slate-100"
            )}
          >
            {d}
          </span>
        );
      })}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeGroupSummary(courses: Course[]) {
  const assigned = courses.filter(c => c.assignmentStatus === "affectee").length;
  const partial = courses.filter(c => c.assignmentStatus === "partiellement_affectee").length;
  const unassigned = courses.filter(c => c.assignmentStatus === "non_affectee").length;

  let amplitudeLabel = "";
  let totalHours = 0;
  if (courses.length > 0) {
    const times = courses.map(c => c.startTime).sort();
    const endTimes = courses.map(c => c.endTime).sort();
    const earliest = times[0];
    const latest = endTimes[endTimes.length - 1];
    amplitudeLabel = `${earliest} → ${latest}`;

    const toMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const totalMin = courses.reduce((sum, c) => {
      const d = toMin(c.endTime) - toMin(c.startTime);
      return sum + (d > 0 ? d : d + 1440);
    }, 0);
    totalHours = totalMin / 60;
    const totalH = Math.floor(totalMin / 60);
    const totalM = totalMin % 60;
    amplitudeLabel += ` (${totalH}h${totalM > 0 ? String(totalM).padStart(2, "0") : ""})`;
  }

  const days = Array.from(new Set(courses.map(c => DAY_MAP[new Date(c.date).getDay()] || "")));
  const pct = courses.length > 0 ? Math.round((assigned / courses.length) * 100) : 0;

  return { assigned, partial, unassigned, amplitudeLabel, days, pct, totalHours };
}

// Aggregate repetitive courses
interface AggregatedRow {
  representativeCourse: Course;
  allCourses: Course[];
  days: string[];
  isAggregated: boolean;
}

function aggregateCourses(courses: Course[]): AggregatedRow[] {
  const routeGroups = new Map<string, Course[]>();

  courses.forEach(course => {
    const sig = `${course.startLocation}|${course.endLocation}|${course.startTime}|${course.endTime}|${course.client || ""}|${course.requiredVehicleType}|${course.driverSlot || ""}`;
    if (!routeGroups.has(sig)) routeGroups.set(sig, []);
    routeGroups.get(sig)!.push(course);
  });

  const rows: AggregatedRow[] = [];
  routeGroups.forEach((groupCourses) => {
    const days = Array.from(new Set(groupCourses.map(c => DAY_MAP[new Date(c.date).getDay()] || "")));
    rows.push({
      representativeCourse: groupCourses[0],
      allCourses: groupCourses,
      days,
      isAggregated: groupCourses.length > 1,
    });
  });

  // Sort by time
  rows.sort((a, b) => a.representativeCourse.startTime.localeCompare(b.representativeCourse.startTime));
  return rows;
}

// ─── CDC Compliance Helpers ──────────────────────────────────────────────────

type CDCAlert = {
  type: 'energy_mismatch' | 'vehicle_type_mismatch' | 'driver_skill_missing';
  message: string;
  severity: 'warning' | 'error';
};

function checkCDCCompliance(course: Course, tournee?: Tournee): CDCAlert[] {
  const alerts: CDCAlert[] = [];

  // Energy mismatch: required energy vs assigned vehicle energy
  if (course.requiredVehicleEnergy && tournee?.vehicleEnergy) {
    if (course.requiredVehicleEnergy !== tournee.vehicleEnergy) {
      alerts.push({
        type: 'energy_mismatch',
        message: `Énergie requise: ${course.requiredVehicleEnergy}, véhicule: ${tournee.vehicleEnergy}`,
        severity: 'warning',
      });
    }
  }

  // Vehicle type mismatch: required type vs assigned vehicle type
  if (course.requiredVehicleType && tournee?.vehicleType) {
    const normalizeType = (t: string) => t === 'Caisse mobile' ? 'CM' : t;
    if (normalizeType(course.requiredVehicleType) !== normalizeType(tournee.vehicleType)) {
      alerts.push({
        type: 'vehicle_type_mismatch',
        message: `Type véhicule requis: ${course.requiredVehicleType}, affecté: ${tournee.vehicleType}`,
        severity: 'error',
      });
    }
  }

  // Driver skill requirements not met
  if (course.requiredDriverSkills.length > 0 && course.assignedDriverId) {
    // In a real scenario, check driver's actual skills
    // For now, flag if the course requires special skills
    if (course.constraintWarnings && course.constraintWarnings.length > 0) {
      alerts.push({
        type: 'driver_skill_missing',
        message: course.constraintWarnings.join(', '),
        severity: 'warning',
      });
    }
  }

  return alerts;
}

/** Abbreviate vehicle types for compact display */
function abbreviateVehicleType(type: string): string {
  switch (type) {
    case 'Caisse mobile': return 'CM';
    case 'Semi-remorque': return 'SPL';
    default: return type;
  }
}

// ─── Status indicator dot ───────────────────────────────────────────────────

function StatusDot({ status }: { status: Course["assignmentStatus"] }) {
  return (
    <span className={cn(
      "inline-block w-2 h-2 rounded-full shrink-0",
      status === "affectee" && "bg-emerald-500",
      status === "partiellement_affectee" && "bg-amber-500",
      status === "non_affectee" && "bg-rose-400"
    )} />
  );
}

// ─── Progress bar mini ──────────────────────────────────────────────────────

function MiniProgress({ pct }: { pct: number }) {
  return (
    <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-rose-400"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Group Header Components (per view mode) ────────────────────────────────

function TourneeGroupHeader({
  group,
  summary,
  isCollapsed,
  onToggle,
}: {
  group: GroupedCourses;
  summary: ReturnType<typeof computeGroupSummary>;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const { tournee, isDualDriver } = group;
  const hasVehicle = !!group.vehicleImmat;
  const hasDriver = !!group.driverName;
  const isUnassigned = !hasVehicle && !hasDriver;

  return (
    <TableRow
      className={cn(
        "cursor-pointer select-none transition-colors group/header",
        isUnassigned
          ? "bg-rose-50/60 hover:bg-rose-50"
          : isDualDriver
            ? "bg-indigo-50/40 hover:bg-indigo-50/60"
            : "bg-slate-50 hover:bg-slate-100/80"
      )}
      onClick={onToggle}
    >
      <TableCell colSpan={100} className="py-2 px-3">
        <div className="flex items-center gap-2.5">
          {/* Collapse icon */}
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            !isCollapsed && "rotate-90"
          )} />

          {/* Tournée code + badge */}
          <div className="flex items-center gap-1.5 min-w-[110px]">
            <Package className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="font-bold text-sm font-mono tracking-tight text-slate-800">
              {group.tourneeCode || group.groupLabel}
            </span>
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-slate-200" />

          {/* Vehicle info */}
          <div className="flex items-center gap-1 min-w-[120px]">
            <Truck className={cn("h-3.5 w-3.5 shrink-0", hasVehicle ? "text-slate-500" : "text-rose-400")} />
            {hasVehicle ? (
              <span className="text-xs font-semibold text-slate-700">
                {group.vehicleImmat}
                {group.vehicleType && (
                  <span className="font-normal text-muted-foreground ml-1">({abbreviateVehicleType(group.vehicleType)})</span>
                )}
              </span>
            ) : (
              <span className="text-xs text-rose-500 font-medium italic">Non affecté</span>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-slate-200" />

          {/* Driver(s) info */}
          <div className="flex items-center gap-1.5 min-w-[160px]">
            {isDualDriver ? (
              <>
                <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <Badge variant="outline" className="text-[9px] h-4 border-indigo-300 text-indigo-700 bg-indigo-50 font-bold gap-0.5 px-1">
                  12h
                </Badge>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                    <span className="font-medium text-sky-700">{group.driverName || "—"}</span>
                  </span>
                  <ArrowRight className="h-2.5 w-2.5 text-slate-400" />
                  <span className="flex items-center gap-0.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span className="font-medium text-indigo-700">{group.driver2Name || "—"}</span>
                  </span>
                </div>
              </>
            ) : (
              <>
                <User className={cn("h-3.5 w-3.5 shrink-0", hasDriver ? "text-slate-500" : "text-rose-400")} />
                {hasDriver ? (
                  <span className="text-xs font-medium text-slate-700">{group.driverName}</span>
                ) : (
                  <span className="text-xs text-rose-500 font-medium italic">Conducteur non affecté</span>
                )}
              </>
            )}
          </div>

          {/* Service pickup location */}
          {tournee?.servicePickup && (
            <>
              <div className="w-px h-5 bg-slate-200" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[100px]">{tournee.servicePickup.location}</span>
                <span className="text-[10px]">à {tournee.servicePickup.time}</span>
              </div>
            </>
          )}

          {/* Days pills */}
          <div className="ml-1">
            <DayPills days={tournee?.daysOfWeek || summary.days} size="xs" />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Summary section */}
          <div className="flex items-center gap-2">
            {/* Amplitude */}
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
              <Clock className="h-3 w-3" />
              {summary.amplitudeLabel}
            </span>

            {/* Progress */}
            <MiniProgress pct={summary.pct} />
            <span className="text-[10px] font-semibold text-slate-600 w-7 text-right">{summary.pct}%</span>

            {/* Status pills */}
            <div className="flex items-center gap-1">
              {summary.unassigned > 0 && (
                <Badge variant="destructive" className="text-[9px] h-4 px-1.5 font-semibold">
                  {summary.unassigned}
                </Badge>
              )}
              {summary.partial > 0 && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-amber-100 text-amber-700 border-amber-200">
                  {summary.partial}
                </Badge>
              )}
            </div>

            {/* Course count */}
            <Badge variant="outline" className="text-[10px] h-5 font-mono tabular-nums whitespace-nowrap">
              {group.courses.length} course{group.courses.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

function VehicleGroupHeader({
  group,
  summary,
  isCollapsed,
  onToggle,
}: {
  group: GroupedCourses;
  summary: ReturnType<typeof computeGroupSummary>;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const hasVehicle = !!group.vehicleImmat;

  return (
    <TableRow
      className={cn(
        "cursor-pointer select-none transition-colors",
        hasVehicle ? "bg-emerald-50/40 hover:bg-emerald-50/60" : "bg-rose-50/50 hover:bg-rose-50"
      )}
      onClick={onToggle}
    >
      <TableCell colSpan={100} className="py-2 px-3">
        <div className="flex items-center gap-2.5">
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            !isCollapsed && "rotate-90"
          )} />

          {/* Vehicle badge */}
          <div className="flex items-center gap-1.5 min-w-[140px]">
            <Truck className={cn("h-4 w-4 shrink-0", hasVehicle ? "text-emerald-600" : "text-rose-400")} />
            {hasVehicle ? (
              <span className="font-bold text-sm text-slate-800">{group.vehicleImmat}</span>
            ) : (
              <span className="font-bold text-sm text-rose-600 italic">Véhicule non affecté</span>
            )}
          </div>

          {/* Vehicle details */}
          {group.vehicleType && (
            <Badge variant="secondary" className="text-[9px] h-4 bg-slate-100">
              {abbreviateVehicleType(group.vehicleType)}
            </Badge>
          )}
          {group.vehicleEnergy && (
            <Badge variant="outline" className={cn("text-[9px] h-4",
              group.vehicleEnergy === "Diesel" && "border-slate-300 text-slate-600",
              group.vehicleEnergy === "Gaz" && "border-sky-300 text-sky-600",
              group.vehicleEnergy === "Électrique" && "border-emerald-300 text-emerald-600"
            )}>
              <Fuel className="h-2.5 w-2.5 mr-0.5" />
              {group.vehicleEnergy}
            </Badge>
          )}

          <div className="w-px h-5 bg-slate-200" />

          {/* Tournée code */}
          {group.tourneeCode && (
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3 text-slate-400" />
              <span className="text-xs font-mono text-slate-600">{group.tourneeCode}</span>
            </div>
          )}

          {/* Driver info */}
          <div className="flex items-center gap-1 text-xs">
            <User className="h-3 w-3 text-slate-400" />
            <span className="text-slate-600">{group.driverName || "—"}</span>
            {group.isDualDriver && group.driver2Name && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-indigo-600">{group.driver2Name}</span>
                <Badge variant="outline" className="text-[8px] h-3.5 border-indigo-300 text-indigo-600 bg-indigo-50 px-1">
                  2×
                </Badge>
              </>
            )}
          </div>

          <DayPills days={group.tournee?.daysOfWeek || summary.days} size="xs" />

          <div className="flex-1" />

          <span className="text-[10px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
            <Clock className="h-3 w-3" />
            {summary.amplitudeLabel}
          </span>
          <MiniProgress pct={summary.pct} />
          <span className="text-[10px] font-semibold text-slate-600 w-7 text-right">{summary.pct}%</span>
          {summary.unassigned > 0 && (
            <Badge variant="destructive" className="text-[9px] h-4 px-1.5">{summary.unassigned}</Badge>
          )}
          <Badge variant="outline" className="text-[10px] h-5 font-mono tabular-nums whitespace-nowrap">
            {group.courses.length} course{group.courses.length > 1 ? "s" : ""}
          </Badge>
        </div>
      </TableCell>
    </TableRow>
  );
}

function DriverGroupHeader({
  group,
  summary,
  isCollapsed,
  onToggle,
}: {
  group: GroupedCourses;
  summary: ReturnType<typeof computeGroupSummary>;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const hasDriver = !!group.driverName;

  return (
    <TableRow
      className={cn(
        "cursor-pointer select-none transition-colors",
        hasDriver ? "bg-sky-50/40 hover:bg-sky-50/60" : "bg-rose-50/50 hover:bg-rose-50"
      )}
      onClick={onToggle}
    >
      <TableCell colSpan={100} className="py-2 px-3">
        <div className="flex items-center gap-2.5">
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            !isCollapsed && "rotate-90"
          )} />

          {/* Driver badge */}
          <div className="flex items-center gap-1.5 min-w-[140px]">
            <User className={cn("h-4 w-4 shrink-0", hasDriver ? "text-sky-600" : "text-rose-400")} />
            {hasDriver ? (
              <span className="font-bold text-sm text-slate-800">{group.driverName}</span>
            ) : (
              <span className="font-bold text-sm text-rose-600 italic">Conducteur non affecté</span>
            )}
          </div>

          {/* Driver type */}
          {group.driverType && (
            <Badge variant="secondary" className="text-[9px] h-4 bg-sky-100 text-sky-700">
              {group.driverType}
            </Badge>
          )}

          <div className="w-px h-5 bg-slate-200" />

          {/* Tournée */}
          {group.tourneeCode && (
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3 text-slate-400" />
              <span className="text-xs font-mono text-slate-600">{group.tourneeCode}</span>
            </div>
          )}

          {/* Vehicle */}
          <div className="flex items-center gap-1 text-xs">
            <Truck className="h-3 w-3 text-slate-400" />
            <span className="text-slate-600">{group.vehicleImmat || "—"}</span>
            {group.vehicleType && (
              <span className="text-[10px] text-muted-foreground">({group.vehicleType})</span>
            )}
          </div>

          <DayPills days={group.tournee?.daysOfWeek || summary.days} size="xs" />

          <div className="flex-1" />

          <span className="text-[10px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
            <Clock className="h-3 w-3" />
            {summary.amplitudeLabel}
          </span>
          <MiniProgress pct={summary.pct} />
          <span className="text-[10px] font-semibold text-slate-600 w-7 text-right">{summary.pct}%</span>
          {summary.unassigned > 0 && (
            <Badge variant="destructive" className="text-[9px] h-4 px-1.5">{summary.unassigned}</Badge>
          )}
          <Badge variant="outline" className="text-[10px] h-5 font-mono tabular-nums whitespace-nowrap">
            {group.courses.length} course{group.courses.length > 1 ? "s" : ""}
          </Badge>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Driver A/B separator row ───────────────────────────────────────────────

function DriverSlotRow({ slot, name }: { slot: "A" | "B"; name: string }) {
  const isA = slot === "A";
  return (
    <TableRow className={cn(
      "border-0",
      isA ? "bg-sky-50/50" : "bg-indigo-50/50"
    )}>
      <TableCell colSpan={100} className="py-1 px-6 border-b-0">
        <div className="flex items-center gap-2">
          <div className={cn("h-[2px] w-6 rounded", isA ? "bg-sky-400" : "bg-indigo-400")} />
          <span className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isA ? "bg-sky-400" : "bg-indigo-400"
          )} />
          <Badge variant="outline" className={cn(
            "text-[9px] h-4 font-bold gap-0.5 px-1.5",
            isA
              ? "border-sky-300 text-sky-700 bg-sky-50"
              : "border-indigo-400 text-indigo-700 bg-indigo-50"
          )}>
            <User className="h-2.5 w-2.5" />
            Conducteur {slot}
          </Badge>
          <span className={cn(
            "text-[11px] font-semibold",
            isA ? "text-sky-700" : "text-indigo-700"
          )}>
            {name || "Non affecté"}
          </span>
          <div className={cn("flex-1 h-px", isA ? "bg-sky-200" : "bg-indigo-200")} />
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Course Row ─────────────────────────────────────────────────────────────

function CourseRow({
  row,
  viewMode,
  group,
  onCourseClick,
}: {
  row: AggregatedRow;
  viewMode: ViewMode;
  group: GroupedCourses;
  onCourseClick: (course: Course) => void;
}) {
  const course = row.representativeCourse;
  const isUnassigned = course.assignmentStatus === "non_affectee";
  const isPartial = course.assignmentStatus === "partiellement_affectee";

  // CDC Compliance checks
  const cdcAlerts = useMemo(() => checkCDCCompliance(course, group.tournee), [course, group.tournee]);

  return (
    <TableRow
      key={row.isAggregated ? `agg-${course.startLocation}-${course.endLocation}-${course.startTime}-${course.driverSlot || "A"}` : course.id}
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/40",
        isUnassigned && "bg-rose-50/20",
        course.isSensitive && "bg-violet-50/30",
        course.driverSlot === "B" && "bg-indigo-50/20"
      )}
      onClick={() => onCourseClick(course)}
    >
      {/* Status indicator */}
      <TableCell className="w-[3px] !p-0">
        <div className={cn(
          "w-[3px] h-full min-h-[32px]",
          course.assignmentStatus === "affectee" && "bg-emerald-500",
          course.assignmentStatus === "partiellement_affectee" && "bg-amber-400",
          course.assignmentStatus === "non_affectee" && "bg-rose-400"
        )} />
      </TableCell>

      {/* Days */}
      <TableCell className="py-1.5 px-2">
        {row.isAggregated ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div><DayPills days={row.days} size="xs" /></div>
            </TooltipTrigger>
            <TooltipContent className="text-xs">
              {row.allCourses.length} courses identiques sur {row.days.length} jours
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="inline-flex items-center justify-center w-[22px] h-[18px] rounded text-[9px] font-semibold bg-sky-100 text-sky-700 border border-sky-300">
            {DAY_MAP[new Date(course.date).getDay()] || "?"}
          </span>
        )}
      </TableCell>

      {/* Time */}
      <TableCell className="py-1.5 px-2 text-xs font-mono whitespace-nowrap">
        <span className="text-slate-700">{course.startTime}</span>
        <span className="text-slate-300 mx-0.5">→</span>
        <span className="text-slate-700">{course.endTime}</span>
      </TableCell>

      {/* Client */}
      <TableCell className="py-1.5 px-2 text-xs">
        <div className="flex items-center gap-1">
          {course.isSensitive && (
            <Shield className="h-3 w-3 text-violet-600 shrink-0" />
          )}
          <span className="font-medium text-slate-700 truncate max-w-[110px]">
            {course.client || "N/A"}
          </span>
          {row.isAggregated && (
            <Badge variant="secondary" className="text-[8px] h-3.5 px-1 font-bold bg-sky-50 text-sky-700 border-sky-200">
              ×{row.allCourses.length}
            </Badge>
          )}
          {course.prestationType === "sup" && (
            <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-amber-300 text-amber-700 bg-amber-50">
              <Zap className="h-2 w-2" />
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Route: startLocation → endLocation */}
      <TableCell className="py-1.5 px-2 text-xs">
        <div className="flex items-center gap-1 min-w-0">
          <CircleDot className="h-3 w-3 text-emerald-500 shrink-0" />
          <span className="truncate max-w-[90px] text-slate-600">{course.startLocation}</span>
          <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
          <CircleDot className="h-3 w-3 text-indigo-500 shrink-0" />
          <span className="truncate max-w-[90px] text-slate-600">{course.endLocation}</span>
        </div>
      </TableCell>

      {/* Vehicle (shown in driver view & tournée view) */}
      {(viewMode === "drivers" || viewMode === "tournees") && (
        <TableCell className="py-1.5 px-2 text-xs">
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-slate-400 shrink-0" />
            <span className={cn("truncate", course.assignedVehicleImmat ? "text-slate-700" : "text-muted-foreground italic")}>
              {course.assignedVehicleImmat || course.requiredVehicleType}
            </span>
          </div>
        </TableCell>
      )}

      {/* Driver (shown in vehicle view & tournée view) */}
      {(viewMode === "vehicles" || viewMode === "tournees") && (
        <TableCell className="py-1.5 px-2 text-xs">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-slate-400 shrink-0" />
            <span className={cn("truncate", course.assignedDriverName ? "text-slate-700" : "text-muted-foreground italic")}>
              {course.assignedDriverName || course.requiredDriverType || "—"}
            </span>
            {course.isDualDriver && course.driverSlot && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[8px] px-1 h-3.5 font-bold",
                  course.driverSlot === "A"
                    ? "border-sky-300 text-sky-700 bg-sky-50"
                    : "border-indigo-300 text-indigo-700 bg-indigo-50"
                )}
              >
                {course.driverSlot}
              </Badge>
            )}
          </div>
        </TableCell>
      )}

      {/* Vehicle type */}
      <TableCell className="py-1.5 px-2">
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-slate-100 text-slate-600">
            {abbreviateVehicleType(course.requiredVehicleType)}
          </Badge>
          {/* CDC compliance alerts */}
          {cdcAlerts.length > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="destructive" className="text-[8px] h-3.5 px-1 gap-0.5">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {cdcAlerts.length}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-rose-600">Alertes CDC</p>
                  {cdcAlerts.map((alert, i) => (
                    <p key={i} className={cn(
                      "text-xs",
                      alert.severity === 'error' ? "text-rose-600" : "text-amber-600"
                    )}>
                      • {alert.message}
                    </p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>

      {/* Energy */}
      <TableCell className="py-1.5 px-2">
        {course.requiredVehicleEnergy ? (
          <Badge variant="outline" className={cn("text-[8px] px-1 h-3.5",
            course.requiredVehicleEnergy === "Diesel" && "border-slate-300 text-slate-600",
            course.requiredVehicleEnergy === "Gaz" && "border-sky-300 text-sky-600",
            course.requiredVehicleEnergy === "Électrique" && "border-emerald-300 text-emerald-600"
          )}>
            <Fuel className="h-2.5 w-2.5 mr-0.5" />
            {course.requiredVehicleEnergy}
          </Badge>
        ) : (
          <span className="text-[10px] text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Skills */}
      <TableCell className="py-1.5 px-2">
        <div className="flex items-center gap-0.5">
          {course.requiredDriverSkills.length > 0 ? (
            course.requiredDriverSkills.map((skill) => (
              <Tooltip key={skill}>
                <TooltipTrigger>
                  <Badge variant="outline" className={cn("text-[8px] px-1 h-3.5 font-bold",
                    skill === "Habilitation sûreté" && "border-violet-300 text-violet-700 bg-violet-50",
                    skill === "ADR" && "border-rose-300 text-rose-700 bg-rose-50",
                    skill === "Aéroportuaire" && "border-sky-300 text-sky-700 bg-sky-50"
                  )}>
                    {skill === "Habilitation sûreté" ? "HS" : skill === "Aéroportuaire" ? "AÉR" : skill}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="text-xs">{skill}</TooltipContent>
              </Tooltip>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
        </div>
      </TableCell>

      {/* Status badge */}
      <TableCell className="py-1.5 px-2">
        <div className="flex items-center gap-1.5">
          <StatusDot status={course.assignmentStatus} />
          <span className={cn(
            "text-[10px] font-medium",
            course.assignmentStatus === "affectee" && "text-emerald-700",
            course.assignmentStatus === "partiellement_affectee" && "text-amber-700",
            course.assignmentStatus === "non_affectee" && "text-rose-600"
          )}>
            {course.assignmentStatus === "affectee"
              ? "Affectée"
              : course.assignmentStatus === "partiellement_affectee"
                ? "Partielle"
                : "Non aff."}
          </span>
        </div>
      </TableCell>

      {/* Action */}
      <TableCell className="py-1.5 px-2">
        {isUnassigned && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-sky-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onCourseClick(course);
                }}
              >
                <UserPlus className="h-3.5 w-3.5 text-sky-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Affecter</TooltipContent>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ListViewGrouped({
  courses,
  tournees,
  viewMode,
  onCourseClick,
}: ListViewGroupedProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(true);

  // Derive groupingMode from viewMode
  const groupingMode: GroupingMode = viewMode === "tournees" ? "tournee" : viewMode === "vehicles" ? "vehicle" : "driver";

  const toggleGroup = useCallback((groupKey: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allExpanded) {
      setCollapsedGroups(new Set(sortedGroups.map(g => g.groupKey)));
      setAllExpanded(false);
    } else {
      setCollapsedGroups(new Set());
      setAllExpanded(true);
    }
  }, [allExpanded]);

  // Tournee lookup maps
  const tourneeMap = useMemo(() => {
    const codeMap = new Map<string, string>();
    const tMap = new Map<string, Tournee>();
    tournees?.forEach(t => {
      if (t.id) {
        codeMap.set(t.id, t.tourneeCode);
        tMap.set(t.id, t);
      }
      t.courses.forEach(c => {
        if (c.tourneeId) {
          codeMap.set(c.tourneeId, t.tourneeCode);
          tMap.set(c.tourneeId, t);
        }
      });
    });
    return { codeMap, tMap };
  }, [tournees]);

  // Group courses
  const groupedCourses = useMemo(() => {
    const groups = new Map<string, GroupedCourses>();

    courses.forEach(course => {
      let groupKey: string;
      let groupLabel: string;
      let groupSubLabel: string | undefined;
      let tourneeCode: string | undefined;
      let tournee: Tournee | undefined;

      tourneeCode = course.tourneeId ? tourneeMap.codeMap.get(course.tourneeId) : undefined;
      tournee = course.tourneeId ? tourneeMap.tMap.get(course.tourneeId) : undefined;

      if (groupingMode === "tournee") {
        groupKey = course.tourneeId || `unassigned-${course.id}`;
        groupLabel = tourneeCode || course.tourneeNumber || "Non affecté";
      } else if (groupingMode === "vehicle") {
        groupKey = course.assignedVehicleId || `no-vehicle-${course.tourneeId || course.id}`;
        groupLabel = course.assignedVehicleImmat || "Véhicule non affecté";
      } else {
        // driver
        groupKey = course.assignedDriverId || `no-driver-${course.tourneeId || course.id}`;
        groupLabel = course.assignedDriverName || "Conducteur non affecté";
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          groupKey,
          groupLabel,
          groupSubLabel,
          courses: [],
          tourneeCode,
          tournee,
          vehicleImmat: course.assignedVehicleImmat || tournee?.vehicleImmat,
          vehicleType: tournee?.vehicleType || course.requiredVehicleType,
          vehicleEnergy: tournee?.vehicleEnergy || course.requiredVehicleEnergy,
          driverName: tournee?.driverName || course.assignedDriverName,
          driverType: tournee?.driverType || course.requiredDriverType,
          driver2Name: tournee?.driver2Name,
          isDualDriver: tournee?.isDualDriver,
          serviceLocation: tournee?.servicePickup?.location,
          serviceTime: tournee?.servicePickup?.time,
        });
      }
      groups.get(groupKey)!.courses.push(course);
    });

    return Array.from(groups.values());
  }, [courses, groupingMode, tourneeMap]);

  // Sort groups
  const sortedGroups = useMemo(() => {
    return groupedCourses.map(group => {
      const sortedCourses = [...group.courses].sort((a, b) => {
        let comparison = 0;
        switch (sortColumn) {
          case "time":
            comparison = a.startTime.localeCompare(b.startTime);
            break;
          case "date":
            comparison = a.date.localeCompare(b.date);
            break;
          case "client":
            comparison = (a.client || "").localeCompare(b.client || "");
            break;
          case "vehicleType":
            comparison = a.requiredVehicleType.localeCompare(b.requiredVehicleType);
            break;
          case "status": {
            const statusOrder = { affectee: 0, partiellement_affectee: 1, non_affectee: 2 };
            comparison = statusOrder[a.assignmentStatus] - statusOrder[b.assignmentStatus];
            break;
          }
          case "tournee": {
            const aCode = a.tourneeId ? tourneeMap.codeMap.get(a.tourneeId) || "" : "";
            const bCode = b.tourneeId ? tourneeMap.codeMap.get(b.tourneeId) || "" : "";
            comparison = aCode.localeCompare(bCode);
            break;
          }
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
      return { ...group, courses: sortedCourses };
    }).sort((a, b) => {
      // Unassigned groups go last
      const aUnassigned = a.groupKey.startsWith("unassigned") || a.groupKey.startsWith("no-");
      const bUnassigned = b.groupKey.startsWith("unassigned") || b.groupKey.startsWith("no-");
      if (aUnassigned !== bUnassigned) return aUnassigned ? 1 : -1;
      return a.groupLabel.localeCompare(b.groupLabel);
    });
  }, [groupedCourses, sortColumn, sortDirection, tourneeMap]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  // Stats summary
  const totalCourses = courses.length;
  const totalGroups = sortedGroups.length;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* ─── Top bar with stats and expand/collapse all ─── */}
        <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {totalGroups} {groupingMode === "tournee" ? "tournées" : groupingMode === "vehicle" ? "véhicules" : "conducteurs"}
            </span>
            <span>•</span>
            <span>{totalCourses} courses</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={toggleAll}
          >
            {allExpanded ? <Shrink className="h-3 w-3" /> : <Expand className="h-3 w-3" />}
            {allExpanded ? "Tout replier" : "Tout déplier"}
          </Button>
        </div>

        {/* ─── Table ─── */}
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
              <TableRow className="border-b-2">
                {/* Status bar col */}
                <TableHead className="w-[3px] !p-0" />

                <TableHead className="w-[100px] px-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Jours</span>
                </TableHead>
                <TableHead className="w-[90px] px-2">
                  <Button variant="ghost" size="sm" className="h-5 px-1 -ml-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400" onClick={() => handleSort("time")}>
                    Horaire <SortIcon column="time" />
                  </Button>
                </TableHead>
                <TableHead className="w-[130px] px-2">
                  <Button variant="ghost" size="sm" className="h-5 px-1 -ml-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400" onClick={() => handleSort("client")}>
                    Client <SortIcon column="client" />
                  </Button>
                </TableHead>
                <TableHead className="px-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Trajet</span>
                </TableHead>

                {/* Contextual columns */}
                {(viewMode === "drivers" || viewMode === "tournees") && (
                  <TableHead className="w-[110px] px-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Véhicule</span>
                  </TableHead>
                )}
                {(viewMode === "vehicles" || viewMode === "tournees") && (
                  <TableHead className="w-[110px] px-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Conducteur</span>
                  </TableHead>
                )}

                <TableHead className="w-[80px] px-2">
                  <Button variant="ghost" size="sm" className="h-5 px-1 -ml-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400" onClick={() => handleSort("vehicleType")}>
                    Type <SortIcon column="vehicleType" />
                  </Button>
                </TableHead>
                <TableHead className="w-[70px] px-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Énergie</span>
                </TableHead>
                <TableHead className="w-[70px] px-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Form.</span>
                </TableHead>
                <TableHead className="w-[80px] px-2">
                  <Button variant="ghost" size="sm" className="h-5 px-1 -ml-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400" onClick={() => handleSort("status")}>
                    Statut <SortIcon column="status" />
                  </Button>
                </TableHead>
                <TableHead className="w-[40px] px-2" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedGroups.map((group) => {
                const isCollapsed = collapsedGroups.has(group.groupKey);
                const summary = computeGroupSummary(group.courses);
                const aggregatedRows = aggregateCourses(group.courses);
                const isDualDriver = group.isDualDriver;

                return (
                  <React.Fragment key={group.groupKey}>
                    {/* ─── Group Header ─── */}
                    {groupingMode === "tournee" && (
                      <TourneeGroupHeader
                        group={group}
                        summary={summary}
                        isCollapsed={isCollapsed}
                        onToggle={() => toggleGroup(group.groupKey)}
                      />
                    )}
                    {groupingMode === "vehicle" && (
                      <VehicleGroupHeader
                        group={group}
                        summary={summary}
                        isCollapsed={isCollapsed}
                        onToggle={() => toggleGroup(group.groupKey)}
                      />
                    )}
                    {groupingMode === "driver" && (
                      <DriverGroupHeader
                        group={group}
                        summary={summary}
                        isCollapsed={isCollapsed}
                        onToggle={() => toggleGroup(group.groupKey)}
                      />
                    )}

                    {/* ─── Course rows ─── */}
                    {!isCollapsed && (() => {
                      // For dual-driver tournées: show Driver A/B sections
                      if (isDualDriver && groupingMode === "tournee") {
                        const slotA = aggregatedRows.filter(r =>
                          !r.representativeCourse.driverSlot || r.representativeCourse.driverSlot === "A"
                        );
                        const slotB = aggregatedRows.filter(r =>
                          r.representativeCourse.driverSlot === "B"
                        );

                        return (
                          <>
                            <DriverSlotRow slot="A" name={group.driverName || ""} />
                            {slotA.map((row, i) => (
                              <CourseRow
                                key={`a-${i}`}
                                row={row}
                                viewMode={viewMode}
                                group={group}
                                onCourseClick={onCourseClick}
                              />
                            ))}
                            <DriverSlotRow slot="B" name={group.driver2Name || ""} />
                            {slotB.map((row, i) => (
                              <CourseRow
                                key={`b-${i}`}
                                row={row}
                                viewMode={viewMode}
                                group={group}
                                onCourseClick={onCourseClick}
                              />
                            ))}
                          </>
                        );
                      }

                      // Non-dual-driver: render normally
                      return aggregatedRows.map((row, i) => (
                        <CourseRow
                          key={i}
                          row={row}
                          viewMode={viewMode}
                          group={group}
                          onCourseClick={onCourseClick}
                        />
                      ));
                    })()}

                    {/* Group bottom separator */}
                    {!isCollapsed && (
                      <TableRow className="border-0">
                        <TableCell colSpan={100} className="!p-0">
                          <div className="h-1 bg-muted/40" />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Empty state */}
              {sortedGroups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={100} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-slate-300" />
                      <p className="text-sm">Aucune course trouvée pour cette période</p>
                      <p className="text-xs">Modifiez les filtres ou changez de date</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
