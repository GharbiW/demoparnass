
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, PlusCircle, Link as LinkIcon } from "lucide-react";
import type { Contract } from "@/lib/types";

interface PlanRequestDialogProps {
  contract: Contract;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (option: 'new' | 'attach', contract: Contract) => void;
}

export function PlanRequestDialog({ contract, open, onOpenChange, onSelect }: PlanRequestDialogProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Planifier la Prestation: {contract.client}</DialogTitle>
          <DialogDescription>
            L'IA a analysé les plannings et vous propose les meilleures options pour intégrer ce trajet.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="cursor-pointer hover:border-primary" onClick={() => onSelect('attach', contract)}>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg"><LinkIcon className="mr-2"/>Rattacher à une tournée</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>Ajouter cette prestation à la tournée <span className="font-semibold">T-LGN-004</span> (Chauffeur: P. Martin).</p>
                    <div className="p-2 bg-muted/50 rounded-md">
                        <p className="font-semibold text-green-600">Impact minimal</p>
                        <p className="text-xs text-muted-foreground">+ 35km à vide, +45 min de temps de service.</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary" onClick={() => onSelect('new', contract)}>
                <CardHeader>
                    <CardTitle className="flex items-center text-lg"><PlusCircle className="mr-2"/>Créer une nouvelle tournée</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>Créer un trajet dédié pour cette prestation. Le système vous aidera à assigner un chauffeur et un véhicule.</p>
                    <div className="p-2 bg-muted/50 rounded-md">
                        <p className="font-semibold text-amber-600">Coûts plus élevés</p>
                        <p className="text-xs text-muted-foreground">Nécessite un véhicule et un chauffeur dédiés.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
        <DialogFooter>
            <p className="text-xs text-muted-foreground flex items-center gap-1 w-full"><Bot className="h-4 w-4"/> L'IA apprend de vos choix pour affiner ses futures propositions.</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
