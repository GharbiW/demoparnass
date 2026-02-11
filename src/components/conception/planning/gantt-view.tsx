"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Course, Tournee } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Shield,
  Zap,
  MapPin,
  User,
  Truck,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type ViewMode = "vehicles" | "drivers";
type ZoomLevel = "15min" | "30min" | "1h";

interface GanttViewProps {
  courses: Course[];
  tournees: Tournee[];
  viewMode: ViewMode;
  date: string; // YYYY-MM-DD
  zoomLevel: ZoomLevel;
  onCourseClick: (course: Course) => void;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToPx(minutes: number, zoomLevel: ZoomLevel): number {
  switch (zoomLevel) {
    case "15min": return (minutes / 15) * 20;
    case "30min": return (minutes / 30) * 25;
    case "1h": return (minutes / 60) * 50;
  }
}

function getTotalWidth(zoomLevel: ZoomLevel): number {
  return minutesToPx(24 * 60, zoomLevel);
}

function getHourMarkers(zoomLevel: ZoomLevel) {
  const markers: { hour: number; label: string; offset: number }[] = [];
  for (let h = 0; h < 24; h++) {
    markers.push({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      offset: minutesToPx(h * 60, zoomLevel),
    });
  }
  return markers;
}

// ─── Course Block ─────────────────────────────────────────────────────────────

function CourseBlock({
  course,
  zoomLevel,
  viewMode,
  onClick,
}: {
  course: Course;
  zoomLevel: ZoomLevel;
  viewMode: ViewMode;
  onClick: () => void;
}) {
  const startMin = timeToMinutes(course.startTime);
  const endMin = timeToMinutes(course.endTime);
  const durationMin = Math.max(endMin - startMin, 30); // Min 30 min display
  const left = minutesToPx(startMin, zoomLevel);
  const width = Math.max(minutesToPx(durationMin, zoomLevel), 40);

  const isUnassigned = course.assignmentStatus !== "assigned";
  const isSup = course.prestationType === "sup";

  const bgColor = isUnassigned
    ? "bg-slate-200 border-slate-400 text-slate-700"
    : isSup
      ? "bg-amber-100 border-amber-400 text-amber-800"
      : course.isSensitive
        ? "bg-violet-100 border-violet-400 text-violet-800"
        : "bg-sky-100 border-sky-400 text-sky-800";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute h-9 rounded border cursor-pointer transition-all hover:shadow-md hover:z-10 hover:scale-y-110 overflow-hidden flex items-center gap-1 px-1.5",
              bgColor
            )}
            style={{ left: `${left}px`, width: `${width}px`, top: "2px" }}
            onClick={onClick}
          >
            {course.isSensitive && <Shield className="h-3 w-3 shrink-0 text-violet-600" />}
            {isSup && <Zap className="h-3 w-3 shrink-0 text-amber-600" />}
            {isUnassigned && <AlertTriangle className="h-3 w-3 shrink-0 text-slate-500" />}
            <span className="text-[10px] font-semibold truncate">
              {width > 80 ? (course.client || course.prestationId) : course.id.slice(-4)}
            </span>
            {width > 120 && (
              <span className="text-[9px] opacity-70 truncate">
                {course.startTime}-{course.endTime}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-xs">{course.id}</span>
              {course.isSensitive && <Badge variant="outline" className="text-[10px] h-4 border-violet-300 text-violet-700">Sensible</Badge>}
              {isSup && <Badge variant="outline" className="text-[10px] h-4 border-amber-300 text-amber-700">SUP</Badge>}
            </div>
            <p className="text-xs"><strong>Client:</strong> {course.client || 'N/A'}</p>
            <p className="text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {course.startLocation} → {course.endLocation}
            </p>
            <p className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.startTime} - {course.endTime}
            </p>
            {viewMode === "vehicles" && course.assignedDriverName && (
              <p className="text-xs flex items-center gap-1">
                <User className="h-3 w-3" /> {course.assignedDriverName}
              </p>
            )}
            {viewMode === "drivers" && course.assignedVehicleImmat && (
              <p className="text-xs flex items-center gap-1">
                <Truck className="h-3 w-3" /> {course.assignedVehicleImmat}
              </p>
            )}
            {isUnassigned && (
              <p className="text-xs text-rose-600 font-medium">Non affecté — {course.nonPlacementReason.replace(/_/g, ' ')}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Idle Segment (gap between courses) ───────────────────────────────────────

function IdleSegment({ startMin, endMin, zoomLevel }: { startMin: number; endMin: number; zoomLevel: ZoomLevel }) {
  const left = minutesToPx(startMin, zoomLevel);
  const width = minutesToPx(endMin - startMin, zoomLevel);
  if (width < 5) return null;

  return (
    <div
      className="absolute h-9 bg-slate-100 rounded opacity-50"
      style={{ left: `${left}px`, width: `${width}px`, top: "2px" }}
    />
  );
}

// ─── Resource Row ─────────────────────────────────────────────────────────────

function ResourceRow({
  resourceId,
  resourceLabel,
  resourceSub,
  courses,
  zoomLevel,
  viewMode,
  onCourseClick,
  isDriverChange,
}: {
  resourceId: string;
  resourceLabel: string;
  resourceSub: string;
  courses: Course[];
  zoomLevel: ZoomLevel;
  viewMode: ViewMode;
  onCourseClick: (course: Course) => void;
  isDriverChange?: boolean;
}) {
  // Sort courses by start time
  const sorted = [...courses].sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Calculate idle segments
  const idleSegments: { startMin: number; endMin: number }[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const endPrev = timeToMinutes(sorted[i].endTime);
    const startNext = timeToMinutes(sorted[i + 1].startTime);
    if (startNext > endPrev + 15) {
      idleSegments.push({ startMin: endPrev, endMin: startNext });
    }
  }

  // Check for driver changes in vehicle view
  const driverChanges = new Set<string>();
  if (viewMode === "vehicles") {
    sorted.forEach(c => { if (c.assignedDriverId) driverChanges.add(c.assignedDriverId); });
  }

  return (
    <div className="flex border-b hover:bg-muted/30 transition-colors">
      {/* Resource Label */}
      <div className="sticky left-0 z-10 w-48 shrink-0 bg-background border-r px-3 py-1.5 flex items-center">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{resourceLabel}</p>
          <p className="text-[10px] text-muted-foreground truncate">{resourceSub}</p>
          {driverChanges.size > 1 && (
            <Badge variant="outline" className="text-[9px] h-4 mt-0.5 border-amber-300 text-amber-600">
              {driverChanges.size} conducteurs
            </Badge>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative h-11 flex-1" style={{ minWidth: getTotalWidth(zoomLevel) }}>
        {idleSegments.map((seg, i) => (
          <IdleSegment key={i} startMin={seg.startMin} endMin={seg.endMin} zoomLevel={zoomLevel} />
        ))}
        {sorted.map(course => (
          <CourseBlock
            key={course.id}
            course={course}
            zoomLevel={zoomLevel}
            viewMode={viewMode}
            onClick={() => onCourseClick(course)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Gantt View ──────────────────────────────────────────────────────────

export function ConceptionGanttView({
  courses,
  tournees,
  viewMode,
  date,
  zoomLevel,
  onCourseClick,
}: GanttViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hourMarkers = useMemo(() => getHourMarkers(zoomLevel), [zoomLevel]);
  const totalWidth = getTotalWidth(zoomLevel);

  // Filter courses for the selected date
  const dayCourses = useMemo(() => courses.filter(c => c.date === date), [courses, date]);

  // Group by resource
  const resourceGroups = useMemo(() => {
    const groups: Map<string, { label: string; sub: string; courses: Course[] }> = new Map();

    if (viewMode === "vehicles") {
      // Group by vehicle (via tournee or directly)
      dayCourses.forEach(course => {
        const key = course.assignedVehicleId || course.tourneeId || `unassigned-${course.id}`;
        const label = course.assignedVehicleImmat || course.tourneeNumber || "Non affecté";
        const sub = course.requiredVehicleType + (course.requiredVehicleEnergy ? ` • ${course.requiredVehicleEnergy}` : "");

        if (!groups.has(key)) {
          groups.set(key, { label, sub, courses: [] });
        }
        groups.get(key)!.courses.push(course);
      });
    } else {
      // Group by driver
      dayCourses.forEach(course => {
        const key = course.assignedDriverId || `unassigned-${course.id}`;
        const label = course.assignedDriverName || "Non affecté";
        const sub = course.requiredDriverType || "N/A";

        if (!groups.has(key)) {
          groups.set(key, { label, sub, courses: [] });
        }
        groups.get(key)!.courses.push(course);
      });
    }

    // Sort: assigned first, then unassigned
    return Array.from(groups.entries()).sort(([, a], [, b]) => {
      const aAssigned = a.courses.some(c => c.assignmentStatus === "assigned");
      const bAssigned = b.courses.some(c => c.assignmentStatus === "assigned");
      if (aAssigned !== bAssigned) return aAssigned ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
  }, [dayCourses, viewMode]);

  // Scroll to ~6:00 on mount
  useEffect(() => {
    if (scrollRef.current) {
      const offset6h = minutesToPx(6 * 60, zoomLevel);
      scrollRef.current.scrollLeft = offset6h - 50;
    }
  }, [zoomLevel, date]);

  const dateObj = parseISO(date);

  return (
    <div className="flex flex-col h-full">
      {/* Date header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
        <p className="text-sm font-semibold">
          {format(dateObj, "EEEE d MMMM yyyy", { locale: fr })}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-sky-200 border border-sky-400" /> Régulière</span>
          <span className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-amber-200 border border-amber-400" /> SUP</span>
          <span className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-violet-200 border border-violet-400" /> Sensible</span>
          <span className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-slate-200 border border-slate-400" /> Non affecté</span>
          <span className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-slate-100 opacity-50" /> Inactif</span>
        </div>
      </div>

      {/* Gantt scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div style={{ minWidth: totalWidth + 192 }}>
          {/* Hour headers */}
          <div className="flex sticky top-0 z-20 bg-background border-b">
            <div className="sticky left-0 z-30 w-48 shrink-0 bg-background border-r px-3 py-1.5 flex items-center">
              <p className="text-xs font-semibold text-muted-foreground">
                {viewMode === "vehicles" ? "Véhicule / Tournée" : "Conducteur"}
              </p>
            </div>
            <div className="relative flex-1" style={{ minWidth: totalWidth }}>
              <div className="flex">
                {hourMarkers.map(marker => (
                  <div
                    key={marker.hour}
                    className="border-r text-center shrink-0"
                    style={{ width: minutesToPx(60, zoomLevel) }}
                  >
                    <p className="text-[10px] text-muted-foreground py-1">{marker.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resource rows */}
          {resourceGroups.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              Aucune course pour cette date
            </div>
          ) : (
            resourceGroups.map(([key, group]) => (
              <ResourceRow
                key={key}
                resourceId={key}
                resourceLabel={group.label}
                resourceSub={group.sub}
                courses={group.courses}
                zoomLevel={zoomLevel}
                viewMode={viewMode}
                onCourseClick={onCourseClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
