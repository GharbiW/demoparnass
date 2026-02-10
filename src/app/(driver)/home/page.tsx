
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, AlertTriangle, Fuel, ListChecks, GraduationCap, FileWarning, PlayCircle } from "lucide-react";
import Link from "next/link";

const todayTrip = {
  id: "TRIP-LY-001",
  client: "CARREFOUR",
  departure: "04:00 - Entrepôt Vénissieux",
  eta: "06:05",
  isAdr: false,
  isColdChain: true,
};

const vehicleStatus = {
  immatriculation: "AB-123-CD",
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

export default function DriverHomePage() {
  return (
    <div className="space-y-4">
      
      {/* Shift Management */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Bonjour Jean,</h2>
            <Button>Démarrer mon shift</Button>
        </CardContent>
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
        <CardContent>
          <p><strong>Départ:</strong> {todayTrip.departure}</p>
          <p><strong>ETA:</strong> {todayTrip.eta}</p>
        </CardContent>
        <CardFooter>
            <Button className="w-full" asChild>
                <Link href={`/m/inspection/pre-trip/${todayTrip.id}`}>Commencer le trajet</Link>
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
                <CardTitle className="text-base flex items-center"><ListChecks className="mr-2"/>Checklist départ</CardTitle>
            </CardHeader>
            <CardContent>
                <Button variant="outline" className="w-full">Voir / Compléter</Button>
            </CardContent>
        </Card>
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
    </div>
  );
}
