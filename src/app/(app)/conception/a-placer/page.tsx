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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Search,
  AlertCircle,
  Truck,
  User,
  Clock,
  MapPin,
  CalendarDays,
  Package,
  AlertTriangle,
  Shield,
  Zap,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  X,
  Filter,
  TrendingUp,
  ArrowRightLeft,
  MoreHorizontal,
  Calendar,
  Route,
  Fuel,
  BadgeCheck,
  CircleDot,
} from "lucide-react";
import { Prestation, Course, NonPlacementReason } from "@/lib/types";
import { unassignedPrestations, getStatsByWeek } from "@/lib/a-placer-data-v2";
import { PrestationDrawer } from "@/components/conception/prestation-drawer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Reason config (icon + short label + description) ───────────────────────
const reasonConfig: Record<NonPlacementReason, { label: string; shortLabel: string; icon: React.ReactNode; color: string }> = {
  'nouvelle_prestation_reguliere': {
    label: 'Nouvelle prestation régulière',
    shortLabel: 'Nouvelle presta',
    icon: <Package className="h-3.5 w-3.5" />,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  'premiere_presta_nouveau_client': {
    label: 'Première prestation — nouveau client',
    shortLabel: 'Nouveau client',
    icon: <Zap className="h-3.5 w-3.5" />,
    color: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  'sup_client_existant': {
    label: 'SUP demandée par un client existant',
    shortLabel: 'SUP client',
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    color: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  'conducteur_absent': {
    label: 'Le conducteur prévu est absent',
    shortLabel: 'Conducteur absent',
    icon: <User className="h-3.5 w-3.5" />,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'materiel_indisponible': {
    label: 'Le matériel prévu n\'est plus disponible',
    shortLabel: 'Matériel indispo.',
    icon: <Truck className="h-3.5 w-3.5" />,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'prestation_modifiee': {
    label: 'Prestation modifiée — sortie de tournée',
    shortLabel: 'Presta modifiée',
    icon: <ArrowRightLeft className="h-3.5 w-3.5" />,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  'tournee_cassee': {
    label: 'Tournée cassée ou modifiée',
    shortLabel: 'Tournée cassée',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: 'bg-rose-50 text-rose-600 border-rose-200',
  },
  'tournee_modifiee': {
    label: 'Tournée modifiée',
    shortLabel: 'Tournée modifiée',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  'rides_combines_sans_affectation': {
    label: 'Rides combinés sans affectation véhicule / conducteur',
    shortLabel: 'Combiné non affecté',
    icon: <LayoutGrid className="h-3.5 w-3.5" />,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
};

// ─── Subtle date urgency (softer palette) ────────────────────────────────────
function getDateUrgency(date: string) {
  const today = new Date();
  const courseDate = new Date(date);
  const daysDiff = Math.floor((courseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 1) return { color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Urgent', dot: 'bg-rose-500' };
  if (daysDiff <= 3) return { color: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Bientôt', dot: 'bg-amber-400' };
  if (daysDiff <= 7) return { color: 'bg-sky-400', text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', label: 'Cette semaine', dot: 'bg-sky-400' };
  return { color: 'bg-slate-300', text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Planifié', dot: 'bg-slate-300' };
}

// ─── Trajet pipeline ─────────────────────────────────────────────────────────
function TrajetPipeline({ course, compact = false }: { course: Course; compact?: boolean }) {
  const locations = [
    course.startLocation,
    ...(course.intermediateLocations || []),
    course.endLocation,
  ];

  if (compact && locations.length > 3) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          <span className="text-xs font-medium truncate max-w-[120px]">{locations[0]}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-px w-4 bg-border" />
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
            +{locations.length - 2} stops
          </Badge>
          <div className="h-px w-4 bg-border" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-500/20" />
          <span className="text-xs font-medium truncate max-w-[120px]">{locations[locations.length - 1]}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {locations.map((location, index) => (
        <div key={index} className="flex items-center gap-1">
          <div className={cn(
            "h-2 w-2 rounded-full ring-2 flex-shrink-0",
            index === 0 ? "bg-emerald-500 ring-emerald-500/20" :
            index === locations.length - 1 ? "bg-indigo-500 ring-indigo-500/20" :
            "bg-violet-400 ring-violet-400/20"
          )} />
          <span className="text-xs font-medium whitespace-nowrap">{location}</span>
          {index < locations.length - 1 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
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
function MissingResourceIndicator({ resource }: { resource?: 'vehicle' | 'driver' | 'both' }) {
  if (!resource) return null;
  return (
    <div className="flex items-center gap-1">
      {(resource === 'vehicle' || resource === 'both') && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-amber-50 border border-amber-200">
                <Truck className="h-2.5 w-2.5 text-amber-600" />
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Véhicule manquant</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {(resource === 'driver' || resource === 'both') && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center justify-center h-5 w-5 rounded-full bg-amber-50 border border-amber-200">
                <User className="h-2.5 w-2.5 text-amber-600" />
              </div>
            </TooltipTrigger>
            <TooltipContent><p>Conducteur manquant</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// ─── Reason badge (self-explanatory) ─────────────────────────────────────────
function ReasonBadge({ reason }: { reason: NonPlacementReason }) {
  const config = reasonConfig[reason];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-0.5 border cursor-default",
            config.color
          )}>
            {config.icon}
            <span>{config.shortLabel}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs max-w-[220px]">{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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

// ═══════════════════════════════════════════════════════════════════════════════
// CARD VIEW — PrestationCard
// ═══════════════════════════════════════════════════════════════════════════════
function PrestationCard({ 
  prestation, 
  onSelect 
}: { 
  prestation: Prestation; 
  onSelect: () => void;
}) {
  const firstCourse = prestation.courses[0];
  const dates = [...new Set(prestation.courses.map(c => c.date))].sort();
  const unassignedCount = prestation.courses.filter(c => c.assignmentStatus === 'non_affectee').length;
  const urgency = getDateUrgency(dates[0]);

  return (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        prestation.hasSensitiveCourses && "ring-1 ring-rose-200/60"
      )}
      onClick={onSelect}
    >
      {/* Top urgency bar — thinner, subtler */}
      <div className={cn("h-0.5 w-full", urgency.color)} />
      
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{prestation.id}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {prestation.type === 'sup' ? 'SUP' : prestation.type === 'spot' ? 'Spot' : 'Régulière'}
              </Badge>
              <WeekBadge week={prestation.week} />
              {prestation.hasSensitiveCourses && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-50">
                  <Shield className="h-2.5 w-2.5 mr-0.5" /> Sensible
                </Badge>
              )}
            </div>
            <div className="text-sm font-medium text-primary mt-0.5">{prestation.client}</div>
            {prestation.codeArticle && (
              <div className="text-[11px] text-muted-foreground mt-0.5">Art. {prestation.codeArticle}</div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <MissingResourceIndicator resource={firstCourse.missingResource} />
          </div>
        </div>

        {/* Courses section */}
        <div className="space-y-2">
          {prestation.courses.slice(0, 3).map((course, idx) => (
            <div key={course.id} className="rounded-lg bg-muted/30 p-2.5 border border-transparent hover:border-primary/20 transition-colors">
              {/* Trajet visualization */}
              <TrajetPipeline course={course} compact={prestation.courses.length > 1} />
              
              {/* Course meta */}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className={cn(
                  "flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border",
                  urgency.bg, urgency.border, urgency.text
                )}>
                  <CalendarDays className="h-3 w-3" />
                  {format(new Date(course.date), "EEE d MMM", { locale: fr })}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {course.startTime} — {course.endTime}
                </div>
                {course.isSensitive && idx > 0 && (
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                )}
              </div>
            </div>
          ))}
          {prestation.courses.length > 3 && (
            <div className="text-center py-1">
              <span className="text-xs text-muted-foreground">
                +{prestation.courses.length - 3} autre(s) course(s)
              </span>
            </div>
          )}
        </div>

        {/* Footer — reason + requirements + count */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t gap-2">
          <ReasonBadge reason={firstCourse.nonPlacementReason} />

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Vehicle requirement */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                    <Truck className="h-3 w-3" />
                    {prestation.requiredVehicleType}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1 text-xs">
                    <p><strong>Véhicule:</strong> {prestation.requiredVehicleType}</p>
                    {prestation.requiredVehicleEnergy && <p><strong>Énergie:</strong> {prestation.requiredVehicleEnergy}</p>}
                    {prestation.requiredDriverType && <p><strong>Conducteur:</strong> {prestation.requiredDriverType}</p>}
                    {prestation.requiredDriverSkills.length > 0 && (
                      <p><strong>Compétences:</strong> {prestation.requiredDriverSkills.join(', ')}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Driver skills */}
            {prestation.requiredDriverSkills.length > 0 && (
              prestation.requiredDriverSkills.map(skill => (
                <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                  {skill}
                </Badge>
              ))
            )}

            {/* Count badge */}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium">
              {unassignedCount} à placer
            </Badge>
          </div>
        </div>

        {/* Hover CTA — inline, not overlapping */}
        <div className="mt-3 pt-2 border-t border-dashed border-muted opacity-0 group-hover:opacity-100 transition-all duration-200 -mb-1">
          <Button 
            size="sm" 
            className="w-full h-8 text-xs"
            variant="default"
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            Voir détails & Affecter ({unassignedCount})
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE VIEW — Interactive rows (not a classic boring table!)
// ═══════════════════════════════════════════════════════════════════════════════
function PrestationRow({ 
  prestation, 
  onSelect 
}: { 
  prestation: Prestation; 
  onSelect: () => void;
}) {
  const firstCourse = prestation.courses[0];
  const dates = [...new Set(prestation.courses.map(c => c.date))].sort();
  const unassignedCount = prestation.courses.filter(c => c.assignmentStatus === 'non_affectee').length;
  const urgency = getDateUrgency(dates[0]);
  const locations = [firstCourse.startLocation, ...(firstCourse.intermediateLocations || []), firstCourse.endLocation];
  const rConfig = reasonConfig[firstCourse.nonPlacementReason];

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 px-4 py-3 rounded-lg border bg-card cursor-pointer transition-all duration-150 hover:shadow-md hover:bg-accent/5",
        prestation.hasSensitiveCourses && "ring-1 ring-rose-200/50"
      )}
      onClick={onSelect}
    >
      {/* Urgency dot */}
      <div className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", urgency.dot)} />

      {/* Ref + Client */}
      <div className="w-[180px] flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold">{prestation.id}</span>
          {prestation.hasSensitiveCourses && (
            <Shield className="h-3 w-3 text-rose-500" />
          )}
        </div>
        <div className="text-xs font-medium text-primary truncate">{prestation.client}</div>
        {prestation.codeArticle && (
          <div className="text-[10px] text-muted-foreground">Art. {prestation.codeArticle}</div>
        )}
      </div>

      {/* Trajet */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-emerald-500/20 flex-shrink-0" />
          <span className="text-xs font-medium truncate">{locations[0]}</span>
          {locations.length > 2 && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
              <span className="text-[10px] text-muted-foreground">+{locations.length - 2} étapes</span>
            </>
          )}
          <ChevronRight className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
          <div className="h-2 w-2 rounded-full bg-indigo-500 ring-1 ring-indigo-500/20 flex-shrink-0" />
          <span className="text-xs font-medium truncate">{locations[locations.length - 1]}</span>
        </div>
        {prestation.courses.length > 1 && (
          <div className="text-[10px] text-muted-foreground mt-0.5">{prestation.courses.length} courses</div>
        )}
      </div>

      {/* Date */}
      <div className="w-[100px] flex-shrink-0">
        <div className={cn(
          "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border",
          urgency.bg, urgency.border, urgency.text
        )}>
          <CalendarDays className="h-3 w-3" />
          {format(new Date(dates[0]), "EEE d", { locale: fr })}
        </div>
      </div>

      {/* Time */}
      <div className="w-[90px] flex-shrink-0 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {firstCourse.startTime} — {firstCourse.endTime}
        </div>
      </div>

      {/* Type + Week */}
      <div className="w-[80px] flex-shrink-0 flex flex-col items-start gap-1">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
          {prestation.type === 'sup' ? 'SUP' : prestation.type === 'spot' ? 'Spot' : 'Rég.'}
        </Badge>
        <WeekBadge week={prestation.week} />
      </div>

      {/* Reason */}
      <div className="w-[140px] flex-shrink-0">
        <div className={cn(
          "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 border",
          rConfig.color
        )}>
          {rConfig.icon}
          <span className="truncate">{rConfig.shortLabel}</span>
        </div>
      </div>

      {/* Requirements */}
      <div className="w-[110px] flex-shrink-0 flex flex-col gap-1">
        <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <Truck className="h-3 w-3" />
          <span className="truncate">{prestation.requiredVehicleType}</span>
        </div>
        {prestation.requiredDriverType && (
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{prestation.requiredDriverType}</span>
          </div>
        )}
      </div>

      {/* Missing + Count + CTA */}
      <div className="w-[140px] flex-shrink-0 flex items-center justify-end gap-2">
        <MissingResourceIndicator resource={firstCourse.missingResource} />
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-medium whitespace-nowrap group-hover:hidden">
          {unassignedCount} à placer
        </Badge>
        <Button size="sm" className="h-7 text-xs shadow-md hidden group-hover:inline-flex">
          Affecter
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
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
  const [selectedPrestation, setSelectedPrestation] = useState<Prestation | null>(null);
  const [prestations, setPrestations] = useState<Prestation[]>(unassignedPrestations);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { toast } = useToast();

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(prestations.map(p => p.client))).sort();
  }, [prestations]);

  const stats = useMemo(() => getStatsByWeek(prestations), [prestations]);

  const filteredPrestations = useMemo(() => {
    return prestations.filter(prestation => {
      if (searchQuery && !prestation.client.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !prestation.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !prestation.codeArticle?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !prestation.courses.some(c =>
            c.startLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.endLocation.toLowerCase().includes(searchQuery.toLowerCase())
          )) {
        return false;
      }
      if (clientFilter !== "all" && prestation.client !== clientFilter) return false;
      if (typeFilter !== "all" && prestation.type !== typeFilter) return false;
      if (reasonFilter !== "all" && prestation.courses[0]?.nonPlacementReason !== reasonFilter) return false;
      if (weekFilter !== "all" && prestation.week !== weekFilter) return false;
      if (vehicleTypeFilter !== "all" && prestation.requiredVehicleType !== vehicleTypeFilter) return false;
      if (driverSkillFilter !== "all" && !prestation.requiredDriverSkills.includes(driverSkillFilter as any)) return false;
      return true;
    });
  }, [prestations, searchQuery, clientFilter, typeFilter, reasonFilter, weekFilter, vehicleTypeFilter, driverSkillFilter]);

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

  const activeFilterCount = [clientFilter, typeFilter, reasonFilter, weekFilter, vehicleTypeFilter, driverSkillFilter].filter(f => f !== "all").length;
  const totalUnassigned = filteredPrestations.reduce((sum, p) => sum + p.courses.filter(c => c.assignmentStatus === 'non_affectee').length, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold font-headline tracking-tight">Prestations à Placer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredPrestations.length} prestations · {totalUnassigned} courses non affectées
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard
          label="Semaine +1"
          count={stats['S+1'].count}
          courses={stats['S+1'].courses}
          color="bg-rose-400"
          active={weekFilter === 'S+1'}
          onClick={() => setWeekFilter(weekFilter === 'S+1' ? 'all' : 'S+1')}
        />
        <StatCard
          label="Semaine +2"
          count={stats['S+2'].count}
          courses={stats['S+2'].courses}
          color="bg-amber-400"
          active={weekFilter === 'S+2'}
          onClick={() => setWeekFilter(weekFilter === 'S+2' ? 'all' : 'S+2')}
        />
        <StatCard
          label="Semaine +3"
          count={stats['S+3'].count}
          courses={stats['S+3'].courses}
          color="bg-sky-400"
          active={weekFilter === 'S+3'}
          onClick={() => setWeekFilter(weekFilter === 'S+3' ? 'all' : 'S+3')}
        />
        <StatCard
          label="Semaine +4 et plus"
          count={stats['S+4+'].count}
          courses={stats['S+4+'].courses}
          color="bg-slate-300"
          active={weekFilter === 'S+4+'}
          onClick={() => setWeekFilter(weekFilter === 'S+4+' ? 'all' : 'S+4+')}
        />
      </div>

      {/* Search & Filters Bar */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client, prestation, trajet..."
              className="pl-9 h-9 bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-9 gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary-foreground text-primary text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setClientFilter("all");
                setTypeFilter("all");
                setReasonFilter("all");
                setWeekFilter("all");
                setVehicleTypeFilter("all");
                setDriverSkillFilter("all");
              }}
              className="h-9 text-xs text-muted-foreground"
            >
              Réinitialiser
            </Button>
          )}

          {/* View mode toggle */}
          <div className="ml-auto flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className={cn("h-7 w-7 p-0", viewMode !== 'grid' && "hover:bg-background")}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className={cn("h-7 w-7 p-0", viewMode !== 'table' && "hover:bg-background")}
              onClick={() => setViewMode('table')}
            >
              <LayoutList className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex items-center gap-3 flex-wrap p-3 rounded-lg bg-card border animate-in slide-in-from-top-2 duration-200">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {uniqueClients.map(client => (
                  <SelectItem key={client} value={client}>{client}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="régulière">Régulière</SelectItem>
                <SelectItem value="sup">SUP</SelectItem>
                <SelectItem value="spot">Spot</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue placeholder="Raison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes raisons</SelectItem>
                {Object.entries(reasonConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
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
            <Select value={driverSkillFilter} onValueChange={setDriverSkillFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Compétence" />
              </SelectTrigger>
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
            {vehicleTypeFilter !== "all" && <ActiveFilter label={vehicleTypeFilter} onRemove={() => setVehicleTypeFilter("all")} />}
            {driverSkillFilter !== "all" && <ActiveFilter label={driverSkillFilter} onRemove={() => setDriverSkillFilter("all")} />}
          </div>
        )}
      </div>

      {/* Prestations list */}
      <div className="flex-1 min-h-0">
        {filteredPrestations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Aucune prestation trouvée</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Aucune prestation ne correspond aux filtres sélectionnés. Essayez d'ajuster vos critères de recherche.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW ── */
          <ScrollArea className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
              {filteredPrestations.map(prestation => (
                <PrestationCard
                  key={prestation.id}
                  prestation={prestation}
                  onSelect={() => setSelectedPrestation(prestation)}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          /* ── TABLE VIEW ── */
          <ScrollArea className="h-full">
            {/* Table header */}
            <div className="flex items-center gap-4 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b mb-2 sticky top-0 bg-background z-10">
              <div className="w-[12px]" /> {/* urgency dot */}
              <div className="w-[180px]">Référence / Client</div>
              <div className="flex-1">Trajet</div>
              <div className="w-[100px]">Date</div>
              <div className="w-[90px]">Horaires</div>
              <div className="w-[80px]">Type</div>
              <div className="w-[140px]">Raison</div>
              <div className="w-[110px]">Ressources</div>
              <div className="w-[100px] text-right">Statut</div>
            </div>
            <div className="space-y-2 pb-4">
              {filteredPrestations.map(prestation => (
                <PrestationRow
                  key={prestation.id}
                  prestation={prestation}
                  onSelect={() => setSelectedPrestation(prestation)}
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
    </div>
  );
}
