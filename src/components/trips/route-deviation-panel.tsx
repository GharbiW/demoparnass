
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSearch, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Trip } from "@/lib/types";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface RouteDeviationPanelProps {
  visibleTrips: Trip[];
}

type Breach = {
  tripId: string;
  client: string;
  plannedStart: string;
  plannedEnd: string;
  deviationPercent: number;
  offRoutePercent: number;
  lastPoint: { lat: number; lon: number; stamp: string };
};

const mockAnalysisResult = (trips: Trip[], tolerance: number): Breach[] => {
    const breaches: Breach[] = [];
    trips.forEach(trip => {
        // Simulate some deviation for demo purposes
        const deviationPercent = Math.floor(Math.random() * 40); // 0 to 39%
        const offRoutePercent = Math.floor(Math.random() * deviationPercent);
        
        if (deviationPercent > tolerance) {
            breaches.push({
                tripId: trip.id,
                client: trip.client,
                plannedStart: trip.plannedStart,
                plannedEnd: trip.plannedEnd,
                deviationPercent,
                offRoutePercent,
                lastPoint: { lat: 45.76, lon: 4.85, stamp: "14:05" },
            });
        }
    });
    return breaches;
}

const useRole = () => ({ role: 'fleet_manager' }); // 'analyst' for read-only

export function RouteDeviationPanel({ visibleTrips }: RouteDeviationPanelProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<Breach[] | null>(null);
  const { role } = useRole();
  const isReadOnly = role === 'analyst';

  const [prefs, setPrefs] = useState({
    tolerancePercent: 20,
    autoCreateAnomaly: true,
  });

  const handleAnalyze = () => {
    setIsLoading(true);
    setTimeout(() => {
      const results = mockAnalysisResult(visibleTrips, prefs.tolerancePercent);
      setAnalysisResult(results);
      setIsLoading(false);
      
      toast({
        title: "Analyse terminée",
        description: `${results.length} dépassement(s) de tolérance détecté(s).`,
      });

      if (prefs.autoCreateAnomaly && results.length > 0) {
        toast({
            title: "Anomalies créées",
            description: `${results.length} anomalie(s) d'écart d'itinéraire ont été automatiquement créées.`,
            variant: "default",
        });
      }

    }, 1500);
  };
  
  const createAnomaliesForSelection = (selection: Breach[]) => {
      if (isReadOnly) {
          toast({ variant: 'destructive', title: "Action non autorisée", description: "Votre rôle ne permet pas de créer des anomalies."});
          return;
      }
      toast({
        title: "Anomalies créées manuellement",
        description: `${selection.length} anomalie(s) ont été créées avec succès.`,
      });
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
            <ShieldCheck className="mr-2" />
            Sécurité Trajet – Écart d’itinéraire
        </CardTitle>
        <CardDescription>
            Analyse l’écart entre l’itinéraire planifié et la trajectoire réelle des trajets listés ci-dessus.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center p-4 border rounded-lg">
            <div className="lg:col-span-2">
                <Label htmlFor="tolerance-slider">Tolérance d’écart (%)</Label>
                <div className="flex items-center gap-4">
                    <Slider
                        id="tolerance-slider"
                        value={[prefs.tolerancePercent]}
                        onValueChange={(val) => setPrefs(p => ({...p, tolerancePercent: val[0]}))}
                        max={100}
                        step={5}
                        disabled={isReadOnly}
                    />
                    <Badge variant="outline" className="text-lg">{prefs.tolerancePercent}%</Badge>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="auto-anomaly-switch" checked={prefs.autoCreateAnomaly} onCheckedChange={(val) => setPrefs(p => ({...p, autoCreateAnomaly: val}))} disabled={isReadOnly} />
                <Label htmlFor="auto-anomaly-switch">Créer DIRECTEMENT une anomalie si &gt; tolérance</Label>
            </div>
             <p className="text-sm text-muted-foreground">Seuil off-route: 300 m</p>
        </div>
        
        <div className="flex items-center gap-4">
            <Button onClick={handleAnalyze} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <FileSearch className="mr-2"/>}
                Analyser les trajets affichés
            </Button>
            {analysisResult && analysisResult.length > 0 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="destructive" onClick={() => createAnomaliesForSelection(analysisResult)} disabled={isReadOnly}>
                                <AlertTriangle className="mr-2"/>
                                Créer anomalies pour tous les dépassements ({analysisResult.length})
                            </Button>
                        </TooltipTrigger>
                        {isReadOnly && <TooltipContent><p>Rôle Analyste: Création désactivée</p></TooltipContent>}
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>

        {analysisResult && (
            <div>
                <h3 className="text-lg font-semibold mb-2">Trajets en dépassement ({analysisResult.length})</h3>
                {analysisResult.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Trip ID</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Déviation %</TableHead>
                            <TableHead>Temps hors itinéraire %</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {analysisResult.map(breach => (
                            <TableRow key={breach.tripId}>
                                <TableCell className="font-medium">{breach.tripId}</TableCell>
                                <TableCell>{breach.client}</TableCell>
                                <TableCell><Badge variant="destructive">{breach.deviationPercent}%</Badge></TableCell>
                                <TableCell><Badge variant="secondary">{breach.offRoutePercent}%</Badge></TableCell>
                                <TableCell className="space-x-2">
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => createAnomaliesForSelection([breach])} disabled={isReadOnly}>Créer anomalie</Button>
                                            </TooltipTrigger>
                                            {isReadOnly && <TooltipContent><p>Rôle Analyste: Création désactivée</p></TooltipContent>}
                                        </Tooltip>
                                    </TooltipProvider>
                                    <Button variant="ghost" size="sm" asChild><Link href={`/trips/${breach.tripId}`}>Ouvrir Trajet</Link></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                ) : (
                    <p className="text-muted-foreground text-center py-4">Aucun dépassement détecté pour la tolérance de {prefs.tolerancePercent}%.</p>
                )}
            </div>
        )}

      </CardContent>
    </Card>
  );
}
