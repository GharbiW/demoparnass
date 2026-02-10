

"use client";

import React from 'react';
import { PredictiveMaintenanceClient } from "@/components/vehicles/predictive-maintenance-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Copy, Wrench, Siren, Droplet, Thermometer, FileText, Upload, BarChart, DollarSign, Leaf, MapPin, Video, CalendarDays, Truck as TruckIcon, Play } from "lucide-react";
import { useParams } from 'next/navigation';

import { maintenanceTickets, inspectionHistory } from "@/lib/vehicles-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ReeferChart } from "@/components/vehicles/reefer-chart";
import { fuelTransactions, fuelExceptions } from "@/lib/fuel-data";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMockData } from '@/hooks/use-mock-data';
import { format } from 'date-fns';
import Link from 'next/link';
import { LiveTripMap } from '../trips/live-trip-map';
import { useToast } from '@/hooks/use-toast';


const telematicsData = {
    livePosition: { lat: 45.75, lon: 4.85, speed: 55, timestamp: "2024-07-31 14:05:12" },
    trace24h: [ { lat: 45.76, lon: 4.83 }, { lat: 45.75, lon: 4.85 }, { lat: 45.74, lon: 4.86 } ],
    dtcCodes: [{ code: "P0420", description: "Efficacité du système de catalyseur inférieure au seuil (groupe 1)", criticality: "Haute" }],
    tpms: {
        avg: { pressure: 8.5, temp: 45 },
        avd: { pressure: 8.4, temp: 46 },
        arg: { pressure: 8.6, temp: 48 },
        ard: { pressure: 8.5, temp: 47 },
    },
    reefer: {
        setpoint: 4,
        temperature: [ {time: "10:00", temp: 4.1}, {time: "11:00", temp: 4.3}, {time: "12:00", temp: 5.1}, {time: "13:00", temp: 4.2} ]
    }
}

const costsData = {
    tco30d: 0.45,
    tco90d: 0.43,
    breakdown: [
        { name: 'Carburant', value: 55, fill: 'hsl(var(--chart-1))' },
        { name: 'Péage', value: 15, fill: 'hsl(var(--chart-2))'},
        { name: 'Maintenance', value: 12, fill: 'hsl(var(--chart-3))'},
        { name: 'Assurance', value: 8, fill: 'hsl(var(--chart-4))'},
        { name: 'Leasing', value: 10, fill: 'hsl(var(--chart-5))'},
    ],
    co2: 750,
    classAvgCo2: 780,
}

const vehicleDocuments = [
    { id: 'DOC-CG-1', type: 'Carte Grise', expiry: 'N/A', status: 'Valide' },
    { id: 'DOC-ASS-1', type: 'Assurance', expiry: '2025-06-30', status: 'Valide' },
    { id: 'DOC-CT-1', type: 'Contrôle Technique', expiry: '2024-08-25', status: 'À renouveler' },
]

export function VehicleDetailClient({ vin: vinProp }: { vin: string }) {
    const params = useParams();
    const vin = (params.vin || vinProp) as string;
  const { vehiclesData, trips, drivers } = useMockData();
  const vehicle = vehiclesData.find(v => v.vin === vin);
  const vehicleTrips = trips.filter(t => t.vin === vin);
  const { toast } = useToast();

  if (!vehicle) {
    return (
        <Card>
            <CardHeader><CardTitle>Chargement...</CardTitle></CardHeader>
            <CardContent>
                <p>Chargement des données du véhicule...</p>
            </CardContent>
        </Card>
    );
  }

  const handleAction = (message: string) => {
    toast({ title: "Action Simulée", description: message });
  };
  
  const handleCopyVin = () => {
    navigator.clipboard.writeText(vin);
    toast({ title: "Copié!", description: "Le VIN a été copié dans le presse-papiers." });
  }

  const getPriorityVariant = (priority: string) => {
      switch (priority) {
          case "Critique": return "destructive"
          case "Haute": return "secondary"
          default: return "outline"
      }
  }

  const getExceptionBadgeVariant = (severity: string) => {
      switch (severity) {
          case 'Haute': return 'destructive';
          case 'Moyenne': return 'secondary';
          default: return 'outline';
      }
  }
  
   const getDocStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Valide': return 'secondary';
      case 'À renouveler': return 'destructive';
      default: return 'outline';
    }
  }
  
  const getResultVariant = (result?: string) => {
    if (result === "Dommage détecté") return "destructive";
    return "default";
  };


  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm -mx-6 -mt-6 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
              {vehicle.immatriculation} 
              <Badge variant="outline">{vehicle.energie}</Badge>
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{vin}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCopyVin}>
                      <Copy className="h-3 w-3"/>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copier le VIN</TooltipContent>
                </Tooltip>
              </TooltipProvider>
               <span>•</span>
              <span>{vehicle.site}</span>
               <span>•</span>
              <Badge variant={vehicle.statut === 'Disponible' ? 'secondary' : 'default'}>{vehicle.statut}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-sm font-semibold">Kilométrage</p>
                <p className="text-lg font-bold">{vehicle.kilometrage.toLocaleString('fr-FR')} km</p>
              </div>
               <div>
                <p className="text-sm font-semibold">Prochain Service</p>
                <p className="text-lg font-bold">{vehicle.prochainService}</p>
              </div>
              <Separator orientation="vertical" className="h-10"/>
              <div className="flex gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex flex-col items-center">
                          <span className="font-bold text-lg">{vehicle.dtcAlert ? <AlertCircle className="text-destructive"/> : <CheckCircle className="text-green-600"/>}</span>
                          <span className="text-xs">DTC Actifs</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{vehicle.dtcAlert ? 'Codes défauts actifs' : 'Aucun code défaut'}</TooltipContent>
                  </Tooltip>
                   <Tooltip>
                    <TooltipTrigger>
                      <div className="flex flex-col items-center">
                          <span className="font-bold text-lg">{vehicle.tpmsAlert ? <AlertCircle className="text-amber-500"/> : <CheckCircle className="text-green-600"/>}</span>
                          <span className="text-xs">Alertes TPMS</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{vehicle.tpmsAlert ? 'Alertes de pression des pneus' : 'TPMS OK'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-9 w-full">
          <TabsTrigger value="predictions">Prédictions IA</TabsTrigger>
          <TabsTrigger value="assignments">Trajets</TabsTrigger>
          <TabsTrigger value="health">Santé</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="map">Carte & Replay</TabsTrigger>
          <TabsTrigger value="fuel">Carburant</TabsTrigger>
          <TabsTrigger value="costs">Coûts</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
        </TabsList>
        <TabsContent value="predictions" className="mt-4">
           <PredictiveMaintenanceClient vin={vin} />
        </TabsContent>
         <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Trajets</CardTitle>
              <CardDescription>Liste des trajets planifiés et effectués par ce véhicule.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Trajet</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleTrips.map(trip => {
                    const driver = drivers.find(d => d.id === trip.driverId);
                    return (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">
                          <Link href={`/trips/${trip.id}`} className="text-primary hover:underline">{trip.id}</Link>
                        </TableCell>
                        <TableCell>{driver?.name || trip.driverId}</TableCell>
                        <TableCell>{format(new Date(trip.plannedStart), 'dd/MM/yy HH:mm')}</TableCell>
                        <TableCell>{format(new Date(trip.plannedEnd), 'dd/MM/yy HH:mm')}</TableCell>
                        <TableCell><Badge variant={trip.status === 'in_progress' ? 'secondary' : 'outline'}>{trip.status.replace('_', ' ')}</Badge></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="health" className="mt-4">
            <Card>
                <CardHeader><CardTitle>Santé & Capteurs</CardTitle><CardDescription>Données en temps réel des capteurs du véhicule.</CardDescription></CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center text-base"><Siren className="mr-2"/>Codes DTC Actifs</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Description</TableHead><TableHead>Criticité</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {telematicsData.dtcCodes.map(dtc => (
                                        <TableRow key={dtc.code}>
                                            <TableCell className="font-mono">{dtc.code}</TableCell>
                                            <TableCell>{dtc.description}</TableCell>
                                            <TableCell><Badge variant={getPriorityVariant(dtc.criticality)}>{dtc.criticality}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center text-base"><Droplet className="mr-2"/>TPMS</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                {Object.entries(telematicsData.tpms).map(([key, value]) => (
                                    <div key={key} className="p-4 bg-muted/50 rounded-lg">
                                        <p className="font-bold uppercase text-sm">{key}</p>
                                        <p className="text-lg">{value.pressure} bar</p>
                                        <p className="text-xs text-muted-foreground">{value.temp}°C</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle className="flex items-center text-base"><Thermometer className="mr-2"/>Reefer</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-center mb-2">Setpoint: <span className="font-bold">{telematicsData.reefer.setpoint}°C</span></p>
                            <ReeferChart temperatureData={telematicsData.reefer.temperature} />
                        </CardContent>
                    </Card>

                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="maintenance" className="mt-4">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                  <CardHeader><CardTitle>Tickets de Maintenance</CardTitle></CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Priorité</TableHead>
                                  <TableHead>Statut</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Créé le</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {maintenanceTickets.filter(t => t.vin === vehicle.vin).map(ticket => (
                                  <TableRow key={ticket.id}>
                                      <TableCell className="font-medium">
                                        <Link href={`/maintenance/${ticket.id}`} className="text-primary hover:underline">
                                          {ticket.id}
                                        </Link>
                                      </TableCell>
                                      <TableCell>{ticket.type}</TableCell>
                                      <TableCell><Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge></TableCell>
                                      <TableCell><Badge variant="outline">{ticket.status}</Badge></TableCell>
                                      <TableCell>{ticket.description}</TableCell>
                                      <TableCell>{ticket.createdAt}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                  </CardContent>
                  <CardFooter>
                      <Button onClick={() => handleAction("Ouverture du formulaire de création de ticket.")}>Créer un Ticket</Button>
                  </CardFooter>
              </Card>
            </div>
        </TabsContent>
        <TabsContent value="map" className="mt-4">
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center"><MapPin className="mr-2"/>Carte & Replay 24h</CardTitle>
                    <CardDescription>Position: {telematicsData.livePosition.lat}, {telematicsData.livePosition.lon} @ {telematicsData.livePosition.speed} km/h ({telematicsData.livePosition.timestamp})</CardDescription>
                </CardHeader>
                <CardContent className="p-0 relative h-[400px] bg-muted/50">
                    <LiveTripMap />
                </CardContent>
                <CardFooter className="flex justify-end p-2">
                    <Button onClick={() => handleAction("Le replay des dernières 24h a commencé.")}><Play className="mr-2" />Lancer le replay</Button>
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="fuel" className="mt-4">
          <Card>
              <CardHeader>
                  <CardTitle>Carburant & PASSalert</CardTitle>
                  <CardDescription>Transactions et alertes associées au véhicule.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Transactions</h3>
                   <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Station</TableHead>
                        <TableHead>Litres</TableHead>
                        <TableHead>Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fuelTransactions.filter(tx => tx.vin === vehicle.vin).map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{tx.date}</TableCell>
                          <TableCell>{tx.station}</TableCell>
                          <TableCell>{tx.litres.toFixed(2)}</TableCell>
                          <TableCell className="font-bold">{tx.amount.toFixed(2)} €</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                 <div>
                  <h3 className="font-semibold text-lg mb-2">Exceptions</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Sévérité</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fuelExceptions.filter(ex => ex.vin === vehicle.vin).map(ex => (
                                <TableRow key={ex.id}>
                                    <TableCell>{ex.date}</TableCell>
                                    <TableCell className="font-medium">{ex.type}</TableCell>
                                    <TableCell>{ex.description}</TableCell>
                                    <TableCell><Badge variant={getExceptionBadgeVariant(ex.severity)}>{ex.severity}</Badge></TableCell>
                                    <TableCell className="space-x-2">
                                      <Button variant="outline" size="sm" onClick={() => handleAction(`L'exception ${ex.id} a été validée.`)}>Valider</Button>
                                      <Button variant="destructive" size="sm" onClick={() => handleAction(`L'exception ${ex.id} a été invalidée.`)}>Invalider</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
              </CardContent>
               <CardFooter>
                  <Button onClick={() => handleAction("La carte carburant a été verrouillée pour ce véhicule.")}>Verrouiller la carte carburant</Button>
               </CardFooter>
          </Card>
        </TabsContent>
         <TabsContent value="costs" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Coûts & CO₂</CardTitle>
                    <CardDescription>Analyse des coûts opérationnels et des émissions.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6 p-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base"><DollarSign className="mr-2"/>TCO (Total Cost of Ownership)</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold">{costsData.tco30d.toFixed(2)}€/km</p>
                                    <p className="text-xs text-muted-foreground">30 derniers jours</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{costsData.tco90d.toFixed(2)}€/km</p>
                                    <p className="text-xs text-muted-foreground">90 derniers jours</p>
                                </div>
                            </div>
                            <div className="h-40 mt-4">
                                <p className="text-center text-sm font-medium">Répartition des coûts</p>
                                {/* Placeholder for chart */}
                                <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/50 rounded-lg">
                                    <BarChart className="w-8 h-8"/>
                                    <p>Graphique à venir</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base"><Leaf className="mr-2"/>Émissions CO₂</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-3xl font-bold">{costsData.co2} g/km</p>
                             <p className="text-sm text-muted-foreground">Moyenne 30 jours</p>
                             <div className="mt-4">
                                <p className="text-lg font-semibold text-green-600">
                                    {(((costsData.classAvgCo2 - costsData.co2) / costsData.classAvgCo2) * 100).toFixed(1)}%
                                </p>
                                <p className="text-xs text-muted-foreground">meilleur que la moyenne de la classe ({costsData.classAvgCo2} g/km)</p>
                             </div>
                        </CardContent>
                         <CardFooter>
                            <Button variant="outline" className="w-full" onClick={() => handleAction("Affichage de la comparaison des véhicules.")}>Comparer les véhicules</Button>
                         </CardFooter>
                    </Card>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="docs" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Documents & Conformité</CardTitle>
                    <CardDescription>Gestion des documents liés au véhicule.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type de document</TableHead>
                                <TableHead>Date d'expiration</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicleDocuments.map(doc => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">{doc.type}</TableCell>
                                    <TableCell>{doc.expiry}</TableCell>
                                    <TableCell><Badge variant={getDocStatusBadgeVariant(doc.status)}>{doc.status}</Badge></TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => handleAction(`Affichage du document ${doc.type}.`)}>Voir</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">OCR est simulé pour l'extraction de la date d'expiration.</p>
                    <Button onClick={() => handleAction("Ouverture de l'interface d'upload.")}><Upload className="mr-2"/>Uploader un document</Button>
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="inspections" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Historique des Inspections Vidéo</CardTitle>
                    <CardDescription>Vidéos pré et post-trajet pour le véhicule {vehicle.immatriculation}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Trajet</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inspectionHistory.filter(i => i.vin === vin).map(insp => (
                                <TableRow key={insp.id}>
                                    <TableCell>{insp.date}</TableCell>
                                    <TableCell>{insp.tripId}</TableCell>
                                    <TableCell><Badge variant={insp.type === 'Pré-trajet' ? 'outline' : 'secondary'}>{insp.type}</Badge></TableCell>
                                    <TableCell><Button size="sm" variant="outline" onClick={() => handleAction(`Affichage de la vidéo d'inspection ${insp.id}.`)}>Voir Vidéo</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
