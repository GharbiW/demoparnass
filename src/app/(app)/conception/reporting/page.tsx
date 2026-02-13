"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  Info,
} from "lucide-react";
import {
  getPlanVsRealData,
  type PlanVsRealEntry,
  type EcartType,
  type GraviteLevel,
  type EcartReason,
} from "@/lib/conception-planning-data";
import { cn } from "@/lib/utils";

// ─── Labels ──────────────────────────────────────────────────────────────────

const ecartTypeLabels: Record<EcartType, string> = {
  conducteur: "Conducteur",
  vehicule: "Véhicule",
  horaire: "Horaire",
  lieu: "Lieu",
  annulation: "Annulation",
  date: "Date",
  rse: "RSE",
};

const ecartTypeColors: Record<EcartType, string> = {
  conducteur: "bg-indigo-500",
  vehicule: "bg-amber-500",
  horaire: "bg-rose-500",
  lieu: "bg-violet-500",
  annulation: "bg-slate-600",
  date: "bg-sky-500",
  rse: "bg-emerald-500",
};

const graviteLabels: Record<GraviteLevel, string> = {
  mineur: "Mineur",
  majeur: "Majeur",
  annule: "Annulé",
};

const graviteEmoji: Record<GraviteLevel, string> = {
  mineur: "🟡",
  majeur: "🔴",
  annule: "⚫",
};

const graviteBadge: Record<GraviteLevel, string> = {
  mineur: "bg-amber-100 text-amber-700 border-amber-200",
  majeur: "bg-rose-100 text-rose-700 border-rose-200",
  annule: "bg-slate-200 text-slate-700 border-slate-300",
};

const reasonLabels: Record<EcartReason, string> = {
  absence_conducteur: "Absence conducteur",
  panne_vehicule: "Panne véhicule",
  probleme_site: "Problème site",
  annulation_demande_client: "Annulation — Demande client",
  annulation_operationnel_parnass: "Annulation — Opérationnel Parnass",
  annulation_empechement_exterieur: "Annulation — Empêchement extérieur",
  retard_cascade: "Retard en cascade",
  alea_externe: "Aléa externe (trafic, météo)",
  retard_demarrage: "Retard au démarrage",
  modification_demande_client: "Modification — Demande client",
  ecart_rse: "Écart avec les règles RSE",
  non_renseigne: "Non renseigné",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReportingPage() {
  const data = useMemo(() => getPlanVsRealData(), []);

  // Filters state
  const [period, setPeriod] = useState("semaine_n1");
  const [product, setProduct] = useState("tous");
  const [client, setClient] = useState("tous");
  const [gravite, setGravite] = useState("tous");
  const [ecartType, setEcartType] = useState("tous");
  const [showFilters, setShowFilters] = useState(true);
  const [expandedTable, setExpandedTable] = useState(false);
  const [sortCol, setSortCol] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Unique clients
  const clients = useMemo(() => {
    const set = new Set(data.entries.map((e) => e.client));
    return Array.from(set).sort();
  }, [data]);

  // Filtered entries
  const filtered = useMemo(() => {
    let items = data.entries;
    if (product !== "tous") items = items.filter((e) => e.product === product);
    if (client !== "tous") items = items.filter((e) => e.client === client);
    if (gravite !== "tous") items = items.filter((e) => e.gravite === gravite);
    if (ecartType !== "tous") items = items.filter((e) => e.ecartType === ecartType);
    return items;
  }, [data, product, client, gravite, ecartType]);

  // Filtered non-conforme
  const filteredNonConforme = useMemo(() => filtered.filter((e) => !e.isConforme), [filtered]);

  // Recompute stats on filtered
  const stats = useMemo(() => {
    const total = filtered.length;
    const conforme = filtered.filter((e) => e.isConforme).length;
    const ecart = total - conforme;
    const conformeRate = total > 0 ? Math.round((conforme / total) * 100) : 0;

    const delayItems = filtered.filter((e) => e.retardMinutes && e.retardMinutes > 0);
    const avgRetard = delayItems.length > 0
      ? Math.round(delayItems.reduce((s, e) => s + (e.retardMinutes || 0), 0) / delayItems.length)
      : 0;

    // Ecart type breakdown (from non-conforme only)
    const ecartTypeBreakdown: Record<EcartType, number> = { conducteur: 0, vehicule: 0, horaire: 0, lieu: 0, annulation: 0, date: 0, rse: 0 };
    filteredNonConforme.forEach((e) => { if (e.ecartType) ecartTypeBreakdown[e.ecartType]++; });

    // Gravite breakdown
    const graviteBreakdown: Record<GraviteLevel, number> = { mineur: 0, majeur: 0, annule: 0 };
    filteredNonConforme.forEach((e) => { if (e.gravite) graviteBreakdown[e.gravite]++; });

    // Reason breakdown
    const reasonBreakdown: Record<string, number> = {};
    filteredNonConforme.forEach((e) => {
      reasonBreakdown[e.ecartReason] = (reasonBreakdown[e.ecartReason] || 0) + 1;
    });
    const totalNonConf = ecart || 1;
    const reasonCompletude = Math.round(((totalNonConf - (reasonBreakdown['non_renseigne'] || 0)) / totalNonConf) * 100);

    // Tournee aggregation
    const tourneeMap = new Map<string, { ecartCount: number; totalCourses: number }>();
    filtered.forEach((e) => {
      const tNum = e.tourneeNumber || 'Sans tournée';
      if (!tourneeMap.has(tNum)) tourneeMap.set(tNum, { ecartCount: 0, totalCourses: 0 });
      const t = tourneeMap.get(tNum)!;
      t.totalCourses++;
      if (!e.isConforme) t.ecartCount++;
    });
    const tourneeEcarts = Array.from(tourneeMap.entries())
      .map(([tourneeNumber, d]) => ({ tourneeNumber, ...d }))
      .filter((t) => t.ecartCount > 0)
      .sort((a, b) => b.ecartCount - a.ecartCount)
      .slice(0, 10);
    const tourneesWithEcart = Array.from(tourneeMap.values()).filter((t) => t.ecartCount > 0).length;
    const totalTournees = tourneeMap.size;
    const tourneeEcartPct = totalTournees > 0 ? Math.round((tourneesWithEcart / totalTournees) * 100) : 0;

    return {
      total, conforme, ecart, conformeRate, avgRetard,
      ecartTypeBreakdown, graviteBreakdown, reasonBreakdown, reasonCompletude,
      tourneeEcarts, tourneesWithEcart, totalTournees, tourneeEcartPct,
    };
  }, [filtered, filteredNonConforme]);

  // Sorted non-conforme for table
  const sortedNonConforme = useMemo(() => {
    const items = [...filteredNonConforme];
    items.sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      switch (sortCol) {
        case "date": va = a.date; vb = b.date; break;
        case "client": va = a.client; vb = b.client; break;
        case "gravite": va = a.gravite || ""; vb = b.gravite || ""; break;
        case "retard": va = a.retardMinutes || 0; vb = b.retardMinutes || 0; break;
        case "ecart": va = a.ecartType || ""; vb = b.ecartType || ""; break;
        default: va = a.date; vb = b.date;
      }
      if (typeof va === "number" && typeof vb === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return items;
  }, [filteredNonConforme, sortCol, sortDir]);

  const toggleSort = useCallback((col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  }, [sortCol]);

  const resetFilters = useCallback(() => {
    setPeriod("semaine_n1");
    setProduct("tous");
    setClient("tous");
    setGravite("tous");
    setEcartType("tous");
  }, []);

  const hasActiveFilters = product !== "tous" || client !== "tous" || gravite !== "tous" || ecartType !== "tous";

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold font-headline flex items-center gap-2">
              Reporting Conception
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Analyse des écarts entre plans de conception et réalité terrain
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
              SUP exclues par défaut
            </Badge>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export Excel
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-130px)]">
          <div className="space-y-4 pr-3">

            {/* ═══ BLOC 1 — Filtres globaux ═══════════════════════════ */}
            <Card className="border-slate-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <button
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filtres
                    {hasActiveFilters && (
                      <Badge className="h-4 w-4 p-0 text-[9px] bg-indigo-500 text-white justify-center">
                        !
                      </Badge>
                    )}
                    {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground" onClick={resetFilters}>
                      <RotateCcw className="h-3 w-3" /> Reset filtres
                    </Button>
                  )}
                </div>

                {showFilters && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue placeholder="Période" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semaine_n1">Semaine N-1</SelectItem>
                        <SelectItem value="semaine_n2">Semaine N-2</SelectItem>
                        <SelectItem value="semaine_n3">Semaine N-3</SelectItem>
                        <SelectItem value="mois_courant">Mois courant</SelectItem>
                        <SelectItem value="mois_precedent">Mois précédent</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={product} onValueChange={setProduct}>
                      <SelectTrigger className="w-[110px] h-8 text-xs">
                        <SelectValue placeholder="Produit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Tous</SelectItem>
                        <SelectItem value="CM">CM</SelectItem>
                        <SelectItem value="SPL">SPL</SelectItem>
                        <SelectItem value="VL">VL</SelectItem>
                        <SelectItem value="PO">PO</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={client} onValueChange={setClient}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Tous</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={gravite} onValueChange={setGravite}>
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="Gravité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Tous</SelectItem>
                        <SelectItem value="mineur">🟡 Mineur</SelectItem>
                        <SelectItem value="majeur">🔴 Majeur</SelectItem>
                        <SelectItem value="annule">⚫ Annulé</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={ecartType} onValueChange={setEcartType}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Type d'écart" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Tous</SelectItem>
                        <SelectItem value="horaire">Horaire</SelectItem>
                        <SelectItem value="conducteur">Conducteur</SelectItem>
                        <SelectItem value="vehicule">Véhicule</SelectItem>
                        <SelectItem value="lieu">Lieu</SelectItem>
                        <SelectItem value="annulation">Annulation</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="rse">RSE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ═══ BLOC 2 — Vue macro de conformité — Courses ════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
              {/* Left: Conformité au plan */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Conformité au Plan
                  </p>
                  <div className="flex items-start gap-6">
                    {/* Big number */}
                    <div>
                      <p className="text-4xl font-extrabold tracking-tight">{stats.total}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">courses analysées</p>
                    </div>

                    {/* Donut visual */}
                    <div className="flex-1 flex items-center gap-4">
                      <div className="relative w-24 h-24">
                        <svg viewBox="0 0 36 36" className="w-24 h-24 transform -rotate-90">
                          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                          <circle
                            cx="18" cy="18" r="15.5" fill="none"
                            stroke="#22c55e" strokeWidth="3.5"
                            strokeDasharray={`${stats.conformeRate * 0.974} ${97.4 - stats.conformeRate * 0.974}`}
                            strokeLinecap="round"
                          />
                          <circle
                            cx="18" cy="18" r="15.5" fill="none"
                            stroke="#ef4444" strokeWidth="3.5"
                            strokeDasharray={`${(100 - stats.conformeRate) * 0.974} ${97.4 - (100 - stats.conformeRate) * 0.974}`}
                            strokeDashoffset={`-${stats.conformeRate * 0.974}`}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-lg font-bold text-emerald-600">{stats.conformeRate}%</span>
                          <span className="text-xs text-muted-foreground">Conformes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-rose-500" />
                          <span className="text-lg font-bold text-rose-600">{100 - stats.conformeRate}%</span>
                          <span className="text-xs text-muted-foreground">Avec écart</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 pt-1 border-t">
                          <span className="text-xs text-muted-foreground">Retard moyen :</span>
                          <span className="text-sm font-bold">{stats.avgRetard} min</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal stacked bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                      <div className="bg-emerald-500 transition-all" style={{ width: `${stats.conformeRate}%` }} />
                      <div className="bg-rose-500 transition-all" style={{ width: `${100 - stats.conformeRate}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{stats.conforme} conformes</span>
                      <span>{stats.ecart} avec écart</span>
                    </div>
                  </div>

                  {/* 6-week trend */}
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-[10px] font-medium text-muted-foreground mb-2">Tendance 6 dernières semaines</p>
                    <div className="flex items-end gap-1.5 h-16">
                      {data.weeklyTrend.map((w, i) => (
                        <Tooltip key={w.week}>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-0.5 flex-1">
                              <span className="text-[9px] font-medium text-muted-foreground">{w.conformeRate}%</span>
                              <div className="w-full rounded-t bg-slate-100 relative" style={{ height: '40px' }}>
                                <div
                                  className={cn(
                                    "absolute bottom-0 w-full rounded-t transition-all",
                                    i === data.weeklyTrend.length - 1 ? "bg-indigo-500" : "bg-indigo-300"
                                  )}
                                  style={{ height: `${w.conformeRate * 0.4}px` }}
                                />
                              </div>
                              <span className="text-[9px] text-muted-foreground">{w.week}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {w.week}: {w.conformeRate}% conforme ({w.total} courses)
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right: Tournées à problèmes */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Tournées à Problèmes
                  </p>

                  {/* Big stat */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-rose-600">{stats.tourneeEcartPct}%</p>
                      <p className="text-xs text-muted-foreground">des tournées avec au moins un écart</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground mb-2">
                    {stats.tourneesWithEcart} / {stats.totalTournees} tournées
                  </p>

                  {/* Top 10 list */}
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-3 mb-2">
                    Top 10 Tournées
                  </p>
                  <div className="space-y-1">
                    {stats.tourneeEcarts.map((t, idx) => (
                      <div key={t.tourneeNumber} className="flex items-center justify-between py-1 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-4 text-right">{idx + 1}.</span>
                          <span className="text-xs font-medium">{t.tourneeNumber}</span>
                        </div>
                        <span className="text-xs font-bold text-rose-600">{t.ecartCount}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ═══ BLOC 3+4+5 — Écarts / Gravité / Raisons ══════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* BLOC 3 — Types d'écart */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Types d&apos;Écart
                  </p>
                  <div className="space-y-2.5">
                    {(Object.entries(stats.ecartTypeBreakdown) as [EcartType, number][])
                      .filter(([, count]) => count > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => {
                        const pct = stats.ecart > 0 ? Math.round((count / stats.ecart) * 100) : 0;
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{ecartTypeLabels[type]}</span>
                              <span className="text-xs font-bold">{pct}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", ecartTypeColors[type])}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* BLOC 4 — Gravité */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Gravité
                  </p>
                  <div className="space-y-4">
                    {(Object.entries(stats.graviteBreakdown) as [GraviteLevel, number][])
                      .sort((a, b) => b[1] - a[1])
                      .map(([level, count]) => {
                        const pct = stats.ecart > 0 ? Math.round((count / stats.ecart) * 100) : 0;
                        return (
                          <div key={level} className="flex items-center gap-3">
                            <span className="text-xl">{graviteEmoji[level]}</span>
                            <Badge variant="outline" className={cn("text-[10px]", graviteBadge[level])}>
                              {graviteLabels[level]}
                            </Badge>
                            <span className="text-2xl font-extrabold ml-auto">{pct}%</span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* BLOC 5 — Raisons des écarts */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Raisons des Écarts
                  </p>

                  {/* Complétude bar */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">Complétude :</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${stats.reasonCompletude}%` }} />
                    </div>
                    <span className="text-xs font-bold">{stats.reasonCompletude}%</span>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(stats.reasonBreakdown)
                      .filter(([, count]) => count > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([reason, count]) => {
                        const pct = stats.ecart > 0 ? Math.round((count / stats.ecart) * 100) : 0;
                        return (
                          <div key={reason} className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {reasonLabels[reason as EcartReason] || reason}
                            </span>
                            <span className="text-xs font-bold ml-2">{pct}%</span>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ═══ BLOC 6 — Détail des écarts (Table) ════════════════ */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Détail des Écarts
                    </p>
                    <Badge variant="outline" className="text-[10px]">{filteredNonConforme.length} courses</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                      <Download className="h-3 w-3" /> Export Excel
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <SortableHead col="courseId" label="Course ID" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                        <TableHead className="text-[10px] h-8 whitespace-nowrap">Tournée</TableHead>
                        <SortableHead col="client" label="Client" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                        <TableHead className="text-[10px] h-8">Code Article</TableHead>
                        <TableHead className="text-[10px] h-8">Produit</TableHead>
                        <TableHead className="text-[10px] h-8">Plan</TableHead>
                        <TableHead className="text-[10px] h-8">Réel</TableHead>
                        <SortableHead col="ecart" label="Écart" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                        <SortableHead col="gravite" label="Gravité" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                        <SortableHead col="retard" label="Retard" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} />
                        <TableHead className="text-[10px] h-8">Raison</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedNonConforme.slice(0, expandedTable ? 100 : 12).map((entry) => (
                        <TableRow key={entry.courseId} className="hover:bg-muted/30">
                          <TableCell className="py-1.5">
                            <button className="text-xs font-mono text-indigo-600 hover:underline flex items-center gap-0.5">
                              {entry.courseId}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </button>
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-muted-foreground font-mono">
                            {entry.tourneeNumber || '—'}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs">{entry.client}</TableCell>
                          <TableCell className="py-1.5 text-xs font-mono text-muted-foreground">{entry.codeArticle || '—'}</TableCell>
                          <TableCell className="py-1.5">
                            <Badge variant="outline" className="text-[9px]">{entry.product}</Badge>
                          </TableCell>
                          <TableCell className="py-1.5">
                            <div className="text-[10px]">
                              <span className="font-mono">{entry.planned.startTime}–{entry.planned.endTime}</span>
                              <div className="text-muted-foreground truncate max-w-[120px]" title={`${entry.planned.startLocation} → ${entry.planned.endLocation}`}>
                                {entry.planned.startLocation} → {entry.planned.endLocation}
                              </div>
                              {entry.planned.driverName && (
                                <div className="text-muted-foreground">{entry.planned.driverName} · {entry.planned.vehicleImmat}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5">
                            <div className="text-[10px]">
                              <span className="font-mono">{entry.actual.startTime}–{entry.actual.endTime}</span>
                              <div className="text-muted-foreground truncate max-w-[120px]" title={`${entry.actual.startLocation} → ${entry.actual.endLocation}`}>
                                {entry.actual.startLocation} → {entry.actual.endLocation}
                              </div>
                              {entry.actual.driverName && (
                                <div className={cn(
                                  "text-muted-foreground",
                                  entry.deviations.driverChanged && "text-violet-600 font-medium",
                                  entry.deviations.vehicleChanged && "text-amber-600 font-medium"
                                )}>
                                  {entry.actual.driverName} · {entry.actual.vehicleImmat}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5">
                            {entry.ecartType && (
                              <Badge variant="outline" className={cn("text-[9px] border-0 text-white", ecartTypeColors[entry.ecartType])}>
                                {ecartTypeLabels[entry.ecartType]}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5">
                            {entry.gravite && (
                              <Badge variant="outline" className={cn("text-[9px]", graviteBadge[entry.gravite])}>
                                {graviteEmoji[entry.gravite]} {graviteLabels[entry.gravite]}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs font-mono font-medium">
                            {entry.retardMinutes != null ? (
                              <span className={cn(
                                entry.retardMinutes >= 15 ? "text-rose-600" :
                                entry.retardMinutes >= 5 ? "text-amber-600" :
                                "text-emerald-600"
                              )}>
                                +{entry.retardMinutes}&apos;
                              </span>
                            ) : entry.status === 'cancelled' ? (
                              <span className="text-slate-500">—</span>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="py-1.5 text-[10px] text-muted-foreground max-w-[140px] truncate" title={reasonLabels[entry.ecartReason]}>
                            {reasonLabels[entry.ecartReason]}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredNonConforme.length > 12 && (
                  <div className="flex justify-center mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => setExpandedTable(!expandedTable)}
                    >
                      {expandedTable ? (
                        <>Voir moins <ChevronUp className="h-3 w-3" /></>
                      ) : (
                        <>Voir tout ({filteredNonConforme.length}) <ChevronDown className="h-3 w-3" /></>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

// ─── Sortable Table Head ─────────────────────────────────────────────────────

function SortableHead({
  col, label, sortCol, sortDir, onSort,
}: {
  col: string; label: string; sortCol: string; sortDir: "asc" | "desc"; onSort: (col: string) => void;
}) {
  const isActive = sortCol === col;
  return (
    <TableHead className="text-[10px] h-8 whitespace-nowrap">
      <button
        className={cn("flex items-center gap-0.5 hover:text-foreground transition-colors", isActive && "text-foreground font-bold")}
        onClick={() => onSort(col)}
      >
        {label}
        {isActive && (sortDir === "asc" ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />)}
      </button>
    </TableHead>
  );
}
