"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
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
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Truck,
  User,
  Clock,
  MapPin,
  CalendarDays,
  Users,
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Eye,
  Phone,
  BadgeCheck,
  Gauge,
  Calendar,
  ArrowRight,
  Timer,
  Award,
  Activity,
  BarChart3,
  Coffee,
  Briefcase,
  CircleDot,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  ArrowRightLeft,
  CalendarOff,
  CalendarCheck,
} from "lucide-react";
import { drivers } from "@/lib/planning-data";
import { planningCourses, planningTournees } from "@/lib/conception-planning-data";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, startOfWeek, endOfWeek, addDays, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Types
type DriverConception = {
  id: string;
  name: string;
  site: string;
  status: "Actif" | "En repos" | "En congé";
  driverType: string;
  phone: string;
  truck: string;
  // Conception-specific
  coursesThisWeek: number;
  coursesNextWeek: number;
  hoursThisWeek: number;
  maxHoursWeek: number;
  amplitudeStatus: "ok" | "warning" | "critical";
  skills: string[];
  availability: "available" | "partial" | "unavailable";
  manualAvailability?: { available: boolean; from?: string; to?: string };
  miseADispoSchedule?: { day: string; from: string; to: string; active: boolean }[];
  lastAssignment?: string;
  scoreSecurite: number;
  scoreEco: number;
  isDualDriverTour: boolean; // Participates in a dual-driver tour
  dualDriverTourneeCode?: string;
};

// Build driver conception data
function buildDriverConceptionData(): DriverConception[] {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const nextWeekStart = addDays(weekEnd, 1);
  const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });

  return drivers.map((d) => {
    // Count courses assigned to this driver
    const thisWeekCourses = planningCourses.filter((c) => {
      if (c.assignedDriverId !== d.id) return false;
      try {
        const date = parseISO(c.date);
        return date >= weekStart && date <= weekEnd;
      } catch {
        return false;
      }
    });

    const nextWeekCourses = planningCourses.filter((c) => {
      if (c.assignedDriverId !== d.id) return false;
      try {
        const date = parseISO(c.date);
        return date >= nextWeekStart && date <= nextWeekEnd;
      } catch {
        return false;
      }
    });

    // Estimate hours from courses
    const estimateHours = (courses: typeof planningCourses) => {
      return courses.reduce((sum, c) => {
        const [sh, sm] = c.startTime.split(":").map(Number);
        const [eh, em] = c.endTime.split(":").map(Number);
        return sum + (eh + em / 60) - (sh + sm / 60);
      }, 0);
    };

    const hoursThisWeek = Math.round(estimateHours(thisWeekCourses) * 10) / 10;
    const maxHours = 48;

    // Skills inference
    const skills: string[] = [];
    if (d.driverType === "SPL") skills.push("SPL");
    if (d.driverType === "CM") skills.push("CM");
    // Randomly assign some skills for demo
    if (d.id.includes("001") || d.id.includes("003")) skills.push("ADR");
    if (d.id.includes("004") || d.id.includes("002")) skills.push("Aéroportuaire");
    if (Math.random() > 0.8) skills.push("Habilitation sûreté");

    // Amplitude
    let amplitudeStatus: "ok" | "warning" | "critical" = "ok";
    if (hoursThisWeek > maxHours * 0.9) amplitudeStatus = "critical";
    else if (hoursThisWeek > maxHours * 0.75) amplitudeStatus = "warning";

    // Availability
    let availability: "available" | "partial" | "unavailable" = "available";
    if (d.status === "En congé") availability = "unavailable";
    else if (d.status === "En repos") availability = "partial";
    else if (hoursThisWeek > maxHours * 0.9) availability = "partial";

    // Check if driver participates in a dual-driver tour
    const dualTournee = planningTournees.find(
      t => t.isDualDriver && (t.driverId === d.id || t.driver2Id === d.id)
    );

    return {
      id: d.id,
      name: d.name,
      site: d.site,
      status: d.status as DriverConception["status"],
      driverType: d.driverType || "CM",
      phone: d.phone || "",
      truck: d.truck || "",
      coursesThisWeek: thisWeekCourses.length,
      coursesNextWeek: nextWeekCourses.length,
      hoursThisWeek,
      maxHoursWeek: maxHours,
      amplitudeStatus,
      skills,
      availability,
      lastAssignment: thisWeekCourses.length > 0 ? thisWeekCourses[thisWeekCourses.length - 1]?.date : undefined,
      scoreSecurite: d.scoreSecurite || Math.floor(Math.random() * 20) + 80,
      scoreEco: d.scoreEco || Math.floor(Math.random() * 20) + 80,
      isDualDriverTour: !!dualTournee,
      dualDriverTourneeCode: dualTournee?.tourneeCode,
    };
  });
}

const statusColors = {
  Actif: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "En repos": "bg-amber-50 text-amber-700 border-amber-200",
  "En congé": "bg-slate-100 text-slate-500 border-slate-200",
};

const availabilityConfig = {
  available: { label: "Disponible", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  partial: { label: "Limité", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <CircleDot className="h-3 w-3" /> },
  unavailable: { label: "Indisponible", color: "bg-slate-100 text-slate-500 border-slate-200", icon: <XCircle className="h-3 w-3" /> },
};

const amplitudeColors = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-rose-500",
};

type SortField = "name" | "site" | "status" | "coursesThisWeek" | "hoursThisWeek" | "availability" | "driverType";

export default function ConducteursPage() {
  const allDrivers = useMemo(() => buildDriverConceptionData(), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedDriver, setSelectedDriver] = useState<DriverConception | null>(null);
  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
  const [driverToReplace, setDriverToReplace] = useState<DriverConception | null>(null);
  const [manualAvailDialogOpen, setManualAvailDialogOpen] = useState(false);
  const [driverForAvail, setDriverForAvail] = useState<DriverConception | null>(null);
  const { toast } = useToast();

  const sites = useMemo(() => [...new Set(allDrivers.map((d) => d.site))].sort(), [allDrivers]);
  const driverTypes = useMemo(() => [...new Set(allDrivers.map((d) => d.driverType))].sort(), [allDrivers]);

  const filteredDrivers = useMemo(() => {
    let list = [...allDrivers];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(lower) ||
          d.id.toLowerCase().includes(lower) ||
          d.phone.includes(lower) ||
          d.site.toLowerCase().includes(lower)
      );
    }

    if (statusFilter !== "all") list = list.filter((d) => d.status === statusFilter);
    if (siteFilter !== "all") list = list.filter((d) => d.site === siteFilter);
    if (typeFilter !== "all") list = list.filter((d) => d.driverType === typeFilter);
    if (availabilityFilter !== "all") list = list.filter((d) => d.availability === availabilityFilter);

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "site": cmp = a.site.localeCompare(b.site); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "coursesThisWeek": cmp = a.coursesThisWeek - b.coursesThisWeek; break;
        case "hoursThisWeek": cmp = a.hoursThisWeek - b.hoursThisWeek; break;
        case "availability": cmp = a.availability.localeCompare(b.availability); break;
        case "driverType": cmp = a.driverType.localeCompare(b.driverType); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [allDrivers, searchTerm, statusFilter, siteFilter, typeFilter, availabilityFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  // Stats
  const stats = useMemo(() => ({
    total: allDrivers.length,
    available: allDrivers.filter((d) => d.availability === "available").length,
    partial: allDrivers.filter((d) => d.availability === "partial").length,
    unavailable: allDrivers.filter((d) => d.availability === "unavailable").length,
    overAmplitude: allDrivers.filter((d) => d.amplitudeStatus === "critical").length,
    warningAmplitude: allDrivers.filter((d) => d.amplitudeStatus === "warning").length,
    totalCourses: allDrivers.reduce((s, d) => s + d.coursesThisWeek, 0),
    avgHours: Math.round(allDrivers.reduce((s, d) => s + d.hoursThisWeek, 0) / allDrivers.length * 10) / 10,
  }), [allDrivers]);

  // Stats by driver type (CM, SPL, Polyvalent, etc.)
  const statsByType = useMemo(() => {
    const typeMap = new Map<string, { type: string; total: number; available: number; partial: number; unavailable: number; courses: number }>();
    allDrivers.forEach(d => {
      if (!typeMap.has(d.driverType)) {
        typeMap.set(d.driverType, { type: d.driverType, total: 0, available: 0, partial: 0, unavailable: 0, courses: 0 });
      }
      const entry = typeMap.get(d.driverType)!;
      entry.total++;
      entry.courses += d.coursesThisWeek;
      if (d.availability === "available") entry.available++;
      else if (d.availability === "partial") entry.partial++;
      else entry.unavailable++;
    });
    return Array.from(typeMap.values()).sort((a, b) => b.total - a.total);
  }, [allDrivers]);

  // Driver's courses for detail view
  const getDriverCourses = (driverId: string) => {
    return planningCourses.filter((c) => c.assignedDriverId === driverId).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  };

  // Get compatible replacement drivers
  const getCompatibleDrivers = (driver: DriverConception) => {
    return allDrivers.filter(d =>
      d.id !== driver.id &&
      d.availability === "available" &&
      d.driverType === driver.driverType &&
      d.site === driver.site &&
      d.amplitudeStatus !== "critical"
    );
  };

  const handleReplacement = (replacementId: string) => {
    const replacement = allDrivers.find(d => d.id === replacementId);
    toast({
      title: "Remplacement effectué",
      description: `${driverToReplace?.name} remplacé par ${replacement?.name}.`,
    });
    setReplacementDialogOpen(false);
    setDriverToReplace(null);
  };

  // Per-day mise à dispo schedule state
  const DAYS_OF_WEEK = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;
  const defaultSchedule = DAYS_OF_WEEK.map(day => ({ day, from: "06:00", to: "14:00", active: true }));
  const [miseADispoSchedule, setMiseADispoSchedule] = useState(defaultSchedule);

  const updateScheduleDay = (dayIndex: number, field: "from" | "to" | "active", value: string | boolean) => {
    setMiseADispoSchedule(prev => prev.map((entry, i) => i === dayIndex ? { ...entry, [field]: value } : entry));
  };

  const handleManualAvailability = (available: boolean) => {
    toast({
      title: available ? "Disponibilité activée" : "Indisponibilité enregistrée",
      description: `${driverForAvail?.name} marqué comme ${available ? "disponible" : "indisponible"} manuellement.`,
    });
    setManualAvailDialogOpen(false);
    setDriverForAvail(null);
  };

  const handleSaveMiseADispo = () => {
    const activeDays = miseADispoSchedule.filter(d => d.active);
    toast({
      title: "Planning mise à dispo enregistré",
      description: `${driverForAvail?.name} — ${activeDays.length} jour(s) planifié(s) pour la semaine.`,
    });
    setManualAvailDialogOpen(false);
    setDriverForAvail(null);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full space-y-4">
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-500" />
              Conducteurs — Conception
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Disponibilité, amplitude et affectations des conducteurs pour la planification
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Exporter
          </Button>
        </div>

        {/* ─── Stats: Global row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Total</p>
              <p className="text-xl font-bold mt-0.5">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer", availabilityFilter === "available" && "ring-2 ring-emerald-400")} onClick={() => setAvailabilityFilter(availabilityFilter === "available" ? "all" : "available")}>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Disponibles</p>
              <p className="text-xl font-bold mt-0.5 text-emerald-600">{stats.available}</p>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer", availabilityFilter === "partial" && "ring-2 ring-amber-400")} onClick={() => setAvailabilityFilter(availabilityFilter === "partial" ? "all" : "partial")}>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Limités</p>
              <p className="text-xl font-bold mt-0.5 text-amber-600">{stats.partial}</p>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer", availabilityFilter === "unavailable" && "ring-2 ring-slate-400")} onClick={() => setAvailabilityFilter(availabilityFilter === "unavailable" ? "all" : "unavailable")}>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Indisponibles</p>
              <p className="text-xl font-bold mt-0.5 text-slate-500">{stats.unavailable}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Courses/sem</p>
              <p className="text-xl font-bold mt-0.5">{stats.totalCourses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Moy. heures</p>
              <p className="text-xl font-bold mt-0.5">{stats.avgHours}h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />Amplitude
              </p>
              <p className="text-xl font-bold mt-0.5 text-amber-600">{stats.warningAmplitude}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-rose-500" />Critiques
              </p>
              <p className="text-xl font-bold mt-0.5 text-rose-600">{stats.overAmplitude}</p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Stats: Breakdown by Driver Type ────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statsByType.map(st => {
            const isActive = typeFilter === st.type;
            return (
              <Card
                key={st.type}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isActive && "ring-2 ring-indigo-400 shadow-md"
                )}
                onClick={() => setTypeFilter(isActive ? "all" : st.type)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-semibold px-2",
                      isActive ? "bg-indigo-50 text-indigo-700 border-indigo-300" : ""
                    )}>
                      {st.type}
                    </Badge>
                    <span className="text-lg font-bold">{st.total}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-0.5 text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {st.available}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <CircleDot className="h-3 w-3" />
                      {st.partial}
                    </span>
                    <span className="flex items-center gap-0.5 text-slate-500">
                      <XCircle className="h-3 w-3" />
                      {st.unavailable}
                    </span>
                    <span className="text-muted-foreground ml-auto">{st.courses} courses</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ─── Filters ─────────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher nom, site, téléphone..."
                  className="pl-8 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="En repos">En repos</SelectItem>
                  <SelectItem value="En congé">En congé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous sites</SelectItem>
                  {sites.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  {driverTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ─── Results Count ───────────────────────────────────────────────── */}
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filteredDrivers.length}</span> conducteur{filteredDrivers.length > 1 ? "s" : ""}
        </p>

        {/* ─── Table ───────────────────────────────────────────────────────── */}
        <Card className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-420px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                    <div className="flex items-center gap-1">Nom<ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("driverType")}>
                    <div className="flex items-center gap-1">Type<ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("site")}>
                    <div className="flex items-center gap-1">Site<ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead>Compétences</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                    <div className="flex items-center gap-1">Statut<ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("availability")}>
                    <div className="flex items-center gap-1">Dispo<ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => toggleSort("coursesThisWeek")}>
                    <div className="flex items-center gap-1 justify-center">Courses S<ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("hoursThisWeek")}>
                    <div className="flex items-center gap-1">Amplitude<ArrowUpDown className="h-3 w-3" /></div>
                  </TableHead>
                  <TableHead>Scores</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => {
                  const avail = availabilityConfig[driver.availability];
                  const amplPct = Math.min(100, (driver.hoursThisWeek / driver.maxHoursWeek) * 100);
                  return (
                    <TableRow
                      key={driver.id}
                      className="group cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedDriver(driver)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{driver.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{driver.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{driver.driverType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {driver.site}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-0.5">
                          {driver.skills.map((s) => (
                            <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px]", statusColors[driver.status])}>
                          {driver.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] gap-0.5", avail.color)}>
                          {avail.icon}
                          {avail.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono text-sm font-medium">{driver.coursesThisWeek}</span>
                          <span className="text-[10px] text-muted-foreground">/ {driver.coursesNextWeek} S+1</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-[120px] space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className={cn(
                              "font-medium",
                              driver.amplitudeStatus === "ok" && "text-emerald-600",
                              driver.amplitudeStatus === "warning" && "text-amber-600",
                              driver.amplitudeStatus === "critical" && "text-rose-600"
                            )}>
                              {driver.hoursThisWeek}h
                            </span>
                            <span className="text-muted-foreground">/ {driver.maxHoursWeek}h</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", amplitudeColors[driver.amplitudeStatus])}
                              style={{ width: `${amplPct}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center gap-0.5">
                                <Shield className="h-3 w-3 text-indigo-400" />
                                <span className="font-mono">{driver.scoreSecurite}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Score sécurité</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center gap-0.5">
                                <Activity className="h-3 w-3 text-emerald-400" />
                                <span className="font-mono">{driver.scoreEco}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Score éco-conduite</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {driver.isDualDriverTour && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-[8px] h-4 border-indigo-300 text-indigo-700 bg-indigo-50 gap-0.5 px-1">
                                  <Users className="h-2.5 w-2.5" />
                                  2×
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Tournée bi-conducteur: {driver.dualDriverTourneeCode}</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDriverToReplace(driver);
                                  setReplacementDialogOpen(true);
                                }}
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remplacer ce conducteur</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDriverForAvail(driver);
                                  setManualAvailDialogOpen(true);
                                }}
                              >
                                {driver.availability === "unavailable"
                                  ? <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  : <CalendarOff className="h-3.5 w-3.5 text-amber-600" />
                                }
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {driver.availability === "unavailable" ? "Marquer disponible" : "Marquer indisponible"}
                            </TooltipContent>
                          </Tooltip>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        {/* ─── Driver Detail Dialog ────────────────────────────────────────── */}
        <Dialog open={!!selectedDriver} onOpenChange={(open) => { if (!open) setSelectedDriver(null); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedDriver && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-500" />
                    {selectedDriver.name}
                    <Badge variant="outline" className={cn("text-xs", statusColors[selectedDriver.status])}>
                      {selectedDriver.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{selectedDriver.driverType}</Badge>
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-3">
                    <span className="font-mono">{selectedDriver.id}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedDriver.site}</span>
                    {selectedDriver.phone && (
                      <><span>·</span><span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selectedDriver.phone}</span></>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="overview" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                    <TabsTrigger value="courses">Courses ({getDriverCourses(selectedDriver.id).length})</TabsTrigger>
                    <TabsTrigger value="skills">Compétences</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    {/* KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-[10px] text-muted-foreground">Courses cette semaine</p>
                          <p className="text-2xl font-bold">{selectedDriver.coursesThisWeek}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-[10px] text-muted-foreground">Courses S+1</p>
                          <p className="text-2xl font-bold">{selectedDriver.coursesNextWeek}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-[10px] text-muted-foreground">Heures cette semaine</p>
                          <p className={cn("text-2xl font-bold",
                            selectedDriver.amplitudeStatus === "ok" && "text-emerald-600",
                            selectedDriver.amplitudeStatus === "warning" && "text-amber-600",
                            selectedDriver.amplitudeStatus === "critical" && "text-rose-600"
                          )}>{selectedDriver.hoursThisWeek}h</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-[10px] text-muted-foreground">Disponibilité</p>
                          <Badge variant="outline" className={cn("mt-1 text-xs gap-0.5", availabilityConfig[selectedDriver.availability].color)}>
                            {availabilityConfig[selectedDriver.availability].icon}
                            {availabilityConfig[selectedDriver.availability].label}
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Amplitude progress */}
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            <Gauge className="h-4 w-4 text-indigo-500" />
                            Amplitude hebdomadaire
                          </p>
                          <span className="text-sm font-mono">
                            {selectedDriver.hoursThisWeek}h / {selectedDriver.maxHoursWeek}h
                          </span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", amplitudeColors[selectedDriver.amplitudeStatus])}
                            style={{ width: `${Math.min(100, (selectedDriver.hoursThisWeek / selectedDriver.maxHoursWeek) * 100)}%` }}
                          />
                        </div>
                        {selectedDriver.amplitudeStatus !== "ok" && (
                          <p className={cn("text-xs flex items-center gap-1",
                            selectedDriver.amplitudeStatus === "warning" ? "text-amber-600" : "text-rose-600"
                          )}>
                            <AlertTriangle className="h-3 w-3" />
                            {selectedDriver.amplitudeStatus === "warning"
                              ? "Approche de la limite d'amplitude"
                              : "Limite d'amplitude dépassée — ne peut plus être affecté"}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Score sécurité</p>
                            <p className="text-2xl font-bold">{selectedDriver.scoreSecurite}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                            <Activity className="h-6 w-6 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Score éco-conduite</p>
                            <p className="text-2xl font-bold">{selectedDriver.scoreEco}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="courses" className="mt-4">
                    <ScrollArea className="h-[350px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Trajet</TableHead>
                            <TableHead>Horaires</TableHead>
                            <TableHead>Véhicule</TableHead>
                            <TableHead>Client</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getDriverCourses(selectedDriver.id).slice(0, 30).map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="text-xs font-mono">
                                {(() => { try { return format(parseISO(c.date), "dd/MM", { locale: fr }); } catch { return c.date; } })()}
                              </TableCell>
                              <TableCell className="text-xs font-mono text-indigo-600">{c.id}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="truncate max-w-[80px]">{c.startLocation}</span>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <span className="truncate max-w-[80px]">{c.endLocation}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs">{c.startTime}—{c.endTime}</TableCell>
                              <TableCell className="text-xs">{c.assignedVehicleImmat || "—"}</TableCell>
                              <TableCell className="text-xs font-medium">{c.client || "—"}</TableCell>
                            </TableRow>
                          ))}
                          {getDriverCourses(selectedDriver.id).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                                Aucune course affectée cette période
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="skills" className="mt-4 space-y-4">
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <p className="text-sm font-medium">Permis & Compétences</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200" variant="outline">
                            <BadgeCheck className="h-3 w-3 mr-1" />
                            Permis {selectedDriver.driverType}
                          </Badge>
                          {selectedDriver.skills.map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">
                              <Award className="h-3 w-3 mr-1" />
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <p className="text-sm font-medium">Véhicule assigné</p>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedDriver.truck || "Aucun véhicule assigné"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>
        {/* ─── Replacement Dialog ──────────────────────────────────────── */}
        <Dialog open={replacementDialogOpen} onOpenChange={(open) => { if (!open) { setReplacementDialogOpen(false); setDriverToReplace(null); } }}>
          <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
            {driverToReplace && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-sky-500" />
                    Remplacer {driverToReplace.name}
                  </DialogTitle>
                  <DialogDescription>
                    Conducteurs compatibles ({driverToReplace.driverType}, {driverToReplace.site}, disponibles)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  {getCompatibleDrivers(driverToReplace).length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                      Aucun conducteur compatible disponible
                    </div>
                  ) : (
                    getCompatibleDrivers(driverToReplace).map(d => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleReplacement(d.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                            <User className="h-4 w-4 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{d.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{d.driverType}</span>
                              <span>·</span>
                              <span>{d.site}</span>
                              <span>·</span>
                              <span>{d.hoursThisWeek}h/{d.maxHoursWeek}h</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-[10px]", availabilityConfig[d.availability].color)}>
                            {d.coursesThisWeek} courses
                          </Badge>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Sélectionner
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Manual Availability & Mise à Dispo Dialog ─────────────── */}
        <Dialog open={manualAvailDialogOpen} onOpenChange={(open) => { if (!open) { setManualAvailDialogOpen(false); setDriverForAvail(null); } }}>
          <DialogContent className="max-w-md">
            {driverForAvail && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-500" />
                    Disponibilité & Mise à dispo
                  </DialogTitle>
                  <DialogDescription>
                    {driverForAvail.name} — {driverForAvail.driverType} · {driverForAvail.site}
                  </DialogDescription>
                </DialogHeader>

                {/* Quick availability toggle */}
                <div className="space-y-3 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Statut actuel : <Badge variant="outline" className={cn("text-xs ml-1", availabilityConfig[driverForAvail.availability].color)}>
                      {availabilityConfig[driverForAvail.availability].label}
                    </Badge>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 border-emerald-200 hover:bg-emerald-50 text-xs"
                      onClick={() => handleManualAvailability(true)}
                    >
                      <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Disponible
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 border-rose-200 hover:bg-rose-50 text-xs"
                      onClick={() => handleManualAvailability(false)}
                    >
                      <CalendarOff className="h-3.5 w-3.5 text-rose-600" />
                      Indisponible
                    </Button>
                  </div>
                </div>

                {/* Per-day mise à dispo schedule */}
                <div className="space-y-3 mt-4 pt-4 border-t">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    Planning mise à dispo (horaires par jour)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Définissez les créneaux horaires pour chaque jour de la semaine. Ces horaires seront utilisés pour la planification.
                  </p>

                  <div className="space-y-2">
                    {miseADispoSchedule.map((entry, idx) => (
                      <div
                        key={entry.day}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg border transition-colors",
                          entry.active ? "bg-white" : "bg-muted/40 opacity-60"
                        )}
                      >
                        <Switch
                          checked={entry.active}
                          onCheckedChange={(val) => updateScheduleDay(idx, "active", val)}
                          className="scale-75"
                        />
                        <span className={cn(
                          "text-xs font-medium w-[65px]",
                          entry.active ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {entry.day}
                        </span>
                        <div className="flex items-center gap-1.5 flex-1">
                          <Input
                            type="time"
                            value={entry.from}
                            onChange={(e) => updateScheduleDay(idx, "from", e.target.value)}
                            className="h-7 text-xs w-[90px]"
                            disabled={!entry.active}
                          />
                          <span className="text-xs text-muted-foreground">→</span>
                          <Input
                            type="time"
                            value={entry.to}
                            onChange={(e) => updateScheduleDay(idx, "to", e.target.value)}
                            className="h-7 text-xs w-[90px]"
                            disabled={!entry.active}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => { setManualAvailDialogOpen(false); setDriverForAvail(null); }}>
                    Annuler
                  </Button>
                  <Button onClick={handleSaveMiseADispo} className="gap-1.5">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Enregistrer
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
