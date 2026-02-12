"use client";

import React, { useState, useMemo } from "react";
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
  MapPin,
  Clock,
  AlertTriangle,
  Fuel,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export type GroupingMode = "tournee" | "vehicle" | "driver" | "none";

type SortColumn = "time" | "date" | "client" | "vehicleType" | "status" | "tournee";
type SortDirection = "asc" | "desc";

interface ListViewGroupedProps {
  courses: Course[];
  tournees?: Tournee[];
  groupingMode: GroupingMode;
  viewMode: "vehicles" | "drivers";
  onCourseClick: (course: Course) => void;
}

interface GroupedCourses {
  groupKey: string;
  groupLabel: string;
  groupSubLabel?: string;
  courses: Course[];
  tourneeCode?: string;
}

export function ListViewGrouped({
  courses,
  tournees,
  groupingMode,
  viewMode,
  onCourseClick,
}: ListViewGroupedProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Create tournee code map
  const tourneeCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    tournees?.forEach(t => {
      if (t.id) map.set(t.id, t.tourneeCode);
      t.courses.forEach(c => {
        if (c.tourneeId) map.set(c.tourneeId, t.tourneeCode);
      });
    });
    return map;
  }, [tournees]);

  // Group courses
  const groupedCourses = useMemo(() => {
    const groups = new Map<string, GroupedCourses>();

    courses.forEach(course => {
      let groupKey: string;
      let groupLabel: string;
      let groupSubLabel: string | undefined;
      let tourneeCode: string | undefined;

      if (groupingMode === "tournee") {
        groupKey = course.tourneeId || `unassigned-${course.id}`;
        tourneeCode = course.tourneeId ? tourneeCodeMap.get(course.tourneeId) : undefined;
        groupLabel = tourneeCode || course.tourneeNumber || "Non affecté";
        groupSubLabel = course.assignedVehicleImmat || course.assignedDriverName || undefined;
      } else if (groupingMode === "vehicle") {
        groupKey = course.assignedVehicleId || course.tourneeId || `unassigned-${course.id}`;
        groupLabel = course.assignedVehicleImmat || course.tourneeNumber || "Non affecté";
        groupSubLabel = course.requiredVehicleType + (course.requiredVehicleEnergy ? ` • ${course.requiredVehicleEnergy}` : "");
        tourneeCode = course.tourneeId ? tourneeCodeMap.get(course.tourneeId) : undefined;
      } else if (groupingMode === "driver") {
        groupKey = course.assignedDriverId || course.tourneeId || `unassigned-${course.id}`;
        groupLabel = course.assignedDriverName || course.tourneeNumber || "Non affecté";
        groupSubLabel = course.requiredDriverType || undefined;
        tourneeCode = course.tourneeId ? tourneeCodeMap.get(course.tourneeId) : undefined;
      } else {
        // No grouping
        groupKey = course.id;
        groupLabel = "";
        groupSubLabel = undefined;
        tourneeCode = course.tourneeId ? tourneeCodeMap.get(course.tourneeId) : undefined;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          groupKey,
          groupLabel,
          groupSubLabel,
          courses: [],
          tourneeCode,
        });
      }
      groups.get(groupKey)!.courses.push(course);
    });

    return Array.from(groups.values());
  }, [courses, groupingMode, tourneeCodeMap]);

  // Sort groups and courses within groups
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
          case "status":
            const statusOrder = { affectee: 0, partiellement_affectee: 1, non_affectee: 2 };
            comparison = statusOrder[a.assignmentStatus] - statusOrder[b.assignmentStatus];
            break;
          case "tournee":
            const aCode = a.tourneeId ? tourneeCodeMap.get(a.tourneeId) || "" : "";
            const bCode = b.tourneeId ? tourneeCodeMap.get(b.tourneeId) || "" : "";
            comparison = aCode.localeCompare(bCode);
            break;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });

      return { ...group, courses: sortedCourses };
    }).sort((a, b) => {
      // Sort groups by label
      return a.groupLabel.localeCompare(b.groupLabel);
    });
  }, [groupedCourses, sortColumn, sortDirection, tourneeCodeMap]);

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

  return (
    <TooltipProvider>
    <div className="flex flex-col h-full">
      <div className="overflow-auto flex-1">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {/* 1st column: Code Tournée */}
              <TableHead className="w-[110px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 -ml-2"
                  onClick={() => handleSort("tournee")}
                >
                  Code Tournée
                  <SortIcon column="tournee" />
                </Button>
              </TableHead>
              {/* Group header if applicable */}
              {groupingMode !== "none" && groupingMode !== "tournee" && (
                <TableHead className="w-[150px]">
                  {groupingMode === "vehicle" ? "Véhicule" : "Conducteur"}
                </TableHead>
              )}
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 -ml-2"
                  onClick={() => handleSort("date")}
                >
                  Date
                  <SortIcon column="date" />
                </Button>
              </TableHead>
              <TableHead className="w-[90px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 -ml-2"
                  onClick={() => handleSort("time")}
                >
                  Horaire
                  <SortIcon column="time" />
                </Button>
              </TableHead>
              <TableHead className="w-[130px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 -ml-2"
                  onClick={() => handleSort("client")}
                >
                  Client
                  <SortIcon column="client" />
                </Button>
              </TableHead>
              <TableHead className="w-[180px]">Trajet</TableHead>
              <TableHead className="w-[100px]">Véhicule</TableHead>
              <TableHead className="w-[100px]">Conducteur</TableHead>
              <TableHead className="w-[80px]">Énergie</TableHead>
              <TableHead className="w-[70px]">Formations</TableHead>
              <TableHead className="w-[80px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 -ml-2"
                  onClick={() => handleSort("vehicleType")}
                >
                  Type
                  <SortIcon column="vehicleType" />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 -ml-2"
                  onClick={() => handleSort("status")}
                >
                  Statut
                  <SortIcon column="status" />
                </Button>
              </TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGroups.map((group, groupIdx) => (
              <React.Fragment key={group.groupKey}>
                {groupingMode !== "none" && (
                  <TableRow className="bg-muted/50 hover:bg-muted">
                    <TableCell colSpan={13} className="font-semibold">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span>{group.groupLabel}</span>
                        {group.groupSubLabel && (
                          <span className="text-xs text-muted-foreground font-normal">
                            {group.groupSubLabel}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-[10px] ml-auto">
                          {group.courses.length} course(s)
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {group.courses.map((course) => (
                  <TableRow
                    key={course.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      course.isSensitive && "bg-violet-50/50"
                    )}
                    onClick={() => onCourseClick(course)}
                  >
                    {/* 1st col: Code Tournée */}
                    <TableCell className="text-xs">
                      {group.tourneeCode || course.tourneeNumber ? (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {group.tourneeCode || course.tourneeNumber}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">—</span>
                      )}
                    </TableCell>
                    {/* Group column if not tournee grouping */}
                    {groupingMode !== "none" && groupingMode !== "tournee" && (
                      <TableCell className="text-xs font-medium">
                        {groupingMode === "vehicle"
                          ? course.assignedVehicleImmat || <span className="text-muted-foreground">—</span>
                          : course.assignedDriverName || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    )}
                    <TableCell className="text-xs">
                      {format(new Date(course.date), "EEE d MMM", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {course.startTime} - {course.endTime}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      <div className="flex items-center gap-1">
                        {course.isSensitive && (
                          <Shield className="h-3 w-3 text-violet-600 shrink-0" />
                        )}
                        {course.client || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{course.startLocation}</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{course.endLocation}</span>
                      </div>
                    </TableCell>
                    {/* Véhicule */}
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <Truck className="h-3 w-3 text-muted-foreground" />
                        {course.assignedVehicleImmat || (
                          <span className="text-muted-foreground italic">{course.requiredVehicleType}</span>
                        )}
                      </div>
                    </TableCell>
                    {/* Conducteur */}
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {course.assignedDriverName || (
                          <span className="text-muted-foreground italic">{course.requiredDriverType || "—"}</span>
                        )}
                      </div>
                    </TableCell>
                    {/* Énergie */}
                    <TableCell className="text-xs">
                      {course.requiredVehicleEnergy ? (
                        <Badge variant="outline" className={cn("text-[9px] px-1 h-4",
                          course.requiredVehicleEnergy === "Diesel" && "border-slate-300 text-slate-600",
                          course.requiredVehicleEnergy === "Gaz" && "border-sky-300 text-sky-600",
                          course.requiredVehicleEnergy === "Électrique" && "border-emerald-300 text-emerald-600"
                        )}>
                          <Fuel className="h-2.5 w-2.5 mr-0.5" />
                          {course.requiredVehicleEnergy}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    {/* Formations / Spécificités */}
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        {course.requiredDriverSkills.length > 0 ? (
                          course.requiredDriverSkills.map((skill) => (
                            <Tooltip key={skill}>
                              <TooltipTrigger>
                                <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4 font-semibold",
                                  skill === "Habilitation sûreté" && "border-violet-300 text-violet-700 bg-violet-50",
                                  skill === "ADR" && "border-rose-300 text-rose-700 bg-rose-50",
                                  skill === "Aéroportuaire" && "border-sky-300 text-sky-700 bg-sky-50"
                                )}>
                                  {skill === "Habilitation sûreté" ? "HP" : skill === "Aéroportuaire" ? "FS" : skill}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">{skill}</TooltipContent>
                            </Tooltip>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    {/* Type véhicule */}
                    <TableCell className="text-xs">
                      <Badge variant="secondary" className="text-[9px] h-4">
                        {course.requiredVehicleType}
                      </Badge>
                    </TableCell>
                    {/* Statut */}
                    <TableCell>
                      <Badge
                        variant={
                          course.assignmentStatus === "affectee"
                            ? "default"
                            : course.assignmentStatus === "partiellement_affectee"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {course.assignmentStatus === "affectee"
                          ? "Affectée"
                          : course.assignmentStatus === "partiellement_affectee"
                          ? "Partielle"
                          : "Non affectée"}
                      </Badge>
                    </TableCell>
                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {course.prestationType === "sup" && (
                          <Zap className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        {course.assignmentStatus === "non_affectee" && (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    </TooltipProvider>
  );
}
