
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { leaveRequests as initialRequests, weeklyCapacity } from "@/lib/conges-data";
import type { LeaveRequest, Trip, Driver } from "@/lib/types";
import { AlertCircle, CalendarCheck, CheckCircle, ListFilter, PlusCircle, Search, User, Users, XCircle, Bot, Loader2, Hourglass, CalendarDays, History, GanttChartIcon, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { suggestReplacement, type SuggestReplacementOutput } from "@/ai/flows/suggest-replacement-flow";
import type { ReplacementSuggestion } from "@/ai/flows/suggest-replacement-types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GanttChart } from "@/components/planning/gantt-chart";
import { useMockData } from "@/hooks/use-mock-data";
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";


const getStatusVariant = (status: LeaveRequest['status']) => {
  switch (status) {
    case 'Approuvé': return 'secondary';
    case 'Rejeté': return 'destructive';
    case 'En attente': return 'outline';
    default: return 'default';
  }
};

const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return weekNo;
}

const NewCampaignDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();
    const handleCreate = () => {
        toast({
            title: "Campagne Créée",
            description: "La nouvelle campagne de congés a été lancée.",
        });
        onOpenChange(false);
    }
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lancer une nouvelle campagne de congés</DialogTitle>
                    <DialogDescription>Définissez les paramètres pour la collecte des souhaits de congés.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="campaign-name">Nom de la campagne</Label>
                        <Input id="campaign-name" defaultValue="Campagne Estivale 2025" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Date de début</Label>
                            <Input id="start-date" type="date" defaultValue="2025-6-01" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">Date de fin</Label>
                            <Input id="end-date" type="date" defaultValue="2025-09-30" />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleCreate}>Lancer la campagne</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const NegotiateDialog = ({ open, onOpenChange, request }: { open: boolean, onOpenChange: (open: boolean) => void, request: LeaveRequest | null }) => {
    const { toast } = useToast();
    const [daysToRemove, setDaysToRemove] = useState(0);

    const handleSend = () => {
        if (!request) return;
        toast({
            title: "Négociation envoyée",
            description: `Votre proposition a été envoyée à ${request.driverName}.`,
        });
        onOpenChange(false);
    }
    
    if (!request) return null;

    const originalEndDate = new Date(request.endDate);
    const newEndDate = new Date(originalEndDate);
    newEndDate.setDate(originalEndDate.getDate() - daysToRemove);
    
    const originalDuration = (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 3600 * 24) + 1;
    const newDuration = originalDuration - daysToRemove;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Négocier avec {request.driverName}</DialogTitle>
                    <DialogDescription>Proposez une alternative pour la demande du {new Date(request.startDate).toLocaleDateString('fr-FR')} au {new Date(request.endDate).toLocaleDateString('fr-FR')}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-start-date">Nouvelle date de début</Label>
                            <Input id="new-start-date" type="date" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-end-date">Nouvelle date de fin</Label>
                            <Input id="new-end-date" type="date" defaultValue={daysToRemove > 0 ? newEndDate.toISOString().split('T')[0] : ''} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="days-to-remove">Réduire de (jours)</Label>
                        <Input id="days-to-remove" type="number" min="0" value={daysToRemove} onChange={(e) => setDaysToRemove(parseInt(e.target.value, 10) || 0)} />
                        {daysToRemove > 0 && (
                            <p className="text-xs text-muted-foreground">
                                La demande passerait de {originalDuration} à {newDuration} jours, se terminant le {newEndDate.toLocaleDateString('fr-FR')}.
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea id="message" placeholder="Bonjour, la période demandée est très chargée. Serait-il possible de décaler ou réduire vos congés ?" rows={4} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleSend}>Envoyer la proposition</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const ApproveDialog = ({ open, onOpenChange, request, onApprove, drivers }: { open: boolean, onOpenChange: (open: boolean) => void, request: LeaveRequest | null, onApprove: () => void, drivers: Driver[] }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<SuggestReplacementOutput | null>(null);
    const [selections, setSelections] = useState<Record<string, string>>({});

    const handleSelectionChange = (tripId: string, driverId: string) => {
        setSelections(prev => ({ ...prev, [tripId]: driverId }));
    };

    const isFullySelected = suggestions && suggestions.replacements.length > 0 && suggestions.replacements.every(rep => selections[rep.tripId]);

    React.useEffect(() => {
        if (open && request) {
            setIsLoading(true);
            setError(null);
            setSuggestions(null);
            setSelections({});
            
            const fetchSuggestions = async () => {
                try {
                    const result = await suggestReplacement({ 
                        driverId: request.driverId,
                        startDate: request.startDate,
                        endDate: request.endDate,
                    });
                    setSuggestions(result);
                } catch(e: any) {
                    setError(e.message || "Une erreur est survenue lors de la recherche de remplacements.");
                } finally {
                    setIsLoading(false);
                }
            }
            fetchSuggestions();
        }
    }, [open, request]);
    
    if (!request) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Approuver & Remplacer - Demande de {request.driverName}</DialogTitle>
                    <DialogDescription>
                        L'IA a identifié les trajets impactés. Choisissez les chauffeurs remplaçants.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-4">Analyse des plannings en cours...</p>
                        </div>
                    )}
                    {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" />{error}</Alert>}
                    {suggestions && (
                        <div>
                             <Alert>
                                <Bot className="h-4 w-4" />
                                <DialogTitle>Raisonnement de l'IA</DialogTitle>
                                <AlertDescription>{suggestions.reasoning}</AlertDescription>
                            </Alert>
                            {suggestions.replacements.length > 0 ? (
                                <Table className="mt-4">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Trajet Impacté</TableHead>
                                            <TableHead>Chauffeur Suggéré (Score)</TableHead>
                                            <TableHead className="w-[300px]">Choisir Remplacement</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {suggestions.replacements.map(rep => {
                                            const options = [
                                                { id: rep.suggestedDriverId, name: rep.suggestedDriverName },
                                                ...rep.otherOptions.map(name => {
                                                    const driver = drivers.find(d => d.name === name);
                                                    return driver ? { id: driver.id, name: driver.name } : null;
                                                }).filter((d): d is {id:string, name:string} => d !== null)
                                            ];
                                            
                                            return (
                                                <TableRow key={rep.tripId}>
                                                    <TableCell>{rep.tripId}</TableCell>
                                                    <TableCell className="font-semibold">{rep.suggestedDriverName} <Badge variant="secondary">{rep.matchScore}%</Badge></TableCell>
                                                    <TableCell>
                                                        <Select onValueChange={(driverId) => handleSelectionChange(rep.tripId, driverId)}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Choisir un chauffeur..."/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {options.map(opt => (
                                                                    <SelectItem key={opt.id} value={opt.id}>{opt.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>Aucun trajet n'est impacté par cette demande de congé.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={onApprove} disabled={Boolean(isLoading || error || ((suggestions?.replacements?.length ?? 0) > 0 && !isFullySelected))}>
                        <CheckCircle className="mr-2" /> Approuver & Confirmer les Remplacements
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const PlanLeaveDialog = ({ open, onOpenChange, drivers }: { open: boolean, onOpenChange: (open: boolean) => void, drivers: Driver[] }) => {
    const { toast } = useToast();

    const handlePlan = () => {
        toast({
            title: "Congé Planifié",
            description: "Une notification a été envoyée au chauffeur pour approbation.",
        });
        onOpenChange(false);
    }
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Planifier un congé pour un employé</DialogTitle>
                    <DialogDescription>Choisissez un chauffeur et une période. Le chauffeur devra approuver la demande.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Chauffeur</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un chauffeur..." />
                            </SelectTrigger>
                            <SelectContent>
                                {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="plan-start-date">Date de début</Label>
                            <Input id="plan-start-date" type="date" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan-end-date">Date de fin</Label>
                            <Input id="plan-end-date" type="date" />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="plan-message">Message (optionnel)</Label>
                        <Textarea id="plan-message" placeholder="Ex: Congés imposés pour la période de fermeture estivale." rows={3} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handlePlan}>Planifier et Notifier</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function CongesPage() {
    const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests);
    const { drivers } = useMockData();
    const { toast } = useToast();
    const [isCampaignDialogOpen, setCampaignDialogOpen] = useState(false);
    const [isPlanLeaveOpen, setPlanLeaveOpen] = useState(false);
    const [negotiatingRequest, setNegotiatingRequest] = useState<LeaveRequest | null>(null);
    const [approvingRequest, setApprovingRequest] = useState<LeaveRequest | null>(null);

    // Gantt filters
    const [date, setDate] = useState<Date>(new Date('2024-08-01T00:00:00'));
    const [ganttRange, setGanttRange] = useState<'day' | 'week' | 'month'>('month');
    const [typeFilter, setTypeFilter] = useState('Tous');
    const [siteFilter, setSiteFilter] = useState('Tous');

    const handleStatusChange = (requestId: string, status: LeaveRequest['status']) => {
        setRequests(requests.map(r => r.id === requestId ? { ...r, status } : r));
        toast({
            title: `Demande ${status.toLowerCase().slice(0, -1)}e`,
            description: `Le statut de la demande ${requestId} a été mis à jour.`
        })
        if (approvingRequest) setApprovingRequest(null);
    }
    
    const absenceData = React.useMemo(() => {
        const weeks = [31, 32, 33, 34, 35, 36];
        const driverTypes: LeaveRequest['driverType'][] = ['CM', 'Polyvalent', 'SPL', 'VL'];
        const data: Record<string, Record<number, number>> = {};
        driverTypes.forEach(type => data[type] = {});

        requests.forEach(req => {
            if (req.status === 'Approuvé') {
                const week = getWeekNumber(new Date(req.startDate));
                if (weeks.includes(week)) {
                    if (!data[req.driverType]?.[week]) {
                        if (!data[req.driverType]) data[req.driverType] = {};
                        data[req.driverType][week] = 0;
                    }
                    data[req.driverType][week]++;
                }
            }
        });
        return data;
    }, [requests]);

    const weeklyTotals = React.useMemo(() => {
        const totals: Record<number, number> = {};
         Object.values(absenceData).forEach(weekData => {
            for (const week in weekData) {
                if (!totals[week]) totals[week] = 0;
                totals[week] += weekData[week];
            }
        });
        return totals;
    }, [absenceData]);
    
    const leaveRequestsAsTrips: Trip[] = requests
        .filter(r => r.status === 'Approuvé')
        .map(r => ({
            id: r.id,
            client: `Congé - ${r.driverName}`,
            vin: 'N/A',
            driverId: r.driverId,
            pickupLocation: '',
            deliveryLocation: '',
            plannedStart: new Date(r.startDate).toISOString(),
            plannedEnd: new Date(`${r.endDate}T23:59:59`).toISOString(),
            status: 'completed',
            type: 'express'
        }));

    const filteredDrivers = React.useMemo(() => {
        return drivers.filter((d: Driver) => {
            const typeMatch = typeFilter === 'Tous' || d.driverType === typeFilter;
            const siteMatch = siteFilter === 'Tous' || d.site === siteFilter;
            return typeMatch && siteMatch;
        });
    }, [drivers, typeFilter, siteFilter]);
    
    const uniqueSites = React.useMemo(() => Array.from(new Set(drivers.map(d => d.site))), [drivers]);
    const uniqueTypes = React.useMemo(() => Array.from(new Set(drivers.map(d => d.driverType))), [drivers]);

    const handleDateChange = (days: number) => {
        setDate(currentDate => addDays(currentDate, days));
    };

    const getGanttDateRange = () => {
        switch (ganttRange) {
            case 'day':
                return { start: date, end: date };
            case 'week':
                return { start: startOfWeek(date, { locale: fr }), end: endOfWeek(date, { locale: fr }) };
            case 'month':
            default:
                return { start: startOfMonth(date), end: endOfMonth(date) };
        }
    };
    const ganttDates = getGanttDateRange();


  return (
    <>
    <NewCampaignDialog open={isCampaignDialogOpen} onOpenChange={setCampaignDialogOpen} />
    <PlanLeaveDialog open={isPlanLeaveOpen} onOpenChange={setPlanLeaveOpen} drivers={drivers} />
    <NegotiateDialog open={!!negotiatingRequest} onOpenChange={() => setNegotiatingRequest(null)} request={negotiatingRequest} />
    <ApproveDialog open={!!approvingRequest} onOpenChange={() => setApprovingRequest(null)} request={approvingRequest} onApprove={() => handleStatusChange(approvingRequest!.id, 'Approuvé')} drivers={drivers} />
    
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2"><CalendarCheck/>Gestion des Congés Individuels</h1>
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher chauffeur..." className="pl-8 w-64" />
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
                <DropdownMenuCheckboxItem checked>Statut: Tous</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Site: Tous</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Typologie: Toutes</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
             <Button variant="outline" onClick={() => setPlanLeaveOpen(true)}>Planifier un Congé</Button>
            <Button onClick={() => setCampaignDialogOpen(true)}><PlusCircle className="mr-2"/>Nouvelle Campagne</Button>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes en Attente</CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requests.filter(r => r.status === 'En attente').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chauffeurs en Congé (S+1)</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
               <p className="text-xs text-muted-foreground">pour la semaine du 12 au 18 août</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux d'Absence (S33)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">25%</div>
               <p className="text-xs text-muted-foreground">Semaine critique : 12 au 18 août</p>
            </CardContent>
          </Card>
        </div>
      
        <Tabs defaultValue="requests">
            <TabsList>
                <TabsTrigger value="requests">Demandes en Attente</TabsTrigger>
                <TabsTrigger value="gantt"><GanttChartIcon className="mr-2"/>Gantt des Congés</TabsTrigger>
                <TabsTrigger value="summary">Synthèse des Absences</TabsTrigger>
                <TabsTrigger value="history">Historique Complet</TabsTrigger>
            </TabsList>
            <TabsContent value="requests" className="mt-4">
                <Card>
                    <CardHeader>
                    <CardTitle>Demandes de Congés en Attente</CardTitle>
                    <CardDescription>Liste des demandes soumises par les chauffeurs et en attente de validation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Chauffeur</TableHead>
                            <TableHead>Typologie</TableHead>
                            <TableHead>Période Demandée</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {requests.filter(r => r.status === 'En attente').map((req) => (
                            <TableRow key={req.id}>
                            <TableCell>
                                <div className="font-medium">{req.driverName}</div>
                                <div className="text-sm text-muted-foreground">{req.site}</div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{req.driverType}</Badge></TableCell>
                            <TableCell>
                                {new Date(req.startDate).toLocaleDateString('fr-FR')} - {new Date(req.endDate).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                            </TableCell>
                            <TableCell className="space-x-2">
                                <Button variant="secondary" size="sm" onClick={() => setApprovingRequest(req)}><CheckCircle className="mr-1"/> Approuver (IA)</Button>
                                <Button variant="ghost" size="sm" onClick={() => handleStatusChange(req.id, 'Rejeté')}><XCircle className="mr-1"/> Rejeter</Button>
                                <Button variant="ghost" size="sm" onClick={() => setNegotiatingRequest(req)}>Négocier</Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="gantt" className="mt-4">
                <Card className="h-[70vh] flex flex-col">
                    <CardHeader>
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <div>
                                <CardTitle>Gantt des Congés</CardTitle>
                                <CardDescription>Vue d'ensemble des congés approuvés.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                 <Select value={siteFilter} onValueChange={setSiteFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filtrer par site..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tous">Tous les sites</SelectItem>
                                        {uniqueSites.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                 <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filtrer par typologie..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tous">Toutes les typologies</SelectItem>
                                        {uniqueTypes.map(t => t && <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                                    <Button variant={ganttRange === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => setGanttRange('day')}>Jour</Button>
                                    <Button variant={ganttRange === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setGanttRange('week')}>Semaine</Button>
                                    <Button variant={ganttRange === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => setGanttRange('month')}>Mois</Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDateChange(-1)}><ChevronLeft/></Button>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("h-8 w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4"/>
                                                {format(date, "d MMMM yyyy", { locale: fr })}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent><Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)}/></PopoverContent>
                                    </Popover>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDateChange(1)}><ChevronRight/></Button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 overflow-auto">
                        <GanttChart
                            resources={filteredDrivers}
                            trips={leaveRequestsAsTrips}
                            viewMode="drivers"
                            startDate={ganttDates.start}
                            endDate={ganttDates.end}
                            onTripClick={() => {}}
                        />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="summary" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Synthèse des Absences</CardTitle>
                        <CardDescription>Vue hebdomadaire des absences par type de chauffeur.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Types de chauffeurs</TableHead>
                                    {weeklyCapacity.map(w => <TableHead key={w.weekNumber} className="text-center">S{w.weekNumber}<p className="text-xs font-normal">{w.dateRange}</p></TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(absenceData).map(([type, weekData]) => (
                                    <TableRow key={type}>
                                        <TableCell className="font-semibold">{`CHAUFFEUR ${type}`}</TableCell>
                                        {weeklyCapacity.map(w => <TableCell key={w.weekNumber} className="text-center">{weekData[w.weekNumber] || 0}</TableCell>)}
                                    </TableRow>
                                ))}
                                <TableRow className="font-bold bg-muted/50">
                                    <TableCell>Total absences</TableCell>
                                    {weeklyCapacity.map(w => <TableCell key={w.weekNumber} className="text-center">{weeklyTotals[w.weekNumber] || 0}</TableCell>)}
                                </TableRow>
                                <TableRow className="font-bold">
                                    <TableCell>Chauffeurs disponibles</TableCell>
                                    {weeklyCapacity.map(w => <TableCell key={w.weekNumber} className="text-center">{w.capacity - (weeklyTotals[w.weekNumber] || 0)}</TableCell>)}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Historique de Toutes les Demandes</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Chauffeur</TableHead>
                                <TableHead>Typologie</TableHead>
                                <TableHead>Période</TableHead>
                                <TableHead>Statut</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.id}>
                                <TableCell>
                                    <div className="font-medium">{req.driverName}</div>
                                    <div className="text-sm text-muted-foreground">{req.site}</div>
                                </TableCell>
                                <TableCell><Badge variant="outline">{req.driverType}</Badge></TableCell>
                                <TableCell>
                                    {new Date(req.startDate).toLocaleDateString('fr-FR')} - {new Date(req.endDate).toLocaleDateString('fr-FR')}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
    </>
  );
}
