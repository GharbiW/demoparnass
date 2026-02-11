

"use client";

import Link from "next/link";
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
import {
  ChevronRight,
  ClipboardList,
  Sparkles,
  TrendingDown,
  Lightbulb,
  Loader2,
  Star,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  driverProfile,
  driverCompliance,
  driverShifts,
  telematicsData,
  driverIncidents,
  driverInfractions,
  aiPrediction,
} from "@/lib/driver-profile-data";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge } from "@/components/ui/gauge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, Tooltip } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { useMockData } from "@/hooks/use-mock-data";
import { useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const chartConfig = {
  value: {
    label: "Valeur",
  },
} satisfies ChartConfig;

const mockCoachingPlan = `**Plan de Coaching Personnalisé pour Jean Dupont**

**Objectif:** Améliorer l'éco-conduite et réduire les freinages brusques.

**1. Module E-learning (5 min):**
   - **Titre:** "Anticipation et Éco-conduite"
   - **Action:** Assigner le module via la plateforme de formation.

**2. Revue de Session de Conduite (10 min):**
   - **Trajet:** LGN-002 (30/07/2024)
   - **Événement:** Freinage brusque sur l'A7 à 08:45.
   - **Action:** Planifier une revue vidéo de 10 minutes avec le coach pour analyser la situation et discuter des alternatives.

**3. Objectif de la Semaine:**
   - **Métrique:** Réduire le nombre de freinages brusques par 100km de 50%.
   - **Suivi:** Le score sera suivi via le tableau de bord Télématique.

**Commentaire de l'IA:** Le chauffeur a une bonne performance globale, mais une intervention ciblée sur les freinages brusques peut réduire l'usure des freins de 5% et la consommation de carburant de 2%.`;


export default function DriverProfilePage() {
    const params = useParams();
    const driverId = params.driverId as string;
    const { driverAssignments, vehicles } = useMockData();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [coachingPlan, setCoachingPlan] = useState<string | null>(null);

    const [isAssignVehicleOpen, setAssignVehicleOpen] = useState(false);
    const [isDeclareIncidentOpen, setDeclareIncidentOpen] = useState(false);
    const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);

    const getDaysUntil = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    }

    const getBadgeForExpiry = (days: number) => {
        if (days <= 0) return <Badge variant="destructive">Expiré</Badge>
        if (days <= 7) return <Badge variant="destructive">D-{days}</Badge>
        if (days <= 30) return <Badge variant="secondary">D-{days}</Badge>
        return null;
    }
    
    const handleGenerateCoaching = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setCoachingPlan(mockCoachingPlan);
            setIsGenerating(false);
        }, 1500);
    };

    const handleAction = (message: string) => {
        toast({
            title: "Action Simulée",
            description: message,
        });
    };

    const medicalDays = getDaysUntil(driverCompliance.medical.nextCheckAt);
    const assignmentsForDriver = driverAssignments.filter((a: any) => a.driverId === driverId) || [];

  return (
    <>
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm -mx-6 -mt-6 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link href="/drivers" className="hover:underline">
                Chauffeurs
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">
                {driverProfile.name}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{driverProfile.site}</Badge>
                <Badge variant={driverProfile.status === 'Actif' ? 'secondary' : 'default'}>{driverProfile.status}</Badge>
                {getBadgeForExpiry(getDaysUntil(driverCompliance.licenceC.expiry))}
                {getBadgeForExpiry(medicalDays)}
            </div>
          </div>
           <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-sm font-semibold">Sécurité</p>
                    <p className="text-lg font-bold">96</p>
                </div>
                 <div className="text-right">
                    <p className="text-sm font-semibold">Éco-conduite</p>
                    <p className="text-lg font-bold">90</p>
                </div>
                 <div className="text-right">
                    <p className="text-sm font-semibold">Fatigue</p>
                    <Badge variant="secondary">Faible</Badge>
                </div>
                <Separator orientation="vertical" className="h-10"/>
                 <div className="text-right">
                    <p className="text-sm font-semibold">Incidents (30j)</p>
                    <p className="text-lg font-bold text-destructive">1</p>
                </div>
                 <div className="text-right">
                    <p className="text-sm font-semibold">Infractions (30j)</p>
                    <p className="text-lg font-bold">0</p>
                </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Col 1 */}
        <div className="col-span-1 flex flex-col gap-6">
            <Card>
                <CardHeader><CardTitle>Profil & Conformité (Opérationnel)</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <span>Email</span><span>{driverProfile.email}</span>
                        <span>Téléphone</span><span>{driverProfile.phone}</span>
                    </div>
                    <Separator/>
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                        <span>Permis C/CE</span><span className="flex justify-between">{driverCompliance.licenceC.number} {getBadgeForExpiry(getDaysUntil(driverCompliance.licenceC.expiry))}</span>
                        <span>Carte Tachy</span><span className="flex justify-between">{driverCompliance.tachyCard.number} {getBadgeForExpiry(getDaysUntil(driverCompliance.tachyCard.expiry))}</span>
                         <span>Visite Médicale</span><span className="flex justify-between">{driverCompliance.medical.nextCheckAt} {getBadgeForExpiry(medicalDays)}</span>
                        <span>FCO</span><span className="flex justify-between">{driverCompliance.fco.expiry} {getBadgeForExpiry(getDaysUntil(driverCompliance.fco.expiry))}</span>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Sparkles className="mr-2 text-accent"/>IA • Risques & Coaching</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                         <Gauge value={aiPrediction.riskAccident} size="small" label="Accident"/>
                         <Gauge value={aiPrediction.riskFatigue} size="small" label="Fatigue"/>
                         <Gauge value={aiPrediction.riskInfraction} size="small" label="Infraction"/>
                    </div>
                     
                    <Separator/>
                    <h4 className="text-sm font-medium">Facteurs principaux</h4>
                     <ul className="list-disc list-inside text-xs space-y-1">
                         {aiPrediction.topFactors.slice(0,2).map((factor, i) => <li key={i}>{factor}</li>)}
                    </ul>
                     
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleAction('Ouverture des détails de l\'analyse de risque.')}><Lightbulb className="mr-2"/>Expliquer</Button>
                    <Button onClick={handleGenerateCoaching}><ClipboardList className="mr-2"/>Générer coaching</Button>
                </CardFooter>
            </Card>
        </div>

        {/* Col 2 */}
        <div className="col-span-1 flex flex-col gap-6">
            <Tabs defaultValue="assignments" className="flex-grow">
                <TabsList className="w-full">
                    <TabsTrigger value="assignments">Affectations</TabsTrigger>
                    <TabsTrigger value="hos">Horaires (HOS)</TabsTrigger>
                </TabsList>
                <TabsContent value="assignments" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Historique d'Affectations</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {assignmentsForDriver.map((a: any) => (
                                <Link key={a.id} href={`/trips/${a.tripId}`} className="block hover:bg-muted/80 rounded-md">
                                    <div className="flex items-center justify-between p-2">
                                        <div>
                                            <p className="font-bold">{a.vehicle}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(a.from).toLocaleDateString('fr-FR')} au {a.to ? new Date(a.to).toLocaleDateString('fr-FR') : 'présent'}</p>
                                        </div>
                                        <Badge variant={a.status === 'Actif' ? 'secondary' : 'outline'}>{a.status}</Badge>
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                         <CardFooter>
                            <Button className="w-full" onClick={() => setAssignVehicleOpen(true)}>Assigner un véhicule</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="hos" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Derniers Shifts</CardTitle></CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead><TableHead>Heures</TableHead><TableHead>Statut</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {driverShifts.map(s => (
                                        <TableRow key={s.id}>
                                            <TableCell>{s.date}</TableCell>
                                            <TableCell>{s.hours}</TableCell>
                                            <TableCell><Badge variant={s.status === 'En cours' ? 'destructive' : (s.status === 'Validé' ? 'secondary' : 'outline') }>{s.status}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                         <CardFooter className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => handleAction('Le shift en cours a été clôturé.')}>Clore Shift</Button>
                            <Button className="flex-1" onClick={() => handleAction('Un nouveau shift a été ouvert pour ce chauffeur.')}>Ouvrir Shift</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>

        {/* Col 3 */}
        <div className="col-span-1 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Conduite & Télématique (14j)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Gauge value={telematicsData.securityScore[6]} size="medium" label="Score Sécurité" showValue={true} />
                        <Gauge value={telematicsData.ecoScore[6]} size="medium" label="Score Éco" showValue={true} />
                    </div>
                    <div className="h-[100px]">
                        <ChartContainer config={chartConfig} className="w-full h-full">
                        <LineChart accessibilityLayer data={telematicsData.harshBraking.map((v, i) => ({day: i, value: v}))} margin={{top:5, right:10, left:10, bottom:0}}>
                            <Tooltip content={<ChartTooltipContent indicator="line" />} />
                            <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} dot={false}/>
                        </LineChart>
                        </ChartContainer>
                        <p className="text-center text-xs text-muted-foreground -mt-2">Freinages brusques</p>
                    </div>
                     <div>
                        <h4 className="text-sm font-medium mb-2">Mauvaises tendances</h4>
                        <div className="space-y-1">
                            {telematicsData.badTrends.map((trend, i) => (
                                <p key={i} className="text-xs flex items-center"><TrendingDown className="h-4 w-4 mr-2 text-destructive"/> {trend}</p>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Row 2 */}
        <div className="col-span-1 xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                 <CardHeader>
                    <CardTitle>Incidents & Infractions</CardTitle>
                </CardHeader>
                 <CardContent>
                     <h4 className="text-md font-semibold mb-2">Incidents déclarés</h4>
                     <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Catégorie</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {driverIncidents.map(inc => (
                                <TableRow key={inc.id}>
                                    <TableCell>{inc.date}</TableCell><TableCell>{inc.category}</TableCell><TableCell><Badge variant={inc.status === 'Clos' ? 'secondary' : 'destructive'}>{inc.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Button size="sm" className="mt-4" onClick={() => setDeclareIncidentOpen(true)}>Déclarer un incident</Button>
                    <Separator className="my-4" />
                    <h4 className="text-md font-semibold mb-2">Infractions</h4>
                    <Table>
                        <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Trajet</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                        <TableBody>
                             {driverInfractions.map(inf => (
                                <TableRow key={inf.id}>
                                    <TableCell>{inf.code}</TableCell><TableCell><Link href={`/trips/${inf.tripId}`} className="underline">{inf.tripId}</Link></TableCell><TableCell><Badge variant="outline">{inf.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </CardContent>
            </Card>
             <Card>
                 <CardHeader>
                    <CardTitle>Tâches de Coaching</CardTitle>
                </CardHeader>
                 <CardContent>
                       <div className="grid grid-cols-3 gap-2 text-xs">
                           <div className="bg-muted/30 p-2 rounded-md space-y-1">
                               <h5 className="font-bold">À faire (1)</h5>
                               <p className="p-1.5 bg-background rounded text-xs border">Revue vidéo: freinage brusque A7</p>
                           </div>
                           <div className="bg-muted/30 p-2 rounded-md space-y-1">
                               <h5 className="font-bold">En cours (0)</h5>
                           </div>
                            <div className="bg-muted/30 p-2 rounded-md space-y-1">
                               <h5 className="font-bold">Fait (2)</h5>
                                <p className="p-1.5 bg-background rounded text-xs border">Quiz: règles de stationnement</p>
                                <p className="p-1.5 bg-background rounded text-xs border">Checklist pré-départ</p>
                           </div>
                       </div>
                       <Button size="sm" variant="outline" className="mt-4" onClick={() => setCreateTaskOpen(true)}>Créer une tâche</Button>
                 </CardContent>
            </Card>
        </div>
      </main>
    </div>
    
    {/* Coaching Plan Dialog */}
    <Dialog open={!!coachingPlan} onOpenChange={() => setCoachingPlan(null)}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>Plan de Coaching Généré par IA</DialogTitle>
                <DialogDescription>
                    Voici un plan d'action personnalisé pour {driverProfile.name} basé sur les dernières données de télématique.
                </DialogDescription>
            </DialogHeader>
            <div className="prose prose-sm max-w-none mt-4 max-h-[60vh] overflow-y-auto">
                {isGenerating ? <Loader2 className="animate-spin" /> : <pre className="whitespace-pre-wrap font-sans">{coachingPlan}</pre>}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setCoachingPlan(null)}>Fermer</Button>
                <Button onClick={() => { handleAction('Le plan de coaching a été assigné au chauffeur.'); setCoachingPlan(null); }}>Assigner ce plan</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Assign Vehicle Dialog */}
    <Dialog open={isAssignVehicleOpen} onOpenChange={setAssignVehicleOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Assigner un véhicule</DialogTitle>
                <DialogDescription>Assignez un nouveau véhicule à {driverProfile.name}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="vehicle-select">Véhicule</Label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="Sélectionner un véhicule..." /></SelectTrigger>
                        <SelectContent>
                            {vehicles.map((v) => (
                                <SelectItem key={v.vin} value={v.vin}>{v.immatriculation} ({v.vin})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setAssignVehicleOpen(false)}>Annuler</Button>
                <Button onClick={() => { handleAction("Le véhicule a été assigné au chauffeur."); setAssignVehicleOpen(false); }}>Assigner</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Declare Incident Dialog */}
    <Dialog open={isDeclareIncidentOpen} onOpenChange={setDeclareIncidentOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Déclarer un incident</DialogTitle>
                <DialogDescription>Enregistrez un nouvel incident pour {driverProfile.name}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="incident-category">Catégorie</Label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="accrochage">Accrochage léger</SelectItem>
                            <SelectItem value="bris">Bris de glace</SelectItem>
                            <SelectItem value="vol">Vol de marchandise</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="incident-description">Description</Label>
                    <Textarea id="incident-description" placeholder="Décrivez l'incident..." />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDeclareIncidentOpen(false)}>Annuler</Button>
                <Button onClick={() => { handleAction("L'incident a été déclaré avec succès."); setDeclareIncidentOpen(false); }}>Déclarer</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    
    {/* Create Coaching Task Dialog */}
    <Dialog open={isCreateTaskOpen} onOpenChange={setCreateTaskOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Créer une tâche de coaching</DialogTitle>
                <DialogDescription>Créez une tâche de coaching personnalisée pour {driverProfile.name}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="task-title">Titre de la tâche</Label>
                    <Input id="task-title" placeholder="Ex: Revue vidéo de l'incident..." />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea id="task-description" placeholder="Ajouter plus de détails sur la tâche..." />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setCreateTaskOpen(false)}>Annuler</Button>
                <Button onClick={() => { handleAction("La tâche de coaching a été créée."); setCreateTaskOpen(false); }}>Créer</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

