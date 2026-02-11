import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnassignedRide } from "@/lib/data/unassigned-rides";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Clock, MapPin, Truck, User } from "lucide-react";

interface UnassignedRideDrawerProps {
    ride: UnassignedRide | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UnassignedRideDrawer({ ride, open, onOpenChange }: UnassignedRideDrawerProps) {
    if (!ride) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <span>{ride.ref}</span>
                        {ride.isSensitive && <Badge variant="destructive">Sensible</Badge>}
                    </SheetTitle>
                    <SheetDescription>
                        Détails de la prestation à placer pour {ride.client}
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Status & Reason */}
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            Raison du non-placement
                        </h4>
                        <p className="text-sm">
                            {ride.reason === 'driver_absent' && "Conducteur absent"}
                            {ride.reason === 'vehicle_unavailable' && "Véhicule indisponible"}
                            {ride.reason === 'new_regular' && "Nouvelle prestation régulière"}
                            {ride.reason === 'new_client' && "Nouveau client"}
                            {ride.reason === 'sup' && "Demande supplémentaire (SUP)"}
                            {ride.reason === 'modification' && "Modification de commande"}
                            {ride.reason === 'tour_broken' && "Tournée cassée"}
                            {ride.reason === 'combined_no_resource' && "Tournée combinée sans ressources"}
                        </p>
                        <div className="flex gap-2 mt-2">
                            {ride.missingResources === 'driver' && <Badge variant="outline">Manque Chauffeur</Badge>}
                            {ride.missingResources === 'vehicle' && <Badge variant="outline">Manque Véhicule</Badge>}
                            {ride.missingResources === 'both' && <Badge variant="outline">Manque tout</Badge>}
                        </div>
                    </div>

                    <Separator />

                    {/* Route Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Trajet
                        </h3>
                        <div className="grid grid-cols-[20px_1fr] gap-2">
                            <div className="flex flex-col items-center">
                                <div className="h-2 w-2 rounded-full bg-slate-400 mt-2" />
                                <div className="w-0.5 h-full bg-slate-200" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Départ</p>
                                <p className="text-sm text-muted-foreground">{ride.origin}</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-0.5 h-full bg-slate-200" />
                                <div className="h-2 w-2 rounded-full bg-slate-800 mb-2" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Arrivée</p>
                                <p className="text-sm text-muted-foreground">{ride.destination}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Timing */}
                    <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Horaires
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-muted-foreground block">Date</span>
                                <span className="text-sm font-medium">{format(new Date(ride.date), "dd MMMM yyyy", { locale: fr })}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Créneau</span>
                                <span className="text-sm font-medium">{ride.slot}</span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Type & Constraints */}
                    <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Truck className="h-4 w-4" /> Contraintes
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{ride.type === 'regular' ? 'Régulier' : 'Ponctuel (SUP)'}</Badge>
                            {ride.requiresSpecificHardware && <Badge variant="secondary">Matériel Spécifique</Badge>}
                            {ride.isSensitive && <Badge variant="secondary">Sensible</Badge>}
                        </div>
                    </div>

                </div>

                <SheetFooter className="flex-col sm:flex-col gap-2">
                    <Button className="w-full">Intégrer à une tournée existante</Button>
                    <Button variant="outline" className="w-full">Créer une nouvelle tournée</Button>
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive">Refuser / Annuler</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
