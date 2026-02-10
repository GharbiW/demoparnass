

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ListFilter, Truck, Users, Calendar, GanttChartIcon, List, PlusCircle, Sparkles, ChevronDown } from "lucide-react";
import { GanttChart } from "@/components/planning/gantt-chart";
import { Trip } from "@/lib/planning-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "@/components/ui/calendar";
import { addDays, format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { CreateTripDialog } from "@/components/planning/create-trip-dialog";
import { TripDetailsDialog } from "@/components/planning/trip-details-dialog";
import { TripList } from "@/components/planning/trip-list";
import { useMockData } from "@/hooks/use-mock-data";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const aiProposals = [
  {
    id: "v1",
    name: "Optimisé Coût",
    impact: { cost: -125, onTime: 2 },
    description: "Réduit les coûts en utilisant des véhicules GNC sur les longues distances."
  },
  {
    id: "v2",
    name: "Optimisé On-Time",
    impact: { cost: 45, onTime: 8 },
    description: "Priorise les arrivées à l'heure en ajoutant des marges sur les trajets à risque."
  },
  {
    id: "v4",
    name: "Rattacher une prestation (Gap Filling)",
    impact: { cost: -80, onTime: -1 },
    description: "Insère la commande EXP-105 dans le retour à vide du trajet LGN-002."
  },
  {
    id: "v5",
    name: "Points de Relais (Relay Solver)",
    impact: { cost: -200, onTime: 0 },
    description: "Suggère l'Aire de Beaune comme point de relais pour Paris ↔ Marseille."
  },
  {
    id: 'v6',
    name: 'Augmentation Utilisation Véhicule',
    impact: { cost: 0, onTime: 0 },
    description: 'Propose un trajet court pour le véhicule VUL-012 actuellement inactif.'
  },
  {
    id: 'v7',
    name: 'Vérifier Compatibilité',
    impact: { cost: 0, onTime: 0 },
    description: "Confirme que le chauffeur pour le trajet ADR-001 possède la certification requise."
  }
];

function PlanningPageContent() {
  const searchParams = useSearchParams()
  const { trips, vehicles, drivers } = useMockData();
  const [resourceViewMode, setResourceViewMode] = useState<ViewMode>('vehicles');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('gantt');
  const [ganttRange, setGanttRange] = useState<GanttRange>('day');

  const [date, setDate] = useState<Date>(new Date('2024-08-01T00:00:00'));
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [createTripDefaults, setCreateTripDefaults] = useState({});
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      const client = searchParams.get('client') || '';
      const pickup = searchParams.get('pickup') || '';
      const delivery = searchParams.get('delivery') || '';
      setCreateTripDefaults({ client, pickupLocation: pickup, deliveryLocation: delivery });
      setCreateOpen(true);
    }
  }, [searchParams]);

  const resources = resourceViewMode === 'vehicles' ? vehicles : drivers;

  const handleApplyProposal = (proposalName: string) => {
    toast({
        title: "Planification IA Appliquée",
        description: `Le plan "${proposalName}" a été appliqué au planning.`,
    });
  }

  const getGanttDateRange = () => {
    switch (ganttRange) {
      case 'day':
        return { start: date, end: date };
      case 'week':
        const start = startOfWeek(date, { locale: fr });
        return { start, end: addDays(start, 6) };
      case 'month':
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        return { start: startOfMonth, end: endOfMonth };
    }
  }
  const ganttDates = getGanttDateRange();

  const handleTripClick = (trip: Trip) => {
    setSelectedTrip(trip);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-headline">Planning Interactif</h1>
         <div className="flex items-center gap-2">
            <Button onClick={() => { setCreateTripDefaults({}); setCreateOpen(true); }}><PlusCircle /> Créer un trajet</Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Sparkles className="mr-2 text-accent" />
                  Plan Proposé (IA)
                  <ChevronDown className="ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80">
                <DropdownMenuLabel>Optimisations par l'IA</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {aiProposals.map((p) => (
                  <DropdownMenuItem key={p.id} className="items-start">
                    <div className="flex-grow">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                      {p.impact.cost !== 0 && (
                        <div className="flex gap-2 mt-2">
                          <Badge variant={p.impact.cost < 0 ? "secondary" : "destructive"}>{p.impact.cost}€</Badge>
                          <Badge variant="secondary">+{p.impact.onTime}% On-Time</Badge>
                        </div>
                      )}
                    </div>
                     <div className="flex flex-col gap-1 ml-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs">Prévisualiser</Button>
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleApplyProposal(p.name)}>Appliquer</Button>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-[240px] justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, "d MMMM yyyy", { locale: fr }) : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarIcon
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                <Button variant={displayMode === 'gantt' ? 'secondary' : 'ghost'} size="sm" onClick={() => setDisplayMode('gantt')}>
                    <GanttChartIcon className="mr-2 h-4 w-4"/>Gantt
                </Button>
                <Button variant={displayMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setDisplayMode('list')}>
                    <List className="mr-2 h-4 w-4"/>Liste
                </Button>
            </div>
             <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                <Button variant={resourceViewMode === 'vehicles' ? 'secondary' : 'ghost'} size="sm" onClick={() => setResourceViewMode('vehicles')}>
                    <Truck className="mr-2 h-4 w-4"/>Véhicules
                </Button>
                <Button variant={resourceViewMode === 'drivers' ? 'secondary' : 'ghost'} size="sm" onClick={() => setResourceViewMode('drivers')}>
                    <Users className="mr-2 h-4 w-4"/>Chauffeurs
                </Button>
            </div>
            {displayMode === 'gantt' && (
              <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                  <Button variant={ganttRange === 'day' ? 'secondary' : 'ghost'} size="sm" onClick={() => setGanttRange('day')}>Jour</Button>
                  <Button variant={ganttRange === 'week' ? 'secondary' : 'ghost'} size="sm" onClick={() => setGanttRange('week')}>Semaine</Button>
                  <Button variant={ganttRange === 'month' ? 'secondary' : 'ghost'} size="sm" onClick={() => setGanttRange('month')}>Mois</Button>
              </div>
            )}
         </div>
      </div>
      <Card className="flex-grow flex flex-col overflow-hidden">
        <CardContent className="flex-grow p-0 overflow-auto">
          {displayMode === 'gantt' ? (
              <GanttChart 
                resources={resources}
                trips={trips}
                viewMode={resourceViewMode}
                startDate={ganttDates.start}
                endDate={ganttDates.end}
                onTripClick={handleTripClick}
              />
          ) : (
            <TripList trips={trips} onTripClick={handleTripClick} />
          )}
        </CardContent>
      </Card>
      
      <CreateTripDialog open={isCreateOpen} onOpenChange={setCreateOpen} defaultValues={createTripDefaults} />
      
      <TripDetailsDialog
        trip={selectedTrip}
        open={!!selectedTrip}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedTrip(null);
          }
        }}
      />
    </div>
  );
}


export default function PlanningPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <PlanningPageContent />
        </Suspense>
    )
}
