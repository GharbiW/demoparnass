"use client";

import { useState, useMemo, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import {
  GanttChartIcon,
  List,
  Truck,
  Users,
  Calendar,
  Send,
  Search,
  Filter,
  LayoutGrid,
  LayoutList,
  MapPin,
  Clock,
  AlertTriangle,
  Shield,
  Zap,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  ZoomIn,
  ZoomOut,
  Eye,
  X,
} from "lucide-react";
import { addDays, format, startOfWeek, subDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Course } from "@/lib/types";
import {
  planningCourses,
  planningTournees,
  getHealthMetrics,
  planningVersions,
  getAvailableDrivers,
  getAvailableVehicles,
  getVehicleAvailability,
} from "@/lib/conception-planning-data";
import { HealthTiles } from "@/components/conception/planning/health-tiles";
import { ConceptionGanttView } from "@/components/conception/planning/gantt-view";
import { CourseDetailDialog } from "@/components/conception/planning/course-detail-dialog";
import { PublishDialog } from "@/components/conception/planning/publish-dialog";
import { ListViewGrouped } from "@/components/conception/planning/list-view-grouped";
import { AdvancedFiltersPanel, AdvancedFilters, defaultFilters } from "@/components/conception/planning/advanced-filters";
import { QuickSupDialog } from "@/components/conception/planning/quick-sup-dialog";

type DisplayMode = "gantt" | "list";
type ViewMode = "vehicles" | "drivers" | "tournees";
type ZoomLevel = "15min" | "30min" | "1h";
type PeriodMode = "day" | "week";

// ─── Interactive Table Row ──────────────────────────────────────────────────

function CourseTableRow({
  course,
  viewMode,
  onClick,
}: {
  course: Course;
  viewMode: ViewMode;
  onClick: () => void;
}) {
  const isUnassigned = course.assignmentStatus !== "affectee";
  const isSup = course.prestationType === "sup";
  const dateObj = parseISO(course.date);

  return (
    <TableRow
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        isUnassigned && "bg-slate-50/50",
        course.isSensitive && "border-l-2 border-l-violet-400"
      )}
      onClick={onClick}
    >
      <TableCell className="py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-semibold">{course.id}</span>
          {course.isSensitive && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><Shield className="h-3 w-3 text-violet-500" /></TooltipTrigger>
                <TooltipContent className="text-xs">Course sensible</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isSup && <Badge variant="outline" className="text-[9px] h-4 border-amber-300 text-amber-700">SUP</Badge>}
        </div>
      </TableCell>
      <TableCell className="py-2 text-xs">{course.client || "N/A"}</TableCell>
      <TableCell className="py-2">
        <div className="flex items-center gap-1 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate max-w-[120px]">{course.startLocation}</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span className="truncate max-w-[120px]">{course.endLocation}</span>
        </div>
      </TableCell>
      <TableCell className="py-2 text-xs">
        {format(dateObj, "EEE dd/MM", { locale: fr })}
      </TableCell>
      <TableCell className="py-2 text-xs font-mono">
        {course.startTime} — {course.endTime}
      </TableCell>
      <TableCell className="py-2">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] h-4",
            course.assignmentStatus === "affectee"
              ? "border-emerald-300 text-emerald-700 bg-emerald-50"
              : course.assignmentStatus === "partiellement_affectee"
                ? "border-amber-300 text-amber-700 bg-amber-50"
                : "border-slate-300 text-slate-700 bg-slate-50"
          )}
        >
          {course.assignmentStatus === "affectee" ? "Affectée" : course.assignmentStatus === "partiellement_affectee" ? "Partiellement affectée" : "Non affectée"}
        </Badge>
      </TableCell>
      <TableCell className="py-2 text-xs">
        {viewMode === "vehicles" ? (
          <span>{course.assignedVehicleImmat || <span className="text-muted-foreground">—</span>}</span>
        ) : viewMode === "drivers" ? (
          <span>{course.assignedDriverName || <span className="text-muted-foreground">—</span>}</span>
        ) : (
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1">{course.assignedVehicleImmat || <span className="text-muted-foreground">—</span>}</span>
            <span className="flex items-center gap-1 text-muted-foreground">{course.assignedDriverName || "—"}</span>
          </div>
        )}
      </TableCell>
      <TableCell className="py-2">
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-[9px] h-4">{course.requiredVehicleType}</Badge>
          {course.requiredDriverType && (
            <Badge variant="outline" className="text-[9px] h-4">{course.requiredDriverType}</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="py-2 text-right">
        <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
          <Eye className="h-3 w-3 mr-1" /> Détail
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

function ConceptionPlanningContent() {
  const { toast } = useToast();

  // State
  const [displayMode, setDisplayMode] = useState<DisplayMode>("gantt");
  const [viewMode, setViewMode] = useState<ViewMode>("tournees");
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("1h");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("day");
  const [date, setDate] = useState<Date>(new Date());
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [quickSupOpen, setQuickSupOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>(planningCourses);
  // groupingMode now derived from viewMode directly
  const [ganttStartHour, setGanttStartHour] = useState(0); // 0 = midnight, 6 = 6:00
  const [weekStatus, setWeekStatus] = useState<"draft" | "published">("draft");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [healthFilter, setHealthFilter] = useState<string | null>(null);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(defaultFilters);

  // Computed
  const currentDateStr = format(date, "yyyy-MM-dd");
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  const metrics = useMemo(() => getHealthMetrics(), []);
  const vehicleAvailability = useMemo(() => getVehicleAvailability(currentDateStr), [currentDateStr]);

  // Available data for advanced filters
  const availableClients = useMemo(() => 
    Array.from(new Set(courses.map(c => c.client).filter(Boolean) as string[])).sort(), 
    [courses]
  );
  const availableVehiclesForFilter = useMemo(() => 
    getAvailableVehicles().map(v => ({ vin: v.vin, immatriculation: v.immatriculation, type: 'Semi-remorque' })), 
    []
  );
  const availableDriversForFilter = useMemo(() => 
    getAvailableDrivers().map(d => ({ id: d.id, name: d.name, type: d.driverType || 'CM' })), 
    []
  );

  // Filter courses for the list view
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Date filter
    if (periodMode === "day") {
      filtered = filtered.filter(c => c.date === currentDateStr);
    } else {
      const weekEnd = format(addDays(weekStart, 6), "yyyy-MM-dd");
      const weekStartStr = format(weekStart, "yyyy-MM-dd");
      filtered = filtered.filter(c => c.date >= weekStartStr && c.date <= weekEnd);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.client?.toLowerCase().includes(q) ||
        c.startLocation.toLowerCase().includes(q) ||
        c.endLocation.toLowerCase().includes(q) ||
        c.assignedDriverName?.toLowerCase().includes(q) ||
        c.assignedVehicleImmat?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.assignmentStatus === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(c => c.prestationType === typeFilter);
    }

    // Health filter
    if (healthFilter) {
      switch (healthFilter) {
        case "absent_drivers":
          // Filter courses impacted by absent drivers
          // In a real scenario, we'd check which drivers are absent and filter their courses
          filtered = filtered.filter(c => c.assignmentStatus === "non_affectee" && c.missingResource === "driver");
          break;
        case "unavailable_vehicles":
          // Filter courses impacted by unavailable vehicles
          filtered = filtered.filter(c => c.assignmentStatus === "non_affectee" && c.missingResource === "vehicle");
          break;
        case "unplaced":
          // Filter unplaced courses
          filtered = filtered.filter(c => c.assignmentStatus !== "affectee");
          break;
        case "alerts":
          // Filter courses with alerts (simplified - in real scenario would check alert rules)
          filtered = filtered.filter(c => c.constraintWarnings && c.constraintWarnings.length > 0);
          break;
        case "amplitude":
          // Filter courses with drivers out of amplitude (simplified)
          // In real scenario, would check driver amplitude constraints
          break;
        case "modifications":
          // Filter courses with modifications
          filtered = filtered.filter(c => c.temporaryModifications || c.cancellation);
          break;
        case "expiring":
          // Filter prestations expiring in 4 weeks (simplified)
          // In real scenario, would check prestation end dates
          break;
      }
    }

    // Advanced filters
    if (advancedFilters.client !== "all") {
      filtered = filtered.filter(c => c.client === advancedFilters.client);
    }
    if (advancedFilters.vehicleType !== "all") {
      filtered = filtered.filter(c => c.requiredVehicleType === advancedFilters.vehicleType);
    }
    if (advancedFilters.driverType !== "all") {
      filtered = filtered.filter(c => c.requiredDriverType === advancedFilters.driverType);
    }
    if (advancedFilters.vehicle !== "all") {
      filtered = filtered.filter(c => c.assignedVehicleId === advancedFilters.vehicle);
    }
    if (advancedFilters.driver !== "all") {
      filtered = filtered.filter(c => c.assignedDriverId === advancedFilters.driver);
    }
    if (advancedFilters.prestationType !== "all") {
      filtered = filtered.filter(c => c.prestationType === advancedFilters.prestationType);
    }
    if (advancedFilters.energy !== "all") {
      filtered = filtered.filter(c => c.requiredVehicleEnergy === advancedFilters.energy);
    }
    if (advancedFilters.hasFormation !== "all") {
      filtered = filtered.filter(c => 
        c.requiredDriverSkills.includes(advancedFilters.hasFormation as any)
      );
    }
    if (advancedFilters.sensitiveOnly) {
      filtered = filtered.filter(c => c.isSensitive);
    }
    if (!advancedFilters.includeWeekend) {
      // Exclude weekends (Saturday = 6, Sunday = 0)
      filtered = filtered.filter(c => {
        const date = new Date(c.date);
        const day = date.getDay();
        return day !== 0 && day !== 6;
      });
    }

    return filtered.sort((a, b) => {
      // Sensitive first
      if (a.isSensitive !== b.isSensitive) return a.isSensitive ? -1 : 1;
      // Then by time
      return a.startTime.localeCompare(b.startTime);
    });
  }, [courses, currentDateStr, periodMode, weekStart, searchQuery, statusFilter, typeFilter, healthFilter, advancedFilters]);

  // Stats for current view
  const viewStats = useMemo(() => {
    const total = filteredCourses.length;
    const assigned = filteredCourses.filter(c => c.assignmentStatus === "affectee").length;
    const sensitive = filteredCourses.filter(c => c.isSensitive).length;
    const dualDriverCourses = filteredCourses.filter(c => c.isDualDriver).length;

    // Count distinct tournées
    const tourneeIds = new Set(filteredCourses.map(c => c.tourneeId).filter(Boolean));
    const dualDriverTournees = planningTournees.filter(t => t.isDualDriver && tourneeIds.has(t.id)).length;

    return { total, assigned, unassigned: total - assigned, sensitive, tourneeCount: tourneeIds.size, dualDriverTournees, dualDriverCourses };
  }, [filteredCourses]);

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setCourseDialogOpen(true);
  };

  const handleCourseSave = (updatedCourse: Course) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    toast({
      title: "Course mise à jour",
      description: `${updatedCourse.id} a été sauvegardée avec succès.`,
    });
  };

  const handlePublish = (note: string) => {
    setWeekStatus("published");
    toast({
      title: "Plan publié",
      description: `Le plan S+1 a été publié et figé pour la Conception.`,
    });
  };

  const handleTileClick = (filter: string) => {
    // Toggle filter - if same filter clicked, remove it
    if (healthFilter === filter) {
      setHealthFilter(null);
      toast({
        title: "Filtre retiré",
        description: "Le filtre a été désactivé.",
      });
    } else {
      setHealthFilter(filter);
      // Switch to list view to see filtered results
      if (displayMode === "gantt") {
        setDisplayMode("list");
      }
      toast({
        title: "Filtre appliqué",
        description: `Affichage des courses filtrées par: ${filter.replace(/_/g, ' ')}`,
      });
    }
  };

  const navigateDate = (direction: number) => {
    if (periodMode === "day") {
      setDate(prev => addDays(prev, direction));
    } else {
      setDate(prev => addDays(prev, direction * 7));
    }
  };

  const weekLabel = `S${format(weekStart, "ww")} — ${format(weekStart, "dd/MM")} au ${format(addDays(weekStart, 6), "dd/MM/yyyy")}`;

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-headline">Planning Global — Conception</h1>
            <Badge
              variant="outline"
              className={cn("text-[10px] h-5",
                weekStatus === "published"
                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                  : "border-slate-300 text-slate-600 bg-slate-50"
              )}
            >
              {weekStatus === "published" ? "Publié" : "Brouillon"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{weekLabel}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selector */}
          <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
            <Button
              variant={periodMode === "day" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPeriodMode("day")}
            >
              Jour
            </Button>
            <Button
              variant={periodMode === "week" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPeriodMode("week")}
            >
              Semaine
            </Button>
          </div>

          {/* Date nav */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateDate(-1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs min-w-[140px]">
                  <Calendar className="h-3 w-3 mr-1.5" />
                  {format(date, "EEE d MMM yyyy", { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarWidget
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateDate(1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Display mode */}
          <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
            <Button
              variant={displayMode === "gantt" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDisplayMode("gantt")}
            >
              <GanttChartIcon className="h-3 w-3 mr-1" /> Gantt
            </Button>
            <Button
              variant={displayMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDisplayMode("list")}
            >
              <List className="h-3 w-3 mr-1" /> Liste
            </Button>
          </div>

          {/* View mode — 3-way toggle */}
          <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
            <Button
              variant={viewMode === "tournees" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setViewMode("tournees")}
            >
              <Package className="h-3 w-3 mr-1" /> Tournées
            </Button>
            <Button
              variant={viewMode === "vehicles" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setViewMode("vehicles")}
            >
              <Truck className="h-3 w-3 mr-1" /> Véhicules
            </Button>
            <Button
              variant={viewMode === "drivers" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setViewMode("drivers")}
            >
              <Users className="h-3 w-3 mr-1" /> Chauffeurs
            </Button>
          </div>

          {/* Grouping mode dropdown removed – list view now uses viewMode toggle directly */}

          {/* Zoom (Gantt only) */}
          {displayMode === "gantt" && (
            <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
              <Button
                variant={zoomLevel === "1h" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setZoomLevel("1h")}
              >
                1h
              </Button>
              <Button
                variant={zoomLevel === "30min" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setZoomLevel("30min")}
              >
                30m
              </Button>
              <Button
                variant={zoomLevel === "15min" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setZoomLevel("15min")}
              >
                15m
              </Button>
            </div>
          )}

          {/* Quick SUP */}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={() => setQuickSupOpen(true)}
          >
            <Zap className="h-3 w-3 mr-1" /> + SUP
          </Button>

          {/* Gantt start hour config */}
          {displayMode === "gantt" && (
            <Select value={String(ganttStartHour)} onValueChange={(v) => setGanttStartHour(Number(v))}>
              <SelectTrigger className="h-7 w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">00h-24h</SelectItem>
                <SelectItem value="4">04h-04h</SelectItem>
                <SelectItem value="5">05h-05h</SelectItem>
                <SelectItem value="6">06h-06h</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Publish CTA */}
          <Button
            size="sm"
            className="h-7 text-xs bg-sky-600 hover:bg-sky-700"
            onClick={() => setPublishOpen(true)}
          >
            <Send className="h-3 w-3 mr-1" /> Publier S+1
          </Button>
        </div>
      </div>

      {/* ─── Health Tiles ─── */}
      <div className="space-y-2">
        <HealthTiles metrics={metrics} onTileClick={handleTileClick} />
        {healthFilter && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              Filtre actif: {healthFilter.replace(/_/g, ' ')}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setHealthFilter(null)}
            >
              <X className="h-3 w-3 mr-1" /> Retirer le filtre
            </Button>
          </div>
        )}
      </div>

      {/* ─── Vehicle Availability (Pessimistic) ─── */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg border text-xs">
        <Truck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span className="font-semibold text-slate-700">Disponibilité véhicules (pessimiste):</span>
        <Badge variant="outline" className={cn("text-[10px] h-5", vehicleAvailability.availabilityRate >= 80 ? "border-emerald-300 text-emerald-700 bg-emerald-50" : vehicleAvailability.availabilityRate >= 60 ? "border-amber-300 text-amber-700 bg-amber-50" : "border-rose-300 text-rose-700 bg-rose-50")}>
          {vehicleAvailability.availabilityRate}% dispo
        </Badge>
        <span className="text-muted-foreground">
          {vehicleAvailability.availableToday}/{vehicleAvailability.totalVehicles} disponibles
        </span>
        {vehicleAvailability.maintenancePlanned > 0 && (
          <Badge variant="secondary" className="text-[10px] h-5">
            {vehicleAvailability.maintenancePlanned} maint.
          </Badge>
        )}
        {vehicleAvailability.breakdowns > 0 && (
          <Badge variant="destructive" className="text-[10px] h-5">
            {vehicleAvailability.breakdowns} pannes
          </Badge>
        )}
        <div className="flex-1" />
        {Object.entries(vehicleAvailability.byType).slice(0, 4).map(([type, data]) => (
          <span key={type} className="text-muted-foreground whitespace-nowrap">
            {type}: <span className="font-medium text-foreground">{data.available}</span>/{data.total}
          </span>
        ))}
      </div>

      {/* ─── View Stats Bar ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{viewStats.total} courses</span>
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3 text-sky-500" />
            {viewStats.tourneeCount} tournées
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            {viewStats.assigned} affectées
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            {viewStats.unassigned} restantes
          </span>
          {viewStats.sensitive > 0 && (
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-violet-500" />
              {viewStats.sensitive} sensibles
            </span>
          )}
          {viewStats.dualDriverTournees > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 text-indigo-500" />
              {viewStats.dualDriverTournees} tournées 2×cond.
            </span>
          )}
        </div>

        {/* List-mode filters */}
        {displayMode === "list" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="h-7 w-48 pl-7 text-xs"
                />
                {searchQuery && (
                  <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearchQuery("")}>
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tous statuts</SelectItem>
                  <SelectItem value="affectee" className="text-xs">Affectée</SelectItem>
                  <SelectItem value="partiellement_affectee" className="text-xs">Partiellement affectée</SelectItem>
                  <SelectItem value="non_affectee" className="text-xs">Non affectée</SelectItem>
                </SelectContent>
              </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Tous types</SelectItem>
                <SelectItem value="régulière" className="text-xs">Régulière</SelectItem>
                <SelectItem value="sup" className="text-xs">SUP</SelectItem>
                <SelectItem value="spot" className="text-xs">Spot</SelectItem>
              </SelectContent>
            </Select>
            </div>
            <AdvancedFiltersPanel
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              availableClients={availableClients}
              availableVehicles={availableVehiclesForFilter}
              availableDrivers={availableDriversForFilter}
              onReset={() => setAdvancedFilters(defaultFilters)}
            />
          </div>
        )}
      </div>

      {/* ─── Main Content ─── */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          {displayMode === "gantt" ? (
            /* Gantt View */
            periodMode === "day" ? (
              <ConceptionGanttView
                courses={courses}
                tournees={planningTournees}
                viewMode={viewMode}
                date={currentDateStr}
                zoomLevel={zoomLevel}
                onCourseClick={handleCourseClick}
                startHour={ganttStartHour}
              />
            ) : (
              /* Week Gantt: show day tabs */
              <div className="flex flex-col h-full">
                <div className="flex border-b bg-muted/30">
                  {weekDays.map((d) => {
                    const dayStr = format(d, "yyyy-MM-dd");
                    const isSelected = dayStr === currentDateStr;
                    const dayCoursesCount = courses.filter(c => c.date === dayStr).length;
                    return (
                      <button
                        key={dayStr}
                        className={cn(
                          "flex-1 px-2 py-1.5 text-center border-b-2 transition-colors",
                          isSelected ? "border-sky-500 bg-white" : "border-transparent hover:bg-muted/50"
                        )}
                        onClick={() => setDate(d)}
                      >
                        <p className={cn("text-xs font-semibold", isSelected ? "text-sky-700" : "text-muted-foreground")}>
                          {format(d, "EEE", { locale: fr })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{format(d, "dd/MM")}</p>
                        <Badge variant="secondary" className="text-[9px] h-4 mt-0.5">{dayCoursesCount}</Badge>
                      </button>
                    );
                  })}
                </div>
                <div className="flex-1">
                  <ConceptionGanttView
                    courses={courses}
                    tournees={planningTournees}
                    viewMode={viewMode}
                    date={currentDateStr}
                    zoomLevel={zoomLevel}
                    onCourseClick={handleCourseClick}
                    startHour={ganttStartHour}
                  />
                </div>
              </div>
            )
          ) : (
            /* List View */
            <ListViewGrouped
              courses={filteredCourses}
              tournees={planningTournees}
              viewMode={viewMode}
              onCourseClick={handleCourseClick}
            />
          )}
        </CardContent>
      </Card>

      {/* ─── Dialogs ─── */}
      <CourseDetailDialog
        course={selectedCourse}
        open={courseDialogOpen}
        onOpenChange={setCourseDialogOpen}
        onSave={handleCourseSave}
        tournees={planningTournees}
      />

      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        metrics={metrics}
        weekLabel={`S${format(weekStart, "ww")}`}
        versionLabel="v1"
        onPublish={handlePublish}
      />

      <QuickSupDialog
        open={quickSupOpen}
        onOpenChange={setQuickSupOpen}
        defaultDate={currentDateStr}
      />
    </div>
  );
}

export default function ConceptionPlanningPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Chargement du planning...</div>}>
      <ConceptionPlanningContent />
    </Suspense>
  );
}
