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
  Users,
  Truck,
  Clock,
  Moon,
  ArrowRight,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

type ViewMode = "vehicles" | "drivers" | "tournees";
type ZoomLevel = "15min" | "30min" | "1h";

interface GanttViewProps {
  courses: Course[];
  tournees: Tournee[];
  viewMode: ViewMode;
  date: string; // YYYY-MM-DD
  zoomLevel: ZoomLevel;
  onCourseClick: (course: Course) => void;
  startHour?: number; // 0 = midnight (default), 6 = start at 6:00
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

function getHourMarkers(zoomLevel: ZoomLevel, startHour: number = 0) {
  const markers: { hour: number; label: string; offset: number }[] = [];
  for (let i = 0; i < 24; i++) {
    const h = (startHour + i) % 24;
    markers.push({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      offset: minutesToPx(i * 60, zoomLevel),
    });
  }
  return markers;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function adjustMinutesForStartHour(minutes: number, startHour: number): number {
  const offset = startHour * 60;
  return (minutes - offset + 24 * 60) % (24 * 60);
}

function isCrossMidnight(startTime: string, endTime: string): boolean {
  return timeToMinutes(endTime) < timeToMinutes(startTime);
}

// Stable color palette for driver grouping
const DRIVER_GROUP_COLORS = [
  { bg: "rgba(56,189,248,0.12)", border: "rgb(56,189,248)" },   // sky
  { bg: "rgba(168,85,247,0.12)", border: "rgb(168,85,247)" },   // purple
  { bg: "rgba(251,146,60,0.12)", border: "rgb(251,146,60)" },   // orange
  { bg: "rgba(52,211,153,0.12)", border: "rgb(52,211,153)" },   // emerald
  { bg: "rgba(244,114,182,0.12)", border: "rgb(244,114,182)" }, // pink
  { bg: "rgba(250,204,21,0.12)", border: "rgb(250,204,21)" },   // yellow
];

// ─── Course Block ─────────────────────────────────────────────────────────────

function CourseBlock({
  course,
  zoomLevel,
  viewMode,
  onClick,
  tournee,
  startHour = 0,
  halfHeight = false,
  topOffset = 0,
  driverGroupColor,
}: {
  course: Course;
  zoomLevel: ZoomLevel;
  viewMode: ViewMode;
  onClick: () => void;
  tournee?: Tournee;
  startHour?: number;
  halfHeight?: boolean;
  topOffset?: number;
  driverGroupColor?: string;
}) {
  const startMin = adjustMinutesForStartHour(timeToMinutes(course.startTime), startHour);
  const endMin = adjustMinutesForStartHour(timeToMinutes(course.endTime), startHour);
  const durationMin = Math.max(endMin >= startMin ? endMin - startMin : (24 * 60 - startMin + endMin), 30);
  const left = minutesToPx(startMin, zoomLevel);
  const width = Math.max(minutesToPx(durationMin, zoomLevel), 44);

  const isUnassigned = course.assignmentStatus !== "affectee";
  const isSup = course.prestationType === "sup";
  const crossesMidnight = isCrossMidnight(course.startTime, course.endTime);
  const hasAlert = (course.constraintWarnings && course.constraintWarnings.length > 0) || isUnassigned;

  // Determine colors — with driver slot support
  let bgColor: string;
  if (isUnassigned) {
    bgColor = "bg-slate-200 border-slate-400 text-slate-700";
  } else if (course.isDualDriver && course.driverSlot === "B") {
    bgColor = "bg-indigo-100 border-indigo-400 text-indigo-800";
  } else if (isSup) {
    bgColor = "bg-amber-100 border-amber-400 text-amber-800";
  } else if (course.isSensitive) {
    bgColor = "bg-violet-100 border-violet-400 text-violet-800";
  } else {
    bgColor = "bg-sky-100 border-sky-400 text-sky-800";
  }

  const blockHeight = halfHeight ? "h-[20px]" : "h-[38px]";
  const top = halfHeight ? `${topOffset}px` : "3px";

  // Determine what info to show based on width
  const showIcons = true;
  const showLabel = width > 50;
  const showTime = width > 130 && !halfHeight;
  const showDriverOrVehicle = width > 170 && !halfHeight;

  // Pick resource name depending on viewMode
  const resourceName = viewMode === "vehicles"
    ? (course.assignedDriverName || "")
    : viewMode === "drivers"
      ? (course.assignedVehicleImmat || "")
      : (course.assignedDriverName || course.assignedVehicleImmat || "");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute rounded-[4px] border cursor-pointer transition-all hover:shadow-lg hover:z-20 overflow-hidden",
              blockHeight,
              bgColor,
              crossesMidnight && "border-dashed border-2",
            )}
            style={{
              left: `${left}px`,
              width: `${width}px`,
              top,
              borderBottomWidth: driverGroupColor ? "3px" : undefined,
              borderBottomColor: driverGroupColor || undefined,
            }}
            onClick={onClick}
          >
            {/* Two-line layout for normal height, single-line for half */}
            {halfHeight ? (
              <div className="flex items-center gap-0.5 px-1 h-full">
                {/* Icons */}
                {isSup && <Zap className="h-2.5 w-2.5 shrink-0 text-amber-600" />}
                {course.isSensitive && !isSup && <Shield className="h-2.5 w-2.5 shrink-0 text-violet-600" />}
                {isUnassigned && <AlertTriangle className="h-2.5 w-2.5 shrink-0 text-slate-500" />}
                {crossesMidnight && <Moon className="h-2.5 w-2.5 shrink-0 opacity-60" />}
                {course.isDualDriver && course.driverSlot && (
                  <span className={cn(
                    "text-[7px] font-bold shrink-0 w-3 h-3 rounded-full flex items-center justify-center leading-none",
                    course.driverSlot === "A" ? "bg-sky-200 text-sky-800" : "bg-indigo-200 text-indigo-800"
                  )}>
                    {course.driverSlot}
                  </span>
                )}
                {showLabel && (
                  <span className="text-[8px] font-semibold truncate leading-none">
                    {course.client || course.id.slice(-5)}
                  </span>
                )}
                {width > 100 && (
                  <span className="text-[7px] opacity-70 truncate leading-none ml-auto">
                    {course.startTime}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col justify-center h-full px-1.5 gap-0">
                {/* Row 1: icons + client/label */}
                <div className="flex items-center gap-1 min-w-0">
                  {crossesMidnight && <Moon className="h-3 w-3 shrink-0 opacity-60" />}
                  {course.isSensitive && !crossesMidnight && <Shield className="h-3 w-3 shrink-0 text-violet-600" />}
                  {isSup && !crossesMidnight && <Zap className="h-3 w-3 shrink-0 text-amber-600" />}
                  {hasAlert && !isUnassigned && !crossesMidnight && !isSup && !course.isSensitive && (
                    <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                  )}
                  {isUnassigned && !crossesMidnight && <AlertTriangle className="h-3 w-3 shrink-0 text-rose-500" />}
                  {course.isDualDriver && course.driverSlot && (
                    <span className={cn(
                      "text-[8px] font-bold shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center",
                      course.driverSlot === "A" ? "bg-sky-200 text-sky-800" : "bg-indigo-200 text-indigo-800"
                    )}>
                      {course.driverSlot}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold truncate leading-tight">
                    {showLabel ? (course.client || course.prestationId || course.id) : course.id.slice(-4)}
                  </span>
                </div>
                {/* Row 2: time + driver/vehicle name */}
                <div className="flex items-center gap-1 min-w-0">
                  {showTime && (
                    <span className="text-[9px] opacity-70 font-mono whitespace-nowrap leading-tight">
                      {course.startTime}-{course.endTime}
                    </span>
                  )}
                  {showDriverOrVehicle && resourceName && (
                    <>
                      <span className="text-[9px] opacity-40">|</span>
                      <span className="text-[9px] opacity-70 truncate leading-tight flex items-center gap-0.5">
                        {viewMode === "vehicles" ? <User className="h-2.5 w-2.5 shrink-0" /> : viewMode === "drivers" ? <Truck className="h-2.5 w-2.5 shrink-0" /> : <User className="h-2.5 w-2.5 shrink-0" />}
                        {resourceName}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-xs">{course.id}</span>
              <div className="flex items-center gap-1">
                {course.isSensitive && <Badge variant="outline" className="text-[10px] h-4 border-violet-300 text-violet-700">Sensible</Badge>}
                {isSup && <Badge variant="outline" className="text-[10px] h-4 border-amber-300 text-amber-700">SUP</Badge>}
                {course.isDualDriver && course.driverSlot && (
                  <Badge variant="outline" className={cn("text-[10px] h-4",
                    course.driverSlot === "A" ? "border-sky-300 text-sky-700" : "border-indigo-300 text-indigo-700"
                  )}>
                    Conducteur {course.driverSlot}
                  </Badge>
                )}
                {hasAlert && !isUnassigned && (
                  <Badge variant="outline" className="text-[10px] h-4 border-amber-300 text-amber-600">Alerte</Badge>
                )}
              </div>
            </div>
            <p className="text-xs"><strong>Client:</strong> {course.client || 'N/A'}</p>
            <p className="text-xs flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {course.startLocation} → {course.endLocation}
            </p>
            <p className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {course.startTime} - {course.endTime}
              {crossesMidnight && <Moon className="h-3 w-3 text-indigo-500 ml-1" />}
              {crossesMidnight && <span className="text-indigo-600 font-medium text-[10px]">Nuit</span>}
            </p>
            {(viewMode === "vehicles" || viewMode === "tournees") && course.assignedDriverName && (
              <p className="text-xs flex items-center gap-1">
                <User className="h-3 w-3" /> {course.assignedDriverName}
              </p>
            )}
            {(viewMode === "drivers" || viewMode === "tournees") && course.assignedVehicleImmat && (
              <p className="text-xs flex items-center gap-1">
                <Truck className="h-3 w-3" /> {course.assignedVehicleImmat}
              </p>
            )}
            {isUnassigned && (
              <p className="text-xs text-rose-600 font-medium">Non affecté — {course.nonPlacementReason.replace(/_/g, ' ')}</p>
            )}
            {tournee?.servicePickup && (
              <div className="mt-2 pt-2 border-t border-emerald-200">
                <p className="text-xs font-semibold text-emerald-700 mb-1">Prise de service</p>
                <p className="text-xs"><strong>Lieu:</strong> {tournee.servicePickup.location}</p>
                <p className="text-xs"><strong>Heure:</strong> {tournee.servicePickup.time}</p>
                <p className="text-xs"><strong>Distance:</strong> {tournee.servicePickup.kmFromBase} km</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Idle Segment (gap between courses) ───────────────────────────────────────

function IdleSegment({
  startMin,
  endMin,
  zoomLevel,
  startHour = 0,
  halfHeight = false,
  topOffset = 0,
}: {
  startMin: number;
  endMin: number;
  zoomLevel: ZoomLevel;
  startHour?: number;
  halfHeight?: boolean;
  topOffset?: number;
}) {
  const adjStart = adjustMinutesForStartHour(startMin, startHour);
  const adjEnd = adjustMinutesForStartHour(endMin, startHour);
  const gapMinutes = adjEnd >= adjStart ? adjEnd - adjStart : (24 * 60 - adjStart + adjEnd);
  const left = minutesToPx(adjStart, zoomLevel);
  const width = minutesToPx(gapMinutes, zoomLevel);
  if (width < 8) return null;

  const blockH = halfHeight ? "h-[20px]" : "h-[38px]";
  const showLabel = width > 40;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "absolute rounded-sm overflow-hidden flex items-center justify-center",
              blockH,
            )}
            style={{
              left: `${left}px`,
              width: `${width}px`,
              top: halfHeight ? `${topOffset}px` : "3px",
              background: "repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(148,163,184,0.18) 3px, rgba(148,163,184,0.18) 5px)",
              backgroundColor: "rgba(148,163,184,0.10)",
            }}
          >
            {showLabel && !halfHeight && (
              <span className="text-[8px] text-slate-400 font-medium select-none">
                {formatDuration(gapMinutes)}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs p-2">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="font-medium">Inactif</span>
            <span className="text-muted-foreground">{formatDuration(gapMinutes)}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Driver Change Marker ─────────────────────────────────────────────────────

function DriverChangeMarker({
  minutePos,
  zoomLevel,
  startHour,
  prevDriverName,
  nextDriverName,
}: {
  minutePos: number;
  zoomLevel: ZoomLevel;
  startHour: number;
  prevDriverName: string;
  nextDriverName: string;
}) {
  const adjMin = adjustMinutesForStartHour(minutePos, startHour);
  const left = minutesToPx(adjMin, zoomLevel);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute w-0 flex flex-col items-center z-10"
            style={{ left: `${left}px`, top: "0px", height: "44px" }}
          >
            <div className="w-[2px] h-full bg-amber-400 rounded-full" />
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
              <ArrowRight className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs p-2">
          <p className="font-medium mb-1">Changement de conducteur</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{prevDriverName || "?"}</span>
            <ArrowRight className="h-3 w-3" />
            <span>{nextDriverName || "?"}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Resource Row ─────────────────────────────────────────────────────────────

function ResourceRow({
  resourceId,
  resourceLabel,
  resourceSub,
  tourneeCode,
  courses,
  zoomLevel,
  viewMode,
  onCourseClick,
  tournees,
  startHour = 0,
  isDualDriver = false,
  driverAName,
  driverBName,
  isEmptyTour = false,
  vehicleImmat,
  vehicleType,
}: {
  resourceId: string;
  resourceLabel: string;
  resourceSub: string;
  tourneeCode?: string;
  courses: Course[];
  zoomLevel: ZoomLevel;
  viewMode: ViewMode;
  onCourseClick: (course: Course) => void;
  tournees?: Tournee[];
  startHour?: number;
  isDualDriver?: boolean;
  driverAName?: string;
  driverBName?: string;
  isEmptyTour?: boolean;
  vehicleImmat?: string;
  vehicleType?: string;
}) {
  // Sort courses by start time
  const sorted = [...courses].sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Find tournée
  const tourneeId = sorted[0]?.tourneeId;
  const tournee = tournees?.find(t => t.id === tourneeId || t.courses.some(c => c.id === sorted[0]?.id));
  const servicePickup = tournee?.servicePickup;

  // Split courses by driver slot for dual-driver tours
  const slotACourses = isDualDriver ? sorted.filter(c => c.driverSlot === "A" || !c.driverSlot) : sorted;
  const slotBCourses = isDualDriver ? sorted.filter(c => c.driverSlot === "B") : [];

  // Calculate idle segments
  const computeIdle = (courseList: Course[]) => {
    const segs: { startMin: number; endMin: number }[] = [];
    for (let i = 0; i < courseList.length - 1; i++) {
      const endPrev = timeToMinutes(courseList[i].endTime);
      const startNext = timeToMinutes(courseList[i + 1].startTime);
      if (startNext > endPrev + 10) {
        segs.push({ startMin: endPrev, endMin: startNext });
      }
    }
    return segs;
  };

  const idleSegmentsA = computeIdle(slotACourses);
  const idleSegmentsB = isDualDriver ? computeIdle(slotBCourses) : [];
  const idleSegmentsAll = !isDualDriver ? computeIdle(sorted) : [];

  // ─── Driver grouping for vehicle view (non-dual-driver) ───
  // Detect consecutive driver groups and compute colored underline + change markers
  const driverGroups = useMemo(() => {
    if ((viewMode !== "vehicles" && viewMode !== "tournees") || isDualDriver) return { colorMap: new Map<string, string>(), changeMarkers: [] as { minutePos: number; prev: string; next: string }[] };
    const groups: { driverId: string; driverName: string; startIdx: number; endIdx: number }[] = [];
    let currentDriverId = "";
    sorted.forEach((c, i) => {
      const did = c.assignedDriverId || "__none__";
      if (did !== currentDriverId) {
        groups.push({ driverId: did, driverName: c.assignedDriverName || "—", startIdx: i, endIdx: i });
        currentDriverId = did;
      } else {
        groups[groups.length - 1].endIdx = i;
      }
    });

    // Only color if there are multiple driver groups (i.e. a driver change happens)
    const hasMultiple = groups.length > 1;
    const colorMap = new Map<string, string>();
    const changeMarkers: { minutePos: number; prev: string; next: string }[] = [];
    if (hasMultiple) {
      const seenDrivers = new Map<string, number>();
      let colorIdx = 0;
      groups.forEach((g, gi) => {
        if (!seenDrivers.has(g.driverId)) {
          seenDrivers.set(g.driverId, colorIdx);
          colorIdx = (colorIdx + 1) % DRIVER_GROUP_COLORS.length;
        }
        const col = DRIVER_GROUP_COLORS[seenDrivers.get(g.driverId)!];
        // Assign color to all courses in this group
        for (let i = g.startIdx; i <= g.endIdx; i++) {
          colorMap.set(sorted[i].id, col.border);
        }
        // Mark driver changes
        if (gi > 0) {
          const prevGroup = groups[gi - 1];
          const prevCourse = sorted[prevGroup.endIdx];
          const changeMoment = timeToMinutes(prevCourse.endTime);
          changeMarkers.push({ minutePos: changeMoment, prev: prevGroup.driverName, next: g.driverName });
        }
      });
    }
    return { colorMap, changeMarkers };
  }, [sorted, viewMode, isDualDriver]);

  // Dual-driver row height is taller
  const rowHeight = isDualDriver ? "h-[54px]" : "h-[46px]";

  return (
    <div className={cn(
      "flex border-b hover:bg-muted/30 transition-colors",
      isEmptyTour && "bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.03)_4px,rgba(0,0,0,0.03)_8px)]"
    )}>
      {/* Resource Label */}
      <div className="sticky left-0 z-10 w-52 shrink-0 bg-background border-r px-3 py-1.5 flex items-start">
        <div className="min-w-0 w-full">
          <div className="flex items-center gap-1.5">
            {tourneeCode && (
              <Badge variant="secondary" className="text-[9px] font-mono h-4 shrink-0 bg-slate-100 text-slate-700 font-bold">
                {tourneeCode}
              </Badge>
            )}
            <p className="text-xs font-semibold truncate">{resourceLabel}</p>
          </div>
          {/* In tournees mode: show both vehicle + driver info */}
          {viewMode === "tournees" ? (
            <div className="mt-0.5 space-y-0.5">
              {vehicleImmat ? (
                <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 truncate">
                  <Truck className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                  {vehicleImmat}
                  {vehicleType && <span className="text-[8px] opacity-60">({vehicleType})</span>}
                </span>
              ) : (
                <span className="text-[9px] text-rose-400 flex items-center gap-0.5">
                  <Truck className="h-2.5 w-2.5 shrink-0" />
                  Véhicule non affecté
                </span>
              )}
              {isDualDriver ? (
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[8px] h-3.5 border-indigo-300 text-indigo-700 bg-indigo-50 gap-0.5 px-1 font-bold">
                    <Users className="h-2.5 w-2.5" />
                    12h
                  </Badge>
                  <div className="flex flex-col gap-0 min-w-0">
                    <span className="text-[8px] leading-tight truncate">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 mr-0.5 align-middle" />
                      <span className="font-medium text-sky-700">{driverAName || "—"}</span>
                    </span>
                    <span className="text-[8px] leading-tight truncate">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 mr-0.5 align-middle" />
                      <span className="font-medium text-indigo-700">{driverBName || "—"}</span>
                    </span>
                  </div>
                </div>
              ) : driverAName ? (
                <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 truncate">
                  <User className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                  {driverAName}
                </span>
              ) : (
                <span className="text-[9px] text-rose-400 flex items-center gap-0.5">
                  <User className="h-2.5 w-2.5 shrink-0" />
                  Conducteur non affecté
                </span>
              )}
            </div>
          ) : (
            <>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{resourceSub}</p>
              {isDualDriver && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[8px] h-3.5 border-indigo-300 text-indigo-700 bg-indigo-50 gap-0.5 px-1 font-bold">
                    <Users className="h-2.5 w-2.5" />
                    12h
                  </Badge>
                  <div className="flex flex-col gap-0 min-w-0">
                    <span className="text-[8px] leading-tight truncate">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 mr-0.5 align-middle" />
                      <span className="font-medium text-sky-700">{driverAName || "—"}</span>
                    </span>
                    <span className="text-[8px] leading-tight truncate">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 mr-0.5 align-middle" />
                      <span className="font-medium text-indigo-700">{driverBName || "—"}</span>
                    </span>
                  </div>
                </div>
              )}
              {driverGroups.changeMarkers.length > 0 && !isDualDriver && (
                <Badge variant="outline" className="text-[9px] h-4 mt-0.5 border-amber-300 text-amber-600 bg-amber-50/50">
                  {driverGroups.changeMarkers.length + 1} conducteurs
                </Badge>
              )}
            </>
          )}
          {isEmptyTour && (
            <Badge variant="outline" className="text-[8px] h-3.5 mt-0.5 border-rose-300 text-rose-500 bg-rose-50">
              Sans ressources
            </Badge>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className={cn("relative flex-1", rowHeight)} style={{ minWidth: getTotalWidth(zoomLevel) }}>
        {/* Service Pickup Block */}
        {servicePickup && sorted.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute h-8 rounded border-2 border-dashed border-emerald-400 bg-emerald-50/50 cursor-pointer hover:bg-emerald-100/50 transition-colors flex items-center gap-1 px-1.5 text-[9px] font-medium text-emerald-700 z-[5]"
                  style={{
                    left: `${minutesToPx(adjustMinutesForStartHour(timeToMinutes(servicePickup.time), startHour), zoomLevel)}px`,
                    width: `${Math.max(minutesToPx(30, zoomLevel), 60)}px`,
                    top: "3px",
                  }}
                >
                  <MapPin className="h-2.5 w-2.5" />
                  <span className="truncate">Prise service</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs p-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Prise de service</p>
                  <p className="text-xs"><strong>Lieu:</strong> {servicePickup.location}</p>
                  <p className="text-xs"><strong>Heure:</strong> {servicePickup.time}</p>
                  <p className="text-xs"><strong>Distance:</strong> {servicePickup.kmFromBase} km</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {isDualDriver ? (
          <>
            {/* ─── Dual-driver split lanes with colored backgrounds ─── */}

            {/* Slot A background band */}
            <div
              className="absolute left-0 right-0 rounded-t-sm"
              style={{ top: "0px", height: "25px", backgroundColor: "rgba(56,189,248,0.06)" }}
            />
            {/* Slot A label */}
            <div
              className="absolute left-1 flex items-center gap-0.5 z-[5] pointer-events-none"
              style={{ top: "0px" }}
            >
              <span className="text-[7px] font-bold text-sky-500/60 uppercase tracking-wider select-none">A</span>
            </div>

            {/* Divider line between A and B */}
            <div className="absolute left-0 right-0 border-b-2 border-dashed border-indigo-300/60" style={{ top: "25px" }} />

            {/* Slot B background band */}
            <div
              className="absolute left-0 right-0 rounded-b-sm"
              style={{ top: "26px", height: "25px", backgroundColor: "rgba(129,140,248,0.06)" }}
            />
            {/* Slot B label */}
            <div
              className="absolute left-1 flex items-center gap-0.5 z-[5] pointer-events-none"
              style={{ top: "26px" }}
            >
              <span className="text-[7px] font-bold text-indigo-500/60 uppercase tracking-wider select-none">B</span>
            </div>

            {/* Idle segments — Slot A */}
            {idleSegmentsA.map((seg, i) => (
              <IdleSegment key={`a-idle-${i}`} startMin={seg.startMin} endMin={seg.endMin} zoomLevel={zoomLevel} startHour={startHour} halfHeight topOffset={3} />
            ))}
            {/* Course blocks — Slot A */}
            {slotACourses.map(course => (
              <CourseBlock
                key={course.id}
                course={course}
                zoomLevel={zoomLevel}
                viewMode={viewMode}
                onClick={() => onCourseClick(course)}
                tournee={tournee}
                startHour={startHour}
                halfHeight
                topOffset={3}
              />
            ))}

            {/* Idle segments — Slot B */}
            {idleSegmentsB.map((seg, i) => (
              <IdleSegment key={`b-idle-${i}`} startMin={seg.startMin} endMin={seg.endMin} zoomLevel={zoomLevel} startHour={startHour} halfHeight topOffset={29} />
            ))}
            {/* Course blocks — Slot B */}
            {slotBCourses.map(course => (
              <CourseBlock
                key={course.id}
                course={course}
                zoomLevel={zoomLevel}
                viewMode={viewMode}
                onClick={() => onCourseClick(course)}
                tournee={tournee}
                startHour={startHour}
                halfHeight
                topOffset={29}
              />
            ))}
          </>
        ) : (
          <>
            {/* ─── Standard single-driver row ─── */}

            {/* Driver change markers */}
            {driverGroups.changeMarkers.map((cm, i) => (
              <DriverChangeMarker
                key={`dcm-${i}`}
                minutePos={cm.minutePos}
                zoomLevel={zoomLevel}
                startHour={startHour}
                prevDriverName={cm.prev}
                nextDriverName={cm.next}
              />
            ))}

            {/* Idle segments */}
            {idleSegmentsAll.map((seg, i) => (
              <IdleSegment key={i} startMin={seg.startMin} endMin={seg.endMin} zoomLevel={zoomLevel} startHour={startHour} />
            ))}

            {/* Course blocks */}
            {sorted.map(course => (
              <CourseBlock
                key={course.id}
                course={course}
                zoomLevel={zoomLevel}
                viewMode={viewMode}
                onClick={() => onCourseClick(course)}
                tournee={tournee}
                startHour={startHour}
                driverGroupColor={driverGroups.colorMap.get(course.id)}
              />
            ))}
          </>
        )}
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
  startHour = 0,
}: GanttViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hourMarkers = useMemo(() => getHourMarkers(zoomLevel, startHour), [zoomLevel, startHour]);
  const totalWidth = getTotalWidth(zoomLevel);

  // Filter courses for the selected date
  const dayCourses = useMemo(() => courses.filter(c => c.date === date), [courses, date]);

  // Create tournee lookup maps
  const tourneeCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    tournees.forEach(t => {
      if (t.id) map.set(t.id, t.tourneeCode);
      t.courses.forEach(c => {
        if (c.tourneeId) map.set(c.tourneeId, t.tourneeCode);
      });
    });
    return map;
  }, [tournees]);

  const tourneeByIdMap = useMemo(() => {
    const map = new Map<string, Tournee>();
    tournees.forEach(t => {
      if (t.id) map.set(t.id, t);
    });
    return map;
  }, [tournees]);

  // Group by resource
  const resourceGroups = useMemo(() => {
    const groups: Map<string, {
      label: string;
      sub: string;
      courses: Course[];
      tourneeCode?: string;
      isDualDriver: boolean;
      driverAName?: string;
      driverBName?: string;
      isEmptyTour: boolean;
      vehicleImmat?: string;
      vehicleType?: string;
    }> = new Map();

    if (viewMode === "tournees") {
      // ─── Tournées mode: group by tournée, show vehicle + driver info ───
      dayCourses.forEach(course => {
        const key = course.tourneeId || `unassigned-${course.id}`;
        const tourneeCode = course.tourneeId ? tourneeCodeMap.get(course.tourneeId) : undefined;
        const tournee = course.tourneeId ? tourneeByIdMap.get(course.tourneeId) : undefined;

        let label = tourneeCode || course.tourneeNumber || "Non affecté";
        const sub = [
          course.requiredVehicleType,
          course.requiredVehicleEnergy,
          course.requiredDriverType,
        ].filter(Boolean).join(" • ");
        const isEmptyTour = !course.assignedVehicleId && !course.assignedDriverId;

        if (!groups.has(key)) {
          groups.set(key, {
            label,
            sub,
            courses: [],
            tourneeCode,
            isDualDriver: !!tournee?.isDualDriver,
            driverAName: tournee?.driverName,
            driverBName: tournee?.driver2Name,
            isEmptyTour,
            vehicleImmat: tournee?.vehicleImmat || course.assignedVehicleImmat,
            vehicleType: tournee?.vehicleType || course.requiredVehicleType,
          });
        }
        groups.get(key)!.courses.push(course);
      });
    } else if (viewMode === "vehicles") {
      dayCourses.forEach(course => {
        const tourneeCode = course.tourneeId ? tourneeCodeMap.get(course.tourneeId) : undefined;
        const key = course.assignedVehicleId || course.tourneeId || `unassigned-${course.id}`;
        const tournee = course.tourneeId ? tourneeByIdMap.get(course.tourneeId) : undefined;

        let label = course.assignedVehicleImmat;
        if (!label && tourneeCode) {
          label = tourneeCode;
        } else if (!label) {
          label = course.tourneeNumber || "Non affecté";
        }

        const sub = course.requiredVehicleType + (course.requiredVehicleEnergy ? ` • ${course.requiredVehicleEnergy}` : "");
        const isEmptyTour = !course.assignedVehicleId && !course.assignedDriverId;

        if (!groups.has(key)) {
          groups.set(key, {
            label,
            sub,
            courses: [],
            tourneeCode,
            isDualDriver: !!tournee?.isDualDriver,
            driverAName: tournee?.driverName,
            driverBName: tournee?.driver2Name,
            isEmptyTour,
          });
        }
        groups.get(key)!.courses.push(course);
      });
    } else {
      // drivers mode
      dayCourses.forEach(course => {
        const key = course.assignedDriverId || course.tourneeId || `unassigned-${course.id}`;
        const tourneeCode = course.tourneeId ? tourneeCodeMap.get(course.tourneeId) : undefined;
        const tournee = course.tourneeId ? tourneeByIdMap.get(course.tourneeId) : undefined;

        let label = course.assignedDriverName;
        if (!label && tourneeCode) {
          label = tourneeCode;
        } else if (!label) {
          label = "Non affecté";
        }

        const sub = course.requiredDriverType || "N/A";
        const isEmptyTour = !course.assignedVehicleId && !course.assignedDriverId;

        if (!groups.has(key)) {
          groups.set(key, {
            label,
            sub,
            courses: [],
            tourneeCode,
            isDualDriver: !!tournee?.isDualDriver,
            driverAName: tournee?.driverName,
            driverBName: tournee?.driver2Name,
            isEmptyTour,
          });
        }
        groups.get(key)!.courses.push(course);
      });
    }

    // Sort: assigned first, then unassigned
    return Array.from(groups.entries()).sort(([, a], [, b]) => {
      const aAssigned = a.courses.some(c => c.assignmentStatus === "affectee");
      const bAssigned = b.courses.some(c => c.assignmentStatus === "affectee");
      if (aAssigned !== bAssigned) return aAssigned ? -1 : 1;
      // Dual-driver first for visibility
      if (a.isDualDriver !== b.isDualDriver) return a.isDualDriver ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
  }, [dayCourses, viewMode, tourneeCodeMap, tourneeByIdMap]);

  // Scroll to optimal position on mount
  useEffect(() => {
    if (scrollRef.current) {
      if (startHour > 0) {
        scrollRef.current.scrollLeft = 0;
      } else {
        const offset6h = minutesToPx(6 * 60, zoomLevel);
        scrollRef.current.scrollLeft = offset6h - 50;
      }
    }
  }, [zoomLevel, date, startHour]);

  const dateObj = parseISO(date);

  // Stats
  const dualDriverCount = resourceGroups.filter(([, g]) => g.isDualDriver).length;

  return (
    <div className="flex flex-col h-full">
      {/* Date header + Legend */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold">
            {format(dateObj, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
          {dualDriverCount > 0 && (
            <Badge variant="outline" className="text-[10px] h-5 border-indigo-300 text-indigo-700 bg-indigo-50 gap-1">
              <Users className="h-3 w-3" />
              {dualDriverCount} tournée{dualDriverCount > 1 ? "s" : ""} 2×conducteurs
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-sky-100 border border-sky-400" /> Régulière</span>
          <span className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-indigo-100 border border-indigo-400" /> Cond. B</span>
          <span className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-amber-100 border border-amber-400" /><Zap className="h-3 w-3 text-amber-500" /> SUP</span>
          <span className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-violet-100 border border-violet-400" /><Shield className="h-3 w-3 text-violet-500" /> Sensible</span>
          <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-rose-500" /> Alerte</span>
          <span className="flex items-center gap-1"><div className="w-3 h-2 rounded border-dashed border border-slate-400 bg-slate-200" /><Moon className="h-3 w-3" /> Nuit</span>
          <span className="flex items-center gap-1"><div className="w-3 h-2 rounded bg-slate-200 border border-slate-400" /> Non affecté</span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-2 rounded" style={{ background: "repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(148,163,184,0.25) 2px, rgba(148,163,184,0.25) 3px)", backgroundColor: "rgba(148,163,184,0.10)" }} />
            Inactif
          </span>
        </div>
      </div>

      {/* Gantt scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div style={{ minWidth: totalWidth + 208 }}>
          {/* Hour headers */}
          <div className="flex sticky top-0 z-20 bg-background border-b">
            <div className="sticky left-0 z-30 w-52 shrink-0 bg-background border-r px-3 py-1.5 flex items-center">
              <p className="text-xs font-semibold text-muted-foreground">
                {viewMode === "tournees" ? "Tournée" : viewMode === "vehicles" ? "Véhicule / Tournée" : "Conducteur"}
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
                tourneeCode={group.tourneeCode}
                courses={group.courses}
                zoomLevel={zoomLevel}
                viewMode={viewMode}
                onCourseClick={onCourseClick}
                tournees={tournees}
                startHour={startHour}
                isDualDriver={group.isDualDriver}
                driverAName={group.driverAName}
                driverBName={group.driverBName}
                isEmptyTour={group.isEmptyTour}
                vehicleImmat={group.vehicleImmat}
                vehicleType={group.vehicleType}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
