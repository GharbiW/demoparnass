
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
import { technicians as allTechnicians, workOrders as allWorkOrders } from "@/lib/technicians-data";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface AssignWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignWorkOrderDialog({ open, onOpenChange }: AssignWorkOrderDialogProps) {
    const { toast } = useToast();
    const [selectedTicket, setSelectedTicket] = useState('');
    const [selectedTechnician, setSelectedTechnician] = useState('');

    const openTickets = allWorkOrders.filter(wo => wo.status !== 'Terminé');

    const handleAssign = () => {
        if (selectedTicket && selectedTechnician) {
            toast({
                title: "Intervention Assignée",
                description: `Le ticket ${selectedTicket} a été assigné à ${allTechnicians.find(t => t.id === selectedTechnician)?.name}.`
            });
            onOpenChange(false);
        }
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assigner une Intervention</DialogTitle>
          <DialogDescription>
            Choisissez un ticket ouvert et un technicien disponible.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label>Ticket / Work Order Ouvert</Label>
                 <Select onValueChange={setSelectedTicket}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un ticket..." /></SelectTrigger>
                    <SelectContent>
                        {openTickets.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.id} - {t.task}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Technicien</Label>
                <Select onValueChange={setSelectedTechnician}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un technicien..." /></SelectTrigger>
                    <SelectContent>
                        {allTechnicians.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name} ({t.site})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleAssign} disabled={!selectedTicket || !selectedTechnician}>Assigner</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
