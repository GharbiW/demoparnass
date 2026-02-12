"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  CircleDot,
  ArrowUpDown,
  Eye,
  Gauge,
  Calendar,
  ArrowRight,
  Activity,
  Fuel,
  Wrench,
  Download,
  Filter,
  Zap,
  Package,
} from "lucide-react";
import { vehicles as vehiclesRaw } from "@/lib/vehicles-data";
import { planningCourses, getVehicleAvailability } from "@/lib/conception-planning-data";
import { format, parseISO, startOfWeek, endOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Extended vehicle type for conception
type VehicleConception = {
  vin: string;
  immatriculation: string;
  site: string;
  marque: string;
  modele: string;
  energie: "Diesel" | "Gaz" | "Électrique";
  statut: "Disponible" | "En mission" | "En maintenance" | "En panne";
  kilometrage: number;
  vehicleType: "Semi-remorque" | "Caisse mobile" | "Frigo" | "ADR" | "SPL" | "VL";
  tracte: boolean;
  equipment: string[];
  // Planning specific
  coursesThisWeek: number;
  coursesNextWeek: number;
  hoursThisWeek: number;
  driverAssigned?: string;
  driverAssignedId?: string;
  utilizationRate: number; // percentage
  availability: "available" | "partial" | "unavailable";
  tourneesCount: number;
};

const vehicleTypeList: VehicleConception["vehicleType"][] = [
  "Semi-remorque",
  "Caisse mobile",
  "Frigo",
  "ADR",
  "SPL",
  "VL",
];

const equipmentList = [
  "Hayon",
  "Frigo",
  "ADR",
  "Bâché",
  "Plateau",
  "Remorque frigorifique",
  "GPS",
  "Caméra recul",
];

function buildVehicleConceptionData(): VehicleConception[] {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const nextWeekStart = addDays(weekEnd, 1);
  const nextWeekEnd = endOfWeek(nextWeekStart, { weekStartsOn: 1 });

  return vehiclesRaw.map((v, idx) => {
    const thisWeekCourses = planningCourses.filter((c) => {
      if (c.assignedVehicleId !== v.vin) return false;
      try {
        const date = parseISO(c.date);
        return date >= weekStart && date <= weekEnd;
      } catch {
        return false;
      }
    });

    const nextWeekCourses = planningCourses.filter((c) => {
      if (c.assignedVehicleId !== v.vin) return false;
      try {
        const date = parseISO(c.date);
        return date >= nextWeekStart && date <= nextWeekEnd;
      } catch {
        return false;
      }
    });

    const estimateHours = (courses: typeof planningCourses) => {
      return courses.reduce((sum, c) => {
        const [sh, sm] = c.startTime.split(":").map(Number);
        const [eh, em] = c.endTime.split(":").map(Number);
        return sum + (eh + em / 60) - (sh + sm / 60);
      }, 0);
    };

    const hoursThisWeek = Math.round(estimateHours(thisWeekCourses) * 10) / 10;
    const maxHours = 80; // vehicle can run more than driver
    const utilizationRate = Math.min(100, Math.round((hoursThisWeek / maxHours) * 100));

    // Assign vehicle type based on index to have variety
    const vehicleType = vehicleTypeList[idx % vehicleTypeList.length];
    const tracte = vehicleType === "Semi-remorque" || vehicleType === "Caisse mobile";

    // Random equipment
    const equipment: string[] = [];
    if (vehicleType === "Frigo") equipment.push("Frigo", "GPS");
    else if (vehicleType === "ADR") equipment.push("ADR", "GPS");
    else {
      if (Math.random() > 0.5) equipment.push("Hayon");
      if (Math.random() > 0.6) equipment.push("GPS");
      if (Math.random() > 0.7) equipment.push("Caméra recul");
      if (tracte) equipment.push("Bâché");
    }

    // Find assigned driver
    const driverCourse = thisWeekCourses.find(
      (c) => c.assignedDriverName
    );

    let availability: VehicleConception["availability"] = "available";
    if (v.statut === "En panne" || v.statut === "En maintenance") {
      availability = "unavailable";
    } else if (v.statut === "En mission") {
      availability = "partial";
    }

    return {
      vin: v.vin,
      immatriculation: v.immatriculation,
      site: v.site,
      marque: v.marque,
      modele: v.modele,
      energie: v.energie,
      statut: v.statut,
      kilometrage: v.kilometrage,
      vehicleType,
      tracte,
      equipment,
      coursesThisWeek: thisWeekCourses.length,
      coursesNextWeek: nextWeekCourses.length,
      hoursThisWeek,
      driverAssigned: driverCourse?.assignedDriverName,
      driverAssignedId: driverCourse?.assignedDriverId,
      utilizationRate,
      availability,
      tourneesCount: new Set(
        thisWeekCourses.map((c) => c.tourneeId).filter(Boolean)
      ).size,
    };
  });
}

const statusColors: Record<string, string> = {
  Disponible: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "En mission": "bg-sky-50 text-sky-700 border-sky-200",
  "En maintenance": "bg-amber-50 text-amber-700 border-amber-200",
  "En panne": "bg-rose-50 text-rose-700 border-rose-200",
};

const availabilityConfig = {
  available: {
    label: "Disponible",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  partial: {
    label: "En mission",
    color: "bg-sky-50 text-sky-700 border-sky-200",
    icon: <CircleDot className="h-3 w-3" />,
  },
  unavailable: {
    label: "Indisponible",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

type SortField =
  | "immatriculation"
  | "site"
  | "statut"
  | "vehicleType"
  | "energie"
  | "coursesThisWeek"
  | "hoursThisWeek"
  | "utilizationRate"
  | "availability";

export default function VehiculesPage() {
  const allVehicles = useMemo(() => buildVehicleConceptionData(), []);
  const vehicleAvailability = useMemo(
    () => getVehicleAvailability(format(new Date(), "yyyy-MM-dd")),
    []
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [energyFilter, setEnergyFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("immatriculation");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedVehicle, setSelectedVehicle] =
    useState<VehicleConception | null>(null);

  const sites = useMemo(
    () => [...new Set(allVehicles.map((v) => v.site))].sort(),
    [allVehicles]
  );

  const filteredVehicles = useMemo(() => {
    let list = [...allVehicles];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(
        (v) =>
          v.immatriculation.toLowerCase().includes(lower) ||
          v.vin.toLowerCase().includes(lower) ||
          v.marque.toLowerCase().includes(lower) ||
          v.modele.toLowerCase().includes(lower) ||
          v.site.toLowerCase().includes(lower) ||
          v.driverAssigned?.toLowerCase().includes(lower)
      );
    }

    if (statusFilter !== "all")
      list = list.filter((v) => v.statut === statusFilter);
    if (siteFilter !== "all") list = list.filter((v) => v.site === siteFilter);
    if (typeFilter !== "all")
      list = list.filter((v) => v.vehicleType === typeFilter);
    if (energyFilter !== "all")
      list = list.filter((v) => v.energie === energyFilter);
    if (availabilityFilter !== "all")
      list = list.filter((v) => v.availability === availabilityFilter);

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "immatriculation":
          cmp = a.immatriculation.localeCompare(b.immatriculation);
          break;
        case "site":
          cmp = a.site.localeCompare(b.site);
          break;
        case "statut":
          cmp = a.statut.localeCompare(b.statut);
          break;
        case "vehicleType":
          cmp = a.vehicleType.localeCompare(b.vehicleType);
          break;
        case "energie":
          cmp = a.energie.localeCompare(b.energie);
          break;
        case "coursesThisWeek":
          cmp = a.coursesThisWeek - b.coursesThisWeek;
          break;
        case "hoursThisWeek":
          cmp = a.hoursThisWeek - b.hoursThisWeek;
          break;
        case "utilizationRate":
          cmp = a.utilizationRate - b.utilizationRate;
          break;
        case "availability":
          cmp = a.availability.localeCompare(b.availability);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [
    allVehicles,
    searchTerm,
    statusFilter,
    siteFilter,
    typeFilter,
    energyFilter,
    availabilityFilter,
    sortField,
    sortDir,
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // Stats
  const stats = useMemo(
    () => ({
      total: allVehicles.length,
      available: allVehicles.filter((v) => v.availability === "available")
        .length,
      partial: allVehicles.filter((v) => v.availability === "partial").length,
      unavailable: allVehicles.filter((v) => v.availability === "unavailable")
        .length,
      maintenance: allVehicles.filter((v) => v.statut === "En maintenance")
        .length,
      panne: allVehicles.filter((v) => v.statut === "En panne").length,
      avgUtilization:
        Math.round(
          (allVehicles.reduce((s, v) => s + v.utilizationRate, 0) /
            allVehicles.length) *
            10
        ) / 10,
      totalCourses: allVehicles.reduce(
        (s, v) => s + v.coursesThisWeek,
        0
      ),
    }),
    [allVehicles]
  );

  const getVehicleCourses = (vin: string) => {
    return planningCourses
      .filter((c) => c.assignedVehicleId === vin)
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      );
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full space-y-4">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
              <Truck className="h-6 w-6 text-indigo-500" />
              Véhicules — Conception
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Disponibilité, type, énergie et affectations des véhicules pour la
              planification
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Exporter
          </Button>
        </div>

        {/* ─── Stats ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Total
              </p>
              <p className="text-xl font-bold mt-0.5">{stats.total}</p>
            </CardContent>
          </Card>
          <Card
            className={cn(
              "cursor-pointer",
              availabilityFilter === "available" && "ring-2 ring-emerald-400"
            )}
            onClick={() =>
              setAvailabilityFilter(
                availabilityFilter === "available" ? "all" : "available"
              )
            }
          >
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Disponibles
              </p>
              <p className="text-xl font-bold mt-0.5 text-emerald-600">
                {stats.available}
              </p>
            </CardContent>
          </Card>
          <Card
            className={cn(
              "cursor-pointer",
              availabilityFilter === "partial" && "ring-2 ring-sky-400"
            )}
            onClick={() =>
              setAvailabilityFilter(
                availabilityFilter === "partial" ? "all" : "partial"
              )
            }
          >
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                En mission
              </p>
              <p className="text-xl font-bold mt-0.5 text-sky-600">
                {stats.partial}
              </p>
            </CardContent>
          </Card>
          <Card
            className={cn(
              "cursor-pointer",
              availabilityFilter === "unavailable" && "ring-2 ring-rose-400"
            )}
            onClick={() =>
              setAvailabilityFilter(
                availabilityFilter === "unavailable" ? "all" : "unavailable"
              )
            }
          >
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Indisponibles
              </p>
              <p className="text-xl font-bold mt-0.5 text-rose-600">
                {stats.unavailable}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Maintenance
              </p>
              <p className="text-xl font-bold mt-0.5 text-amber-600">
                {stats.maintenance}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Pannes
              </p>
              <p className="text-xl font-bold mt-0.5 text-rose-600">
                {stats.panne}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Courses/sem
              </p>
              <p className="text-xl font-bold mt-0.5">{stats.totalCourses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Moy. utilisation
              </p>
              <p className="text-xl font-bold mt-0.5">
                {stats.avgUtilization}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ─── Pessimistic Availability Bar ─── */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg border text-xs">
          <Truck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-700">
            Disponibilité pessimiste:
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-5",
              vehicleAvailability.availabilityRate >= 80
                ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                : vehicleAvailability.availabilityRate >= 60
                ? "border-amber-300 text-amber-700 bg-amber-50"
                : "border-rose-300 text-rose-700 bg-rose-50"
            )}
          >
            {vehicleAvailability.availabilityRate}% dispo
          </Badge>
          <span className="text-muted-foreground">
            {vehicleAvailability.availableToday}/{vehicleAvailability.totalVehicles} véhicules
            disponibles aujourd&apos;hui
          </span>
        </div>

        {/* ─── Filters ─── */}
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher immat, VIN, marque, site..."
                  className="pl-8 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="Disponible">Disponible</SelectItem>
                  <SelectItem value="En mission">En mission</SelectItem>
                  <SelectItem value="En maintenance">En maintenance</SelectItem>
                  <SelectItem value="En panne">En panne</SelectItem>
                </SelectContent>
              </Select>
              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue placeholder="Site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous sites</SelectItem>
                  {sites.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  {vehicleTypeList.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={energyFilter} onValueChange={setEnergyFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Énergie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute énergie</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Gaz">Gaz</SelectItem>
                  <SelectItem value="Électrique">Électrique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ─── Results Count ─── */}
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {filteredVehicles.length}
          </span>{" "}
          véhicule{filteredVehicles.length > 1 ? "s" : ""}
        </p>

        {/* ─── Table ─── */}
        <Card className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-420px)]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("immatriculation")}
                  >
                    <div className="flex items-center gap-1">
                      Immatriculation
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("vehicleType")}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("energie")}
                  >
                    <div className="flex items-center gap-1">
                      Énergie
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Tracté</TableHead>
                  <TableHead>Équipement</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("site")}
                  >
                    <div className="flex items-center gap-1">
                      Site
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Conducteur</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("statut")}
                  >
                    <div className="flex items-center gap-1">
                      Statut
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-center"
                    onClick={() => toggleSort("coursesThisWeek")}
                  >
                    <div className="flex items-center gap-1 justify-center">
                      Courses S
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("utilizationRate")}
                  >
                    <div className="flex items-center gap-1">
                      Utilisation
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => {
                  const avail = availabilityConfig[vehicle.availability];
                  return (
                    <TableRow
                      key={vehicle.vin}
                      className="group cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {vehicle.immatriculation}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {vehicle.marque} {vehicle.modele}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {vehicle.vehicleType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            vehicle.energie === "Diesel" &&
                              "border-slate-300 text-slate-600",
                            vehicle.energie === "Gaz" &&
                              "border-sky-300 text-sky-600",
                            vehicle.energie === "Électrique" &&
                              "border-emerald-300 text-emerald-600"
                          )}
                        >
                          <Fuel className="h-2.5 w-2.5 mr-0.5" />
                          {vehicle.energie}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {vehicle.tracte ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4"
                          >
                            Tracté
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-0.5">
                          {vehicle.equipment.slice(0, 3).map((e) => (
                            <Badge
                              key={e}
                              variant="secondary"
                              className="text-[9px] px-1 py-0"
                            >
                              {e}
                            </Badge>
                          ))}
                          {vehicle.equipment.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0"
                            >
                              +{vehicle.equipment.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {vehicle.site}
                        </div>
                      </TableCell>
                      <TableCell>
                        {vehicle.driverAssigned ? (
                          <div className="flex items-center gap-1 text-xs">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">
                              {vehicle.driverAssigned}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Non assigné
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            statusColors[vehicle.statut]
                          )}
                        >
                          {vehicle.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono text-sm font-medium">
                            {vehicle.coursesThisWeek}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            / {vehicle.coursesNextWeek} S+1
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-[90px] space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span
                              className={cn(
                                "font-medium",
                                vehicle.utilizationRate >= 70 &&
                                  "text-emerald-600",
                                vehicle.utilizationRate >= 40 &&
                                  vehicle.utilizationRate < 70 &&
                                  "text-amber-600",
                                vehicle.utilizationRate < 40 &&
                                  "text-slate-500"
                              )}
                            >
                              {vehicle.utilizationRate}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                vehicle.utilizationRate >= 70
                                  ? "bg-emerald-500"
                                  : vehicle.utilizationRate >= 40
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              )}
                              style={{
                                width: `${vehicle.utilizationRate}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
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

        {/* ─── Vehicle Detail Dialog ─── */}
        <Dialog
          open={!!selectedVehicle}
          onOpenChange={(open) => {
            if (!open) setSelectedVehicle(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedVehicle && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-indigo-500" />
                    {selectedVehicle.immatriculation}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        statusColors[selectedVehicle.statut]
                      )}
                    >
                      {selectedVehicle.statut}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {selectedVehicle.vehicleType}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono">{selectedVehicle.vin}</span>
                    <span>·</span>
                    <span>
                      {selectedVehicle.marque} {selectedVehicle.modele}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedVehicle.site}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Fuel className="h-3 w-3" />
                      {selectedVehicle.energie}
                    </span>
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="overview" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">
                      Vue d&apos;ensemble
                    </TabsTrigger>
                    <TabsTrigger value="courses">
                      Courses (
                      {getVehicleCourses(selectedVehicle.vin).length})
                    </TabsTrigger>
                    <TabsTrigger value="equipment">Équipement</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-[10px] text-muted-foreground">
                            Courses cette semaine
                          </p>
                          <p className="text-2xl font-bold">
                            {selectedVehicle.coursesThisWeek}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-[10px] text-muted-foreground">
                            Courses S+1
                          </p>
                          <p className="text-2xl font-bold">
                            {selectedVehicle.coursesNextWeek}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-[10px] text-muted-foreground">
                            Taux utilisation
                          </p>
                          <p
                            className={cn(
                              "text-2xl font-bold",
                              selectedVehicle.utilizationRate >= 70
                                ? "text-emerald-600"
                                : selectedVehicle.utilizationRate >= 40
                                ? "text-amber-600"
                                : "text-slate-500"
                            )}
                          >
                            {selectedVehicle.utilizationRate}%
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-[10px] text-muted-foreground">
                            Tournées
                          </p>
                          <p className="text-2xl font-bold">
                            {selectedVehicle.tourneesCount}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            <Gauge className="h-4 w-4 text-indigo-500" />
                            Utilisation hebdomadaire
                          </p>
                          <span className="text-sm font-mono">
                            {selectedVehicle.hoursThisWeek}h
                          </span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              selectedVehicle.utilizationRate >= 70
                                ? "bg-emerald-500"
                                : selectedVehicle.utilizationRate >= 40
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            )}
                            style={{
                              width: `${selectedVehicle.utilizationRate}%`,
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-3">
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                            <User className="h-6 w-6 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Conducteur assigné
                            </p>
                            <p className="text-sm font-bold">
                              {selectedVehicle.driverAssigned ||
                                "Non assigné"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                            <Activity className="h-6 w-6 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Kilométrage
                            </p>
                            <p className="text-sm font-bold">
                              {selectedVehicle.kilometrage.toLocaleString(
                                "fr-FR"
                              )}{" "}
                              km
                            </p>
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
                            <TableHead>Conducteur</TableHead>
                            <TableHead>Client</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getVehicleCourses(selectedVehicle.vin)
                            .slice(0, 30)
                            .map((c) => (
                              <TableRow key={c.id}>
                                <TableCell className="text-xs font-mono">
                                  {(() => {
                                    try {
                                      return format(
                                        parseISO(c.date),
                                        "dd/MM",
                                        { locale: fr }
                                      );
                                    } catch {
                                      return c.date;
                                    }
                                  })()}
                                </TableCell>
                                <TableCell className="text-xs font-mono text-indigo-600">
                                  {c.id}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-xs">
                                    <span className="truncate max-w-[80px]">
                                      {c.startLocation}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate max-w-[80px]">
                                      {c.endLocation}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {c.startTime}—{c.endTime}
                                </TableCell>
                                <TableCell className="text-xs font-medium">
                                  {c.assignedDriverName || "—"}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {c.client || "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          {getVehicleCourses(selectedVehicle.vin).length ===
                            0 && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center text-sm text-muted-foreground py-8"
                              >
                                Aucune course affectée cette période
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent
                    value="equipment"
                    className="mt-4 space-y-4"
                  >
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <p className="text-sm font-medium">
                          Type &amp; Configuration
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Type
                              </p>
                              <p className="text-sm font-medium">
                                {selectedVehicle.vehicleType}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Énergie
                              </p>
                              <p className="text-sm font-medium">
                                {selectedVehicle.energie}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Tracté
                              </p>
                              <p className="text-sm font-medium">
                                {selectedVehicle.tracte ? "Oui" : "Non"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <p className="text-sm font-medium">Équipements</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedVehicle.equipment.length > 0 ? (
                            selectedVehicle.equipment.map((e) => (
                              <Badge key={e} variant="outline" className="text-xs">
                                {e}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Aucun équipement spécifique
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
