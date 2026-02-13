"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// ScrollArea removed — native overflow-y-auto used instead for reliable flex-based scrolling
import { Separator } from "@/components/ui/separator";
import { Course, Driver, Vehicle } from "@/lib/types";
import { useMockData } from "@/hooks/use-mock-data";
import {
  validateAssignment,
  normalizeTrajetId,
} from "@/lib/assignment-constraints";
import { Calendar as CalendarIcon, ArrowRight, Clock, MapPin, Shield, Building2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, XCircle, AlertTriangle, Sparkles, Loader2, Truck, User, ChevronRight, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { weeklyAssignments } from "@/lib/a-placer-data-v2";
import { getWeekKey } from "@/lib/assignment-constraints";
import { cn } from "@/lib/utils";

interface AssignCourseDialogProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (courseId: string, driverId: string, vehicleId: string) => void;
}

// Mock external providers
const externalProviders = [
  { id: "ext-001", name: "TransExpress Lyon", specialty: "Caisse mobile", zone: "Lyon / Rhône-Alpes", rating: 4.2 },
  { id: "ext-002", name: "Logistique du Sud", specialty: "SPL", zone: "Marseille / PACA", rating: 3.8 },
  { id: "ext-003", name: "NordTrans SARL", specialty: "Semi-remorque", zone: "Lille / Hauts-de-France", rating: 4.5 },
  { id: "ext-004", name: "Frigoroute", specialty: "Frigo", zone: "National", rating: 4.0 },
  { id: "ext-005", name: "ADR Solutions", specialty: "ADR", zone: "National", rating: 4.7 },
  { id: "ext-006", name: "Partenaires Express IDF", specialty: "Polyvalent", zone: "Paris / Île-de-France", rating: 3.9 },
];

export function AssignCourseDialog({ course, open, onOpenChange, onAssign }: AssignCourseDialogProps) {
  const { drivers, vehicles, trips } = useMockData();
  const { toast } = useToast();
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [allowOverride, setAllowOverride] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [useExternalProvider, setUseExternalProvider] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  useEffect(() => {
    if (course) {
      setSelectedDriverId('');
      setSelectedVehicleId('');
      setAiSuggestions([]);
      setAllowOverride(false);
      setUseExternalProvider(false);
      setSelectedProviderId('');
    }
  }, [course]);

  const compatibleDrivers = useMemo(() => {
    if (!course) return [];
    return drivers.filter(driver => driver.status === 'Actif');
  }, [drivers, course]);

  const compatibleVehicles = useMemo(() => {
    if (!course) return [];
    return vehicles.filter(vehicle =>
      vehicle.status === 'Disponible' || vehicle.status === 'En mission'
    );
  }, [vehicles, course]);

  const validation = useMemo(() => {
    if (!course || !selectedDriverId || !selectedVehicleId) return null;
    const driver = drivers.find(d => d.id === selectedDriverId);
    const vehicle = vehicles.find(v => v.vin === selectedVehicleId);
    if (!driver || !vehicle) return null;
    return validateAssignment(course, vehicle, driver, trips, weeklyAssignments);
  }, [course, selectedDriverId, selectedVehicleId, drivers, vehicles, trips]);

  const weeklyCount = useMemo(() => {
    if (!course || !selectedDriverId) return null;
    const trajetId = normalizeTrajetId(course);
    const weekKey = getWeekKey(course.date);
    const assignment = weeklyAssignments.find(
      wa => wa.chauffeurId === selectedDriverId &&
        wa.trajetId === trajetId &&
        wa.week === weekKey
    );
    return assignment?.count || 0;
  }, [course, selectedDriverId]);

  const generateSuggestions = async () => {
    if (!course) return;
    setLoadingSuggestions(true);
    setTimeout(() => {
      const suggestions = compatibleDrivers.slice(0, 3).map((driver, idx) => {
        const vehicle = compatibleVehicles[idx % compatibleVehicles.length];
        const tempValidation = validateAssignment(course!, vehicle, driver, trips, weeklyAssignments);
        return {
          driverId: driver.id,
          driverName: driver.name,
          driverType: driver.driverType,
          driverSite: driver.site,
          vehicleId: vehicle.vin,
          vehicleName: vehicle.immatriculation,
          vehicleSite: vehicle.site,
          score: tempValidation?.valid ? 95 - (idx * 12) : 45 - (idx * 10),
          reasoning: tempValidation?.valid
            ? `Compatible avec toutes les contraintes. ${driver.driverType} disponible sur ${driver.site}.`
            : `Quelques contraintes à vérifier: ${tempValidation?.errors?.slice(0, 1).join(', ') || 'incompatibilité détectée'}.`,
          validation: tempValidation
        };
      });
      setAiSuggestions(suggestions.sort((a, b) => b.score - a.score));
      setLoadingSuggestions(false);
    }, 1000);
  };

  useEffect(() => {
    if (open && course && compatibleDrivers.length > 0) {
      generateSuggestions();
    }
  }, [open, course]);

  const handleSuggestionSelect = (suggestion: any) => {
    setSelectedDriverId(suggestion.driverId);
    setSelectedVehicleId(suggestion.vehicleId);
  };

  const handleSubmit = async () => {
    if (!course) return;

    if (useExternalProvider) {
      if (!selectedProviderId) {
        toast({ variant: "destructive", title: "Sélection incomplète", description: "Veuillez sélectionner un prestataire externe." });
        return;
      }
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      const provider = externalProviders.find(p => p.id === selectedProviderId);
      onAssign(course.id, `ext:${selectedProviderId}`, "external");
      toast({ title: "Sous-traitance confirmée", description: `Course confiée à ${provider?.name || "prestataire externe"}.` });
      setIsSubmitting(false);
      onOpenChange(false);
      return;
    }

    if (!selectedDriverId || !selectedVehicleId) {
      toast({ variant: "destructive", title: "Sélection incomplète", description: "Veuillez sélectionner un chauffeur et un véhicule." });
      return;
    }
    if (validation && !validation.valid && validation.errors.length > 0 && !allowOverride) {
      toast({ variant: "destructive", title: "Contraintes bloquantes", description: "Cochez 'Forcer l'assignation' pour continuer." });
      return;
    }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onAssign(course.id, selectedDriverId, selectedVehicleId);
    toast({ title: "Assignation réussie", description: `La course a été assignée avec succès.` });
    setIsSubmitting(false);
    onOpenChange(false);
  };

  if (!course) return null;

  const locations = [course.startLocation, ...(course.intermediateLocations || []), course.endLocation];
  const selectedDriver = drivers.find(d => d.id === selectedDriverId);
  const selectedVehicle = vehicles.find(v => v.vin === selectedVehicleId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!grid-cols-1 max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] sm:max-h-[85vh] p-0 !overflow-hidden flex flex-col">
        {/* Header — compact */}
        <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b bg-gradient-to-b from-muted/30 to-transparent flex-shrink-0">
          <DialogHeader className="space-y-0.5 sm:space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">{course.id}</span>
                {course.isSensitive && (
                  <Badge className="text-[9px] sm:text-[10px] px-1.5 py-0 h-4 bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                    <Shield className="h-2.5 w-2.5 mr-0.5" /> Sensible
                  </Badge>
                )}
              </div>
            </div>
            <DialogTitle className="text-sm sm:text-base leading-tight">Affecter la course</DialogTitle>
            <DialogDescription className="text-[10px] sm:text-xs !mt-0">
              {course.client} · {format(new Date(course.date), "EEEE d MMMM yyyy", { locale: fr })}
            </DialogDescription>
          </DialogHeader>

          {/* Trajet + Requirements — single compact block */}
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
              {locations.map((location, index) => (
                <div key={index} className="flex items-center gap-0.5 sm:gap-1">
                  <div className={cn(
                    "h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full flex-shrink-0",
                    index === 0 ? "bg-emerald-500" :
                      index === locations.length - 1 ? "bg-primary" :
                        "bg-amber-500"
                  )} />
                  <span className="text-[9px] sm:text-[10px] font-medium truncate max-w-[70px] sm:max-w-[120px]">{location}</span>
                  {index < locations.length - 1 && (
                    <ChevronRight className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-muted-foreground/40 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-[9px] sm:text-[10px] text-muted-foreground bg-card rounded-full px-1.5 sm:px-2 py-0.5 border inline-flex items-center gap-0.5">
                <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                {course.startTime}–{course.endTime}
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground bg-card rounded-full px-1.5 sm:px-2 py-0.5 border inline-flex items-center gap-0.5">
                <Truck className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                {course.requiredVehicleType}
              </span>
              {course.requiredDriverType && (
                <span className="text-[9px] sm:text-[10px] text-muted-foreground bg-card rounded-full px-1.5 sm:px-2 py-0.5 border inline-flex items-center gap-0.5">
                  <User className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                  {course.requiredDriverType}
                </span>
              )}
              {course.requiredDriverSkills.map(skill => (
                <Badge key={skill} variant="outline" className="text-[8px] sm:text-[9px] px-1 py-0 h-3.5 sm:h-4">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-6">
            {/* AI Suggestions — collapsible */}
            <div>
              <button
                type="button"
                className="w-full flex items-center justify-between mb-2 group"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                  </div>
                  <h3 className="text-[11px] sm:text-xs font-semibold">Suggestions IA</h3>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                    {aiSuggestions.length > 0 ? `(${aiSuggestions.length})` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {showSuggestions && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); generateSuggestions(); }}
                      disabled={loadingSuggestions}
                      className="h-5 sm:h-6 text-[9px] sm:text-[10px] px-1.5"
                    >
                      {loadingSuggestions ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : "Actualiser"}
                    </Button>
                  )}
                  {showSuggestions ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                </div>
              </button>

              {showSuggestions && (
                <>
                  {loadingSuggestions ? (
                    <div className="flex items-center justify-center py-4 rounded-lg bg-muted/30 border border-dashed">
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Analyse en cours...
                      </div>
                    </div>
                  ) : aiSuggestions.length > 0 ? (
                    <div className="space-y-1">
                      {aiSuggestions.map((suggestion, idx) => {
                        const isActive = selectedDriverId === suggestion.driverId && selectedVehicleId === suggestion.vehicleId;
                        return (
                          <button
                            key={idx}
                            className={cn(
                              "w-full text-left px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg border transition-all duration-200",
                              isActive
                                ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                                : "bg-card border-border hover:border-muted-foreground/30 hover:shadow-sm"
                            )}
                            onClick={() => handleSuggestionSelect(suggestion)}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className={cn(
                                "text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0",
                                suggestion.score >= 80 ? "bg-emerald-100 text-emerald-700" :
                                  suggestion.score >= 50 ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"
                              )}>
                                {suggestion.score}%
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div className="flex items-center gap-1 min-w-0">
                                  <User className="h-2.5 w-2.5 text-blue-500 flex-shrink-0" />
                                  <span className="text-[9px] sm:text-[10px] font-medium truncate">{suggestion.driverName}</span>
                                </div>
                                <div className="flex items-center gap-1 min-w-0">
                                  <Truck className="h-2.5 w-2.5 text-orange-500 flex-shrink-0" />
                                  <span className="text-[9px] sm:text-[10px] font-medium truncate">{suggestion.vehicleName}</span>
                                </div>
                              </div>
                              {idx === 0 && (
                                <Badge className="text-[8px] sm:text-[9px] px-1 py-0 h-3.5 bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100 flex-shrink-0">
                                  <Zap className="h-2 w-2 mr-0.5" /> Top
                                </Badge>
                              )}
                              {suggestion.validation?.valid && (
                                <CheckCircle className="h-2.5 w-2.5 text-emerald-500 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-3 rounded-lg bg-muted/30 border border-dashed">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Aucune suggestion disponible</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <Separator />

            {/* External Provider Toggle */}
            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
                <div>
                  <p className="text-[10px] sm:text-xs font-medium">Prestataire externe</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Confier à un sous-traitant</p>
                </div>
              </div>
              <Switch
                checked={useExternalProvider}
                onCheckedChange={(val) => {
                  setUseExternalProvider(val);
                  if (val) { setSelectedDriverId(''); setSelectedVehicleId(''); }
                  else { setSelectedProviderId(''); }
                }}
              />
            </div>

            {useExternalProvider ? (
              /* External Provider Selection */
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm font-semibold">Sélectionner un prestataire</h3>
                </div>
                <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Choisir un prestataire externe..." />
                  </SelectTrigger>
                  <SelectContent>
                    {externalProviders.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{provider.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {provider.specialty} · {provider.zone} · {provider.rating}/5
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProviderId && (
                  <div className="mt-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50/50">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                      <p className="text-[10px] sm:text-[11px] text-amber-700">
                        La course sera marquée comme sous-traitée. Le suivi sera assuré via le module exploitation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
            /* Manual Assignment (internal) */
            <>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-semibold">Assignation manuelle</h3>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:inline">(ou ajustez la suggestion)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="driver-select" className="text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5 block">
                    Chauffeur <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                    <SelectTrigger id="driver-select" className="h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Sélectionner un chauffeur" />
                    </SelectTrigger>
                    <SelectContent>
                      {compatibleDrivers.map(driver => (
                        <SelectItem key={driver.id} value={driver.id}>
                          <div className="flex items-center gap-2">
                            <span>{driver.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {driver.driverType || ''} · {driver.site}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedDriver && weeklyCount !== null && (
                    <div className={cn(
                      "mt-1 sm:mt-1.5 text-[10px] sm:text-[11px] flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md",
                      weeklyCount >= 5 ? "bg-red-50 text-red-600" :
                        weeklyCount >= 4 ? "bg-amber-50 text-amber-600" :
                          "bg-muted/50 text-muted-foreground"
                    )}>
                      <CalendarIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="truncate">Ce trajet: {weeklyCount}/5 cette semaine</span>
                      {weeklyCount >= 4 && <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5 flex-shrink-0" />}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="vehicle-select" className="text-[10px] sm:text-xs font-medium mb-1 sm:mb-1.5 block">
                    Véhicule <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                    <SelectTrigger id="vehicle-select" className="h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Sélectionner un véhicule" />
                    </SelectTrigger>
                    <SelectContent>
                      {compatibleVehicles.map(vehicle => (
                        <SelectItem key={vehicle.vin} value={vehicle.vin}>
                          <div className="flex items-center gap-2">
                            <span>{vehicle.immatriculation}</span>
                            <span className="text-xs text-muted-foreground">{vehicle.site}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Validation Results */}
            {validation && (
              <div className="space-y-1.5 sm:space-y-2">
                {validation.errors.length > 0 && (
                  <div className="rounded-lg sm:rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-red-700">Contraintes bloquantes</span>
                    </div>
                    <ul className="space-y-0.5 sm:space-y-1 ml-4 sm:ml-6">
                      {validation.errors.map((error, idx) => (
                        <li key={idx} className="text-[10px] sm:text-xs text-red-600 list-disc">{error}</li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-red-200">
                      <button
                        onClick={() => setAllowOverride(!allowOverride)}
                        className={cn(
                          "h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                          allowOverride ? "bg-red-500 border-red-500" : "border-red-300 hover:border-red-400"
                        )}
                      >
                        {allowOverride && <CheckCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />}
                      </button>
                      <label className="text-[10px] sm:text-xs text-red-600 cursor-pointer" onClick={() => setAllowOverride(!allowOverride)}>
                        Forcer l&apos;assignation malgré les erreurs
                      </label>
                    </div>
                  </div>
                )}

                {validation.warnings.length > 0 && (
                  <div className="rounded-lg sm:rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-amber-700">Avertissements</span>
                    </div>
                    <ul className="space-y-0.5 sm:space-y-1 ml-4 sm:ml-6">
                      {validation.warnings.map((warning, idx) => (
                        <li key={idx} className="text-[10px] sm:text-xs text-amber-600 list-disc">{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.valid && validation.errors.length === 0 && (
                  <div className="rounded-lg sm:rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-emerald-700">
                        Assignation valide — toutes les contraintes sont respectées
                      </span>
                    </div>
                  </div>
                )}

                {/* Compatibility summary */}
                {selectedDriver && selectedVehicle && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className={cn(
                      "rounded-lg border p-2 sm:p-3",
                      validation.compatibility.vehicleCompatible
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-red-200 bg-red-50/50"
                    )}>
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                        <Truck className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span className="text-[10px] sm:text-xs font-medium truncate">
                          {validation.compatibility.vehicleCompatible ? "Véhicule compatible" : "Véhicule incompatible"}
                        </span>
                      </div>
                      {validation.compatibility.vehicleIssues.length > 0 && (
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground line-clamp-2">{validation.compatibility.vehicleIssues.join(', ')}</p>
                      )}
                    </div>
                    <div className={cn(
                      "rounded-lg border p-2 sm:p-3",
                      validation.compatibility.driverCompatible
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-red-200 bg-red-50/50"
                    )}>
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                        <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span className="text-[10px] sm:text-xs font-medium truncate">
                          {validation.compatibility.driverCompatible ? "Chauffeur compatible" : "Chauffeur incompatible"}
                        </span>
                      </div>
                      {validation.compatibility.driverIssues.length > 0 && (
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground line-clamp-2">{validation.compatibility.driverIssues.join(', ')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-t bg-card flex items-center justify-between flex-shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-[10px] sm:text-xs h-7 sm:h-8">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={useExternalProvider ? !selectedProviderId || isSubmitting : !selectedDriverId || !selectedVehicleId || isSubmitting}
            size="sm"
            className="gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
                {useExternalProvider ? "Sous-traitance..." : "Assignation..."}
              </>
            ) : (
              <>
                {useExternalProvider ? (
                  <><Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Sous-traiter</>
                ) : (
                  <><CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Assigner la course</>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
