"use client";

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Bot, FileWarning, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignRequest, CapacityNeed } from "@/lib/vacation-campaign-data";
import { differenceInDays, addDays } from "date-fns";
import { useToast } from '@/hooks/use-toast';

interface RequestsConflictsViewProps {
  requests: CampaignRequest[];
  capacityNeeds: CapacityNeed[];
  onRunSimulation: (updatedRequests: CampaignRequest[]) => void;
  onSelectDriver: (driverId: string) => void;
}

const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
};

const getImpactVariant = (impact?: 'OK' | 'Tight' | 'KO'): 'secondary' | 'outline' | 'destructive' => {
  switch (impact) {
    case 'OK': return 'secondary';
    case 'Tight': return 'outline';
    case 'KO': return 'destructive';
    default: return 'outline';
  }
};
const getImpactRowClass = (impact?: 'OK' | 'Tight' | 'KO'): string => {
  switch (impact) {
    case 'OK': return 'bg-green-500/10 hover:bg-green-500/20';
    case 'Tight': return 'bg-amber-500/10 hover:bg-amber-500/20';
    case 'KO': return 'bg-red-500/10 hover:bg-red-500/20';
    default: return '';
  }
};


export function RequestsConflictsView({ requests, capacityNeeds, onRunSimulation, onSelectDriver }: RequestsConflictsViewProps) {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    zone: 'all',
    skill: 'all',
    status: 'all',
    impact: 'all',
    search: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRunSimulation = () => {
    setIsLoading(true);
    setTimeout(() => {
        const updatedRequests = requests.map(req => {
            const startWeek = getWeekNumber(new Date(req.startDate));
            const endWeek = getWeekNumber(new Date(req.endDate));
            let minDelta = Infinity;

            for (let w = startWeek; w <= endWeek; w++) {
                const need = capacityNeeds.find(n => n.week === w && n.zone === req.zone && n.skill === req.skill);
                if (need) {
                    const validatedRequestsInWeek = requests.filter(r => 
                        r.status === 'accepted' && 
                        r.id !== req.id &&
                        getWeekNumber(new Date(r.startDate)) <= w && 
                        getWeekNumber(new Date(r.endDate)) >= w &&
                        r.zone === req.zone &&
                        r.skill === req.skill
                    ).length;
                    const delta = need.capacity - validatedRequestsInWeek - 1; // -1 for the current request
                    if (delta < minDelta) minDelta = delta;
                }
            }
            
            let impact: CampaignRequest['impact'] = 'OK';
            if (minDelta < 0) impact = 'KO';
            else if (minDelta <= 2) impact = 'Tight';

            return {
                ...req,
                impact: req.status === 'accepted' || req.status === 'rejected' ? undefined : impact,
                delta: req.status === 'accepted' || req.status === 'rejected' ? undefined : minDelta,
                priorityScore: req.status === 'pending' ? Math.floor(Math.random() * 40 + 60) : undefined,
            }
        });
        onRunSimulation(updatedRequests);
        setIsLoading(false);
        toast({ title: "Simulation terminée", description: "L'impact et les scores de priorité ont été mis à jour." });
    }, 1500);
  };
  
  const filteredRequests = useMemo(() => {
      return requests.filter(req => {
          const searchLower = filters.search.toLowerCase();
          return (
              (filters.zone === 'all' || req.zone === filters.zone) &&
              (filters.skill === 'all' || req.skill === filters.skill) &&
              (filters.status === 'all' || req.status === filters.status) &&
              (filters.impact === 'all' || req.impact === filters.impact) &&
              (filters.search === '' || req.driverName.toLowerCase().includes(searchLower))
          );
      }).sort((a, b) => (a.priorityScore ?? 0) < (b.priorityScore ?? 0) ? 1 : -1);
  }, [requests, filters]);

  const uniqueZones = [...new Set(requests.map(r => r.zone))];
  const uniqueSkills = [...new Set(requests.map(r => r.skill))];


  return (
     <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                 <CardTitle>Toutes les Demandes &amp; Conflits</CardTitle>
                <CardDescription>Vue globale pour analyser l'impact et prioriser les décisions.</CardDescription>
            </div>
             <Button onClick={handleRunSimulation} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Bot className="mr-2"/>}
                Lancer la simulation
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50 mb-4">
            <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher chauffeur..." className="pl-8" value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value}))}/>
            </div>
            <Select value={filters.zone} onValueChange={(v) => setFilters(f => ({...f, zone: v}))}><SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Toutes les zones</SelectItem>{uniqueZones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent></Select>
            <Select value={filters.skill} onValueChange={(v) => setFilters(f => ({...f, skill: v}))}><SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Toutes les compétences</SelectItem>{uniqueSkills.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
            <Select value={filters.status} onValueChange={(v) => setFilters(f => ({...f, status: v}))}><SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem><SelectItem value="pending">En attente</SelectItem><SelectItem value="accepted">Accepté</SelectItem><SelectItem value="rejected">Rejeté</SelectItem><SelectItem value="negotiate">À négocier</SelectItem></SelectContent></Select>
            <Select value={filters.impact} onValueChange={(v) => setFilters(f => ({...f, impact: v}))}><SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Tous les impacts</SelectItem><SelectItem value="OK">OK</SelectItem><SelectItem value="Tight">Serré</SelectItem><SelectItem value="KO">KO</SelectItem></SelectContent></Select>
        </div>
        <div className="flex-grow overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Chauffeur</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead className="text-center">Durée</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-center">Impact</TableHead>
                        <TableHead className="text-center">Delta</TableHead>
                        <TableHead className="text-center">Score Priorité</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredRequests.map(req => (
                        <TableRow key={req.id} className={cn("cursor-pointer", getImpactRowClass(req.impact))} onClick={() => onSelectDriver(req.driverId)}>
                            <TableCell>
                                <p className="font-semibold">{req.driverName}</p>
                                <p className="text-xs text-muted-foreground">{req.zone} - {req.skill}</p>
                            </TableCell>
                            <TableCell>{new Date(req.startDate).toLocaleDateString('fr-FR')} - {new Date(req.endDate).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell className="text-center">{differenceInDays(addDays(new Date(req.endDate), 1), new Date(req.startDate))}j</TableCell>
                            <TableCell><Badge variant={req.status === 'accepted' ? 'secondary' : (req.status === 'rejected' ? 'destructive' : 'outline')}>{req.status}</Badge></TableCell>
                            <TableCell className="text-center"><Badge variant={getImpactVariant(req.impact)}>{req.impact || 'N/A'}</Badge></TableCell>
                            <TableCell className="text-center font-bold">{req.delta ?? 'N/A'}</TableCell>
                            <TableCell className="text-center font-bold">{req.priorityScore || '-'}</TableCell>
                        </TableRow>
                    ))}
                     {filteredRequests.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                {requests.some(r => r.impact) ? "Aucune demande ne correspond à vos filtres." : "Lancez la simulation pour voir l'analyse d'impact."}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}