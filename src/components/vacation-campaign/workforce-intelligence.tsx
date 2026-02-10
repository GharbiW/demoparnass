
"use client";

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignDriver, CampaignRequest, CapacityNeed } from "@/lib/vacation-campaign-data";
import { Bot, Combine, CheckCircle, Lightbulb, Loader2, ArrowRight, GitPullRequestArrow } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

interface WorkforceIntelligenceProps {
  drivers: CampaignDriver[];
  capacityNeeds: CapacityNeed[];
  requests: CampaignRequest[];
  onBatchUpdate: (updates: { requestId: string, status: CampaignRequest['status'] }[]) => void;
}

const getHeatmapColor = (delta: number) => {
    if (delta < 0) return 'bg-red-500/20';
    if (delta < 3) return 'bg-amber-500/20';
    return 'bg-green-500/20';
}

const getScoreColor = (score: number) => {
    if (score < 40) return 'bg-red-500/80';
    if (score < 70) return 'bg-amber-500/80';
    return 'bg-green-500/80';
}

const mockAiSolution = {
    problem: "Sous-capacité de -2 chauffeurs SPL pour la Semaine 32 en zone Sud-Est.",
    solutions: [
        {
            type: 'Négociation',
            description: "Suggérer à Chauffeur 18 de décaler ses congés à la semaine 34 (Score de flexibilité: 85%).",
            actionLabel: "Proposer",
            requestId: 'REQ-018'
        },
        {
            type: 'Substitution',
            description: "Approuver Chauffeur 22 (Score de priorité: 88). Chauffeur 4 (Polyvalent) peut couvrir ses trajets (Score de substitution: 92%).",
            actionLabel: "Approuver & Substituer",
            requestId: 'REQ-022'
        },
         {
            type: 'Alerte',
            description: "Si les actions échouent, prévoir 1 intérimaire pour couvrir le besoin critique.",
            actionLabel: "Créer Alerte RH",
            requestId: null
        }
    ]
};


export function WorkforceIntelligence({ drivers, capacityNeeds, requests, onBatchUpdate }: WorkforceIntelligenceProps) {
  const { toast } = useToast();
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState<typeof mockAiSolution | null>(null);

  const heatmapData = useMemo(() => {
    const data: Record<string, { totalCapacity: number, totalRequests: number, keys: string[] }> = {};
    const uniqueKeys = new Set<string>();
    const weeks = [...new Set(capacityNeeds.map(n => n.week))].sort((a,b) => a - b);

    // Aggregate capacity
    capacityNeeds.forEach(need => {
        const key = `${need.zone} - ${need.skill}`;
        uniqueKeys.add(key);
        if (!data[key]) data[key] = { totalCapacity: 0, totalRequests: 0, keys: [] };
        data[key].keys.push(`${need.week}-${need.zone}-${need.skill}`);
    });

    // Create matrix
    const matrix: Record<string, Record<number, { capacity: number, requests: number }>> = {};
    Array.from(uniqueKeys).sort().forEach(key => {
        matrix[key] = {};
        weeks.forEach(week => {
            const relevantNeeds = capacityNeeds.filter(n => n.week === week && `${n.zone} - ${n.skill}` === key);
            const capacity = relevantNeeds.reduce((sum, n) => sum + n.capacity, 0);

            const relevantRequests = requests.filter(r => r.status === 'accepted' && getWeekNumber(new Date(r.startDate)) <= week && getWeekNumber(new Date(r.endDate)) >= week && `${r.zone} - ${r.skill}` === key).length;
            
            matrix[key][week] = { capacity, requests: relevantRequests };
        })
    });
    
    return { matrix, weeks, keys: Array.from(uniqueKeys).sort() };
  }, [capacityNeeds, requests]);

  const substitutionMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    drivers.forEach(driver1 => {
      matrix[driver1.id] = {};
      drivers.forEach(driver2 => {
        if (driver1.id === driver2.id) {
          matrix[driver1.id][driver2.id] = 100;
        } else {
          let score = 0;
          if (driver1.zone === driver2.zone) score += 40;
          if (driver1.skill === 'Polyvalent' || driver2.skill === 'Polyvalent') score += 20;
          if (driver1.skill === driver2.skill) score += 30;
          const commonSkills = driver1.specialSkills.filter(s => driver2.specialSkills.includes(s)).length;
          score += commonSkills * 10;
          matrix[driver1.id][driver2.id] = Math.min(99, score);
        }
      });
    });
    return matrix;
  }, [drivers]);

  const criticalPoint = useMemo(() => {
      for(const key of heatmapData.keys) {
          for(const week of heatmapData.weeks) {
              const data = heatmapData.matrix[key][week];
              const delta = data.capacity - data.requests;
              if (delta < 0) {
                  return { week, key, delta };
              }
          }
      }
      return null;
  }, [heatmapData]);
  
  const handleSolve = () => {
    setIsSolving(true);
    setSolution(null);
    setTimeout(() => {
        setSolution(mockAiSolution);
        setIsSolving(false);
    }, 1500)
  }

  const handleApplySolution = (sol: typeof mockAiSolution.solutions[0]) => {
      if(sol.requestId){
         onBatchUpdate([{ requestId: sol.requestId, status: sol.type === 'Substitution' ? 'accepted' : 'negotiate' }]);
      }
      toast({
          title: "Action Appliquée",
          description: `L'action "${sol.description}" a été exécutée.`
      })
  }

  return (
    <div className="space-y-6">
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Bot className="mr-2"/>Optimiseur de Scénario de Congés (IA)</CardTitle>
                <CardDescription>Identifiez les points de blocage et laissez l'IA proposer un plan d'action pour résoudre les conflits de capacité.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {criticalPoint ? (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold text-destructive">Point de Blocage Détecté</h4>
                                <p className="text-sm">Semaine {criticalPoint.week} - {criticalPoint.key} (Marge: <span className="font-bold">{criticalPoint.delta}</span>)</p>
                            </div>
                            <Button onClick={handleSolve} disabled={isSolving}>
                                {isSolving ? <Loader2 className="mr-2 animate-spin"/> : <Lightbulb className="mr-2"/>}
                                Trouver une solution
                            </Button>
                        </div>
                    </div>
                ): (
                     <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                         <CheckCircle className="h-5 w-5 text-green-600"/>
                        <div>
                            <h4 className="font-semibold text-green-700">Aucun Point de Blocage Majeur</h4>
                            <p className="text-sm text-green-600/80">La capacité prévisionnelle est suffisante pour couvrir les congés actuellement validés.</p>
                        </div>
                    </div>
                )}
                
                {solution && (
                     <div className="mt-4">
                        <p className="text-sm font-semibold mb-2">Plan d'action suggéré pour: <span className="italic">{solution.problem}</span></p>
                        <div className="space-y-3">
                            {solution.solutions.map((sol, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 border rounded-md bg-muted/50">
                                    <div className="flex-grow">
                                        <Badge variant="outline" className="mb-1">{sol.type}</Badge>
                                        <p className="text-sm">{sol.description}</p>
                                    </div>
                                    <Button size="sm" onClick={() => handleApplySolution(sol)}>{sol.actionLabel}</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Heatmap des Risques de Capacité</CardTitle>
                <CardDescription>Vue d'ensemble de la marge de capacité (chauffeurs disponibles - congés validés) par semaine, zone et compétence.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 bg-card z-10 w-48">Zone - Compétence</TableHead>
                            {heatmapData.weeks.map(week => <TableHead key={week} className="text-center">S{week}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {heatmapData.keys.map(key => (
                            <TableRow key={key}>
                                <TableCell className="sticky left-0 bg-card z-10 font-semibold w-48">{key}</TableCell>
                                {heatmapData.weeks.map(week => {
                                    const data = heatmapData.matrix[key][week];
                                    const delta = data.capacity - data.requests;
                                    return (
                                        <TableCell key={week} className={cn("text-center font-bold text-lg p-4", getHeatmapColor(delta))}>
                                            {delta}
                                        </TableCell>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Combine className="mr-2" />Matrice de Substitution (IA)</CardTitle>
                <CardDescription>Score de "remplaçabilité" entre les chauffeurs basé sur la zone, les compétences et les certifications.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky top-0 bg-card z-10">Chauffeur</TableHead>
                            {drivers.slice(0,10).map(d => <TableHead key={d.id} className="text-center sticky top-0 bg-card z-10">{d.name}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {drivers.slice(0,10).map(d1 => (
                             <TableRow key={d1.id}>
                                <TableCell className="font-semibold sticky left-0 bg-card">{d1.name}</TableCell>
                                {drivers.slice(0,10).map(d2 => (
                                    <TableCell key={d2.id} className="text-center p-1">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Badge className={cn("text-white", getScoreColor(substitutionMatrix[d1.id]?.[d2.id] ?? 0))}>
                                                        {substitutionMatrix[d1.id]?.[d2.id] ?? 0}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Remplaçant: {d2.name}</p>
                                                    <p>Remplacé: {d1.name}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}

const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return weekNo;
}
