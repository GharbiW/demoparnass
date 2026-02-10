
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { drivers, vehicles } from "@/lib/planning-data";
import { Trip } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface TripDetailsDialogProps {
    trip: Trip | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TripDetailsDialog({ trip, open, onOpenChange }: TripDetailsDialogProps) {
    if (!trip) {
        return null;
    }

    const driver = drivers.find(d => d.id === trip.driverId);
    const vehicle = vehicles.find(v => v.vin === trip.vin);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Détails du Trajet: {trip.id}</DialogTitle>
                    <DialogDescription>
                        Client: {trip.client}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold col-span-1">Statut</span>
                        <span className="col-span-3">{trip.status}</span>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold col-span-1">Enlèvement</span>
                        <span className="col-span-3">{trip.pickupLocation}</span>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold col-span-1">Livraison</span>
                        <span className="col-span-3">{trip.deliveryLocation}</span>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold col-span-1">Début</span>
                        <span className="col-span-3">{format(new Date(trip.plannedStart), "d MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold col-span-1">Fin</span>
                        <span className="col-span-3">{format(new Date(trip.plannedEnd), "d MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold col-span-1">Véhicule</span>
                        <span className="col-span-3">{vehicle?.immatriculation || 'N/A'}</span>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold col-span-1">Chauffeur</span>
                        <span className="col-span-3">{driver?.name || 'N/A'}</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button asChild>
                        <Link href={`/trips/${trip.id}`}>
                            Voir les détails complets <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
