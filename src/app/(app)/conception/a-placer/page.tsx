"use client";

import { useState, useMemo, useCallback } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Search,
  AlertCircle,
  Truck,
  User,
  Clock,
  CalendarDays,
  Package,
  AlertTriangle,
  Shield,
  Zap,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  X,
  Filter,
  TrendingUp,
  ArrowRightLeft,
  MoreHorizontal,
  Route,
  Fuel,
  CheckSquare,
  Layers,
  Plus,
  ExternalLink,
  Eye,
  ChevronsUpDown,
  Circle,
} from "lucide-react";
import { Prestation, Course, NonPlacementReason, Tournee } from "@/lib/types";
import { unassignedPrestations, getStatsByWeek } from "@/lib/a-placer-data-v2";
import { planningTournees } from "@/lib/conception-planning-data";
import { PrestationDrawer } from "@/components/conception/prestation-drawer";
import { format, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Reason config ───────────────────────────────────────────────────────────
const reasonConfig: Record<NonPlacementReason, { label: string; shortLabel: string; icon: React.ReactNode; color: string }> = {
  'nouvelle_prestation_reguliere': {
    label: 'Nouvelle prestation régulière',
    shortLabel: 'Nouvelle presta',
    icon: <Package className="h-3 w-3" />,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  'premiere_presta_nouveau_client': {
    label: 'Première prestation — nouveau client',
    shortLabel: 'Nouveau client',
    icon: <Zap className="h-3 w-3" />,
    color: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  'sup_client_existant': {
    label: 'SUP demandée par un client existant',
    shortLabel: 'SUP client',
    icon: <TrendingUp className="h-3 w-3" />,
    color: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  'conducteur_absent': {
    label: 'Le conducteur prévu est absent',
    shortLabel: 'Conducteur absent',
    icon: <User className="h-3 w-3" />,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'materiel_indisponible': {
    label: 'Le matériel prévu n\'est plus disponible',
    shortLabel: 'Matériel indispo.',
    icon: <Truck className="h-3 w-3" />,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'prestation_modifiee': {
    label: 'Prestation modifiée — sortie de tournée',
    shortLabel: 'Presta modifiée',
    icon: <ArrowRightLeft className="h-3 w-3" />,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  'tournee_cassee': {
    label: 'Tournée cassée ou modifiée',
    shortLabel: 'Tournée cassée',
    icon: <AlertTriangle className="h-3 w-3" />,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
  },
  'tournee_modifiee': {
    label: 'Tournée modifiée',
    shortLabel: 'Tournée modifiée',
    icon: <AlertCircle className="h-3 w-3" />,
    color: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  'rides_combines_sans_affectation': {
    label: 'Rides combinés sans affectation véhicule / conducteur',
    shortLabel: 'Combiné non affecté',
    icon: <LayoutGrid className="h-3 w-3" />,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
};

// ─── Color-coded Day Pills ─────────────────────────────────────────────────────
const DAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"] as const;
const DAY_MAP: Record<number, string> = { 1: "Lu", 2: "Ma", 3: "Me", 4: "Je", 5: "Ve", 6: "Sa", 0: "Di" };

type DayStatus = 'affectee' | 'partiellement_affectee' | 'non_affectee' | 'inactive';

function StatusDayPills({ dayStatuses }: { dayStatuses: Record<string, DayStatus> }) {
  return (
    <div className="flex items-center gap-0.5">
      {DAY_LABELS.map((d) => {
        const status = dayStatuses[d] || 'inactive';
        return (
          <TooltipProvider key={d}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-[22px] h-5 rounded text-[9px] font-bold transition-all cursor-default",
                    status === 'affectee' && "bg-emerald-500 text-white shadow-sm",
                    status === 'partiellement_affectee' && "bg-amber-400 text-white shadow-sm",
                    status === 'non_affectee' && "bg-rose-500 text-white shadow-sm",
                    status === 'inactive' && "bg-slate-50 text-slate-300 border border-slate-100"
                  )}
                >
                  {d[0]}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{d}</p>
                <p className="text-muted-foreground">
                  {status === 'affectee' && '✓ Affectée'}
                  {status === 'partiellement_affectee' && '◐ Partiellement affectée'}
                  {status === 'non_affectee' && '✗ Non affectée'}
                  {status === 'inactive' && '— Pas de course'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

function getDayStatuses(courses: Course[]): Record<string, DayStatus> {
  const statusByDay: Record<string, DayStatus> = {};
  courses.forEach(c => {
    const dayKey = DAY_MAP[getDay(new Date(c.date))];
    if (!dayKey) return;
    const existing = statusByDay[dayKey];
    if (!existing) {
      statusByDay[dayKey] = c.assignmentStatus === 'affectee' ? 'affectee' : c.assignmentStatus === 'partiellement_affectee' ? 'partiellement_affectee' : 'non_affectee';
    } else {
      // Merge: if any course on that day is non_affectee, day is non_affectee
      if (existing === 'affectee' && c.assignmentStatus !== 'affectee') {
        statusByDay[dayKey] = 'partiellement_affectee';
      } else if (existing === 'non_affectee' && c.assignmentStatus === 'affectee') {
        statusByDay[dayKey] = 'partiellement_affectee';
      }
    }
  });
  return statusByDay;
}

function getRepetitionDays(prestation: Prestation): string[] {
  const days = new Set<string>();
  prestation.courses.forEach(c => {
    const day = DAY_MAP[getDay(new Date(c.date))];
    if (day) days.add(day);
  });
  return Array.from(days);
}

// ─── Date urgency ──────────────────────────────────────────────────────────────
function getDateUrgency(date: string) {
  const today = new Date();
  const courseDate = new Date(date);
  const daysDiff = Math.floor((courseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 1) return { color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Urgent', dot: 'bg-rose-500' };
  if (daysDiff <= 3) return { color: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Bientôt', dot: 'bg-amber-400' };
  if (daysDiff <= 7) return { color: 'bg-sky-400', text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', label: 'Cette semaine', dot: 'bg-sky-400' };
  return { color: 'bg-slate-300', text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Planifié', dot: 'bg-slate-300' };
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, count, courses, color, active, onClick
}: {
  label: string; count: number; courses: number; color: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-md",
        active ? "ring-2 ring-primary shadow-md bg-card" : "bg-card hover:bg-accent/5"
      )}
    >
      <div className={cn("absolute top-0 left-0 w-1 h-full", color)} />
      <div className="ml-2">
        <div className="text-2xl font-bold tracking-tight">{count}</div>
        <div className="text-xs font-medium text-muted-foreground mt-0.5">{label}</div>
        <div className="flex items-center gap-1 mt-2">
          <div className={cn("h-1.5 w-1.5 rounded-full", color)} />
          <span className="text-[11px] text-muted-foreground">{courses} courses</span>
        </div>
      </div>
    </button>
  );
}

// ─── Missing resource indicator ──────────────────────────────────────────────
function MissingResourceBadge({ resource }: { resource?: 'vehicle' | 'driver' | 'both' }) {
  if (!resource) return <span className="text-[10px] text-emerald-600">—</span>;
  return (
    <div className="flex items-center gap-1">
      {(resource === 'vehicle' || resource === 'both') && (
        <div className="flex items-center justify-center h-5 px-1.5 rounded bg-amber-50 border border-amber-200">
          <Truck className="h-2.5 w-2.5 text-amber-600" />
        </div>
      )}
      {(resource === 'driver' || resource === 'both') && (
        <div className="flex items-center justify-center h-5 px-1.5 rounded bg-amber-50 border border-amber-200">
          <User className="h-2.5 w-2.5 text-amber-600" />
        </div>
      )}
    </div>
  );
}

// ─── Week badge ──────────────────────────────────────────────────────────────
function WeekBadge({ week }: { week: string }) {
  const colors: Record<string, string> = {
    'S+1': 'bg-rose-50 text-rose-600 border-rose-200',
    'S+2': 'bg-amber-50 text-amber-600 border-amber-200',
    'S+3': 'bg-sky-50 text-sky-600 border-sky-200',
    'S+4+': 'bg-slate-50 text-slate-500 border-slate-200',
  };
  return (
    <span className={cn("inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded border", colors[week] || colors['S+4+'])}>
      {week}
    </span>
  );
}

// ─── Reason badge ────────────────────────────────────────────────────────────
function ReasonBadge({ reason }: { reason: NonPlacementReason }) {
  const config = reasonConfig[reason];
  if (!config) return null;
  return (
    <div className={cn(
      "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 border whitespace-nowrap",
      config.color
    )}>
      {config.icon}
      <span className="truncate max-w-[100px]">{config.shortLabel}</span>
    </div>
  );
}

// ─── Active filter pill ──────────────────────────────────────────────────────
function ActiveFilter({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESTATION GROUP ROW (expandable)
// ═══════════════════════════════════════════════════════════════════════════════
function PrestationGroupRow({
  prestation,
  isExpanded,
  onToggleExpand,
  isSelected,
  onToggleSelect,
  onOpenDrawer,
  onOpenTournee,
}: {
  prestation: Prestation;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDrawer: () => void;
  onOpenTournee: (tourneeId: string) => void;
}) {
  const firstCourse = prestation.courses[0];
  const dates = [...new Set(prestation.courses.map(c => c.date))].sort();
  const urgency = getDateUrgency(dates[0]);
  const unassignedCount = prestation.courses.filter(c => c.assignmentStatus === 'non_affectee').length;
  const totalCourses = prestation.courses.length;
  const dayStatuses = getDayStatuses(prestation.courses);
  const repetitionDays = getRepetitionDays(prestation);
  const tourneeNumber = firstCourse.tourneeNumber;
  const rConfig = reasonConfig[firstCourse.nonPlacementReason];

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden transition-all duration-200",
      isExpanded ? "shadow-md ring-1 ring-primary/10" : "hover:shadow-sm",
      isSelected && "ring-2 ring-primary",
      prestation.hasSensitiveCourses && !isSelected && "ring-1 ring-rose-200/60"
    )}>
      {/* Group Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors",
          isExpanded ? "bg-muted/60" : "bg-card hover:bg-muted/30"
        )}
        onClick={onToggleExpand}
      >
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(prestation.id)}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        />

        {/* Expand/Collapse */}
        <button className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors">
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>

        {/* Urgency dot */}
        <div className={cn("h-2 w-2 rounded-full shrink-0", urgency.dot)} />

        {/* Ref Prestation */}
        <div className="w-[110px] shrink-0">
          <div className="text-xs font-bold text-foreground">{prestation.id}</div>
          {prestation.codeArticle && (
            <div className="text-[9px] text-muted-foreground font-mono">{prestation.codeArticle}</div>
          )}
        </div>

        {/* Tournée */}
        <div className="w-[70px] shrink-0">
          {tourneeNumber ? (
            <button
              onClick={(e) => { e.stopPropagation(); if (firstCourse.tourneeId) onOpenTournee(firstCourse.tourneeId); }}
              className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200 rounded px-1.5 py-0.5 hover:bg-sky-100 transition-colors"
            >
              {tourneeNumber}
              <ExternalLink className="h-2.5 w-2.5" />
            </button>
          ) : (
            <span className="text-[10px] text-muted-foreground">—</span>
          )}
        </div>

        {/* Client */}
        <div className="w-[120px] shrink-0">
          <div className="text-xs font-semibold text-primary truncate">{prestation.client}</div>
        </div>

        {/* Route (summary) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[11px] font-medium truncate max-w-[120px]">{firstCourse.startLocation}</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-[11px] font-medium truncate max-w-[120px]">{firstCourse.endLocation}</span>
          </div>
        </div>

        {/* Day Status Pills */}
        <div className="w-[170px] shrink-0">
          <StatusDayPills dayStatuses={dayStatuses} />
        </div>

        {/* Time */}
        <div className="w-[80px] shrink-0 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-0.5">
            <Clock className="h-3 w-3 shrink-0" />
            {firstCourse.startTime}–{firstCourse.endTime}
          </div>
        </div>

        {/* Type + Week */}
        <div className="w-[60px] shrink-0 flex flex-col gap-0.5 items-start">
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-semibold">
            {prestation.type === 'sup' ? 'SUP' : prestation.type === 'spot' ? 'Spot' : 'Rég.'}
          </Badge>
          <WeekBadge week={prestation.week} />
        </div>

        {/* Reason */}
        <div className="w-[130px] shrink-0">
          <ReasonBadge reason={firstCourse.nonPlacementReason} />
        </div>

        {/* Sensitive */}
        <div className="w-[30px] shrink-0 flex justify-center">
          {prestation.hasSensitiveCourses && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Shield className="h-3.5 w-3.5 text-rose-500" />
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Trajet sensible</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Vehicle / Resource */}
        <div className="w-[80px] shrink-0">
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Truck className="h-3 w-3 shrink-0" />
            <span className="truncate">{prestation.requiredVehicleType}</span>
          </div>
          {prestation.requiredVehicleEnergy && (
            <div className="text-[9px] text-muted-foreground/70">{prestation.requiredVehicleEnergy}</div>
          )}
        </div>

        {/* Missing resource */}
        <div className="w-[50px] shrink-0 flex justify-center">
          <MissingResourceBadge resource={firstCourse.missingResource} />
        </div>

        {/* Count + CTA */}
        <div className="w-[100px] shrink-0 flex items-center justify-end gap-1.5">
          <Badge
            variant={unassignedCount > 0 ? "destructive" : "secondary"}
            className="text-[9px] px-1.5 py-0 h-4 font-bold"
          >
            {unassignedCount}/{totalCourses}
          </Badge>
          <Button
            size="sm"
            className="h-6 text-[10px] px-2 shadow-sm"
            onClick={(e) => { e.stopPropagation(); onOpenDrawer(); }}
          >
            Affecter
          </Button>
        </div>
      </div>

      {/* Expanded Course Rows */}
      {isExpanded && (
        <div className="border-t bg-muted/20">
          {/* Sub-header */}
          <div className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground border-b bg-muted/40">
            <div className="w-[28px]" /> {/* checkbox space */}
            <div className="w-[30px]" /> {/* expand space */}
            <div className="w-[100px]">Réf. Course</div>
            <div className="w-[70px]">Ride</div>
            <div className="flex-1">Trajet</div>
            <div className="w-[100px]">Date</div>
            <div className="w-[80px]">Horaires</div>
            <div className="w-[80px]">Statut</div>
            <div className="w-[110px]">Conducteur</div>
            <div className="w-[90px]">Véhicule</div>
            <div className="w-[80px] text-right">Actions</div>
          </div>

          {prestation.courses.map((course, idx) => {
            const isAssigned = course.assignmentStatus === 'affectee';
            const isPartial = course.assignmentStatus === 'partiellement_affectee';
            const cUrgency = getDateUrgency(course.date);

            return (
              <div
                key={course.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 border-b last:border-b-0 transition-colors hover:bg-muted/40",
                  isAssigned && "bg-emerald-50/30",
                  course.isSensitive && "bg-rose-50/20"
                )}
              >
                <div className="w-[28px]" />
                <div className="w-[30px] flex justify-center">
                  <div className={cn("h-1.5 w-1.5 rounded-full", cUrgency.dot)} />
                </div>

                {/* Course Ref */}
                <div className="w-[100px] shrink-0">
                  <span className="text-[11px] font-mono font-medium">{course.id}</span>
                </div>

                {/* Ride Ref */}
                <div className="w-[70px] shrink-0">
                  <span className="text-[10px] text-muted-foreground font-mono">{course.rideId}</span>
                </div>

                {/* Route */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[11px] truncate max-w-[100px]">{course.startLocation}</span>
                    {course.intermediateLocations && course.intermediateLocations.length > 0 && (
                      <>
                        <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
                        <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">
                          +{course.intermediateLocations.length}
                        </Badge>
                      </>
                    )}
                    <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <span className="text-[11px] truncate max-w-[100px]">{course.endLocation}</span>
                  </div>
                </div>

                {/* Date */}
                <div className="w-[100px] shrink-0">
                  <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                    cUrgency.bg, cUrgency.border, cUrgency.text
                  )}>
                    {format(new Date(course.date), "EEE d MMM", { locale: fr })}
                  </span>
                </div>

                {/* Time */}
                <div className="w-[80px] shrink-0 text-[11px] text-muted-foreground">
                  {course.startTime}–{course.endTime}
                </div>

                {/* Status */}
                <div className="w-[80px] shrink-0">
                  {isAssigned ? (
                    <Badge className="text-[9px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                      Affectée
                    </Badge>
                  ) : isPartial ? (
                    <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                      Partielle
                    </Badge>
                  ) : (
                    <Badge className="text-[9px] px-1.5 py-0 h-4 bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100">
                      Non placée
                    </Badge>
                  )}
                </div>

                {/* Driver */}
                <div className="w-[110px] shrink-0 text-[10px]">
                  {course.assignedDriverName ? (
                    <span className="text-foreground font-medium">{course.assignedDriverName}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Non assigné</span>
                  )}
                </div>

                {/* Vehicle */}
                <div className="w-[90px] shrink-0 text-[10px]">
                  {course.assignedVehicleImmat ? (
                    <span className="font-mono text-foreground">{course.assignedVehicleImmat}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Non assigné</span>
                  )}
                </div>

                {/* Actions */}
                <div className="w-[80px] shrink-0 flex justify-end">
                  {!isAssigned && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 text-[9px] px-1.5"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <Eye className="h-2.5 w-2.5 mr-0.5" />
                      Détail
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Group footer with quick actions */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                {prestation.courses.length} course(s) · {unassignedCount} à placer
              </span>
              {prestation.requiredDriverSkills.length > 0 && (
                <div className="flex items-center gap-1">
                  {prestation.requiredDriverSkills.map(skill => (
                    <Badge key={skill} variant="outline" className="text-[9px] px-1 py-0 h-3.5">{skill}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {firstCourse.tourneeId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[10px] px-2 gap-1"
                  onClick={() => onOpenTournee(firstCourse.tourneeId!)}
                >
                  <Route className="h-3 w-3" />
                  Voir tournée
                </Button>
              )}
              <Button
                size="sm"
                variant="default"
                className="h-6 text-[10px] px-2.5 shadow-sm"
                onClick={onOpenDrawer}
              >
                Affecter tout ({unassignedCount})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARD VIEW — PrestationCard (improved)
// ═══════════════════════════════════════════════════════════════════════════════
function PrestationCard({
  prestation,
  onSelect,
  isSelected,
  onToggleSelect,
}: {
  prestation: Prestation;
  onSelect: () => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const firstCourse = prestation.courses[0];
  const dates = [...new Set(prestation.courses.map(c => c.date))].sort();
  const unassignedCount = prestation.courses.filter(c => c.assignmentStatus === 'non_affectee').length;
  const urgency = getDateUrgency(dates[0]);
  const dayStatuses = getDayStatuses(prestation.courses);
  const tourneeNumber = firstCourse.tourneeNumber;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        prestation.hasSensitiveCourses && "ring-1 ring-rose-200/60",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      <div className={cn("h-0.5 w-full", urgency.color)} />
      <CardContent className="p-3.5">
        {/* Header */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {onToggleSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(prestation.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm">{prestation.id}</span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                  {prestation.type === 'sup' ? 'SUP' : prestation.type === 'spot' ? 'Spot' : 'Régulière'}
                </Badge>
                <WeekBadge week={prestation.week} />
                {tourneeNumber && (
                  <Badge className="text-[9px] px-1 py-0 h-3.5 bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 font-mono">
                    {tourneeNumber}
                  </Badge>
                )}
                {prestation.hasSensitiveCourses && (
                  <Badge className="text-[9px] px-1 py-0 h-3.5 bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-50">
                    <Shield className="h-2.5 w-2.5 mr-0.5" /> Sensible
                  </Badge>
                )}
              </div>
              <div className="text-sm font-semibold text-primary mt-0.5">{prestation.client}</div>
            </div>
          </div>
          <MissingResourceBadge resource={firstCourse.missingResource} />
        </div>

        {/* Route */}
        <div className="flex items-center gap-1.5 mb-2.5 bg-muted/30 rounded-lg px-2.5 py-2 border">
          <div className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
          <span className="text-xs font-medium truncate">{firstCourse.startLocation}</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
          <div className="h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-indigo-500/20 shrink-0" />
          <span className="text-xs font-medium truncate">{firstCourse.endLocation}</span>
        </div>

        {/* Day status pills */}
        <div className="mb-2.5">
          <StatusDayPills dayStatuses={dayStatuses} />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {firstCourse.startTime}–{firstCourse.endTime}
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3" />
            {prestation.requiredVehicleType}
            {prestation.requiredVehicleEnergy && ` / ${prestation.requiredVehicleEnergy}`}
          </div>
          {prestation.requiredDriverSkills.length > 0 && (
            <>
              <span>·</span>
              {prestation.requiredDriverSkills.map(skill => (
                <Badge key={skill} variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">{skill}</Badge>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t gap-2">
          <ReasonBadge reason={firstCourse.nonPlacementReason} />
          <Badge variant={unassignedCount > 0 ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 h-4 font-bold">
            {unassignedCount}/{prestation.courses.length} à placer
          </Badge>
        </div>

        {/* Hover CTA */}
        <div className="mt-2 pt-2 border-t border-dashed border-muted opacity-0 group-hover:opacity-100 transition-all duration-200 -mb-0.5">
          <Button
            size="sm"
            className="w-full h-7 text-xs"
            variant="default"
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            Voir détails & Affecter
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function APlacerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all");
  const [driverSkillFilter, setDriverSkillFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPrestation, setSelectedPrestation] = useState<Prestation | null>(null);
  const [prestations, setPrestations] = useState<Prestation[]>(unassignedPrestations);
  const [showFilters, setShowFilters] = useState(false);
  // List view (table) is the default; grid view is secondary
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedPrestationIds, setSelectedPrestationIds] = useState<Set<string>>(new Set());
  const [expandedPrestationIds, setExpandedPrestationIds] = useState<Set<string>>(new Set());
  const [tourneeDialogOpen, setTourneeDialogOpen] = useState(false);
  const [tourneeDialogTab, setTourneeDialogTab] = useState<"existing" | "new">("existing");
  const [selectedTourneeId, setSelectedTourneeId] = useState<string>("");
  const [newTourneeName, setNewTourneeName] = useState("");
  const [newTourneeVehicleType, setNewTourneeVehicleType] = useState("");
  const [newTourneeZone, setNewTourneeZone] = useState("");
  const [tourneeSearchQuery, setTourneeSearchQuery] = useState("");
  const { toast } = useToast();

  const availableTournees = useMemo(() => {
    let list = [...planningTournees];
    if (tourneeSearchQuery) {
      const q = tourneeSearchQuery.toLowerCase();
      list = list.filter(t =>
        t.tourneeCode.toLowerCase().includes(q) ||
        t.driverName?.toLowerCase().includes(q) ||
        t.vehicleImmat?.toLowerCase().includes(q) ||
        t.vehicleType?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tourneeSearchQuery]);

  const toggleSelectPrestation = useCallback((id: string) => {
    setSelectedPrestationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleExpandPrestation = useCallback((id: string) => {
    setExpandedPrestationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedPrestationIds(new Set(filteredPrestations.map(p => p.id)));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedPrestationIds(new Set());
  }, []);

  const selectAll = () => {
    if (selectedPrestationIds.size === filteredPrestations.length) {
      setSelectedPrestationIds(new Set());
    } else {
      setSelectedPrestationIds(new Set(filteredPrestations.map(p => p.id)));
    }
  };

  const handleAssembleTournee = () => setTourneeDialogOpen(true);

  const handleConfirmTourneeAssignment = () => {
    const count = selectedPrestationIds.size;
    if (tourneeDialogTab === "existing" && selectedTourneeId) {
      const tournee = planningTournees.find(t => t.id === selectedTourneeId);
      toast({ title: "Attribué à une tournée", description: `${count} prestation(s) attribuée(s) à ${tournee?.tourneeCode || selectedTourneeId}.` });
    } else if (tourneeDialogTab === "new" && newTourneeName) {
      toast({ title: "Nouvelle tournée créée", description: `${count} prestation(s) assemblée(s) dans "${newTourneeName}".` });
    } else {
      toast({ variant: "destructive", title: "Sélection incomplète", description: "Veuillez sélectionner ou créer une tournée." });
      return;
    }
    setSelectedPrestationIds(new Set());
    setTourneeDialogOpen(false);
    setSelectedTourneeId("");
    setNewTourneeName("");
    setNewTourneeVehicleType("");
    setNewTourneeZone("");
    setTourneeSearchQuery("");
  };

  const handleMassAssign = () => {
    const allCourseIds = prestations
      .filter(p => selectedPrestationIds.has(p.id))
      .flatMap(p => p.courses.filter(c => c.assignmentStatus === 'non_affectee').map(c => c.id));
    if (allCourseIds.length === 0) return;
    setPrestations(prev => prev.map(prestation => {
      if (!selectedPrestationIds.has(prestation.id)) return prestation;
      const updatedCourses = prestation.courses.map(course => {
        if (course.assignmentStatus === 'non_affectee') {
          return { ...course, assignmentStatus: 'partiellement_affectee' as const };
        }
        return course;
      });
      return { ...prestation, courses: updatedCourses };
    }));
    toast({ title: "Affectation en masse", description: `${allCourseIds.length} course(s) marquée(s) pour affectation.` });
    setSelectedPrestationIds(new Set());
  };

  const handleOpenTournee = (tourneeId: string) => {
    toast({ title: "Navigation vers tournée", description: `Ouverture de la tournée ${tourneeId} dans le planning.` });
  };

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(prestations.map(p => p.client))).sort();
  }, [prestations]);

  const stats = useMemo(() => getStatsByWeek(prestations), [prestations]);

  const filteredPrestations = useMemo(() => {
    return prestations.filter(prestation => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          prestation.client.toLowerCase().includes(q) ||
          prestation.id.toLowerCase().includes(q) ||
          prestation.codeArticle?.toLowerCase().includes(q) ||
          prestation.courses.some(c =>
            c.id.toLowerCase().includes(q) ||
            c.startLocation.toLowerCase().includes(q) ||
            c.endLocation.toLowerCase().includes(q) ||
            c.tourneeNumber?.toLowerCase().includes(q)
          );
        if (!match) return false;
      }
      if (clientFilter !== "all" && prestation.client !== clientFilter) return false;
      if (typeFilter !== "all" && prestation.type !== typeFilter) return false;
      if (reasonFilter !== "all" && prestation.courses[0]?.nonPlacementReason !== reasonFilter) return false;
      if (weekFilter !== "all" && prestation.week !== weekFilter) return false;
      if (vehicleTypeFilter !== "all" && prestation.requiredVehicleType !== vehicleTypeFilter) return false;
      if (driverSkillFilter !== "all" && !prestation.requiredDriverSkills.includes(driverSkillFilter as any)) return false;
      if (statusFilter !== "all") {
        const hasNonAffectee = prestation.courses.some(c => c.assignmentStatus === 'non_affectee');
        const hasAffectee = prestation.courses.some(c => c.assignmentStatus === 'affectee');
        const hasPartielle = prestation.courses.some(c => c.assignmentStatus === 'partiellement_affectee');
        if (statusFilter === "non_affectee" && !hasNonAffectee) return false;
        if (statusFilter === "partiellement_affectee" && !hasPartielle && !(hasNonAffectee && hasAffectee)) return false;
        if (statusFilter === "affectee" && hasNonAffectee) return false;
      }
      return true;
    });
  }, [prestations, searchQuery, clientFilter, typeFilter, reasonFilter, weekFilter, vehicleTypeFilter, driverSkillFilter, statusFilter]);

  const handleAssign = (courseIds: string[], driverId: string, vehicleId: string) => {
    setPrestations(prev => prev.map(prestation => {
      const updatedCourses = prestation.courses.map(course => {
        if (courseIds.includes(course.id)) {
          return { ...course, assignmentStatus: 'affectee' as const, assignedDriverId: driverId, assignedVehicleId: vehicleId };
        }
        return course;
      });
      return { ...prestation, courses: updatedCourses };
    }));
    toast({ title: "Assignation réussie", description: `${courseIds.length} course(s) assignée(s) avec succès.` });
  };

  const activeFilterCount = [clientFilter, typeFilter, reasonFilter, weekFilter, vehicleTypeFilter, driverSkillFilter, statusFilter].filter(f => f !== "all").length;
  const totalUnassigned = filteredPrestations.reduce((sum, p) => sum + p.courses.filter(c => c.assignmentStatus === 'non_affectee').length, 0);
  const totalCourses = filteredPrestations.reduce((sum, p) => sum + p.courses.length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold font-headline tracking-tight">Écran à Placer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredPrestations.length} prestations · {totalCourses} courses · <span className="text-rose-600 font-semibold">{totalUnassigned} non affectées</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={selectAll}>
            <CheckSquare className="h-3.5 w-3.5" />
            {selectedPrestationIds.size === filteredPrestations.length && filteredPrestations.length > 0 ? "Tout désélectionner" : "Tout sélectionner"}
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedPrestationIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-in slide-in-from-top-2 duration-200">
          <Badge variant="default" className="text-sm px-3 py-1">{selectedPrestationIds.size} sélectionnée(s)</Badge>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleAssembleTournee}>
            <Layers className="h-3.5 w-3.5" /> Assembler en tournée
          </Button>
          <Button size="sm" variant="default" className="h-8 text-xs gap-1.5" onClick={handleMassAssign}>
            <User className="h-3.5 w-3.5" /> Affecter en masse
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setSelectedPrestationIds(new Set())}>Annuler</Button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Semaine +1" count={stats['S+1'].count} courses={stats['S+1'].courses} color="bg-rose-400" active={weekFilter === 'S+1'} onClick={() => setWeekFilter(weekFilter === 'S+1' ? 'all' : 'S+1')} />
        <StatCard label="Semaine +2" count={stats['S+2'].count} courses={stats['S+2'].courses} color="bg-amber-400" active={weekFilter === 'S+2'} onClick={() => setWeekFilter(weekFilter === 'S+2' ? 'all' : 'S+2')} />
        <StatCard label="Semaine +3" count={stats['S+3'].count} courses={stats['S+3'].courses} color="bg-sky-400" active={weekFilter === 'S+3'} onClick={() => setWeekFilter(weekFilter === 'S+3' ? 'all' : 'S+3')} />
        <StatCard label="Semaine +4 et plus" count={stats['S+4+'].count} courses={stats['S+4+'].courses} color="bg-slate-300" active={weekFilter === 'S+4+'} onClick={() => setWeekFilter(weekFilter === 'S+4+' ? 'all' : 'S+4+')} />
      </div>

      {/* Search & Filters Bar */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client, prestation, course, tournée, trajet..."
              className="pl-9 h-9 bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="h-9 gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filtres
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary-foreground text-primary text-[10px] font-bold">{activeFilterCount}</span>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost" size="sm"
              onClick={() => { setClientFilter("all"); setTypeFilter("all"); setReasonFilter("all"); setWeekFilter("all"); setVehicleTypeFilter("all"); setDriverSkillFilter("all"); setStatusFilter("all"); }}
              className="h-9 text-xs text-muted-foreground"
            >
              Réinitialiser
            </Button>
          )}

          {/* View mode toggle */}
          <div className="ml-auto flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" className={cn("h-7 w-7 p-0", viewMode !== 'table' && "hover:bg-background")} onClick={() => setViewMode('table')}>
              <LayoutList className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className={cn("h-7 w-7 p-0", viewMode !== 'grid' && "hover:bg-background")} onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex items-center gap-3 flex-wrap p-3 rounded-lg bg-card border animate-in slide-in-from-top-2 duration-200">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {uniqueClients.map(client => (<SelectItem key={client} value={client}>{client}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="régulière">Régulière</SelectItem>
                <SelectItem value="sup">SUP</SelectItem>
                <SelectItem value="spot">Spot</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Raison" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes raisons</SelectItem>
                {Object.entries(reasonConfig).map(([key, cfg]) => (<SelectItem key={key} value={key}>{cfg.label}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="non_affectee">Non affectée</SelectItem>
                <SelectItem value="partiellement_affectee">Partiellement</SelectItem>
                <SelectItem value="affectee">Affectée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Véhicule" /></SelectTrigger>
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
            <Select value={driverSkillFilter} onValueChange={setDriverSkillFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Compétence" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes compétences</SelectItem>
                <SelectItem value="ADR">ADR</SelectItem>
                <SelectItem value="Aéroportuaire">Aéroportuaire</SelectItem>
                <SelectItem value="Habilitation sûreté">Habilitation sûreté</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Active filter pills */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {weekFilter !== "all" && <ActiveFilter label={weekFilter} onRemove={() => setWeekFilter("all")} />}
            {clientFilter !== "all" && <ActiveFilter label={clientFilter} onRemove={() => setClientFilter("all")} />}
            {typeFilter !== "all" && <ActiveFilter label={typeFilter} onRemove={() => setTypeFilter("all")} />}
            {reasonFilter !== "all" && <ActiveFilter label={reasonConfig[reasonFilter as NonPlacementReason]?.shortLabel || reasonFilter} onRemove={() => setReasonFilter("all")} />}
            {statusFilter !== "all" && <ActiveFilter label={statusFilter === 'non_affectee' ? 'Non affectée' : statusFilter === 'partiellement_affectee' ? 'Partielle' : 'Affectée'} onRemove={() => setStatusFilter("all")} />}
            {vehicleTypeFilter !== "all" && <ActiveFilter label={vehicleTypeFilter} onRemove={() => setVehicleTypeFilter("all")} />}
            {driverSkillFilter !== "all" && <ActiveFilter label={driverSkillFilter} onRemove={() => setDriverSkillFilter("all")} />}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {filteredPrestations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Aucune prestation trouvée</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Aucune prestation ne correspond aux filtres sélectionnés.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* ── TABLE VIEW (Expandable Groups) ── */
          <ScrollArea className="h-full">
            {/* Table controls */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {filteredPrestations.length} prestations groupées
                </span>
                {/* Legend */}
                <div className="flex items-center gap-3 ml-3">
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <span className="inline-block w-3 h-3 rounded bg-emerald-500" /> Affectée
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <span className="inline-block w-3 h-3 rounded bg-amber-400" /> Partielle
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <span className="inline-block w-3 h-3 rounded bg-rose-500" /> Non placée
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={expandAll}>
                  <ChevronsUpDown className="h-3 w-3" /> Tout déplier
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={collapseAll}>
                  <ChevronsUpDown className="h-3 w-3 rotate-90" /> Tout replier
                </Button>
              </div>
            </div>

            {/* Table header */}
            <div className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground border rounded-t-lg bg-muted/50 mb-0">
              <div className="w-[20px]" /> {/* checkbox */}
              <div className="w-[22px]" /> {/* expand */}
              <div className="w-[12px]" /> {/* urgency dot */}
              <div className="w-[110px]">Réf. Prestation</div>
              <div className="w-[70px]">Tournée</div>
              <div className="w-[120px]">Client</div>
              <div className="flex-1">Trajet</div>
              <div className="w-[170px]">Jours (statut)</div>
              <div className="w-[80px]">Horaires</div>
              <div className="w-[60px]">Type</div>
              <div className="w-[130px]">Raison</div>
              <div className="w-[30px]">🔒</div>
              <div className="w-[80px]">Véhicule</div>
              <div className="w-[50px]">Manque</div>
              <div className="w-[100px] text-right">Actions</div>
            </div>

            {/* Prestation group rows */}
            <div className="space-y-1.5 pb-4 mt-1.5">
              {filteredPrestations.map(prestation => (
                <PrestationGroupRow
                  key={prestation.id}
                  prestation={prestation}
                  isExpanded={expandedPrestationIds.has(prestation.id)}
                  onToggleExpand={() => toggleExpandPrestation(prestation.id)}
                  isSelected={selectedPrestationIds.has(prestation.id)}
                  onToggleSelect={toggleSelectPrestation}
                  onOpenDrawer={() => setSelectedPrestation(prestation)}
                  onOpenTournee={handleOpenTournee}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          /* ── GRID VIEW ── */
          <ScrollArea className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
              {filteredPrestations.map(prestation => (
                <PrestationCard
                  key={prestation.id}
                  prestation={prestation}
                  onSelect={() => setSelectedPrestation(prestation)}
                  isSelected={selectedPrestationIds.has(prestation.id)}
                  onToggleSelect={toggleSelectPrestation}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Prestation Drawer */}
      <PrestationDrawer
        prestation={selectedPrestation}
        open={!!selectedPrestation}
        onOpenChange={(open) => !open && setSelectedPrestation(null)}
        onAssign={handleAssign}
      />

      {/* ─── Assign to Tournée Dialog ───────────────────────────────────── */}
      <Dialog open={tourneeDialogOpen} onOpenChange={(open) => { if (!open) { setTourneeDialogOpen(false); setSelectedTourneeId(""); setNewTourneeName(""); setTourneeSearchQuery(""); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-sky-500" />
              Attribuer à une tournée
            </DialogTitle>
            <DialogDescription>
              {selectedPrestationIds.size} prestation(s) sélectionnée(s) — Choisissez une tournée existante ou créez-en une nouvelle.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tourneeDialogTab} onValueChange={(v) => setTourneeDialogTab(v as "existing" | "new")} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Tournée existante</TabsTrigger>
              <TabsTrigger value="new">Nouvelle tournée</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="flex-1 overflow-hidden flex flex-col mt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher tournée, véhicule, conducteur..." className="pl-8 h-9" value={tourneeSearchQuery} onChange={(e) => setTourneeSearchQuery(e.target.value)} />
              </div>
              <ScrollArea className="flex-1 max-h-[300px]">
                <RadioGroup value={selectedTourneeId} onValueChange={setSelectedTourneeId}>
                  <div className="space-y-2 pr-2">
                    {availableTournees.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                        Aucune tournée trouvée
                      </div>
                    ) : (
                      availableTournees.map(t => (
                        <label
                          key={t.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                            selectedTourneeId === t.id && "ring-2 ring-primary bg-primary/5"
                          )}
                        >
                          <RadioGroupItem value={t.id} className="shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-mono h-5">{t.tourneeCode}</Badge>
                              {t.vehicleType && <Badge variant="secondary" className="text-[9px] h-4">{t.vehicleType}</Badge>}
                              {t.isDualDriver && <Badge variant="outline" className="text-[9px] h-4 border-indigo-300 text-indigo-700 bg-indigo-50">2×</Badge>}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                              {t.vehicleImmat ? (
                                <span className="flex items-center gap-0.5"><Truck className="h-3 w-3" />{t.vehicleImmat}</span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-amber-600"><Truck className="h-3 w-3" />Pas de véhicule</span>
                              )}
                              {t.driverName ? (
                                <span className="flex items-center gap-0.5"><User className="h-3 w-3" />{t.driverName}</span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-amber-600"><User className="h-3 w-3" />Pas de conducteur</span>
                              )}
                              <span>{t.courses.length} course(s)</span>
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </RadioGroup>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="new" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Nom de la tournée *</Label>
                <Input placeholder="ex: Caisse mobile 50, SPL 23 Paris-Sud..." value={newTourneeName} onChange={(e) => setNewTourneeName(e.target.value)} className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Type véhicule</Label>
                  <Select value={newTourneeVehicleType} onValueChange={setNewTourneeVehicleType}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semi-remorque">Semi-remorque</SelectItem>
                      <SelectItem value="Caisse mobile">Caisse mobile</SelectItem>
                      <SelectItem value="Frigo">Frigo</SelectItem>
                      <SelectItem value="ADR">ADR</SelectItem>
                      <SelectItem value="SPL">SPL</SelectItem>
                      <SelectItem value="VL">VL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Zone / Site</Label>
                  <Select value={newTourneeZone} onValueChange={setNewTourneeZone}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paris-Nord">Paris-Nord</SelectItem>
                      <SelectItem value="Paris-Sud">Paris-Sud</SelectItem>
                      <SelectItem value="Lyon">Lyon</SelectItem>
                      <SelectItem value="Marseille">Marseille</SelectItem>
                      <SelectItem value="Nantes">Nantes</SelectItem>
                      <SelectItem value="Lille">Lille</SelectItem>
                      <SelectItem value="Bordeaux">Bordeaux</SelectItem>
                      <SelectItem value="Strasbourg">Strasbourg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  La tournée sera créée sans conducteur ni véhicule assigné. Vous pourrez les affecter ultérieurement.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setTourneeDialogOpen(false)}>Annuler</Button>
            <Button
              onClick={handleConfirmTourneeAssignment}
              disabled={(tourneeDialogTab === "existing" && !selectedTourneeId) || (tourneeDialogTab === "new" && !newTourneeName)}
              className="gap-1.5"
            >
              {tourneeDialogTab === "new" && <Plus className="h-3.5 w-3.5" />}
              {tourneeDialogTab === "existing" ? "Attribuer" : "Créer & Attribuer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
