

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMockData } from "@/hooks/use-mock-data";

interface AssignCoachingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  driverIds: string[];
  onAssign: () => void;
}

export function AssignCoachingDialog({ isOpen, onOpenChange, driverIds, onAssign }: AssignCoachingDialogProps) {
    const { toast } = useToast();
    const { drivers } = useMockData();

    const handleAssign = () => {
        onAssign();
        onOpenChange(false);
    }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assigner un Coaching</DialogTitle>
          <DialogDescription>
            Assigner un plan de coaching à {driverIds.length} chauffeur(s).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label>Type de coaching</Label>
                 <Select>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un type..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="securite">Revue Sécurité</SelectItem>
                        <SelectItem value="eco">Coaching Éco-conduite</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label>Assigné à (Coach)</Label>
                 <Select>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un coach..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="manager-lyon">Manager Flotte - Lyon</SelectItem>
                        <SelectItem value="manager-paris">Manager Flotte - Paris</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea defaultValue={`Un coaching est requis suite à des performances en dessous des seuils de sécurité pour ${driverIds.length} chauffeur(s).`} />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleAssign}>Assigner</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
