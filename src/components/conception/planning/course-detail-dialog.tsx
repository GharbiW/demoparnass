"use client";

import { useState, useMemo } from "react";
import { Course, CancellationReason, CancellationDelay } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  MapPin,
  Clock,
  Calendar,
  Truck,
  User,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Package,
  MessageSquare,
  Edit,
  XCircle,
  FileText,
  ChevronRight,
  Star,
  Info,
  Save,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getAISuggestions, getAvailableDrivers, getAvailableVehicles, subcontractors } from "@/lib/conception-planning-data";
import { drivers } from "@/lib/planning-data";
import { Tournee } from "@/lib/types";
import { reassignDriver, reassignVehicle, checkTourneeCoherence, shouldSplitTournee } from "@/lib/tournee-reassignment";
import { useToast } from "@/hooks/use-toast";

interface CourseDetailDialogProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (course: Course) => void;
  tournees?: Tournee[];
}

export function CourseDetailDialog({ course, open, onOpenChange, onSave, tournees }: CourseDetailDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  const [isSensitive, setIsSensitive] = useState(course?.isSensitive || false);
  const [loadingCode, setLoadingCode] = useState(course?.loadingCode || "");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(course?.comments || []);
  const [saving, setSaving] = useState(false);

  // Resource assignment state
  const [selectedDriverId, setSelectedDriverId] = useState(course?.assignedDriverId || "");
  const [selectedVehicleId, setSelectedVehicleId] = useState(course?.assignedVehicleId || "");
  const [selectedSubcontractor, setSelectedSubcontractor] = useState(course?.subcontractorId || "");

  // Temporary modification state
  const [modAddress, setModAddress] = useState(course?.temporaryModifications?.address || "");
  const [modDateStart, setModDateStart] = useState(course?.temporaryModifications?.dates?.start || "");
  const [modDateEnd, setModDateEnd] = useState(course?.temporaryModifications?.dates?.end || "");
  const [modTimeStart, setModTimeStart] = useState(course?.temporaryModifications?.times?.start || "");
  const [modTimeEnd, setModTimeEnd] = useState(course?.temporaryModifications?.times?.end || "");
  const [modValidFrom, setModValidFrom] = useState(course?.temporaryModifications?.validFrom || "");
  const [modValidTo, setModValidTo] = useState(course?.temporaryModifications?.validTo || "");

  // Cancellation state
  const [cancelStart, setCancelStart] = useState(course?.cancellation?.start || "");
  const [cancelEnd, setCancelEnd] = useState(course?.cancellation?.end || "");
  const [cancelReason, setCancelReason] = useState<CancellationReason | "">(course?.cancellation?.reason || "");
  const [cancelDelay, setCancelDelay] = useState<CancellationDelay | "">(course?.cancellation?.delay || "");
  const [cancelComment, setCancelComment] = useState(course?.cancellation?.comment || "");

  const availableDrivers = useMemo(() => getAvailableDrivers(), []);
  const availableVehicles = useMemo(() => getAvailableVehicles(), []);
  const aiSuggestions = useMemo(() => course ? getAISuggestions(course) : [], [course]);

  // Find tournée for this course
  const tournee = useMemo(() => {
    if (!course || !tournees) return undefined;
    return tournees.find(t => t.id === course.tourneeId || t.courses.some(c => c.id === course.id));
  }, [course, tournees]);

  // Service pickup state (managed at tournée level)
  const [servicePickupLocation, setServicePickupLocation] = useState(tournee?.servicePickup?.location || "");
  const [servicePickupTime, setServicePickupTime] = useState(tournee?.servicePickup?.time || "");
  const [servicePickupKm, setServicePickupKm] = useState(tournee?.servicePickup?.kmFromBase?.toString() || "");

  if (!course) return null;

  const dateObj = parseISO(course.date);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: `CMT-${Date.now()}`,
      text: newComment.trim(),
      author: "Utilisateur courant",
      timestamp: new Date().toISOString(),
    };
    setComments([...comments, comment]);
    setNewComment("");
  };

  const handleSave = () => {
    setSaving(true);
    
    // Check if driver or vehicle changed
    const driverChanged = selectedDriverId !== course?.assignedDriverId;
    const vehicleChanged = selectedVehicleId !== course?.assignedVehicleId;
    const newDriverName = selectedDriverId ? drivers.find(d => d.id === selectedDriverId)?.name : undefined;
    const newVehicle = availableVehicles.find(v => v.vin === selectedVehicleId);

    // Use reassignment logic if driver or vehicle changed and course is part of a tournée
    if ((driverChanged || vehicleChanged) && tournee && course) {
      if (driverChanged && selectedDriverId && newDriverName) {
        const result = reassignDriver(
          [course],
          selectedDriverId,
          newDriverName,
          tournees || [],
          availableVehicles.map(v => ({ vin: v.vin, immatriculation: v.immatriculation, type: course.requiredVehicleType }))
        );
        
        if (result.success) {
          toast({
            title: "Conducteur réaffecté",
            description: result.message,
            variant: result.action === 'reassigned' ? 'default' : 'destructive',
          });
          
          // Check if tournée should be split
          if (result.updatedTournee) {
            const splitCheck = shouldSplitTournee(result.updatedTournee);
            if (splitCheck.shouldSplit) {
              toast({
                title: "Attention: Tournée incohérente",
                description: `La tournée ${result.updatedTournee.tourneeCode} pourrait nécessiter une division: ${splitCheck.reason}`,
                variant: 'destructive',
              });
            }
          }
        }
      }
      
      if (vehicleChanged && selectedVehicleId && newVehicle) {
        const result = reassignVehicle(
          [course],
          selectedVehicleId,
          newVehicle.immatriculation,
          tournees || []
        );
        
        if (result.success) {
          toast({
            title: "Véhicule réaffecté",
            description: result.message,
          });
        }
      }
    }

    const updatedCourse: Course = {
      ...course,
      isSensitive,
      loadingCode: loadingCode || undefined,
      comments: comments.length > 0 ? comments : undefined,
      assignedDriverId: selectedDriverId || undefined,
      assignedDriverName: selectedDriverId ? newDriverName : undefined,
      assignedVehicleId: selectedVehicleId || undefined,
      assignedVehicleImmat: selectedVehicleId && newVehicle ? newVehicle.immatriculation : course?.assignedVehicleImmat,
      assignmentStatus: selectedDriverId && selectedVehicleId ? 'affectee' : selectedDriverId || selectedVehicleId ? 'partiellement_affectee' : 'non_affectee',
      subcontractorId: selectedSubcontractor || undefined,
      subcontractorName: selectedSubcontractor ? subcontractors.find(s => s.id === selectedSubcontractor)?.name : undefined,
      temporaryModifications: modAddress || modDateStart ? {
        address: modAddress || undefined,
        dates: modDateStart ? { start: modDateStart, end: modDateEnd } : undefined,
        times: modTimeStart ? { start: modTimeStart, end: modTimeEnd } : undefined,
        validFrom: modValidFrom || undefined,
        validTo: modValidTo || undefined,
        modifiedBy: "Utilisateur courant",
        modifiedAt: new Date().toISOString(),
      } : undefined,
      cancellation: cancelStart && cancelReason ? {
        start: cancelStart,
        end: cancelEnd,
        reason: cancelReason as CancellationReason,
        delay: cancelReason === 'demande_client' ? cancelDelay as CancellationDelay : undefined,
        comment: cancelComment,
        cancelledBy: "Utilisateur courant",
        cancelledAt: new Date().toISOString(),
      } : undefined,
    };
    onSave?.(updatedCourse);
    setTimeout(() => {
      setSaving(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!grid !grid-cols-1 !grid-rows-[auto_1fr_auto] max-w-3xl max-h-[85vh] !overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base">{course.id}</DialogTitle>
            {course.isSensitive && <Badge variant="outline" className="text-[10px] border-violet-300 text-violet-700"><Shield className="h-3 w-3 mr-1" />Sensible</Badge>}
            {course.prestationType === 'sup' && <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700"><Zap className="h-3 w-3 mr-1" />SUP</Badge>}
            <Badge variant="secondary" className="text-[10px]">
              {course.assignmentStatus === 'affectee' ? 'Affectée' : course.assignmentStatus === 'partiellement_affectee' ? 'Partiellement affectée' : 'Non affectée'}
            </Badge>
          </div>
          <DialogDescription className="text-xs flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(dateObj, "EEEE d MMMM yyyy", { locale: fr })}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.startTime} - {course.endTime}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{course.startLocation} → {course.endLocation}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col min-h-0 overflow-hidden">
          <TabsList className="grid grid-cols-5 shrink-0">
            <TabsTrigger value="details" className="text-xs"><Package className="h-3 w-3 mr-1" />Détails</TabsTrigger>
            <TabsTrigger value="assignment" className="text-xs"><User className="h-3 w-3 mr-1" />Affectation</TabsTrigger>
            <TabsTrigger value="modifications" className="text-xs"><Edit className="h-3 w-3 mr-1" />Modifications</TabsTrigger>
            <TabsTrigger value="cancellation" className="text-xs"><XCircle className="h-3 w-3 mr-1" />Annulation</TabsTrigger>
            <TabsTrigger value="comments" className="text-xs"><MessageSquare className="h-3 w-3 mr-1" />Notes</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 mt-3 overflow-y-auto">
            {/* ─── Details Tab ─── */}
            <TabsContent value="details" className="mt-0 space-y-4 px-1">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-muted">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trajet</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm">{course.startLocation}</span>
                    </div>
                    {course.intermediateLocations?.map((loc, i) => (
                      <div key={i} className="flex items-center gap-2 pl-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-xs text-muted-foreground">{loc}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-sm">{course.endLocation}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exigences</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{course.requiredVehicleType}</span>
                      {course.requiredVehicleEnergy && (
                        <Badge variant="outline" className="text-[10px] h-4">{course.requiredVehicleEnergy}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{course.requiredDriverType || 'Tout type'}</span>
                    </div>
                    {course.requiredDriverSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {course.requiredDriverSkills.map(skill => (
                          <Badge key={skill} variant="secondary" className="text-[10px] h-4">{skill}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sensitive toggle + Loading code */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Flag Sensible</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isSensitive}
                      onCheckedChange={(checked) => setIsSensitive(!!checked)}
                    />
                    <span className="text-xs text-muted-foreground">
                      Marquer cette course comme sensible (toutes les courses de la prestation seront impactées)
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loadingCode" className="text-xs font-medium">Code de Chargement</Label>
                  <Input
                    id="loadingCode"
                    value={loadingCode}
                    onChange={(e) => setLoadingCode(e.target.value)}
                    placeholder="Ex: LC-0042"
                    className="h-8 text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">1 code par jour par course, jamais dupliqué</p>
                </div>
              </div>

              {/* Current assignment */}
              {course.assignedDriverName && (
                <Card className="border-emerald-200 bg-emerald-50/50">
                  <CardContent className="px-4 py-3">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Affectation actuelle</p>
                    <div className="flex items-center gap-4 text-sm">
                      {course.assignedDriverName && (
                        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{course.assignedDriverName}</span>
                      )}
                      {course.assignedVehicleImmat && (
                        <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{course.assignedVehicleImmat}</span>
                      )}
                      {course.tourneeNumber && (
                        <Badge variant="outline" className="text-[10px]">{course.tourneeNumber}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ─── Assignment Tab ─── */}
            <TabsContent value="assignment" className="mt-0 space-y-4 px-1">
              {/* AI Suggestions */}
              <Card className="border-sky-200 bg-sky-50/50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1 text-sky-700">
                    <Sparkles className="h-3.5 w-3.5" /> Suggestions IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {aiSuggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="flex items-center justify-between p-2 rounded-lg border bg-white hover:shadow-sm cursor-pointer transition-all"
                      onClick={() => {
                        setSelectedDriverId(sug.driverId);
                        setSelectedVehicleId(sug.vehicleId);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{sug.driverName}</span>
                          <Badge variant="secondary" className="text-[9px] h-4">{sug.driverType}</Badge>
                          <span className="text-[10px] text-muted-foreground">{sug.vehicleImmat}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sug.reasons.map((r, i) => (
                            <span key={i} className="text-[10px] text-muted-foreground">{r}{i < sug.reasons.length - 1 ? ' •' : ''}</span>
                          ))}
                        </div>
                        {sug.warnings.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <span className="text-[10px] text-amber-600">{sug.warnings.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <div className={cn(
                          "text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center",
                          sug.score >= 90 ? "bg-emerald-100 text-emerald-700" : sug.score >= 80 ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {sug.score}
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Appliquer
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Separator />

              {/* Manual Assignment */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Affectation manuelle</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Conducteur</Label>
                    <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Sélectionner un conducteur" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">Aucun</SelectItem>
                        {availableDrivers.map(d => (
                          <SelectItem key={d.id} value={d.id} className="text-xs">
                            {d.name} ({d.driverType}) — {d.site}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Véhicule</Label>
                    <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Sélectionner un véhicule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">Aucun</SelectItem>
                        {availableVehicles.slice(0, 20).map(v => (
                          <SelectItem key={v.vin} value={v.vin} className="text-xs">
                            {v.immatriculation} — {v.site}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Subcontractor */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  Sous-traitance
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="text-xs max-w-xs">Uniquement si aucune option interne satisfaisante</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h4>
                <Select value={selectedSubcontractor} onValueChange={setSelectedSubcontractor}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Sélectionner un sous-traitant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">Aucun</SelectItem>
                    {subcontractors.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name} — {s.specialty} ({s.rating}/5)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service Pickup (Tournée level) */}
              {tournee && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      Prise de service (Tournée {tournee.tourneeCode})
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent className="text-xs max-w-xs">La prise de service est rattachée à la tournée, pas à la course individuelle. Les calculs kilométriques sont effectués au niveau de la tournée.</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Lieu</Label>
                        <Input
                          value={servicePickupLocation}
                          onChange={(e) => setServicePickupLocation(e.target.value)}
                          placeholder="Lieu de prise de service"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Heure</Label>
                        <Input
                          type="time"
                          value={servicePickupTime}
                          onChange={(e) => setServicePickupTime(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Distance (km)</Label>
                        <Input
                          type="number"
                          value={servicePickupKm}
                          onChange={(e) => setServicePickupKm(e.target.value)}
                          placeholder="0"
                          className="h-8 text-xs"
                          min="0"
                        />
                      </div>
                    </div>
                    {tournee.servicePickup && (
                      <p className="text-[10px] text-muted-foreground">
                        Actuel: {tournee.servicePickup.location} à {tournee.servicePickup.time} ({tournee.servicePickup.kmFromBase} km)
                      </p>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* ─── Modifications Tab ─── */}
            <TabsContent value="modifications" className="mt-0 space-y-4 px-1">
              <Card className="border-amber-200 bg-amber-50/30">
                <CardContent className="px-4 py-3">
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Les modifications temporaires n'impactent pas l'ADV. Au-delà de la date de validité, les données ADV originales sont restaurées.
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Adresse modifiée</Label>
                  <Input
                    value={modAddress}
                    onChange={(e) => setModAddress(e.target.value)}
                    placeholder="Nouvelle adresse (optionnel)"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date début modifiée</Label>
                    <Input type="date" value={modDateStart} onChange={(e) => setModDateStart(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date fin modifiée</Label>
                    <Input type="date" value={modDateEnd} onChange={(e) => setModDateEnd(e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Horaire début modifié</Label>
                    <Input type="time" value={modTimeStart} onChange={(e) => setModTimeStart(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Horaire fin modifié</Label>
                    <Input type="time" value={modTimeEnd} onChange={(e) => setModTimeEnd(e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Modification valide du</Label>
                    <Input type="date" value={modValidFrom} onChange={(e) => setModValidFrom(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Au</Label>
                    <Input type="date" value={modValidTo} onChange={(e) => setModValidTo(e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ─── Cancellation Tab ─── */}
            <TabsContent value="cancellation" className="mt-0 space-y-4 px-1">
              <Card className="border-rose-200 bg-rose-50/30">
                <CardContent className="px-4 py-3">
                  <p className="text-xs text-rose-700 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    L'annulation ne supprime pas la prestation ADV. La course réapparaît automatiquement après la date de fin.
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Annuler du</Label>
                    <Input type="date" value={cancelStart} onChange={(e) => setCancelStart(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Au</Label>
                    <Input type="date" value={cancelEnd} onChange={(e) => setCancelEnd(e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Raison de l'annulation</Label>
                  <Select value={cancelReason} onValueChange={(v) => setCancelReason(v as CancellationReason)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Sélectionner une raison" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demande_client" className="text-xs">Demande client</SelectItem>
                      <SelectItem value="operationnel_parnass" className="text-xs">Opérationnel Parnass</SelectItem>
                      <SelectItem value="empechement_exterieur" className="text-xs">Empêchement extérieur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {cancelReason === 'demande_client' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Délai de prévenance</Label>
                    <Select value={cancelDelay} onValueChange={(v) => setCancelDelay(v as CancellationDelay)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Sélectionner le délai" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1j_avant" className="text-xs">1 jour avant la course</SelectItem>
                        <SelectItem value="plus_1j_avant" className="text-xs">Plus d'1 jour avant la course</SelectItem>
                        <SelectItem value="annulation_sur_place" className="text-xs">Annulation sur place</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Commentaire (obligatoire)
                    <span className="text-rose-500 ml-1">*</span>
                  </Label>
                  <Textarea
                    value={cancelComment}
                    onChange={(e) => setCancelComment(e.target.value)}
                    placeholder="Copier-coller le mail client ou justification de l'opérateur..."
                    className="text-sm min-h-[80px]"
                  />
                </div>
              </div>
            </TabsContent>

            {/* ─── Comments Tab ─── */}
            <TabsContent value="comments" className="mt-0 space-y-4 px-1">
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucun commentaire</p>
                ) : (
                  comments.map(comment => (
                    <Card key={comment.id} className="border-muted">
                      <CardContent className="px-4 py-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">{comment.author}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(comment.timestamp), "dd/MM/yyyy HH:mm", { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs">Nouveau commentaire</Label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="text-sm min-h-[60px]"
                />
                <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                  <MessageSquare className="h-3 w-3 mr-1" /> Ajouter
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Save CTA */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>Enregistrement...</>
            ) : (
              <><Save className="h-3.5 w-3.5 mr-1" /> Enregistrer</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
