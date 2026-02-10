

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
  Loader2,
  FileText,
  CalendarOff,
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
  driverDocs,
  driverShifts,
  driverTrainings,
  contractInfo,
  absenceHistory,
  managerNotes,
} from "@/lib/driver-profile-data";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMockData } from "@/hooks/use-mock-data";
import { useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock function to simulate role-based masking
const useRole = () => ({ role: 'hr' }); // Change to 'hr' to see unmasked data

const PiiField = ({ value, isPii = true }: { value: string | number, isPii?: boolean }) => {
    const { role } = useRole();
    if (isPii && role !== 'hr') {
        return <span className="text-muted-foreground italic">Confidentiel</span>
    }
    return <span>{typeof value === 'number' ? `${value.toLocaleString('fr-FR')} €` : value}</span>
}

export default function EmployeeProfilePage() {
    const params = useParams();
    const employeeId = params.employeeId as string;
    const { driverAssignments, vehicles } = useMockData();
    const { toast } = useToast();

    const [isUploadDocOpen, setUploadDocOpen] = useState(false);
    const [isAssignVehicleOpen, setAssignVehicleOpen] = useState(false);
    const [isAssignTrainingOpen, setAssignTrainingOpen] = useState(false);

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
    
    const handleAction = (message: string) => {
        toast({
            title: "Action Simulée",
            description: message,
        });
    };

    const medicalDays = getDaysUntil(driverCompliance.medical.nextCheckAt);
    const assignmentsForDriver = driverAssignments.filter((a: any) => a.driverId === employeeId) || [];

  return (
    <>
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm -mx-6 -mt-6 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link href="/employees" className="hover:underline">
                Employés
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
        </div>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Col 1 */}
        <div className="col-span-1 flex flex-col gap-6">
            <Card>
                <CardHeader><CardTitle>Profil & Conformité (RH)</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <span>Email</span><PiiField value={driverProfile.email} />
                        <span>Téléphone</span><PiiField value={driverProfile.phone} />
                        <span>Langues</span><span>{driverProfile.languages.join(', ')}</span>
                        <span>Contact Urgence</span><PiiField value={driverProfile.emergencyContact} />
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
                    <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead><TableHead>Expiration</TableHead><TableHead>Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {driverDocs.map(doc => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">{doc.type}</TableCell>
                                    <TableCell>{doc.expiry} {getBadgeForExpiry(getDaysUntil(doc.expiry))}</TableCell>
                                    <TableCell><Badge variant={doc.status === 'Vérifié' ? 'secondary' : 'outline'}>{doc.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => handleAction('Tous les documents en attente sont marqués comme vérifiés.')}>Tout vérifier</Button>
                    <Button onClick={() => setUploadDocOpen(true)}>Uploader</Button>
                </CardFooter>
            </Card>
             <Card>
                <CardHeader><CardTitle>Contrat & Rémunération</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <span>Type Contrat</span><span className="font-medium">{contractInfo.type}</span>
                        <span>Date d'entrée</span><span>{contractInfo.startDate}</span>
                        <span>Manager</span><span>{contractInfo.manager}</span>
                        <span>Salaire (brut annuel)</span><span className="font-medium"><PiiField value={contractInfo.salary} /></span>
                    </div>
                </CardContent>
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
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><CalendarOff className="mr-2"/>Absences & Congés</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                        <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Solde CP</p>
                            <p className="font-bold text-lg">{contractInfo.leaveBalance.paid} jours</p>
                        </div>
                        <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Solde RTT</p>
                            <p className="font-bold text-lg">{contractInfo.leaveBalance.rtt} jours</p>
                        </div>
                    </div>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Période</TableHead><TableHead>Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {absenceHistory.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.period}</TableCell>
                                    <TableCell><Badge variant={req.status === 'Approuvé' ? 'secondary' : 'outline'}>{req.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        
        {/* Col 3 */}
        <div className="col-span-1 xl:col-span-1 grid grid-cols-1 gap-6">
             <Card>
                 <CardHeader>
                    <CardTitle>Formations</CardTitle>
                </CardHeader>
                 <CardContent>
                     <div className="space-y-2">
                        {driverTrainings.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                <div>
                                    <p className="font-bold">{t.topic}</p>
                                    <p className="text-xs text-muted-foreground">Échéance: {t.dueAt}</p>
                                </div>
                                <Badge variant={t.completedAt ? 'secondary' : 'default'}>{t.completedAt ? `Fait (${t.score})` : 'À faire'}</Badge>
                            </div>
                        ))}
                     </div>
                 </CardContent>
                 <CardFooter>
                    <Button size="sm" className="w-full" onClick={() => setAssignTrainingOpen(true)}>Assigner une formation</Button>
                 </CardFooter>
            </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center"><Star className="mr-2"/>Évaluations & Notes Manager</CardTitle></CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        {managerNotes.map(note => (
                             <div key={note.id} className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm italic">"{note.content}"</p>
                                <p className="text-xs text-muted-foreground text-right mt-2">- {note.author} le {note.date}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button className="w-full">Ajouter une note</Button>
                 </CardFooter>
            </Card>
        </div>
      </main>
    </div>

    {/* Upload Document Dialog */}
    <Dialog open={isUploadDocOpen} onOpenChange={setUploadDocOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Uploader un document</DialogTitle>
                <DialogDescription>Ajoutez un nouveau document au profil de {driverProfile.name}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="doc-type">Type de document</Label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="Sélectionner un type..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="permis">Permis de Conduire</SelectItem>
                            <SelectItem value="fco">Carte FCO</SelectItem>
                            <SelectItem value="visite">Visite Médicale</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="doc-file">Fichier</Label>
                    <Input id="doc-file" type="file" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setUploadDocOpen(false)}>Annuler</Button>
                <Button onClick={() => { handleAction("Le document a été uploadé avec succès."); setUploadDocOpen(false); }}>Uploader</Button>
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
                                <SelectItem key={v.vin} value={v.vin}>{v.immatriculation} ({v.marque} {v.modele})</SelectItem>
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
    
    {/* Assign Training Dialog */}
    <Dialog open={isAssignTrainingOpen} onOpenChange={setAssignTrainingOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Assigner une formation</DialogTitle>
                <DialogDescription>Assignez une nouvelle formation à {driverProfile.name}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <div className="space-y-2">
                    <Label htmlFor="training-module">Module de formation</Label>
                    <Select>
                        <SelectTrigger><SelectValue placeholder="Sélectionner un module..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="eco">Éco-conduite 2.0</SelectItem>
                            <SelectItem value="adr">Mise à jour ADR</SelectItem>
                            <SelectItem value="stress">Gestion du stress</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="training-due-date">Échéance</Label>
                    <Input id="training-due-date" type="date" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setAssignTrainingOpen(false)}>Annuler</Button>
                <Button onClick={() => { handleAction("La formation a été assignée."); setAssignTrainingOpen(false); }}>Assigner</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}

