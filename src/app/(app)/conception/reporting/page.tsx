"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Truck,
  User,
  Clock,
  Package,
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  CircleDot,
  Calendar,
  Download,
  Gauge,
  Activity,
  PieChart,
  Target,
  Users,
  Zap,
  ArrowRight,
  MapPin,
  Timer,
  Award,
  FileText,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { planningCourses, getHealthMetrics, planningTournees } from "@/lib/conception-planning-data";
import { unassignedPrestations } from "@/lib/a-placer-data-v2";
import { drivers } from "@/lib/planning-data";
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

// KPI data builder
function buildKPIs() {
  const metrics = getHealthMetrics();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  // This week's courses
  const thisWeekCourses = planningCourses.filter((c) => {
    try {
      const d = parseISO(c.date);
      return d >= weekStart && d <= endOfWeek(weekStart, { weekStartsOn: 1 });
    } catch {
      return false;
    }
  });

  // Next week courses
  const nextWeekStart = addWeeks(weekStart, 1);
  const nextWeekCourses = planningCourses.filter((c) => {
    try {
      const d = parseISO(c.date);
      return d >= nextWeekStart && d <= endOfWeek(nextWeekStart, { weekStartsOn: 1 });
    } catch {
      return false;
    }
  });

  const thisWeekAssigned = thisWeekCourses.filter((c) => c.assignmentStatus === "assigned").length;
  const thisWeekUnassigned = thisWeekCourses.filter((c) => c.assignmentStatus === "unassigned").length;
  const nextWeekAssigned = nextWeekCourses.filter((c) => c.assignmentStatus === "assigned").length;
  const nextWeekUnassigned = nextWeekCourses.filter((c) => c.assignmentStatus === "unassigned").length;

  const placementRate = thisWeekCourses.length > 0
    ? Math.round((thisWeekAssigned / thisWeekCourses.length) * 100)
    : 0;

  const nextWeekPlacementRate = nextWeekCourses.length > 0
    ? Math.round((nextWeekAssigned / nextWeekCourses.length) * 100)
    : 0;

  // Courses by type
  const coursesByType = {
    reguliere: planningCourses.filter((c) => c.prestationType !== "sup" && c.prestationType !== "spot").length,
    sup: planningCourses.filter((c) => c.prestationType === "sup").length,
    spot: planningCourses.filter((c) => c.prestationType === "spot").length,
  };

  // Courses by vehicle type
  const coursesByVehicle: Record<string, number> = {};
  planningCourses.forEach((c) => {
    coursesByVehicle[c.requiredVehicleType] = (coursesByVehicle[c.requiredVehicleType] || 0) + 1;
  });

  // Courses by status
  const coursesByStatus = {
    assigned: planningCourses.filter((c) => c.assignmentStatus === "assigned").length,
    unassigned: planningCourses.filter((c) => c.assignmentStatus === "unassigned").length,
    partial: planningCourses.filter((c) => c.assignmentStatus === "partial").length,
  };

  // Sensitive courses
  const sensitiveCourses = planningCourses.filter((c) => c.isSensitive).length;
  const sensitiveUnassigned = planningCourses.filter((c) => c.isSensitive && c.assignmentStatus !== "assigned").length;

  // Drivers summary
  const activeDrivers = drivers.filter((d) => d.status === "Actif").length;
  const restDrivers = drivers.filter((d) => d.status === "En repos").length;
  const leaveDrivers = drivers.filter((d) => d.status === "En congé").length;

  // Top clients
  const clientCounts: Record<string, number> = {};
  planningCourses.forEach((c) => {
    const client = c.client || "N/A";
    clientCounts[client] = (clientCounts[client] || 0) + 1;
  });
  const topClients = Object.entries(clientCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Unassigned by reason
  const unassignedByReason: Record<string, number> = {};
  planningCourses
    .filter((c) => c.assignmentStatus === "unassigned")
    .forEach((c) => {
      unassignedByReason[c.nonPlacementReason] = (unassignedByReason[c.nonPlacementReason] || 0) + 1;
    });

  // Tournees stats
  const totalTournees = planningTournees.length;
  const avgCoursesPerTournee = totalTournees > 0
    ? Math.round((planningTournees.reduce((s, t) => s + t.courses.length, 0) / totalTournees) * 10) / 10
    : 0;

  return {
    metrics,
    thisWeek: {
      total: thisWeekCourses.length,
      assigned: thisWeekAssigned,
      unassigned: thisWeekUnassigned,
      placementRate,
    },
    nextWeek: {
      total: nextWeekCourses.length,
      assigned: nextWeekAssigned,
      unassigned: nextWeekUnassigned,
      placementRate: nextWeekPlacementRate,
    },
    overall: {
      totalCourses: planningCourses.length,
      coursesByType,
      coursesByVehicle,
      coursesByStatus,
      sensitiveCourses,
      sensitiveUnassigned,
      totalTournees,
      avgCoursesPerTournee,
    },
    drivers: {
      total: drivers.length,
      active: activeDrivers,
      rest: restDrivers,
      leave: leaveDrivers,
    },
    topClients,
    unassignedByReason,
    prestationsAplacer: unassignedPrestations.length,
  };
}

const reasonLabels: Record<string, string> = {
  nouvelle_prestation_reguliere: "Nouvelle presta régulière",
  premiere_presta_nouveau_client: "Nouveau client",
  sup_client_existant: "SUP client",
  conducteur_absent: "Conducteur absent",
  materiel_indisponible: "Matériel indisponible",
  prestation_modifiee: "Prestation modifiée",
  tournee_cassee: "Tournée cassée",
  tournee_modifiee: "Tournée modifiée",
  rides_combines_sans_affectation: "Rides combinées",
};

export default function ReportingPage() {
  const kpis = useMemo(() => buildKPIs(), []);
  const [period, setPeriod] = useState("current");

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full space-y-4">
        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-500" />
              Reporting Conception
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Indicateurs de performance, suivi de la planification et analyse des ressources
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Semaine en cours</SelectItem>
                <SelectItem value="next">Semaine prochaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Exporter PDF
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="space-y-4 pr-4">
            {/* ─── KPI Row 1: Headline Metrics ──────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">Total Courses</p>
                    <Package className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-3xl font-bold mt-2">{kpis.overall.totalCourses}</p>
                  <p className="text-xs text-muted-foreground mt-1">Toutes périodes confondues</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-emerald-600 font-medium">Taux de placement</p>
                    <Target className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-bold mt-2 text-emerald-700">{kpis.thisWeek.placementRate}%</p>
                  <div className="flex items-center gap-1 mt-1">
                    {kpis.thisWeek.placementRate >= 70 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-amber-500" />
                    )}
                    <p className="text-xs text-muted-foreground">Sem. en cours ({kpis.thisWeek.assigned}/{kpis.thisWeek.total})</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">À placer (S)</p>
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                  </div>
                  <p className="text-3xl font-bold mt-2 text-amber-600">{kpis.thisWeek.unassigned}</p>
                  <p className="text-xs text-muted-foreground mt-1">Courses non affectées</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">Prestations AP</p>
                    <FileText className="h-4 w-4 text-indigo-400" />
                  </div>
                  <p className="text-3xl font-bold mt-2 text-indigo-600">{kpis.prestationsAplacer}</p>
                  <p className="text-xs text-muted-foreground mt-1">Écran À Placer</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">Sensibles</p>
                    <Shield className="h-4 w-4 text-rose-400" />
                  </div>
                  <p className="text-3xl font-bold mt-2 text-rose-600">{kpis.overall.sensitiveUnassigned}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    / {kpis.overall.sensitiveCourses} total sensibles
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">Tournées</p>
                    <Gauge className="h-4 w-4 text-indigo-400" />
                  </div>
                  <p className="text-3xl font-bold mt-2">{kpis.overall.totalTournees}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Moy. {kpis.overall.avgCoursesPerTournee} courses/tournée
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ─── Week Comparison ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    Semaine en cours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taux de placement</span>
                    <span className="text-sm font-bold text-emerald-600">{kpis.thisWeek.placementRate}%</span>
                  </div>
                  <Progress value={kpis.thisWeek.placementRate} className="h-2" />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-emerald-700">{kpis.thisWeek.assigned}</p>
                      <p className="text-[10px] text-emerald-600">Affectées</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-amber-700">{kpis.thisWeek.unassigned}</p>
                      <p className="text-[10px] text-amber-600">Non affectées</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-lg font-bold">{kpis.thisWeek.total}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-sky-500" />
                    Semaine prochaine (S+1)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Taux de placement</span>
                    <span className="text-sm font-bold text-sky-600">{kpis.nextWeek.placementRate}%</span>
                  </div>
                  <Progress value={kpis.nextWeek.placementRate} className="h-2" />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-emerald-700">{kpis.nextWeek.assigned}</p>
                      <p className="text-[10px] text-emerald-600">Affectées</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-amber-700">{kpis.nextWeek.unassigned}</p>
                      <p className="text-[10px] text-amber-600">Non affectées</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-lg font-bold">{kpis.nextWeek.total}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ─── Second Row: Breakdown Panels ────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Courses by type */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-indigo-500" />
                    Répartition par type
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Régulières", value: kpis.overall.coursesByType.reguliere, color: "bg-indigo-500", pct: Math.round((kpis.overall.coursesByType.reguliere / kpis.overall.totalCourses) * 100) },
                    { label: "SUP", value: kpis.overall.coursesByType.sup, color: "bg-sky-500", pct: Math.round((kpis.overall.coursesByType.sup / kpis.overall.totalCourses) * 100) },
                    { label: "Spot", value: kpis.overall.coursesByType.spot, color: "bg-violet-500", pct: Math.round((kpis.overall.coursesByType.spot / kpis.overall.totalCourses) * 100) },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.value} <span className="text-muted-foreground">({item.pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Courses by status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    Répartition par statut
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Affectées", value: kpis.overall.coursesByStatus.assigned, color: "bg-emerald-500", icon: <CheckCircle2 className="h-3 w-3 text-emerald-500" /> },
                    { label: "Non affectées", value: kpis.overall.coursesByStatus.unassigned, color: "bg-slate-400", icon: <XCircle className="h-3 w-3 text-slate-400" /> },
                    { label: "Partielles", value: kpis.overall.coursesByStatus.partial, color: "bg-amber-500", icon: <CircleDot className="h-3 w-3 text-amber-500" /> },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2 text-sm">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{item.value}</span>
                        <span className="text-xs text-muted-foreground">
                          ({Math.round((item.value / kpis.overall.totalCourses) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Driver stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-500" />
                    Conducteurs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-700">{kpis.drivers.active}</p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">Actifs</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-amber-700">{kpis.drivers.rest}</p>
                      <p className="text-[10px] text-amber-600 mt-0.5">En repos</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-slate-600">{kpis.drivers.leave}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">En congé</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-700">{kpis.drivers.total}</p>
                      <p className="text-[10px] text-indigo-600 mt-0.5">Total</p>
                    </div>
                  </div>

                  {/* Amplitude alerts */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1.5">Alertes amplitude</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                        Attention
                      </span>
                      <span className="font-medium">{kpis.metrics.driversOutOfAmplitude.above}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-rose-500" />
                        Critique
                      </span>
                      <span className="font-medium text-rose-600">{kpis.metrics.driversOutOfAmplitude.below}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ─── Third Row: Tables ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top clients */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4 text-indigo-500" />
                    Top 10 Clients (par nombre de courses)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">#</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Courses</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {kpis.topClients.map(([client, count], idx) => (
                        <TableRow key={client}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-sm">{client}</TableCell>
                          <TableCell className="text-right font-mono">{count}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {Math.round((count / kpis.overall.totalCourses) * 100)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Unassigned by reason */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Raisons de non-placement
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Courses non affectées par raison de non-placement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {Object.entries(kpis.unassignedByReason)
                      .sort((a, b) => b[1] - a[1])
                      .map(([reason, count]) => {
                        const totalUnassigned = kpis.overall.coursesByStatus.unassigned || 1;
                        const pct = Math.round((count / totalUnassigned) * 100);
                        return (
                          <div key={reason} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground truncate max-w-[200px]">
                                {reasonLabels[reason] || reason}
                              </span>
                              <span className="font-medium ml-2">{count} <span className="text-muted-foreground">({pct}%)</span></span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ─── Vehicle Type Distribution ────────────────────────────────── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4 text-indigo-500" />
                  Répartition par type de véhicule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(kpis.overall.coursesByVehicle)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const pct = Math.round((count / kpis.overall.totalCourses) * 100);
                      return (
                        <div key={type} className="bg-slate-50 rounded-lg p-3 text-center">
                          <Truck className="h-5 w-5 text-indigo-400 mx-auto" />
                          <p className="text-lg font-bold mt-1">{count}</p>
                          <p className="text-[10px] text-muted-foreground">{type}</p>
                          <p className="text-[10px] text-indigo-500 font-medium">{pct}%</p>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* ─── Health Metrics (from Planning) ──────────────────────────── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  Santé du Planning
                </CardTitle>
                <CardDescription className="text-xs">
                  Métriques issues du module Planning Global
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-amber-500" />
                      Conducteurs absents
                    </div>
                    <p className="text-xl font-bold">
                      {kpis.metrics.absentDrivers.reduce((s, d) => s + d.count, 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {kpis.metrics.absentDrivers.reduce((s, d) => s + d.impactedCourses, 0)} courses impactées
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {kpis.metrics.absentDrivers.map((d) => (
                        <Badge key={d.type} variant="outline" className="text-[10px] px-1 py-0">
                          {d.type}: {d.count}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Truck className="h-3.5 w-3.5 text-amber-500" />
                      Véhicules indisponibles
                    </div>
                    <p className="text-xl font-bold">{kpis.metrics.unavailableVehicles.count}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {kpis.metrics.unavailableVehicles.impactedCourses} courses impactées
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      Modifications
                    </div>
                    <p className="text-xl font-bold">{kpis.metrics.modifications.annulations + kpis.metrics.modifications.changements}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {kpis.metrics.modifications.annulations} annulations · {kpis.metrics.modifications.changements} changements
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                      Alertes
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xl font-bold text-rose-600">{kpis.metrics.alertsByLevel.critical}</p>
                        <p className="text-[10px] text-rose-500">Critiques</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-amber-600">{kpis.metrics.alertsByLevel.warning}</p>
                        <p className="text-[10px] text-amber-500">Attention</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-sky-600">{kpis.metrics.alertsByLevel.info}</p>
                        <p className="text-[10px] text-sky-500">Info</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ─── Prestations expiring soon ────────────────────────────────── */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Prestations expirant sous 4 semaines</p>
                      <p className="text-xs text-muted-foreground">Prestations régulières dont le contrat arrive à échéance</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-amber-600">{kpis.metrics.prestationsExpiring4Weeks}</p>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                      À renouveler
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
