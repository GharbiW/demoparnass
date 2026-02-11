import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UnassignedRide } from "@/lib/data/unassigned-rides";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight } from "lucide-react";

interface UnassignedRideTableProps {
    rides: UnassignedRide[];
    onSelectRide: (ride: UnassignedRide) => void;
}

export function UnassignedRideTable({ rides, onSelectRide }: UnassignedRideTableProps) {

    // Sorting logic could go here or be passed as props, strictly following requirement:
    // 1. Urgency (Date) - assumed input is already sorted or we sort here
    // 2. Sensitive rides first if same day

    const sortedRides = [...rides].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;

        if (a.isSensitive && !b.isSensitive) return -1;
        if (!a.isSensitive && b.isSensitive) return 1;

        return 0;
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[120px]">Référence</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Trajet</TableHead>
                        <TableHead>Date / Créneau</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedRides.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                Aucune prestation à placer pour le moment.
                            </TableCell>
                        </TableRow>
                    )}
                    {sortedRides.map((ride) => (
                        <TableRow key={ride.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectRide(ride)}>
                            <TableCell className="font-medium">
                                {ride.ref}
                                {ride.isSensitive && <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0 h-4">Sensible</Badge>}
                            </TableCell>
                            <TableCell>{ride.client}</TableCell>
                            <TableCell>
                                <div className="flex flex-col text-sm">
                                    <span className="font-medium">{ride.origin}</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <ArrowRight className="h-3 w-3" /> {ride.destination}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium capitalize">{format(new Date(ride.date), "EEE dd MMM", { locale: fr })}</span>
                                    <span className="text-xs text-muted-foreground">{ride.slot}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                < div className="flex items-center gap-2">
                                    {getReasonBadge(ride)}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectRide(ride);
                                }}>
                                    Détails
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function getReasonBadge(ride: UnassignedRide) {
    switch (ride.reason) {
        case 'driver_absent':
            return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Absence</Badge>;
        case 'vehicle_unavailable':
            return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Panne</Badge>;
        case 'new_client':
        case 'new_regular':
            return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Nouveau</Badge>;
        case 'sup':
            return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">SUP</Badge>;
        default:
            return <Badge variant="outline">Autre</Badge>;
    }
}
