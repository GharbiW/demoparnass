"use client";

import { useState, useMemo } from "react";
import { Course, Tournee } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  Truck,
  User,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
  Repeat,
  Save,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvailableDrivers, getAvailableVehicles } from "@/lib/conception-planning-data";
import { reassignDriver, reassignVehicle, checkTourneeCoherence, shouldSplitTournee } from "@/lib/tournee-reassignment";
import { useToast } from "@/hooks/use-toast";

interface TourReassignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournee: Tournee | null;
  tournees: Tournee[];
  onReassign?: (updatedCourses: Course[], updatedTournee?: Tournee) => void;
}

export function TourReassignmentDialog({
  open,
  onOpenChange,
  tournee,
  tournees,
  onReassign,
}: TourReassignmentDialogProps) {
  const { toast } = useToast();
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [reassigning, setReassigning] = useState(false);

  const availableDrivers = useMemo(() => getAvailableDrivers(), []);
  const availableVehicles = useMemo(() => getAvailableVehicles(), []);

  if (!tournee) return null;

  const coherence = checkTourneeCoherence(tournee);
  const courseCount = tournee.courses.length;

  const handleReassignDriver = () => {
    if (!selectedDriverId || !tournee) return;
    setReassigning(true);

    const newDriverName = availableDrivers.find(d => d.id === selectedDriverId)?.name || "Inconnu";
    const result = reassignDriver(
      [...tournee.courses],
      selectedDriverId,
      newDriverName,
      tournees,
      availableVehicles.map(v => ({ vin: v.vin, immatriculation: v.immatriculation, type: 'Semi-remorque' }))
    );

    if (result.success) {
      toast({
        title: "Conducteur réaffecté pour la tournée",
        description: `${result.affectedCourses.length} courses mises à jour pour ${tournee.tourneeCode}`,
      });

      if (result.updatedTournee) {
        const splitCheck = shouldSplitTournee(result.updatedTournee);
        if (splitCheck.shouldSplit) {
          toast({
            title: "Attention",
            description: `La tournée pourrait nécessiter une division: ${splitCheck.reason}`,
            variant: 'destructive',
          });
        }
      }

      onReassign?.(result.affectedCourses, result.updatedTournee);
    } else {
      toast({
        title: "Erreur",
        description: result.message,
        variant: 'destructive',
      });
    }

    setReassigning(false);
    setSelectedDriverId("");
  };

  const handleReassignVehicle = () => {
    if (!selectedVehicleId || !tournee) return;
    setReassigning(true);

    const newVehicle = availableVehicles.find(v => v.vin === selectedVehicleId);
    if (!newVehicle) return;

    const result = reassignVehicle(
      [...tournee.courses],
      selectedVehicleId,
      newVehicle.immatriculation,
      tournees
    );

    if (result.success) {
      toast({
        title: "Véhicule réaffecté pour la tournée",
        description: `${result.affectedCourses.length} courses mises à jour pour ${tournee.tourneeCode}`,
      });

      onReassign?.(result.affectedCourses, result.updatedTournee);
    } else {
      toast({
        title: "Erreur",
        description: result.message,
        variant: 'destructive',
      });
    }

    setReassigning(false);
    setSelectedVehicleId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base flex items-center gap-2">
              <Repeat className="h-4 w-4 text-sky-600" />
              Réaffectation tournée
            </DialogTitle>
            <Badge variant="secondary" className="text-[10px] font-mono font-bold">
              {tournee.tourneeCode}
            </Badge>
          </div>
          <DialogDescription className="text-xs mt-1">
            Réaffecter le conducteur ou le véhicule pour toute la tournée ({courseCount} course{courseCount > 1 ? 's' : ''})
          </DialogDescription>
        </DialogHeader>

        {/* Current Assignment Summary */}
        <Card className="border-muted">
          <CardContent className="px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Affectation actuelle</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                {tournee.isDualDriver ? (
                  <>
                    <Users className="h-4 w-4 text-indigo-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{tournee.driverName || "Non affecté"}</span>
                      {tournee.driver2Name && (
                        <span className="text-xs text-indigo-600">{tournee.driver2Name}</span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[8px] h-3.5 border-indigo-300 text-indigo-600">12h</Badge>
                  </>
                ) : (
                  <>
                    <User className={cn("h-4 w-4", tournee.driverName ? "text-slate-500" : "text-rose-400")} />
                    <span className={cn("text-xs font-medium", !tournee.driverName && "text-rose-500 italic")}>
                      {tournee.driverName || "Non affecté"}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Truck className={cn("h-4 w-4", tournee.vehicleImmat ? "text-slate-500" : "text-rose-400")} />
                <span className={cn("text-xs font-medium", !tournee.vehicleImmat && "text-rose-500 italic")}>
                  {tournee.vehicleImmat || "Non affecté"}
                </span>
                {tournee.vehicleType && (
                  <span className="text-[10px] text-muted-foreground">({tournee.vehicleType})</span>
                )}
              </div>
            </div>

            {/* Coherence warnings */}
            {!coherence.isCoherent && (
              <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200">
                <p className="text-[10px] text-amber-700 flex items-center gap-1 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  Problèmes de cohérence:
                </p>
                {coherence.issues.map((issue, i) => (
                  <p key={i} className="text-[10px] text-amber-600 ml-4">• {issue}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Reassign Driver */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            Changer le conducteur
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="text-xs max-w-xs">
                  Le nouveau conducteur sera affecté à toutes les courses de cette tournée
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h4>
          <div className="flex items-center gap-2">
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger className="h-8 text-xs flex-1">
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
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleReassignDriver}
              disabled={!selectedDriverId || selectedDriverId === "none" || reassigning}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              Appliquer
            </Button>
          </div>
        </div>

        <Separator />

        {/* Reassign Vehicle */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Truck className="h-3.5 w-3.5" />
            Changer le véhicule
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="text-xs max-w-xs">
                  Le nouveau véhicule sera affecté à toutes les courses de cette tournée
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h4>
          <div className="flex items-center gap-2">
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Sélectionner un véhicule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">Aucun</SelectItem>
                {availableVehicles.slice(0, 30).map(v => (
                  <SelectItem key={v.vin} value={v.vin} className="text-xs">
                    {v.immatriculation} — {v.site}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleReassignVehicle}
              disabled={!selectedVehicleId || selectedVehicleId === "none" || reassigning}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              Appliquer
            </Button>
          </div>
        </div>

        {/* Courses in this tournée */}
        <div className="mt-2">
          <p className="text-[10px] text-muted-foreground">
            {courseCount} course{courseCount > 1 ? 's' : ''} dans cette tournée seront impactée{courseCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Close */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
