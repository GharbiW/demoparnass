"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Truck,
  User,
  Clock,
  MapPin,
  CalendarDays,
  Package,
  AlertTriangle,
  Shield,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  CircleDot,
  Eye,
  Route,
  Calendar,
  ArrowRight,
  ChevronDown,
  FileText,
  Fuel,
  BadgeCheck,
  Download,
} from "lucide-react";
import { Course } from "@/lib/types";
import { planningCourses } from "@/lib/conception-planning-data";
import { unassignedPrestations } from "@/lib/a-placer-data-v2";
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CourseDetailDialog } from "@/components/conception/planning/course-detail-dialog";

// Merge courses from both sources
function getAllCourses(): Course[] {
  const unassignedCourses = unassignedPrestations.flatMap((p) =>
    p.courses.map((c) => ({
      ...c,
      client: c.client || p.client,
      prestationType: c.prestationType || p.type,
    }))
  );

  // Combine, dedupe by id
  const courseMap = new Map<string, Course>();
  [...planningCourses, ...unassignedCourses].forEach((c) => {
    courseMap.set(c.id, c);
  });
  return Array.from(courseMap.values());
}

// Status config
const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  assigned: {
    label: "Affectée",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  partial: {
    label: "Partielle",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <CircleDot className="h-3.5 w-3.5" />,
  },
  unassigned: {
    label: "Non affectée",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

// Missing resource config
const missingResourceLabel: Record<string, string> = {
  driver: "Conducteur manquant",
  vehicle: "Véhicule manquant",
  both: "Cond. + Véh. manquants",
};

type SortField = "date" | "client" | "status" | "startTime" | "prestationType";
type SortDirection = "asc" | "desc";

export default function CoursesPage() {
  const allCourses = useMemo(() => getAllCourses(), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [weekFilter, setWeekFilter] = useState("all");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Week ranges
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  // Filter and sort
  const filteredCourses = useMemo(() => {
    let courses = [...allCourses];

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.id.toLowerCase().includes(lower) ||
          c.prestationId.toLowerCase().includes(lower) ||
          (c.client || "").toLowerCase().includes(lower) ||
          c.startLocation.toLowerCase().includes(lower) ||
          c.endLocation.toLowerCase().includes(lower) ||
          (c.assignedDriverName || "").toLowerCase().includes(lower) ||
          (c.assignedVehicleImmat || "").toLowerCase().includes(lower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      courses = courses.filter((c) => c.assignmentStatus === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      courses = courses.filter((c) => c.prestationType === typeFilter);
    }

    // Vehicle type filter
    if (vehicleTypeFilter !== "all") {
      courses = courses.filter((c) => c.requiredVehicleType === vehicleTypeFilter);
    }

    // Week filter
    if (weekFilter !== "all") {
      const weekNum = parseInt(weekFilter.replace("S+", ""));
      const wStart = addWeeks(weekStart, weekNum - 1);
      const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
      courses = courses.filter((c) => {
        try {
          const d = parseISO(c.date);
          return isWithinInterval(d, { start: wStart, end: wEnd });
        } catch {
          return false;
        }
      });
    }

    // Sort
    courses.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
          break;
        case "client":
          cmp = (a.client || "").localeCompare(b.client || "");
          break;
        case "status":
          cmp = a.assignmentStatus.localeCompare(b.assignmentStatus);
          break;
        case "startTime":
          cmp = a.startTime.localeCompare(b.startTime);
          break;
        case "prestationType":
          cmp = (a.prestationType || "").localeCompare(b.prestationType || "");
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return courses;
  }, [allCourses, searchTerm, statusFilter, typeFilter, weekFilter, vehicleTypeFilter, sortField, sortDirection]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: allCourses.length,
      assigned: allCourses.filter((c) => c.assignmentStatus === "assigned").length,
      unassigned: allCourses.filter((c) => c.assignmentStatus === "unassigned").length,
      partial: allCourses.filter((c) => c.assignmentStatus === "partial").length,
      sensitive: allCourses.filter((c) => c.isSensitive).length,
      sup: allCourses.filter((c) => c.prestationType === "sup").length,
    };
  }, [allCourses]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getTrajetDisplay = (course: Course) => {
    const parts = [course.startLocation];
    if (course.intermediateLocations?.length) {
      parts.push(...course.intermediateLocations);
    }
    parts.push(course.endLocation);
    return parts;
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full space-y-4">
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline">Courses</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Vue centralisée de toutes les courses planifiées et à planifier
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Exporter
            </Button>
          </div>
        </div>

        {/* ─── Stats Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setStatusFilter("all")}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Total</p>
                <Package className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card
            className={cn("cursor-pointer hover:shadow-sm transition-shadow", statusFilter === "assigned" && "ring-2 ring-emerald-400")}
            onClick={() => setStatusFilter(statusFilter === "assigned" ? "all" : "assigned")}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Affectées</p>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold mt-1 text-emerald-700">{stats.assigned}</p>
            </CardContent>
          </Card>
          <Card
            className={cn("cursor-pointer hover:shadow-sm transition-shadow", statusFilter === "unassigned" && "ring-2 ring-slate-400")}
            onClick={() => setStatusFilter(statusFilter === "unassigned" ? "all" : "unassigned")}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Non affectées</p>
                <XCircle className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold mt-1">{stats.unassigned}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-sm transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Partielles</p>
                <CircleDot className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold mt-1 text-amber-700">{stats.partial}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-sm transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Sensibles</p>
                <Shield className="h-4 w-4 text-rose-400" />
              </div>
              <p className="text-2xl font-bold mt-1 text-rose-600">{stats.sensitive}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-sm transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">SUP</p>
                <FileText className="h-4 w-4 text-sky-400" />
              </div>
              <p className="text-2xl font-bold mt-1 text-sky-600">{stats.sup}</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Filters Bar ─────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher course, client, lieu, conducteur..."
                  className="pl-8 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="assigned">Affectées</SelectItem>
                  <SelectItem value="unassigned">Non affectées</SelectItem>
                  <SelectItem value="partial">Partielles</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="régulière">Régulière</SelectItem>
                  <SelectItem value="sup">SUP</SelectItem>
                  <SelectItem value="spot">Spot</SelectItem>
                </SelectContent>
              </Select>
              <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Véhicule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous véhicules</SelectItem>
                  <SelectItem value="Semi-remorque">Semi-remorque</SelectItem>
                  <SelectItem value="Caisse mobile">Caisse mobile</SelectItem>
                  <SelectItem value="Frigo">Frigo</SelectItem>
                  <SelectItem value="ADR">ADR</SelectItem>
                  <SelectItem value="SPL">SPL</SelectItem>
                  <SelectItem value="VL">VL</SelectItem>
                </SelectContent>
              </Select>
              <Select value={weekFilter} onValueChange={setWeekFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Semaine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes sem.</SelectItem>
                  <SelectItem value="S+1">S+1</SelectItem>
                  <SelectItem value="S+2">S+2</SelectItem>
                  <SelectItem value="S+3">S+3</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 rounded-r-none gap-1"
                  onClick={() => setViewMode("table")}
                >
                  <LayoutList className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 rounded-l-none gap-1"
                  onClick={() => setViewMode("cards")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Results Count ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{filteredCourses.length}</span> course{filteredCourses.length > 1 ? "s" : ""} trouvée{filteredCourses.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* ─── Table View ──────────────────────────────────────────────────── */}
        {viewMode === "table" ? (
          <Card className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[130px] cursor-pointer" onClick={() => toggleSort("date")}>
                      <div className="flex items-center gap-1">
                        Date
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px]">Ref Course</TableHead>
                    <TableHead className="w-[100px]">Ref Presta</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("client")}>
                      <div className="flex items-center gap-1">
                        Client
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[250px]">Trajet</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("startTime")}>
                      <div className="flex items-center gap-1">
                        Horaires
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("prestationType")}>
                      <div className="flex items-center gap-1">
                        Type
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Conducteur</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                      <div className="flex items-center gap-1">
                        Statut
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => {
                    const trajetParts = getTrajetDisplay(course);
                    const sc = statusConfig[course.assignmentStatus];
                    return (
                      <TableRow
                        key={course.id}
                        className="group cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedCourse(course)}
                      >
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {(() => {
                              try {
                                return format(parseISO(course.date), "dd MMM yyyy", { locale: fr });
                              } catch {
                                return course.date;
                              }
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground">{course.id}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-indigo-600">{course.prestationId}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm">{course.client || "—"}</span>
                            {course.isSensitive && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Shield className="h-3.5 w-3.5 text-rose-500" />
                                </TooltipTrigger>
                                <TooltipContent>Course sensible</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                            <span className="truncate max-w-[80px]" title={trajetParts[0]}>{trajetParts[0]}</span>
                            {trajetParts.length > 2 && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                    +{trajetParts.length - 2}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-0.5">
                                    {trajetParts.map((p, i) => (
                                      <div key={i} className="flex items-center gap-1 text-xs">
                                        {i > 0 && <ArrowRight className="h-2.5 w-2.5" />}
                                        {p}
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <MapPin className="h-3 w-3 text-rose-400 flex-shrink-0" />
                            <span className="truncate max-w-[80px]" title={trajetParts[trajetParts.length - 1]}>
                              {trajetParts[trajetParts.length - 1]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {course.startTime} — {course.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] capitalize",
                              course.prestationType === "sup" && "bg-sky-50 text-sky-700 border-sky-200",
                              course.prestationType === "spot" && "bg-violet-50 text-violet-700 border-violet-200"
                            )}
                          >
                            {course.prestationType || "régulière"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-xs">
                              <Truck className="h-3 w-3 text-muted-foreground" />
                              {course.assignedVehicleImmat || (
                                <span className="text-muted-foreground italic">
                                  {course.requiredVehicleType}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {course.assignedDriverName || (
                              <span className="text-muted-foreground italic">
                                {course.requiredDriverType || "—"}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px] gap-1 font-medium", sc?.color)}>
                            {sc?.icon}
                            {sc?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        ) : (
          /* ─── Cards View ──────────────────────────────────────────────────── */
          <ScrollArea className="h-[calc(100vh-380px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCourses.map((course) => {
                const trajetParts = getTrajetDisplay(course);
                const sc = statusConfig[course.assignmentStatus];
                return (
                  <Card
                    key={course.id}
                    className="group cursor-pointer hover:shadow-md transition-all hover:border-slate-300"
                    onClick={() => setSelectedCourse(course)}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Header row */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{course.client || "—"}</span>
                            {course.isSensitive && (
                              <Badge className="bg-rose-50 text-rose-600 border-rose-200 text-[10px] px-1.5 py-0" variant="outline">
                                <Shield className="h-2.5 w-2.5 mr-0.5" />
                                Sensible
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-muted-foreground">{course.id}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="font-mono text-[10px] text-indigo-500">{course.prestationId}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px] gap-1 font-medium", sc?.color)}>
                          {sc?.icon}
                          {sc?.label}
                        </Badge>
                      </div>

                      {/* Trajet visualization */}
                      <div className="bg-slate-50 rounded-lg p-2.5 space-y-1.5">
                        {trajetParts.map((loc, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {idx === 0 ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              </div>
                            ) : idx === trajetParts.length - 1 ? (
                              <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              </div>
                            )}
                            <span className="text-xs truncate">{loc}</span>
                          </div>
                        ))}
                      </div>

                      {/* Date / Time / Type */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {(() => {
                            try {
                              return format(parseISO(course.date), "dd MMM", { locale: fr });
                            } catch {
                              return course.date;
                            }
                          })()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.startTime} — {course.endTime}
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] capitalize",
                            course.prestationType === "sup" && "bg-sky-50 text-sky-700 border-sky-200",
                            course.prestationType === "spot" && "bg-violet-50 text-violet-700 border-violet-200"
                          )}
                        >
                          {course.prestationType || "régulière"}
                        </Badge>
                      </div>

                      {/* Resources */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3 text-muted-foreground" />
                          <span className={course.assignedVehicleImmat ? "font-medium" : "text-muted-foreground italic"}>
                            {course.assignedVehicleImmat || course.requiredVehicleType}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className={course.assignedDriverName ? "font-medium" : "text-muted-foreground italic"}>
                            {course.assignedDriverName || course.requiredDriverType || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Skills badges */}
                      {course.requiredDriverSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {course.requiredDriverSkills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Missing resource indicator */}
                      {course.missingResource && course.assignmentStatus === "unassigned" && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 rounded px-2 py-1">
                          <AlertTriangle className="h-3 w-3" />
                          {missingResourceLabel[course.missingResource] || course.missingResource}
                        </div>
                      )}

                      {/* Hover CTA */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                        <Button size="sm" className="w-full h-7 text-xs gap-1">
                          <Eye className="h-3 w-3" />
                          Voir détails
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* ─── Course Detail Dialog ────────────────────────────────────────── */}
        {selectedCourse && (
          <CourseDetailDialog
            course={selectedCourse}
            open={!!selectedCourse}
            onOpenChange={(open) => {
              if (!open) setSelectedCourse(null);
            }}
            onSave={(updatedCourse) => {
              // Update the course in the list
              setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
              setSelectedCourse(null);
              toast({ title: "Course mise à jour", description: "Les modifications ont été enregistrées." });
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
