
"use client";

import { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSearch, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import Link from 'next/link';
import { AssignCoachingDialog } from './assign-coaching-dialog';
import { Separator } from '../ui/separator';
import { Trip } from '@/lib/types';
import { differenceInMinutes, format } from 'date-fns';

interface DriverSafetyPanelProps {
    visibleTrips: Trip[];
}

type BreachType = 'duration' | 'tolerance' | 'hos';
type Breaches = {
    trip: Trip,
    reason: string
}

const mockAnalysisResult = (trips: Trip[], prefs: SafetyPrefs) => {
    const breaches: Record<BreachType, Trip[]> = {
        duration: [],
        tolerance: [],
        hos: [],
    };

    trips.forEach(trip => {
        const plannedDurationMin = differenceInMinutes(new Date(trip.plannedEnd), new Date(trip.plannedStart));
        
        let actualDurationMin = 0;
        if (trip.actualEnd && trip.actualStart) {
            actualDurationMin = differenceInMinutes(new Date(trip.actualEnd), new Date(trip.actualStart));
        } else if (trip.actualStart) {
            actualDurationMin = differenceInMinutes(new Date(), new Date(trip.actualStart));
        } else {
            actualDurationMin = plannedDurationMin; // For planned trips, assume on time for now
        }
        
        const deviationPercent = plannedDurationMin > 0 ? ((actualDurationMin - plannedDurationMin) / plannedDurationMin) * 100 : 0;

        if (actualDurationMin > prefs.maxDurationHours * 60) {
            breaches.duration.push(trip);
        }
        if (deviationPercent > prefs.tolerancePercent) {
             breaches.tolerance.push(trip);
        }
        if (prefs.checkHOS && trip.hosRemainingMin && trip.hosRemainingMin < 60) { // Example: less than 1h remaining
             breaches.hos.push(trip);
        }
    });

    return {
        duration: breaches.duration,
        tolerance: breaches.tolerance,
        hos: breaches.hos,
    }
}

type SafetyPrefs = {
    maxDurationHours: number;
    tolerancePercent: number;
    autoCreateAnomaly: boolean;
    checkHOS: boolean;
};

export function DriverSafetyPanel({ visibleTrips }: DriverSafetyPanelProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof mockAnalysisResult> | null>(null);
    const [isAssignCoachingOpen, setAssignCoachingOpen] = useState(false);
    const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
    
    const defaultPrefs: SafetyPrefs = {
        maxDurationHours: 8,
        tolerancePercent: 20,
        autoCreateAnomaly: true,
        checkHOS: false,
    };
    
    const [prefs, setPrefs] = useState<SafetyPrefs>(defaultPrefs);

    useEffect(() => {
        try {
            const savedPrefs = localStorage.getItem('driverSafetyPrefs');
            if (savedPrefs) {
                // Merge saved prefs with defaults to prevent missing properties
                setPrefs(prev => ({ ...prev, ...JSON.parse(savedPrefs) }));
            }
        } catch (error) {
            console.error("Failed to load prefs from localStorage", error);
        }
    }, []);

    const handlePrefChange = (key: keyof SafetyPrefs, value: any) => {
        const newPrefs = { ...prefs, [key]: value };
        setPrefs(newPrefs);
        try {
            localStorage.setItem('driverSafetyPrefs', JSON.stringify(newPrefs));
        } catch (error) {
            console.error("Failed to save prefs to localStorage", error);
        }
    };

    const handleAnalyze = () => {
        setIsLoading(true);
        setTimeout(() => {
            const result = mockAnalysisResult(visibleTrips, prefs);
            setAnalysisResult(result);
            setIsLoading(false);
            
            const totalBreaches = result.duration.length + result.tolerance.length + result.hos.length;
            toast({
                title: "Analyse terminée",
                description: `${totalBreaches} dépassement(s) de seuil détecté(s).`,
            });
            if (prefs.autoCreateAnomaly && totalBreaches > 0) {
                 toast({
                    title: "Anomalies créées",
                    description: `${totalBreaches} anomalie(s) de performance ont été automatiquement créées.`,
                });
            }

        }, 1500);
    };

    const handleAssignCoaching = () => {
        const allBreachedDriverIds = [
            ...(analysisResult?.duration.map(t => t.driverId) || []),
            ...(analysisResult?.tolerance.map(t => t.driverId) || []),
            ...(analysisResult?.hos.map(t => t.driverId) || []),
        ];
        setSelectedDriverIds([...new Set(allBreachedDriverIds)]);
        setAssignCoachingOpen(true);
    }
    
    const handleAssignSingleCoaching = (driverId: string) => {
        setSelectedDriverIds([driverId]);
        setAssignCoachingOpen(true);
    }

    const totalBreaches = analysisResult ? analysisResult.duration.length + analysisResult.tolerance.length + analysisResult.hos.length : 0;

    return (
        <>
            <AssignCoachingDialog 
                isOpen={isAssignCoachingOpen}
                onOpenChange={setAssignCoachingOpen}
                driverIds={selectedDriverIds}
                onAssign={() => {
                    toast({
                        title: "Coaching assigné",
                        description: `Un plan de coaching a été créé pour ${selectedDriverIds.length} chauffeur(s).`
                    })
                }}
            />
            <Accordion type="single" collapsible defaultValue="item-1" onValueChange={(value) => setIsOpen(!!value)}>
                <AccordionItem value="item-1" className="border-none">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center">
                                    <AccordionTrigger className="p-0 mr-2 hover:no-underline">
                                        <ShieldCheck className="mr-2" />
                                        Sécurité Trajet (Paramétrage & Actions)
                                    </AccordionTrigger>
                                </CardTitle>
                                <CardDescription>Appliquez des seuils globaux aux trajets des chauffeurs affichés.</CardDescription>
                            </div>
                        </CardHeader>
                        <AccordionContent>
                            <CardContent className="space-y-6">
                                {/* Row 1: Controls */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base flex justify-between items-center">
                                                <span>Durée max. du trajet</span>
                                                <Badge variant="outline">{prefs.maxDurationHours.toFixed(2)}h</Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Slider
                                                value={[prefs.maxDurationHours]}
                                                onValueChange={(val) => handlePrefChange('maxDurationHours', val[0])}
                                                max={10}
                                                step={0.25}
                                            />
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base flex justify-between items-center">
                                                <span>Tolérance d'écart (%)</span>
                                                <Badge variant="outline">{prefs.tolerancePercent}%</Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Slider
                                                value={[prefs.tolerancePercent]}
                                                onValueChange={(val) => handlePrefChange('tolerancePercent', val[0])}
                                                max={100}
                                                step={5}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch id="auto-anomaly" checked={prefs.autoCreateAnomaly} onCheckedChange={(val) => handlePrefChange('autoCreateAnomaly', val)} />
                                        <Label htmlFor="auto-anomaly">Créer automatiquement une anomalie</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Switch id="check-hos" checked={prefs.checkHOS} onCheckedChange={(val) => handlePrefChange('checkHOS', val)} />
                                        <Label htmlFor="check-hos">Inclure contrôle HOS</Label>
                                    </div>
                                </div>
                                <Separator />
                                {/* Row 2: Actions & Feedback */}
                                <div>
                                     <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex gap-2">
                                             <Button onClick={handleAnalyze} disabled={isLoading}>
                                                {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <FileSearch className="mr-2"/>}
                                                Analyser les trajets
                                            </Button>
                                            <Button variant="secondary" onClick={handleAssignCoaching} disabled={totalBreaches === 0}>
                                                Assigner un coaching
                                            </Button>
                                        </div>
                                         <div className="flex items-center gap-4">
                                            {analysisResult && (
                                                <>
                                                    <Badge variant="destructive">Durée max: {analysisResult.duration.length}</Badge>
                                                    <Badge variant="secondary" className="bg-amber-500 text-white">Tolérance: {analysisResult.tolerance.length}</Badge>
                                                    {prefs.checkHOS && <Badge variant="destructive">HOS: {analysisResult.hos.length}</Badge>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Results Area */}
                                {analysisResult && (
                                     <Accordion type="single" collapsible className="w-full" defaultValue="results">
                                        <AccordionItem value="results">
                                            <AccordionTrigger>
                                                <h3 className="text-lg font-semibold">Résultats de l'analyse ({totalBreaches} trajets)</h3>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                {totalBreaches > 0 ? (
                                                    <Tabs defaultValue="duration">
                                                        <TabsList>
                                                            <TabsTrigger value="duration">Durée max ({analysisResult.duration.length})</TabsTrigger>
                                                            <TabsTrigger value="tolerance">Tolérance ({analysisResult.tolerance.length})</TabsTrigger>
                                                            {prefs.checkHOS && <TabsTrigger value="hos">HOS ({analysisResult.hos.length})</TabsTrigger>}
                                                        </TabsList>
                                                        <TabsContent value="duration"><BreachesTable trips={analysisResult.duration} onAssign={handleAssignSingleCoaching} type="duration" /></TabsContent>
                                                        <TabsContent value="tolerance"><BreachesTable trips={analysisResult.tolerance} onAssign={handleAssignSingleCoaching} type="tolerance" /></TabsContent>
                                                        {prefs.checkHOS && <TabsContent value="hos"><BreachesTable trips={analysisResult.hos} onAssign={handleAssignSingleCoaching} type="hos" /></TabsContent>}
                                                    </Tabs>
                                                ) : (
                                                    <p className="text-center text-muted-foreground py-8">Aucun dépassement pour les seuils actuels ✨</p>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                )}
                            </CardContent>
                        </AccordionContent>
                    </Card>
                </AccordionItem>
            </Accordion>
        </>
    );
}


function BreachesTable({ trips, onAssign, type }: { trips: Trip[], onAssign: (driverId: string) => void, type: BreachType }) {
    if (trips.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Aucun trajet dans cette catégorie.</p>

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Trajet</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Réel/Est.</TableHead>
                    <TableHead>Écart</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {trips.map(trip => {
                    const planned = differenceInMinutes(new Date(trip.plannedEnd), new Date(trip.plannedStart));
                    let actual = 0;
                     if (trip.actualEnd && trip.actualStart) {
                        actual = differenceInMinutes(new Date(trip.actualEnd), new Date(trip.actualStart));
                    } else if (trip.actualStart) {
                        actual = differenceInMinutes(new Date(), new Date(trip.actualStart));
                    }
                    const deviation = actual - planned;
                    return (
                        <TableRow key={trip.id}>
                            <TableCell className="font-medium">{trip.id}</TableCell>
                            <TableCell>{trip.client}</TableCell>
                            <TableCell>{planned} min</TableCell>
                            <TableCell>{actual} min</TableCell>
                            <TableCell className="text-destructive font-bold">+{deviation} min</TableCell>
                            <TableCell className="space-x-2">
                                <Button variant="outline" size="sm" onClick={() => onAssign(trip.driverId)}>Assigner Coaching</Button>
                                <Button variant="ghost" size="sm" asChild><Link href={`/trips/${trip.id}`}>Ouvrir</Link></Button>
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
