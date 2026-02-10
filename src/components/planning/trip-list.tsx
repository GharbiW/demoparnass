
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { drivers, vehicles } from "@/lib/planning-data";
import { Trip } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TripListProps {
  trips: Trip[];
  onTripClick: (trip: Trip) => void;
}

export function TripList({ trips, onTripClick }: TripListProps) {

  const getStatusVariant = (status: Trip['status']) => {
    switch (status) {
      case 'in_progress':
        return 'secondary';
      case 'completed':
        return 'default';
      case 'conflict':
        return 'destructive';
      case 'planned':
      default:
        return 'outline';
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID Trajet</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Départ</TableHead>
          <TableHead>Fin</TableHead>
          <TableHead>Véhicule</TableHead>
          <TableHead>Chauffeur</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trips.map((trip) => {
          const driver = drivers.find(d => d.id === trip.driverId);
          const vehicle = vehicles.find(v => v.vin === trip.vin);

          return (
            <TableRow key={trip.id} onClick={() => onTripClick(trip)} className="cursor-pointer">
              <TableCell className="font-medium">{trip.id}</TableCell>
              <TableCell>{trip.client}</TableCell>
              <TableCell>{format(new Date(trip.plannedStart), 'dd/MM HH:mm', { locale: fr })}</TableCell>
              <TableCell>{format(new Date(trip.plannedEnd), 'dd/MM HH:mm', { locale: fr })}</TableCell>
              <TableCell>{vehicle?.immatriculation ?? 'N/A'}</TableCell>
              <TableCell>{driver?.name ?? 'N/A'}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(trip.status)}>
                  {trip.status}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
