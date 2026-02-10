

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ListFilter, MoreHorizontal, Search } from "lucide-react"
import Link from "next/link"
import { Trip } from "@/lib/types"
import { format, differenceInMinutes } from "date-fns"
import { useMockData } from "@/hooks/use-mock-data"
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast";
import { AssignCoachingDialog } from "@/components/drivers/assign-coaching-dialog"
import { DriverSafetyPanel } from "@/components/drivers/driver-safety-panel";


export default function TripsPage() {
  const { trips: allTrips, vehicles, drivers } = useMockData();
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [isAssignInterventionOpen, setAssignInterventionOpen] = useState(false);


  // For now, we display all trips. In a real app, this would be filtered.
  const visibleTrips = allTrips.map(trip => {
    const plannedStart = new Date(trip.plannedStart);
    const plannedEnd = new Date(trip.plannedEnd);
    const actualStart = trip.actualStart ? new Date(trip.actualStart) : null;
    const now = new Date();
    
    let actualEnd = trip.actualEnd ? new Date(trip.actualEnd) : null;
    let actualDurationMin: number | null = null;
    
    if (actualStart && actualEnd) {
      actualDurationMin = differenceInMinutes(actualEnd, actualStart);
    } else if (trip.status === 'in_progress' && actualStart) {
        // Estimate current duration for live trips
        const etaDate = new Date();
        if (trip.eta) {
          const [hours, minutes] = trip.eta.split(':').map(Number);
          etaDate.setHours(hours, minutes, 0, 0);
          actualDurationMin = differenceInMinutes(etaDate, actualStart);
        } else {
           actualDurationMin = differenceInMinutes(now, actualStart);
        }
    }

    const plannedDurationMin = differenceInMinutes(plannedEnd, plannedStart);
    
    const deviationPercent = (plannedDurationMin && actualDurationMin)
      ? Math.round(((actualDurationMin - plannedDurationMin) / plannedDurationMin) * 100)
      : 0;

    return {
      ...trip,
      plannedDurationMin,
      actualDurationMin,
      deviationPercent,
      hosRemainingMin: trip.hosRemainingMin || 0,
    };
  });

  const getStatusVariant = (status: Trip['status']) => {
    switch (status) {
      case 'in_progress':
        return 'secondary'
      case 'completed':
        return 'default'
      case 'planned':
      default:
        return 'outline'
    }
  }

  const getSlaColor = (sla?: Trip['slaStatus']) => {
    if (!sla) return 'text-foreground';
    switch (sla) {
        case 'on_time':
            return 'text-green-600';
        case 'at_risk':
            return 'text-amber-600';
        case 'late':
            return 'text-red-600';
        default:
            return 'text-foreground';
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTripIds(visibleTrips.map(t => t.id));
    } else {
      setSelectedTripIds([]);
    }
  };

  const handleSelectRow = (tripId: string, checked: boolean) => {
    if (checked) {
      setSelectedTripIds(prev => [...prev, tripId]);
    } else {
      setSelectedTripIds(prev => prev.filter(id => id !== tripId));
    }
  };

  const handleAssignIntervention = () => {
    setAssignInterventionOpen(true);
  }

  return (
    <>
      <AssignCoachingDialog
        isOpen={isAssignInterventionOpen}
        onOpenChange={setAssignInterventionOpen}
        driverIds={selectedTripIds}
        onAssign={() => {
            toast({
                title: "Intervention assignée",
                description: `Une intervention a été créée pour les chauffeurs des ${selectedTripIds.length} trajet(s) sélectionnés.`
            });
            setSelectedTripIds([]);
        }}
      />
      <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-headline">Gestion des Trajets</h1>
           <div className="flex items-center gap-2">
              <Button onClick={handleAssignIntervention} disabled={selectedTripIds.length === 0}>
                Assigner une intervention
              </Button>
            </div>
        </div>
        <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                  <div>
                      <CardTitle>Trajets</CardTitle>
                      <CardDescription>Recherchez et gérez les trajets de votre flotte.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Rechercher..." className="pl-8 w-64" />
                      </div>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 gap-1">
                              <ListFilter className="h-3.5 w-3.5" />
                              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                              Filtres
                              </span>
                          </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuCheckboxItem checked>
                              Statut: Tous
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem>
                              SLA: Tous
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem>
                              Type: Tous
                          </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                      <Button>Exporter</Button>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      onCheckedChange={handleSelectAll} 
                      checked={selectedTripIds.length === visibleTrips.length && visibleTrips.length > 0}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>ID Trajet</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Départ</TableHead>
                  <TableHead>Livraison</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTrips.map((trip: any) => {
                  const vehicle = vehicles.find(v => v.vin === trip.vin);
                  const driver = drivers.find(d => d.id === trip.driverId);

                  return (
                    <TableRow key={trip.id} data-state={selectedTripIds.includes(trip.id) && "selected"}>
                      <TableCell>
                        <Checkbox 
                          onCheckedChange={(checked) => handleSelectRow(trip.id, !!checked)}
                          checked={selectedTripIds.includes(trip.id)}
                          aria-label={`Select trip ${trip.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{trip.id}</TableCell>
                      <TableCell>{trip.client}</TableCell>
                      <TableCell>{vehicle?.immatriculation || trip.vin}</TableCell>
                      <TableCell>{driver?.name || trip.driverId}</TableCell>
                      <TableCell>{format(new Date(trip.plannedStart), 'HH:mm')}</TableCell>
                      <TableCell>{format(new Date(trip.plannedEnd), 'HH:mm')}</TableCell>
                      <TableCell>{trip.eta || format(new Date(trip.plannedEnd), 'HH:mm')}</TableCell>
                      <TableCell className={getSlaColor(trip.slaStatus)}>{trip.slaStatus?.replace('_', ' ') || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(trip.status)}>
                          {trip.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild><Link href={`/trips/${trip.id}`}>Détails</Link></DropdownMenuItem>
                            <DropdownMenuItem>Notifier client</DropdownMenuItem>
                            <DropdownMenuItem>Exporter eCMR</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <DriverSafetyPanel visibleTrips={visibleTrips} />
      </div>
    </>
  );
}
