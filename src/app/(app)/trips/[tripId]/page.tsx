
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Car,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Coins,
  DollarSign,
  Download,
  FileCheck2,
  FileText,
  Fuel,
  Map,
  MessageSquareWarning,
  Pen,
  Pin,
  RefreshCcw,
  Truck,
  Upload,
  User,
  Video,
  Warehouse,
  Loader2,
  Zap,
} from "lucide-react";
import {
  tripEvents,
  waypoints,
  tripCosts,
} from "@/lib/trip-details-data";
import { TripRiskAssessmentClient } from "@/components/trips/trip-risk-assessment-client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import Image from "next/image";
import { useMockData } from "@/hooks/use-mock-data";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { Trip } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const LiveTripMap = dynamic(() => import('@/components/trips/live-trip-map').then(mod => mod.LiveTripMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />
});

const inspectionVideos = [
    {
        id: "INSP-PRE-001",
        type: "Inspection Pré-trajet",
        date: "2024-07-31 13:55",
        result: "OK",
        thumbnailUrl: "https://media.licdn.com/dms/image/v2/C5622AQFde6R2BUGGZA/feedshare-shrink_1280/feedshare-shrink_1280/0/1679397203426?e=1763596800&v=beta&t=UcBsOkR54WeG99_s18x4WnFCk-kYiNLV2hy6UnsR3SU"
    },
    {
        id: "INSP-POST-001",
        type: "Inspection Post-trajet",
        date: "N/A",
        result: null,
        thumbnailUrl: "https://media.licdn.com/dms/image/v2/C5622AQFde6R2BUGGZA/feedshare-shrink_1280/feedshare-shrink_1280/0/1679397203426?e=1763596800&v=beta&t=UcBsOkR54WeG99_s18x4WnFCk-kYiNLV2hy6UnsR3SU"
    }
]

const getSlaBadgeVariant = (slaStatus?: "on_time" | "at_risk" | "late") => {
  switch (slaStatus) {
    case "on_time":
      return "secondary";
    case "at_risk":
      return "outline";
    case "late":
      return "destructive";
    default:
        return "default";
  }
};

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case "in_progress": return "secondary";
        case "completed": return "default";
        case "planned":
            return "outline";
        default: return "default";
    }
}

const ReplanDialog = ({ onConfirm }: { onConfirm: () => void }) => (
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Suggestion de Re-planification (IA)</DialogTitle>
            <DialogDescription>L'IA a détecté une opportunité pour optimiser ce trajet.</DialogDescription>
        </DialogHeader>
        <Alert>
            <Bot className="h-4 w-4"/>
            <AlertTitle>Raisonnement</AlertTitle>
            <AlertDescription>
                Un accident sur l'A7 cause un retard estimé de 45min. L'itinéraire alternatif par l'A43 est plus long de 15km mais plus rapide.
            </AlertDescription>
        </Alert>
        <div className="grid grid-cols-2 gap-4 text-center my-4">
            <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Actuel</p>
                <p className="text-xl font-bold">18:45</p>
                <p className="text-sm">450 km / 95€</p>
            </div>
             <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg border border-green-500">
                <p className="text-sm text-green-700 dark:text-green-300">Suggestion IA</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">18:10</p>
                <p className="text-sm text-green-700 dark:text-green-300">465 km / 108€</p>
            </div>
        </div>
        <DialogFooter>
             <DialogTrigger asChild><Button variant="outline">Annuler</Button></DialogTrigger>
            <Button onClick={onConfirm}>
                <Check className="mr-2 h-4 w-4" /> Appliquer la suggestion
            </Button>
        </DialogFooter>
    </DialogContent>
);

const VideoDialog = ({ open, onOpenChange, inspection }: { open: boolean, onOpenChange: (open: boolean) => void, inspection: typeof inspectionVideos[0] | null }) => {
    if (!inspection) return null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{inspection.type}</DialogTitle>
                    <DialogDescription>{inspection.date}</DialogDescription>
                </DialogHeader>
                <div className="aspect-video bg-black rounded-lg">
                    <video src="/placeholder-video.mp4" controls autoPlay className="w-full h-full" />
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function TripDetailPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { trips, drivers, vehiclesData } = useMockData();
  const { toast } = useToast();
  
  const trip = trips.find((t: Trip) => t.id === tripId);
  
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showReplanDialog, setShowReplanDialog] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<typeof inspectionVideos[0] | null>(null);

  if (!trip) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Trajet non trouvé</CardTitle>
                <CardDescription>Le trajet avec l'ID {tripId} n'existe pas.</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  const driver = drivers.find((d: any) => d.id === trip.driverId);
  const vehicle = vehiclesData.find((v: any) => v.vin === trip.vin);

  const handleAction = (message: string) => {
    toast({ title: "Action Simulée", description: message });
  };
  
  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
        setShowReplanDialog(true);
        setIsRecalculating(false);
    }, 1500);
  }

  const handleConfirmReplan = () => {
      setShowReplanDialog(false);
      handleAction("L'itinéraire a été mis à jour et le chauffeur notifié.");
  }
  
  const isPlanned = trip.status.toLowerCase() === 'planned';
  const isInProgress = trip.status.toLowerCase() === 'in_progress';
  const isCompleted = trip.status.toLowerCase() === 'completed';

  return (
    <>
    <VideoDialog open={!!selectedVideo} onOpenChange={(isOpen) => !isOpen && setSelectedVideo(null)} inspection={selectedVideo} />

    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="sticky top-0 z-10 -mx-6 -mt-6 bg-background/80 px-6 py-4 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link href="/trips" className="hover:underline">
                Trajets
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">
                {tripId}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getStatusBadgeVariant(trip.status)}>{trip.status?.replace('_', ' ')}</Badge>
              <Badge variant="outline">{trip.client}</Badge>
              <Badge variant="outline">{trip.site}</Badge>
              {trip.isAdr && <Badge variant="destructive">ADR</Badge>}
              {trip.isColdChain && (
                <Badge variant="outline" className="border-blue-400 text-blue-500">
                  Froid ({trip.coldChainSetpoint}°C)
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
             <div>
                <div className="text-sm font-semibold flex items-center gap-1">SLA <Badge variant={getSlaBadgeVariant(trip.slaStatus)} className="px-1 py-0 h-4">{trip.slaStatus?.replace('_', ' ')}</Badge></div>
                <p className="text-lg font-bold">{trip.eta ? trip.eta : format(new Date(trip.plannedEnd), "HH:mm")}</p>
            </div>
            <Separator orientation="vertical" className="h-10"/>
             <div>
                <p className="text-sm font-semibold flex items-center gap-1"><Bot size={14}/>Risque ETA</p>
                <p className="text-lg font-bold text-amber-600">{trip.riskEta}%</p>
            </div>
             <div>
                <p className="text-sm font-semibold flex items-center gap-1"><Coins size={14}/>Surcoût Prévu</p>
                <p className="text-lg font-bold">15€</p>
            </div>
             <div>
                <p className="text-sm font-semibold flex items-center gap-1"><Clock size={14}/>Dwell Cumulé</p>
                <p className="text-lg font-bold">25 min</p>
            </div>
            <Dialog open={showReplanDialog} onOpenChange={setShowReplanDialog}>
                <DialogTrigger asChild>
                    <Button onClick={handleRecalculate} disabled={isRecalculating}>
                    {isRecalculating ? <Loader2 className="animate-spin"/> : <Zap size={16}/>}
                    Re-planifier (IA)
                    </Button>
                </DialogTrigger>
                <ReplanDialog onConfirm={handleConfirmReplan} />
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left column */}
        <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Map & Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Carte Live & Replay</CardTitle>
                        <CardDescription>Position: 45.75, 4.85 @ 85km/h (Dernier ping: 14:05)</CardDescription>
                    </CardHeader>
                    <CardContent className={cn("p-0 relative h-[400px] bg-muted/50", showReplanDialog ? 'z-0' : 'z-10')}>
                        <LiveTripMap />
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Timeline du Trajet</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative pl-6">
                             <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-border"></div>
                            {tripEvents.map((event, index) => (
                                <div key={index} className="flex items-start gap-4 mb-4">
                                     <div className={cn("absolute left-[-9px] h-5 w-5 rounded-full flex items-center justify-center", event.status === "done" ? "bg-primary" : "bg-muted-foreground")}>
                                        <event.icon className="h-3 w-3 text-white"/>
                                     </div>
                                     <div className="flex-1">
                                        <p className="font-semibold text-sm">{event.label}</p>
                                        <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
             
             {/* Plan vs Real */}
              <Card>
                <CardHeader>
                    <CardTitle>Plan vs Réel</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Étape</TableHead>
                                <TableHead>ETA Plan</TableHead>
                                <TableHead>ETA Réel</TableHead>
                                <TableHead>Écart</TableHead>
                                <TableHead>Slack Restant</TableHead>
                                <TableHead>Déviation</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {waypoints.map(wp => (
                                <TableRow key={wp.step}>
                                    <TableCell className="font-medium">{wp.step}</TableCell>
                                    <TableCell>{wp.plannedEta}</TableCell>
                                    <TableCell>{wp.actualEta}</TableCell>
                                    <TableCell className={wp.delta > 0 ? 'text-destructive' : 'text-green-600'}>
                                        {wp.delta > 0 ? `+${wp.delta}`: wp.delta} min
                                    </TableCell>
                                    <TableCell>{wp.remainingSlack} min</TableCell>
                                    <TableCell>{wp.deviation ? <AlertTriangle className="text-destructive"/> : <CheckCircle className="text-green-600"/>}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Inspections */}
            {!isPlanned && (
                <Card>
                    <CardHeader>
                        <CardTitle>Inspections Vidéo</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        {inspectionVideos.slice(0, isCompleted ? 2 : 1).map(inspection => (
                            <Card key={inspection.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-base"><Video className="mr-2"/>{inspection.type}</CardTitle>
                                    <CardDescription>{inspection.date}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="aspect-video relative bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center">
                                        <Image src={inspection.thumbnailUrl} alt={`Thumbnail for ${inspection.type}`} layout="fill" objectFit="cover" data-ai-hint="truck side" />
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white" onClick={() => setSelectedVideo(inspection)}>
                                                <Video className="h-8 w-8"/>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            )}


            {/* Documents */}
             <Card>
                <CardHeader>
                    <CardTitle>Documents & Preuves</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base"><FileText className="mr-2"/>eCMR</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                                <p className="text-sm text-muted-foreground">eCMR_TRIP123.pdf</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleAction("Le document eCMR a été téléchargé.")}><Download className="mr-2"/>Télécharger</Button>
                                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleAction("Ouverture du formulaire d'upload de document.")}><Upload className="mr-2"/>Uploader</Button>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-base"><FileCheck2 className="mr-2"/>Preuve de Livraison (POD)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg bg-muted/50">
                                <p className="text-sm text-muted-foreground">En attente de livraison</p>
                            </div>
                           <div className="flex gap-2">
                                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleAction("La signature a été enregistrée.")}><Pen className="mr-2"/>Signer</Button>
                                <Button variant="outline" className="flex-1" onClick={() => handleAction("Le lien de partage a été copié dans le presse-papiers.")}>Partager lien</Button>
                           </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
            
            {/* Costs */}
            <Card>
                <CardHeader>
                    <CardTitle>Coûts & Marge (Mission)</CardTitle>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Catégorie</TableHead>
                                <TableHead>Valeur</TableHead>
                                <TableHead>Coût</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="flex items-center"><Fuel className="mr-2"/>Carburant</TableCell>
                                <TableCell>{tripCosts.fuel.value}</TableCell>
                                <TableCell>{tripCosts.fuel.cost}€</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="flex items-center"><Car className="mr-2"/>Péages</TableCell>
                                <TableCell>{tripCosts.tolls.value}</TableCell>
                                <TableCell>{tripCosts.tolls.cost}€</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="flex items-center"><Clock className="mr-2"/>Détention</TableCell>
                                <TableCell>{tripCosts.detention.value}</TableCell>
                                <TableCell>{tripCosts.detention.cost}€</TableCell>
                            </TableRow>
                             <TableRow className="font-bold border-t-2">
                                <TableCell className="flex items-center"><DollarSign className="mr-2"/>Recette Estimée</TableCell>
                                <TableCell></TableCell>
                                <TableCell>{tripCosts.revenue}€</TableCell>
                            </TableRow>
                             <TableRow className="font-bold bg-muted/50">
                                <TableCell>Marge Estimée</TableCell>
                                <TableCell></TableCell>
                                <TableCell className={tripCosts.margin > 0 ? 'text-green-600' : 'text-destructive'}>{tripCosts.margin}€ ({((tripCosts.margin/tripCosts.revenue)*100).toFixed(1)}%)</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter>
                    <Button variant="outline" onClick={() => handleAction("Un export CSV des coûts est en cours de génération.")}>Exporter en CSV</Button>
                 </CardFooter>
            </Card>

            {/* AI */}
            <div id="ai-predictions">
              <TripRiskAssessmentClient tripId={tripId} />
            </div>

        </div>

        {/* Right column */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contexte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center"><Truck className="mr-2"/>Véhicule</h3>
                {vehicle ? (
                    <div className="text-sm p-2 bg-muted/50 rounded-md mt-2">
                        <p><strong>Immat:</strong> {vehicle.immatriculation}</p>
                        <p><strong>Niveau Carburant:</strong> 75%</p>
                        <div className="flex gap-2 mt-1">
                            <Badge variant={vehicle.tpmsAlert ? 'destructive' : 'secondary'}>{vehicle.tpmsAlert ? 'TPMS Alerte' : 'TPMS OK'}</Badge>
                            <Badge variant={vehicle.dtcAlert ? 'destructive' : 'secondary'}>{vehicle.dtcAlert ? `${vehicle.dtcCodes?.length || 0} DTC Actif` : 'Aucun DTC'}</Badge>
                        </div>
                        <Button asChild size="sm" variant="link" className="p-0 h-auto mt-2">
                           <Link href={`/vehicles/${trip.vin}`}>Ouvrir Véhicule 360 <ArrowRight className="ml-1 h-3 w-3"/></Link>
                        </Button>
                    </div>
                ) : <p className="text-sm text-muted-foreground">Véhicule non trouvé</p>}
              </div>
              <Separator />
               <div>
                <h3 className="font-semibold flex items-center"><User className="mr-2"/>Chauffeur</h3>
                 {driver ? (
                    <div className="text-sm p-2 bg-muted/50 rounded-md mt-2">
                        <p><strong>Nom:</strong> {driver.name}</p>
                        <p><strong>HOS:</strong> 4h15 restantes</p>
                        <div className="flex gap-2 mt-1">
                            <Badge variant="outline">Score Sec: {driver.scoreSecurite}</Badge>
                            <Badge variant="outline">Score Eco: {driver.scoreEco}</Badge>
                        </div>
                         <Button asChild size="sm" variant="link" className="p-0 h-auto mt-2">
                            <Link href={`/chauffeurs/${trip.driverId}`}>Ouvrir Chauffeur 360 <ArrowRight className="ml-1 h-3 w-3"/></Link>
                        </Button>
                    </div>
                 ) : <p className="text-sm text-muted-foreground">Chauffeur non trouvé</p>}
              </div>
            </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>Anomalies sur le trajet</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-1"/>
                        <div>
                            <p className="text-sm font-semibold">Déviation d'itinéraire</p>
                            <p className="text-xs text-muted-foreground">Détectée à 10:45 près de Mâcon.</p>
                        </div>
                      </div>
                  </div>
              </CardContent>
          </Card>
        </div>
      </main>
    </div>
    </>
  );
}
