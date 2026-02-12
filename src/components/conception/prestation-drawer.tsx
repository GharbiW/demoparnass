"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Prestation, Course, NonPlacementReason } from "@/lib/types";
import {
  ArrowRight,
  Calendar,
  Clock,
  Truck,
  User,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Shield,
  Package,
  ChevronRight,
  Check,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AssignCourseDialog } from "./assign-course-dialog";
import { cn } from "@/lib/utils";

interface PrestationDrawerProps {
  prestation: Prestation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (courseIds: string[], driverId: string, vehicleId: string) => void;
}

const reasonLabels: Record<string, string> = {
  'nouvelle_prestation_reguliere': 'Nouvelle prestation régulière',
  'premiere_presta_nouveau_client': 'Première presta nouveau client',
  'sup_client_existant': 'SUP client existant',
  'conducteur_absent': 'Conducteur prévu absent',
  'materiel_indisponible': 'Matériel prévu indisponible',
  'prestation_modifiee': 'Prestation modifiée',
  'tournee_cassee': 'Tournée cassée',
  'tournee_modifiee': 'Tournée modifiée',
  'rides_combines_sans_affectation': 'Rides combinés sans affectation',
};

function TrajetTimeline({ course }: { course: Course }) {
  const locations = [
    course.startLocation,
    ...(course.intermediateLocations || []),
    course.endLocation,
  ];

  return (
    <div className="flex items-start gap-2">
      <div className="flex flex-col items-center">
        {locations.map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={cn(
              "h-3 w-3 rounded-full border-2 flex-shrink-0",
              index === 0
                ? "bg-emerald-500 border-emerald-300"
                : index === locations.length - 1
                ? "bg-primary border-primary/60"
                : "bg-amber-500 border-amber-300"
            )} />
            {index < locations.length - 1 && (
              <div className="w-0.5 h-5 bg-gradient-to-b from-muted-foreground/30 to-muted-foreground/10" />
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 -mt-0.5">
        {locations.map((location, index) => (
          <div key={index} className="text-sm">
            <span className="font-medium">{location}</span>
            {index === 0 && (
              <span className="text-[10px] text-muted-foreground ml-1.5 uppercase tracking-wider">Départ</span>
            )}
            {index === locations.length - 1 && (
              <span className="text-[10px] text-muted-foreground ml-1.5 uppercase tracking-wider">Arrivée</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseItem({
  course,
  index,
  isSelected,
  isAssigned,
  onToggle,
  onAssign,
}: {
  course: Course;
  index: number;
  isSelected: boolean;
  isAssigned: boolean;
  onToggle: () => void;
  onAssign: () => void;
}) {
  const locations = [
    course.startLocation,
    ...(course.intermediateLocations || []),
    course.endLocation,
  ];
  const isMultiStop = locations.length > 2;

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-all duration-200",
        isAssigned
          ? "bg-emerald-50/50 border-emerald-200 opacity-70"
          : isSelected
          ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
          : "bg-card border-border hover:border-muted-foreground/30 hover:shadow-sm"
      )}
    >
      {/* Selection indicator */}
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          disabled={isAssigned}
          className={cn(
            "mt-0.5 flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors",
            isAssigned
              ? "bg-emerald-500 border-emerald-500"
              : isSelected
              ? "bg-primary border-primary"
              : "border-muted-foreground/30 hover:border-primary/60"
          )}
        >
          {(isSelected || isAssigned) && <Check className="h-3 w-3 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Course header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{course.id}</span>
              {course.isSensitive && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                  <Shield className="h-2.5 w-2.5 mr-0.5" /> Sensible
                </Badge>
              )}
              {isAssigned && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Affectée
                </Badge>
              )}
            </div>
            {!isAssigned && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={(e) => { e.stopPropagation(); onAssign(); }}
              >
                Affecter
              </Button>
            )}
          </div>

          {/* Trajet */}
          <div className="mb-3">
            <TrajetTimeline course={course} />
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(course.date), "EEE d MMMM", { locale: fr })}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
              <Clock className="h-3 w-3" />
              {course.startTime} — {course.endTime}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
              <Truck className="h-3 w-3" />
              {course.requiredVehicleType}
            </div>
            {course.requiredDriverSkills.length > 0 && course.requiredDriverSkills.map(skill => (
              <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                {skill}
              </Badge>
            ))}
            {isMultiStop && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                <MapPin className="h-2.5 w-2.5 mr-0.5" />
                {locations.length} stops
              </Badge>
            )}
          </div>

          {/* Missing resources */}
          {course.missingResource && !isAssigned && (
            <div className="flex items-center gap-2 mt-2">
              {(course.missingResource === 'vehicle' || course.missingResource === 'both') && (
                <div className="flex items-center gap-1 text-[11px] text-red-600 bg-red-50 rounded-full px-2 py-0.5 border border-red-200">
                  <Truck className="h-3 w-3" /> Véhicule manquant
                </div>
              )}
              {(course.missingResource === 'driver' || course.missingResource === 'both') && (
                <div className="flex items-center gap-1 text-[11px] text-red-600 bg-red-50 rounded-full px-2 py-0.5 border border-red-200">
                  <User className="h-3 w-3" /> Conducteur manquant
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PrestationDrawer({ prestation, open, onOpenChange, onAssign }: PrestationDrawerProps) {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningCourse, setAssigningCourse] = useState<Course | null>(null);

  if (!prestation) return null;

  const unassignedCourses = prestation.courses.filter(c => c.assignmentStatus === 'non_affectee');
  const assignedCourses = prestation.courses.filter(c => c.assignmentStatus === 'affectee');

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedCourses.size === unassignedCourses.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(unassignedCourses.map(c => c.id)));
    }
  };

  const handleAssignSingle = (course: Course) => {
    setAssigningCourse(course);
    setAssignDialogOpen(true);
  };

  const handleAssignBulk = () => {
    if (selectedCourses.size === 0) return;
    const courseIds = Array.from(selectedCourses);
    const firstCourse = prestation.courses.find(c => courseIds.includes(c.id));
    if (firstCourse) {
      setAssigningCourse(firstCourse);
      setAssignDialogOpen(true);
    }
  };

  const handleAssignComplete = (courseId: string, driverId: string, vehicleId: string) => {
    if (selectedCourses.size > 1) {
      onAssign(Array.from(selectedCourses), driverId, vehicleId);
      setSelectedCourses(new Set());
    } else {
      onAssign([courseId], driverId, vehicleId);
    }
    setAssignDialogOpen(false);
    setAssigningCourse(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
          {/* Drawer header */}
          <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-b from-muted/30 to-transparent">
            <SheetHeader className="text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{prestation.id}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  {prestation.type === 'sup' ? 'SUP' : prestation.type === 'spot' ? 'Spot' : 'Régulière'}
                </Badge>
                {prestation.hasSensitiveCourses && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                    <Shield className="h-2.5 w-2.5 mr-0.5" /> Sensible
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {prestation.week}
                </Badge>
              </div>
              <SheetTitle className="text-xl">{prestation.client}</SheetTitle>
              <SheetDescription>
                {prestation.courses.length} course(s) · {unassignedCourses.length} à placer
              </SheetDescription>
            </SheetHeader>

            {/* Summary info */}
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-card rounded-full px-2.5 py-1 border">
                <Truck className="h-3 w-3" />
                {prestation.requiredVehicleType}
                {prestation.requiredVehicleEnergy && ` · ${prestation.requiredVehicleEnergy}`}
              </div>
              {prestation.requiredDriverType && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-card rounded-full px-2.5 py-1 border">
                  <User className="h-3 w-3" />
                  {prestation.requiredDriverType}
                </div>
              )}
              {prestation.requiredDriverSkills.map(skill => (
                <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                  {skill}
                </Badge>
              ))}
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-card rounded-full px-2.5 py-1 border">
                <AlertCircle className="h-3 w-3" />
                {reasonLabels[prestation.courses[0]?.nonPlacementReason] || 'Non spécifié'}
              </div>
            </div>
          </div>

          {/* Selection bar */}
          {unassignedCourses.length > 0 && (
            <div className="px-6 py-3 border-b bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className={cn(
                    "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors",
                    selectedCourses.size === unassignedCourses.length
                      ? "bg-primary border-primary"
                      : selectedCourses.size > 0
                      ? "bg-primary/50 border-primary/50"
                      : "border-muted-foreground/30 hover:border-primary/60"
                  )}
                >
                  {selectedCourses.size === unassignedCourses.length && <Check className="h-3 w-3 text-white" />}
                  {selectedCourses.size > 0 && selectedCourses.size < unassignedCourses.length && <Minus className="h-3 w-3 text-white" />}
                </button>
                <span className="text-sm text-muted-foreground">
                  {selectedCourses.size > 0
                    ? `${selectedCourses.size} sélectionnée(s)`
                    : 'Tout sélectionner'}
                </span>
              </div>
              {selectedCourses.size > 0 && (
                <Button size="sm" onClick={handleAssignBulk} className="h-7 text-xs gap-1.5">
                  Affecter la sélection ({selectedCourses.size})
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* Courses list */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-3">
              {prestation.courses.map((course, index) => {
                const isAssigned = course.assignmentStatus === 'affectee';
                return (
                  <CourseItem
                    key={course.id}
                    course={course}
                    index={index}
                    isSelected={selectedCourses.has(course.id)}
                    isAssigned={isAssigned}
                    onToggle={() => handleCourseSelect(course.id)}
                    onAssign={() => handleAssignSingle(course)}
                  />
                );
              })}
            </div>
          </ScrollArea>

          {/* Bottom bar */}
          <div className="px-6 py-4 border-t bg-card">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {assignedCourses.length > 0 && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {assignedCourses.length} déjà affectée(s)
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {assigningCourse && (
        <AssignCourseDialog
          course={assigningCourse}
          open={assignDialogOpen}
          onOpenChange={(open) => {
            setAssignDialogOpen(open);
            if (!open) setAssigningCourse(null);
          }}
          onAssign={(courseId, driverId, vehicleId) => {
            handleAssignComplete(courseId, driverId, vehicleId);
          }}
        />
      )}
    </>
  );
}
