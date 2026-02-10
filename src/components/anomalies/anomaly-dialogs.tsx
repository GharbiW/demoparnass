
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Anomaly } from "@/lib/anomalies-data";
import { useState } from "react";

interface AnomalyDetailsDialogProps {
  anomaly: Anomaly | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnomalyDetailsDialog({ anomaly, open, onOpenChange }: AnomalyDetailsDialogProps) {
  if (!anomaly) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Détails de l'Anomalie: {anomaly.id}</DialogTitle>
          <DialogDescription>
            {anomaly.scope}: {anomaly.description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="font-semibold">Sévérité</span>
            <span className="col-span-2">{anomaly.severity}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="font-semibold">Contexte</span>
            <span className="col-span-2">{anomaly.context}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="font-semibold">Date</span>
            <span className="col-span-2">{new Date(anomaly.timestamp).toLocaleString('fr-FR')}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="font-semibold">Statut</span>
            <span className="col-span-2">{anomaly.status}</span>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


interface AssignAnomalyDialogProps {
  anomaly: Anomaly | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (anomalyId: string, userId: string) => void;
}

// Mock users for assignment
const users = [
    { id: 'user-1', name: 'Alice (Manager)' },
    { id: 'user-2', name: 'Bob (Spécialiste Carburant)' },
    { id: 'user-3', name: 'Charlie (Support)' },
];

export function AssignAnomalyDialog({ anomaly, open, onOpenChange, onAssign }: AssignAnomalyDialogProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');

  if (!anomaly) return null;
  
  const handleAssign = () => {
    if (selectedUser) {
        onAssign(anomaly.id, selectedUser);
        onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assigner l'anomalie {anomaly.id}</DialogTitle>
          <DialogDescription>
            Choisissez un utilisateur pour prendre en charge cette anomalie. Le statut passera à "Pris en compte".
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
             <Select onValueChange={setSelectedUser}>
                <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur..." />
                </SelectTrigger>
                <SelectContent>
                    {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleAssign} disabled={!selectedUser}>Assigner</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
