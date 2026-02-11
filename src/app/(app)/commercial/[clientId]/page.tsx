
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Contract, Trip } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { mockDataService } from "@/lib/mock-data-service";
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
import { ChevronLeft, PlusCircle, FileText, User, Edit, Upload } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CreateContractDialog } from "@/components/commercial/create-contract-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const [contracts, setContracts] = React.useState<Contract[]>([]);
    const [trips, setTrips] = React.useState<Trip[]>([]);
    const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);

    const clientName = decodeURIComponent(params.clientId as string);

     React.useEffect(() => {
        const unsubscribe = mockDataService.subscribe(() => {
            setContracts(mockDataService.getContracts());
            setTrips(mockDataService.getTrips());
        });
        setContracts(mockDataService.getContracts());
        setTrips(mockDataService.getTrips());
        return unsubscribe;
    }, []);

    const clientContracts = contracts.filter((c: Contract) => c.client === clientName);
    const clientTrips = trips.filter((t: Trip) => t.client === clientName);
    
    const now = new Date();
    const upcomingTrips = clientTrips.filter((t: Trip) => new Date(t.plannedStart) > now);
    const liveTrips = clientTrips.filter((t: Trip) => t.status === 'in_progress');
    const pastTrips = clientTrips.filter((t: Trip) => new Date(t.plannedEnd) < now && t.status !== 'in_progress');


    const handleAddContract = (newContractData: Omit<Contract, 'id' | 'isSuspended'>) => {
        const newContract: Contract = {
            ...newContractData,
            id: `CTR-${clientName.substring(0,3).toUpperCase()}-${String(clientContracts.length + 1).padStart(3, '0')}`,
            client: clientName,
            isSuspended: false,
        };
        mockDataService.addContract(newContract); 
        setContracts(prev => [...(prev || []), newContract]);
        toast({
            title: "Contrat créé",
            description: `Le contrat pour ${newContract.client} a été ajouté avec succès.`,
        });
    }

    if (contracts.length === 0) {
        return <div>Chargement...</div>
    }

    if (clientContracts.length === 0) {
        // Find if client exists in trips even if no contract exists
        if (clientTrips.length > 0) {
            // Render a limited page if client exists but has no formal contracts
             return (
                 <>
                 <CreateContractDialog 
                    open={isCreateDialogOpen} 
                    onOpenChange={setCreateDialogOpen} 
                    onAddContract={handleAddContract}
                    clientName={clientName}
                />
                <div className="space-y-4">
                     <Button variant="ghost" asChild>
                        <Link href="/commercial"><ChevronLeft className="mr-2"/>Retour à la liste des clients</Link>
                    </Button>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold font-headline">Client: {clientName}</h1>
                        <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2"/>Nouveau Contrat</Button>
                    </div>
                    <Card>
                        <CardHeader><CardTitle>Commandes (Contrats)</CardTitle></CardHeader>
                        <CardContent><p>Ce client n'a pas de contrat cadre mais a des trajets enregistrés.</p></CardContent>
                    </Card>
                </div>
                </>
             )
        }
        return (
            <div>
                 <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ChevronLeft className="mr-2" /> Retour à la liste des clients
                </Button>
                <p>Client non trouvé.</p>
            </div>
        )
    }

  return (
    <>
         <CreateContractDialog 
            open={isCreateDialogOpen} 
            onOpenChange={setCreateDialogOpen} 
            onAddContract={handleAddContract}
            clientName={clientName}
        />
        <div className="space-y-6">
             <Button variant="ghost" asChild>
                <Link href="/commercial"><ChevronLeft className="mr-2"/>Retour à la liste des clients</Link>
            </Button>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-headline">Client: {clientName}</h1>
                <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2"/>Nouveau Contrat</Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span className="flex items-center"><User className="mr-2"/>Profil Client</span>
                            <Button variant="outline" size="sm"><Edit className="mr-2"/>Modifier</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><strong>Contact Principal:</strong> Jean-Michel Achat</p>
                        <p><strong>Email:</strong> jm.achat@carrefour.fr</p>
                        <p><strong>Téléphone:</strong> 04 78 00 00 00</p>
                        <p><strong>Adresse:</strong> 1, rue des Entrepôts, 69200 Vénissieux</p>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span className="flex items-center"><FileText className="mr-2"/>Documents</span>
                            <Button variant="outline" size="sm"><Upload className="mr-2"/>Uploader</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <ul className="list-disc list-inside">
                            <li>Cahier des Charges v1.2.pdf</li>
                            <li>Accord de Confidentialité.pdf</li>
                            <li>Conditions Générales de Vente.pdf</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>


            <Card>
                <CardHeader>
                    <CardTitle>Commandes (Contrats)</CardTitle>
                    <CardDescription>Liste de tous les contrats et spécifications pour {clientName}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="upcoming">
                        <TabsList>
                            <TabsTrigger value="upcoming">À venir ({upcomingTrips.length})</TabsTrigger>
                            <TabsTrigger value="live">En cours ({liveTrips.length})</TabsTrigger>
                            <TabsTrigger value="past">Terminés ({pastTrips.length})</TabsTrigger>
                            <TabsTrigger value="all">Tous les contrats ({clientContracts.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upcoming" className="mt-4">
                            <TripsTable trips={upcomingTrips} />
                        </TabsContent>
                        <TabsContent value="live" className="mt-4">
                            <TripsTable trips={liveTrips} />
                        </TabsContent>
                        <TabsContent value="past" className="mt-4">
                            <TripsTable trips={pastTrips} />
                        </TabsContent>
                        <TabsContent value="all" className="mt-4">
                            <ContractsTable contracts={clientContracts} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    </>
  )
}


function ContractsTable({ contracts }: { contracts: Contract[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Trajet</TableHead>
                    <TableHead>Fréquence</TableHead>
                    <TableHead>Contraintes</TableHead>
                    <TableHead>Validité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                        <TableCell>
                            <div className="font-semibold">{contract.originSite}</div>
                            <div className="text-muted-foreground text-xs">vers {contract.destinationSite}</div>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-1">{contract.daysOfWeek.map(day => <Badge key={day} variant="outline" className="text-xs">{day}</Badge>)}</div>
                            <div className="text-xs mt-1">{contract.departureTime} - {contract.arrivalTime}</div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1">
                                <Badge variant="secondary" className="w-fit">{contract.vehicleType}</Badge>
                                {contract.driverSkills.map(skill => <Badge key={skill} variant="outline" className="w-fit">{skill}</Badge>)}
                            </div>
                        </TableCell>
                        <TableCell className="text-xs">
                            <div>{format(new Date(contract.contractStart), "dd/MM/yyyy", { locale: fr })}</div>
                            <div>{format(new Date(contract.contractEnd), "dd/MM/yyyy", { locale: fr })}</div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={contract.isSuspended ? "destructive" : "secondary"}>
                                {contract.isSuspended ? "Suspendu" : "Actif"}
                            </Badge>
                        </TableCell>
                         <TableCell>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/contracts">Voir Contrat</Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

function TripsTable({ trips }: { trips: Trip[] }) {
    const drivers = mockDataService.getDrivers();
    const vehicles = mockDataService.getVehicles();
    
    if (trips.length === 0) {
        return <p className="text-center text-muted-foreground py-4">Aucun trajet dans cette catégorie.</p>
    }
    return (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID Trajet</TableHead>
                    <TableHead>Départ</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Statut</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {trips.map((trip) => {
                     const driver = drivers.find((d: any) => d.id === trip.driverId);
                     const vehicle = vehicles.find((v: any) => v.vin === trip.vin);
                    return (
                        <TableRow key={trip.id}>
                            <TableCell className="font-medium">
                                <Link href={`/trips/${trip.id}`} className="text-primary hover:underline">{trip.id}</Link>
                            </TableCell>
                            <TableCell>{format(new Date(trip.plannedStart), 'dd/MM HH:mm')}</TableCell>
                            <TableCell>{format(new Date(trip.plannedEnd), 'dd/MM HH:mm')}</TableCell>
                            <TableCell>{driver?.name || 'N/A'}</TableCell>
                            <TableCell>{vehicle?.immatriculation || 'N/A'}</TableCell>
                            <TableCell><Badge variant={trip.status === 'in_progress' ? 'secondary' : 'outline'}>{trip.status.replace('_', ' ')}</Badge></TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
