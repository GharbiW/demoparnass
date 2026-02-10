
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ListFilter, Search, Sparkles, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { anomalies as initialAnomalies, type Anomaly } from "@/lib/anomalies-data";
import { AnomalyDetailsDialog, AssignAnomalyDialog } from "@/components/anomalies/anomaly-dialogs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMockData } from "@/hooks/use-mock-data";

const getSeverityVariant = (severity: Anomaly['severity']) => {
  switch (severity) {
    case 'Critique': return 'destructive';
    case 'Haute': return 'secondary';
    case 'Moyenne': return 'outline';
    default: return 'default';
  }
};


export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>(initialAnomalies);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [assignAnomaly, setAssignAnomaly] = useState<Anomaly | null>(null);
  const [isAutoResolving, setIsAutoResolving] = useState(false);
  const { toast } = useToast();
  const { trips, drivers, vehiclesData } = useMockData();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterScope, setFilterScope] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [filterLive, setFilterLive] = useState("all");


  const { uniqueScopes, uniqueSeverities, uniqueZones } = useMemo(() => {
    const scopes = new Set<string>();
    const severities = new Set<string>();
    const zones = new Set<string>();

    initialAnomalies.forEach(anomaly => {
        scopes.add(anomaly.scope);
        severities.add(anomaly.severity);
        const trip = trips.find(t => t.id === anomaly.context);
        if(trip?.site) zones.add(trip.site);
    });

    return {
      uniqueScopes: Array.from(scopes),
      uniqueSeverities: Array.from(severities),
      uniqueZones: Array.from(zones),
    };
  }, [initialAnomalies, trips]);

  const filteredAnomalies = useMemo(() => {
    const now = new Date().getTime();
    return anomalies.filter(anomaly => {
        const trip = trips.find(t => t.id === anomaly.context);
        const driver = drivers.find(d => d.id === trip?.driverId);
        const vehicle = vehiclesData.find(v => v.vin === trip?.vin);

        const searchMatch = searchTerm === "" || 
            anomaly.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            anomaly.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            anomaly.context.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle?.immatriculation.toLowerCase().includes(searchTerm.toLowerCase());

        const scopeMatch = filterScope === "all" || anomaly.scope === filterScope;
        const severityMatch = filterSeverity === "all" || anomaly.severity === filterSeverity;
        const zoneMatch = filterZone === "all" || trip?.site === filterZone;
        
        const isLive = (now - new Date(anomaly.timestamp).getTime()) < 600000; // 10 minutes
        const liveMatch = filterLive === "all" || (filterLive === "live" && isLive) || (filterLive === "past" && !isLive);

        return searchMatch && scopeMatch && severityMatch && zoneMatch && liveMatch;
    })
  }, [anomalies, trips, drivers, vehiclesData, searchTerm, filterScope, filterSeverity, filterZone, filterLive]);


  const handleStatusChange = (anomalyId: string, newStatus: Anomaly['status']) => {
    setAnomalies(anomalies.map(a => a.id === anomalyId ? { ...a, status: newStatus } : a));
  };
  
  const handleAutoResolveToggle = (checked: boolean) => {
    setIsAutoResolving(checked);
    if (checked) {
      toast({
        title: "Auto-résolution activée",
        description: "L'IA va maintenant traiter automatiquement les anomalies mineures.",
      });

      // Simulate AI processing
      setTimeout(() => {
        let resolvedCount = 0;
        setAnomalies(currentAnomalies =>
          currentAnomalies.map(a => {
            if (a.status === 'Ouvert' && a.severity === 'Basse') {
              resolvedCount++;
              return { ...a, status: 'Fermé' };
            }
            return a;
          })
        );

        if (resolvedCount > 0) {
          toast({
            title: "Résolution automatique (IA)",
            description: `${resolvedCount} anomalie(s) mineure(s) ont été automatiquement fermée(s).`,
          });
        }
        setIsAutoResolving(false); // Turn toggle off after action for demo
      }, 2000);
    }
  };

  const liveResolutionRate = 75; // Mock data
  const globalResolutionRate = 92; // Mock data

  const AnomalyCard = ({ anomaly }: { anomaly: Anomaly }) => {
    const isLive = (new Date().getTime() - new Date(anomaly.timestamp).getTime()) < 600000; // less than 10 minutes old

    return (
    <Card className={cn('hover:shadow-md transition-shadow', isLive && anomaly.status === 'Ouvert' && 'bg-destructive/10 border-destructive animate-pulse')}>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center">
                {isLive && anomaly.status === 'Ouvert' && <AlertCircle className="h-4 w-4 mr-2 text-destructive"/>}
                {anomaly.scope}: {anomaly.description}
            </CardTitle>
            <CardDescription className="text-xs">{anomaly.context} - {new Date(anomaly.timestamp).toLocaleString('fr-FR')}</CardDescription>
          </div>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mt-2 -mr-2"><MoreHorizontal className="h-4 w-4"/></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedAnomaly(anomaly)}>Voir détails</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAssignAnomaly(anomaly)}>Assigner</DropdownMenuItem>
                  <DropdownMenuItem>Créer ticket</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusChange(anomaly.id, 'Fermé')}>Marquer comme résolu</DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardFooter className="p-4 pt-0">
        <Badge variant={getSeverityVariant(anomaly.severity)}>{anomaly.severity}</Badge>
      </CardFooter>
    </Card>
  )};

  const KanbanColumn = ({ title, anomalies, status, children }: { title: string; anomalies: Anomaly[], status: Anomaly['status'], children?: React.ReactNode }) => (
      <div className="flex flex-col gap-4 p-4 bg-muted/50 rounded-lg min-h-[400px]">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold tracking-tight">{title} ({anomalies.filter(a => a.status === status).length})</h2>
            {children}
          </div>
          <div className="flex flex-col gap-4">
              {anomalies.filter(a => a.status === status).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(anomaly => <AnomalyCard key={anomaly.id} anomaly={anomaly} />)}
          </div>
      </div>
  )

  return (
    <>
      <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold font-headline">Gestion des Anomalies</h1>
              <div className="flex items-center gap-2">
                  <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Rechercher par contexte..." className="pl-8 w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
              </div>
        </div>

        <Card>
            <CardContent className="p-4 flex flex-wrap items-center gap-2">
                <Select value={filterLive} onValueChange={setFilterLive}>
                    <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Live / Passé</SelectItem>
                        <SelectItem value="live">Live Uniquement</SelectItem>
                        <SelectItem value="past">Passé Uniquement</SelectItem>
                    </SelectContent>
                </Select>
                 <Select value={filterScope} onValueChange={setFilterScope}>
                    <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        {uniqueScopes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                    <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les sévérités</SelectItem>
                        {uniqueSeverities.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={filterZone} onValueChange={setFilterZone}>
                    <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les zones</SelectItem>
                        {uniqueZones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Performance de Résolution</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <Label>Taux de Résolution (Live - 24h)</Label>
                        <span className="font-bold text-lg">{liveResolutionRate}%</span>
                    </div>
                    <Progress value={liveResolutionRate} />
                     <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500"/> +5% vs hier
                    </p>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <Label>Taux de Résolution (Global - 30j)</Label>
                         <span className="font-bold text-lg">{globalResolutionRate}%</span>
                    </div>
                    <Progress value={globalResolutionRate} />
                     <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <TrendingDown className="h-4 w-4 mr-1 text-red-500"/> -1.2% vs mois dernier
                    </p>
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow items-start">
          <KanbanColumn title="Ouvert" anomalies={filteredAnomalies} status="Ouvert">
            <div className="flex items-center space-x-2">
                <Switch id="auto-resolve" checked={isAutoResolving} onCheckedChange={handleAutoResolveToggle} />
                <Label htmlFor="auto-resolve" className="text-xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-accent" />
                    Auto-traiter
                </Label>
            </div>
          </KanbanColumn>
          <KanbanColumn title="Pris en compte" anomalies={filteredAnomalies} status="Pris en compte" />
          <KanbanColumn title="Fermé" anomalies={filteredAnomalies} status="Fermé" />
        </div>
      </div>

      <AnomalyDetailsDialog
        anomaly={selectedAnomaly}
        open={!!selectedAnomaly}
        onOpenChange={(isOpen) => !isOpen && setSelectedAnomaly(null)}
      />

      <AssignAnomalyDialog
        anomaly={assignAnomaly}
        open={!!assignAnomaly}
        onOpenChange={(isOpen) => !isOpen && setAssignAnomaly(null)}
        onAssign={(anomalyId, userId) => {
          console.log(`Assigning anomaly ${anomalyId} to user ${userId}`);
          handleStatusChange(anomalyId, 'Pris en compte');
        }}
      />
    </>
  );
}
