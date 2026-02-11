
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, FormProvider, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@/lib/zod-resolver";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Fuel, Coffee, Shield, Trash2, PlusCircle, Users, Wand2, Bot, Loader2, Sparkles, Flag, CheckCircle } from "lucide-react";
import { fr } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Separator } from "../ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMockData } from "@/hooks/use-mock-data";
import { mockDataService } from "@/lib/mock-data-service";
import { planTrip, type PlanTripOutput } from "@/ai/flows/plan-trip-flow";

interface CreateTripDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: Partial<z.infer<typeof tripFormSchema>>;
}

const stopSchema = z.object({
    type: z.enum(["Pause 45min", "Carburant", "Douane", "Relais", "Autre"]),
    location: z.string().min(1, "Lieu requis"),
    estimatedTime: z.date({ required_error: "Heure requise" }),
});

const tripFormSchema = z.object({
    client: z.string().optional(),
    contractId: z.string().optional(),
    pickupLocation: z.string().min(1, "Le lieu d'enlèvement est requis."),
    deliveryLocation: z.string().min(1, "Le lieu de livraison est requis."),
    vin: z.string().optional(),
    driverId: z.string().optional(),
    driver2Id: z.string().optional(),
    relayPoint: z.string().optional(),
    plannedStart: z.date().optional(),
    plannedEnd: z.date().optional(),
    stops: z.array(stopSchema).optional(),
    demoMode: z.boolean().default(true),
});

const getMockPlan = (): PlanTripOutput & { driver2Id?: string, relayPoint?: string } => ({
    tripId: `AI-TRIP-${Date.now().toString().slice(-6)}`,
    client: "DASSAULT",
    vin: "VIN-DEMO-001", // A GNC vehicle
    driverId: "DRV-JDU-001", // Driver from Lyon
    driver2Id: "DRV-SBE-004", // Driver from Paris for relay
    relayPoint: "Aire de Beaune-Merceuil",
    plannedStart: new Date("2024-08-03T08:00:00").toISOString(),
    plannedEnd: new Date("2024-08-03T18:30:00").toISOString(),
    estimatedDistanceKm: 750,
    routeSummary: "Via A6, avec relais chauffeur",
    stops: [
        { type: "Autre" as const, location: "Aire de Beaune-Merceuil", estimatedTime: new Date("2024-08-03T12:30:00").toISOString() },
        { type: "Carburant", location: "Aire de Service de Nemours", estimatedTime: new Date("2024-08-03T15:00:00").toISOString() },
    ],
    reasoning: "Trajet long (>6h) nécessitant un relais. Chauffeur 1 (Dupont) part de Lyon. Chauffeur 2 (Bernard) prend le relais à Beaune car sa base (Paris) est proche de la destination finale. Le véhicule GNC est choisi pour son faible coût opérationnel."
});

const StopIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'Départ': return <Flag className="h-4 w-4 text-muted-foreground" />;
        case 'Arrivée': return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
        case 'Carburant': return <Fuel className="h-4 w-4 text-muted-foreground" />;
        case 'Pause 45min': return <Coffee className="h-4 w-4 text-muted-foreground" />;
        case 'Douane': return <Shield className="h-4 w-4 text-muted-foreground" />;
        case 'Relais': return <Users className="h-4 w-4 text-accent" />;
        default: return null;
    }
}

const useGeocoding = (form: any, fieldName: 'pickupLocation' | 'deliveryLocation') => {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const query = form.watch(fieldName);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        const handler = setTimeout(async () => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=fr`, { signal });
                if (!response.ok) throw new Error('Network response was not ok.');
                const data = await response.json();
                if (!signal.aborted) {
                    setSuggestions(data.slice(0, 5));
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') console.error("Geocoding fetch error:", error);
            }
        }, 500);

        return () => {
            clearTimeout(handler);
            controller.abort();
        };
    }, [query]);

    const handleSelect = (suggestion: any) => {
        form.setValue(fieldName, suggestion.display_name, { shouldValidate: true });
        setSuggestions([]);
    };

    return { suggestions, handleSelect };
};

const GeocodingInput = ({ form, fieldName, label }: { form: any, fieldName: 'pickupLocation' | 'deliveryLocation', label: string }) => {
    const { suggestions, handleSelect } = useGeocoding(form, fieldName);

    return (
        <FormField control={form.control} name={fieldName} render={({ field }) => (
            <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                    <div className="relative">
                        <Input {...field} autoComplete="off" />
                        {suggestions.length > 0 && (
                            <ul className="absolute z-50 w-full bg-background border rounded-md mt-1 shadow-lg">
                                {suggestions.map((s) => (
                                    <li key={s.place_id} className="px-3 py-2 cursor-pointer hover:bg-muted" onClick={() => handleSelect(s)}>
                                        {s.display_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />
    );
};

export function CreateTripDialog({ open, onOpenChange, defaultValues = {} }: CreateTripDialogProps) {
    const { toast } = useToast();
    const { contracts, vehiclesData, drivers: allDrivers } = useMockData();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [aiReasoning, setAiReasoning] = useState<string | null>(null);

    const form = useForm<z.infer<typeof tripFormSchema>>({
        resolver: zodResolver(tripFormSchema),
        defaultValues: { pickupLocation: "Aéroport de Marseille-Provence, 13700 Marignane", deliveryLocation: "Aéroport de Paris-Charles de Gaulle, 95700 Roissy-en-France", demoMode: true, ...defaultValues },
    });
    
    const uniqueClients = [...new Set(contracts.map(c => c.client))];
    const selectedClient = form.watch("client");
    const selectedContractId = form.watch("contractId");
    const clientContracts = contracts.filter(c => c.client === selectedClient);

    useEffect(() => {
        if (open) {
            form.reset({ pickupLocation: "Aéroport de Marseille-Provence, 13700 Marignane", deliveryLocation: "Aéroport de Paris-Charles de Gaulle, 95700 Roissy-en-France", demoMode: true, ...defaultValues });
            setShowDetails(!!defaultValues.client);
            setAiReasoning(null);
        }
    }, [open, defaultValues, form]);

    useEffect(() => {
        if (selectedContractId) {
            const contract = contracts.find(c => c.id === selectedContractId);
            if (contract) {
                form.setValue("pickupLocation", contract.originSite, { shouldValidate: true });
                form.setValue("deliveryLocation", contract.destinationSite, { shouldValidate: true });
            }
        }
    }, [selectedContractId, contracts, form]);

    const { fields: stopFields, append: appendStop, remove: removeStop } = useFieldArray({
        control: form.control,
        name: "stops",
    });
    
    const onFinalSubmit = (data: z.infer<typeof tripFormSchema>) => {
        if (!data.plannedStart || !data.plannedEnd || !data.vin || !data.driverId) {
            toast({ variant: 'destructive', title: 'Champs manquants', description: "Veuillez remplir tous les détails du trajet (chauffeur, véhicule, dates) avant de créer." });
            setShowDetails(true);
            return;
        }
        
        const newTrip = {
            id: `MAN-${Date.now().toString().slice(-4)}`,
            status: 'planned' as const, ...data,
            plannedStart: data.plannedStart.toISOString(),
            plannedEnd: data.plannedEnd.toISOString(),
            type: 'express' as const,
        };
        mockDataService.addTrip(newTrip);
        toast({ title: "Trajet créé", description: `Le trajet ${newTrip.id} a été ajouté au planning.` });
        onOpenChange(false);
    };

    const onAiSubmit = async (data: z.infer<typeof tripFormSchema>) => {
        setIsLoading(true); setError(null); setAiReasoning(null);
        
        if (data.demoMode) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const aiPlan = getMockPlan();
            form.setValue("client", aiPlan.client);
            form.setValue("vin", aiPlan.vin);
            form.setValue("driverId", aiPlan.driverId);
            form.setValue("driver2Id", aiPlan.driver2Id);
            form.setValue("relayPoint", aiPlan.relayPoint);
            form.setValue("plannedStart", new Date(aiPlan.plannedStart));
            form.setValue("plannedEnd", new Date(aiPlan.plannedEnd));
            form.setValue("stops", aiPlan.stops.map(s => ({...s, estimatedTime: new Date(s.estimatedTime)})));
            setAiReasoning(aiPlan.reasoning);
            setShowDetails(true);
            setIsLoading(false);
            return;
        }

        try {
            const result = await planTrip({pickupLocation: data.pickupLocation, deliveryLocation: data.deliveryLocation});
            form.setValue("client", result.client);
            form.setValue("vin", result.vin);
            form.setValue("driverId", result.driverId);
            form.setValue("plannedStart", new Date(result.plannedStart));
            form.setValue("plannedEnd", new Date(result.plannedEnd));
            form.setValue("stops", result.stops.map(s => ({...s, estimatedTime: new Date(s.estimatedTime)})));
            setAiReasoning(result.reasoning);
            setShowDetails(true);
        } catch (e: any) {
             if (e.message?.includes('429')) setError("Le service IA est surchargé (dépassement de quota). Veuillez réessayer plus tard ou utiliser le mode démo.");
             else setError(e.message || "Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const watchedStops = form.watch("stops") || [];
    const watchedPlannedStart = form.watch("plannedStart");
    const watchedPlannedEnd = form.watch("plannedEnd");
    const watchedPickupLocation = form.watch("pickupLocation");
    const watchedDeliveryLocation = form.watch("deliveryLocation");
    
    const fullSequence = [
        ...(watchedPlannedStart ? [{ type: 'Départ', location: watchedPickupLocation, estimatedTime: watchedPlannedStart, isStop: false }] : []),
        ...watchedStops.map(s => ({...s, isStop: true})),
        ...(watchedPlannedEnd ? [{ type: 'Arrivée', location: watchedDeliveryLocation, estimatedTime: watchedPlannedEnd, isStop: false }] : []),
    ].sort((a, b) => (a.estimatedTime?.getTime() || 0) - (b.estimatedTime?.getTime() || 0));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] !overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Créer un nouveau trajet</DialogTitle>
                    <DialogDescription>Remplissez les détails manuellement ou utilisez l'IA pour une planification optimisée.</DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-4">
                 <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(onFinalSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="client" render={({ field }) => (
                                <FormItem><FormLabel>Client (Optionnel)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..."/></SelectTrigger></FormControl>
                                        <SelectContent>{uniqueClients.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                <FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="contractId" render={({ field }) => (
                                <FormItem><FormLabel>Contrat associé (Optionnel)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={!selectedClient}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl>
                                        <SelectContent>{clientContracts.map(c => <SelectItem key={c.id} value={c.id}>{c.id} ({c.originSite} → {c.destinationSite})</SelectItem>)}</SelectContent>
                                    </Select>
                                <FormMessage /></FormItem>
                            )} />
                        </div>
                        <GeocodingInput form={form} fieldName="pickupLocation" label="Lieu d'enlèvement" />
                        <GeocodingInput form={form} fieldName="deliveryLocation" label="Lieu de livraison" />
                        
                        <Button type="button" onClick={form.handleSubmit(onAiSubmit)} disabled={isLoading} className="w-full !mt-6">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            Générer un plan de trajet (IA)
                        </Button>
                        
                        {error && <Alert variant="destructive" className="mt-4"><Bot className="h-4 w-4" /><AlertTitle>Erreur de l'IA</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                        {aiReasoning && <Alert><Bot className="h-4 w-4" /><AlertTitle>Raisonnement de l'IA</AlertTitle><AlertDescription>{aiReasoning}</AlertDescription></Alert>}
                        
                        <Separator />
                        {!showDetails && <Button type="button" variant="outline" className="w-full" onClick={() => setShowDetails(true)}>Remplir les détails manuellement</Button>}
                        
                        {showDetails && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Détails du Trajet</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="vin" render={({ field }) => (
                                        <FormItem><FormLabel>Véhicule</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent>{vehiclesData.map(v => <SelectItem key={v.vin} value={v.vin}>{v.immatriculation}</SelectItem>)}</SelectContent></Select>
                                        <FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="driverId" render={({ field }) => (
                                        <FormItem><FormLabel>Chauffeur Principal</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent>{allDrivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
                                        <FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="relayPoint" render={({ field }) => (<FormItem><FormLabel>Point de Relais</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="driver2Id" render={({ field }) => (
                                        <FormItem><FormLabel>Chauffeur Relais</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ""}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger></FormControl><SelectContent>{allDrivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
                                        <FormMessage /></FormItem>
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="plannedStart" render={({ field }) => (
                                        <FormItem><FormLabel>Début planifié</FormLabel><Popover><PopoverTrigger asChild>
                                            <FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: fr }) : <span>Choisir une date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                                        </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="plannedEnd" render={({ field }) => (
                                        <FormItem><FormLabel>Fin planifiée</FormLabel><Popover><PopoverTrigger asChild>
                                            <FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: fr }) : <span>Choisir une date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl>
                                        </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <Separator />
                                <div>
                                    <h4 className="font-semibold mb-2">Arrêts &amp; Séquence</h4>
                                    <div className="space-y-2">
                                        {fullSequence.map((step, index) => {
                                            const stopIndex = step.isStop ? watchedStops.findIndex(s => s === step) : -1;
                                            return (
                                                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                                    <StopIcon type={step.type} />
                                                    <p className="font-semibold text-sm flex-grow">{step.location}</p>
                                                    <p className="text-sm">{step.type}</p>
                                                    <p className="font-mono text-xs">{step.estimatedTime ? format(step.estimatedTime, "HH:mm") : ''}</p>
                                                    {step.isStop && (
                                                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeStop(stopIndex)}>
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        {(fullSequence.length === 0) && <p className="text-xs text-muted-foreground text-center">Aucun arrêt planifié.</p>}
                                        <Button type="button" size="sm" variant="secondary" className="mt-2" onClick={() => appendStop({type: "Autre", location: "", estimatedTime: new Date()})}><PlusCircle className="mr-2"/>Ajouter un arrêt manuel</Button>
                                    </div>
                                </div>
                                <DialogFooter className="!mt-8"><Button type="submit" className="w-full">Créer le trajet</Button></DialogFooter>
                            </div>
                        )}
                    </form>
                 </FormProvider>
                </div>
            </DialogContent>
        </Dialog>
    );
}
