
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, AlertTriangle, Fuel, ListChecks, GraduationCap, FileWarning, PlayCircle, Trophy, Sparkles, Coffee, Shield, QrCode } from "lucide-react";
import Link from "next/link";
import { CopilotBar } from "@/components/driver/copilot-bar";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const todayTrip = {
  id: "TRIP-LY-001",
  client: "CARREFOUR",
  departure: "04:00 - Entrepôt Vénissieux",
  arrival: "06:05 - Plateforme Lyon Nord, Quai 12",
  isAdr: false,
  isColdChain: true,
  stops: [
      { type: "Carburant", location: "AS24 Corbas", time: "07:30" },
      { type: "Pause 45min", location: "Aire de Mâcon", time: "09:00" },
  ]
};

const StopIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'Carburant': return <Fuel className="h-4 w-4 text-muted-foreground" />;
        case 'Pause 45min': return <Coffee className="h-4 w-4 text-muted-foreground" />;
        case 'Douane': return <Shield className="h-4 w-4 text-muted-foreground" />;
        default: return null;
    }
}


const vehicleStatus = {
  immatriculation: "AB-123-CD",
  location: "Parking P3, Emplacement 12",
  fuelPercent: 75,
  tpmsAlert: false,
  dtcAlert: true,
};

const coachingTasks = [
  { id: 1, title: "Revue vidéo: freinage brusque A7" },
  { id: 2, title: "Quiz: règles de stationnement" },
];

const trainings = [
    {id: 1, title: "Eco-conduite 2.0", status: "En retard"},
];

const docRenewals = [
    {id: 1, title: "Visite Médicale", daysLeft: 15},
];

const driverRank = {
    safety: 3,
    eco: 5,
    site: "Lyon"
}

export default function DriverHomePage() {
  const [qrScanned, setQrScanned] = useState(false);
  const { toast } = useToast();

  const handleScanQr = () => {
    // Simulate scanning
    toast({
        title: "QR Code scanné",
        description: `Véhicule ${vehicleStatus.immatriculation} confirmé pour le trajet ${todayTrip.id}.`,
    });
    setQrScanned(true);
  }

  return (
    <div className="space-y-4">
      
      {/* Shift Management */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Bonjour Jean,</h2>
            <Button>Démarrer mon shift</Button>
        </CardContent>
      </Card>
      
      {/* Leaderboard Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center"><Trophy className="mr-2 text-amber-500"/>Mes Classements</CardTitle>
          <CardDescription className="text-xs">Votre position sur le site de {driverRank.site}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-around text-center">
            <div>
                <p className="text-3xl font-bold">#{driverRank.safety}</p>
                <p className="text-sm">Sécurité</p>
            </div>
             <div>
                <p className="text-3xl font-bold">#{driverRank.eco}</p>
                <p className="text-sm">Éco-conduite</p>
            </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> Astuce: Évitez les accélérations brusques pour améliorer votre score éco.</p>
        </CardFooter>
      </Card>

      {/* Today's Trip */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Trajet du jour</span>
            <div className="flex items-center gap-2">
                {todayTrip.isColdChain && <Badge variant="outline" className="border-blue-400 text-blue-500">Froid</Badge>}
                {todayTrip.isAdr && <Badge variant="destructive">ADR</Badge>}
            </div>
          </CardTitle>
          <CardDescription>{todayTrip.client}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm">Véhicule</h4>
            <p><strong>Immatriculation:</strong> {vehicleStatus.immatriculation}</p>
            <p><strong>Emplacement:</strong> {vehicleStatus.location}</p>
          </div>
          <Separator />
          <p><strong>Départ:</strong> {todayTrip.departure}</p>
          <p><strong>Arrivée:</strong> {todayTrip.arrival}</p>
          <div>
            <h4 className="font-semibold text-sm">Arrêts prévus:</h4>
            <div className="mt-2 space-y-2">
                {todayTrip.stops.map((stop, index) => (
                    <div key={index} className="flex items-center gap-4 text-sm p-2 bg-muted/50 rounded-md">
                        <StopIcon type={stop.type} />
                        <div className="flex-grow">
                            <p className="font-semibold">{stop.type}</p>
                            <p className="text-xs text-muted-foreground">{stop.location}</p>
                        </div>
                        <p className="font-mono text-xs">{stop.time}</p>
                    </div>
                ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch space-y-4">
             <Separator />
             <div className="flex flex-col items-center gap-4">
                <p className="text-sm font-semibold">Étape 1: Confirmer le véhicule</p>
                <div className="p-4 bg-muted/50 rounded-lg flex flex-col items-center gap-2">
                    <QrCode className="h-20 w-20" />
                    <p className="text-xs text-muted-foreground">Scannez le code sur le véhicule</p>
                </div>
                <Button className="w-full" onClick={handleScanQr} variant="outline">
                    <QrCode className="mr-2"/> Scanner le QR code
                </Button>
            </div>
             <Separator />
            <Button className="w-full" asChild disabled={!qrScanned}>
                <Link href={`/m/inspection/pre-trip/${todayTrip.id}`}>Commencer l'inspection</Link>
            </Button>
        </CardFooter>
      </Card>

      {/* Vehicle Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mon véhicule</span>
            <Badge variant="outline">{vehicleStatus.immatriculation}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-around">
            <div className="text-center">
                <Fuel className="mx-auto h-8 w-8 text-primary"/>
                <p className="font-bold text-lg">{vehicleStatus.fuelPercent}%</p>
                <p className="text-xs text-muted-foreground">Carburant</p>
            </div>
            <div className="text-center">
                <AlertTriangle className={`mx-auto h-8 w-8 ${vehicleStatus.tpmsAlert ? 'text-destructive' : 'text-green-500'}`}/>
                <p className="font-bold text-lg">{vehicleStatus.tpmsAlert ? 'Alerte' : 'OK'}</p>
                <p className="text-xs text-muted-foreground">TPMS</p>
            </div>
            <div className="text-center">
                <AlertTriangle className={`mx-auto h-8 w-8 ${vehicleStatus.dtcAlert ? 'text-destructive' : 'text-green-500'}`}/>
                <p className="font-bold text-lg">{vehicleStatus.dtcAlert ? 'Alerte' : 'OK'}</p>
                <p className="text-xs text-muted-foreground">DTC</p>
            </div>
        </CardContent>
      </Card>

      {/* Other Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center"><GraduationCap className="mr-2"/>Tâches coaching</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                {coachingTasks.map(task => <p key={task.id} className="truncate">- {task.title}</p>)}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center"><PlayCircle className="mr-2"/>Mes formations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {trainings.map(t => (
                    <div key={t.id} className="flex justify-between items-center">
                        <span className="text-sm">{t.title}</span>
                        <Badge variant="destructive">{t.status}</Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center"><FileWarning className="mr-2"/>Docs à renouveler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                 {docRenewals.map(d => (
                    <div key={d.id} className="flex justify-between items-center">
                        <span className="text-sm">{d.title}</span>
                        <Badge variant="secondary">D-{d.daysLeft}</Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
       </div>
       <CopilotBar isFloating={false} />
    </div>
  );
}
