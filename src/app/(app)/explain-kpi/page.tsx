
"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@/lib/zod-resolver";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Loader2, Share2, FileDown, AlertTriangle, ListTree, SlidersHorizontal, Lightbulb, Sparkles, ChevronsRight, Dot } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { KpiRootCauseInputSchema, type KpiRootCauseOutput, Factor } from "@/ai/flows/kpi-root-cause-types";
import { explainKpiRootCause } from "@/ai/flows/kpi-root-cause-flow";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

const mockResponse: KpiRootCauseOutput = {
    kpi: "On-Time Delivery %",
    deviation: "-2.9 points",
    primaryConclusion: "La baisse de la ponctualité est principalement due à une combinaison de pannes sur des véhicules vieillissants et de conditions météorologiques défavorables sur des axes clés.",
    detailedSummary: "L'analyse révèle que près de 40% de la baisse de performance est directement attribuable à des temps d'arrêt imprévus sur trois véhicules de plus de 5 ans, ce qui a entraîné des réorganisations de dernière minute et des retards en cascade. De plus, de fortes pluies dans la région Sud-Est ont causé des ralentissements importants, impactant 35% de la déviation. Enfin, une légère augmentation des temps de pause non planifiés chez certains chauffeurs et des choix d'itinéraires sous-optimaux contribuent de manière secondaire au retard global.",
    rootCauseTree: [
        {
            id: "F-01", description: "Pannes Véhicules", impact: -40,
            reasoning: "Trois pannes majeures ont immobilisé des véhicules, causant des retards directs et des réaffectations complexes.",
            category: "Maintenance", dataPoints: ["VIN-JKL-101: Panne moteur sur A7", "VIN-OLD-002: Problème de freins"],
            subFactors: [
                { id: "F-01a", description: "Maintenance Corrective Imprévue", impact: -30, reasoning: "2 pannes moteur sur des camions à fort kilométrage.", category: "Maintenance", dataPoints: ["VIN-JKL-101 > 500,000 km"] },
                { id: "F-01b", description: "Temps de réparation allongés", impact: -10, reasoning: "Les pièces pour les modèles plus anciens n'étaient pas en stock.", category: "Maintenance", dataPoints: ["Attente de 48h pour la pièce 'INJ-045'"] },
            ]
        },
        {
            id: "F-02", description: "Conditions Météorologiques", impact: -35,
            reasoning: "De fortes pluies et des orages dans la région Sud-Est ont provoqué d'importants bouchons et des fermetures de routes.",
            category: "Conditions Externes", dataPoints: ["12 trajets impactés par des alertes Météo-France niveau orange"]
        },
        {
            id: "F-03", description: "Comportement Chauffeur", impact: -15,
            reasoning: "Une augmentation des choix d'itinéraires non optimaux et des temps de pause prolongés a été observée pour 5% des chauffeurs.",
            category: "Comportement Chauffeur", dataPoints: ["Chauffeur DRV-PMA-003: +25 min de pause en moyenne", "Trajet LGN-002: déviation de 15km non justifiée"]
        },
    ],
    recommendations: [
        { recommendationId: 'REC-01', title: "Audit de la flotte vieillissante", description: "Lancer un audit sur tous les véhicules de plus de 500 000 km pour planifier une maintenance préventive renforcée ou un remplacement.", category: "Processus", estimatedImpact: "+1.5% OTD" },
        { recommendationId: 'REC-02', title: "Formation sur les itinéraires alternatifs", description: "Créer un module de formation rapide pour les chauffeurs sur l'utilisation des outils de navigation pour contourner les incidents majeurs.", category: "Formation", estimatedImpact: "+0.5% OTD" },
        { recommendationId: 'REC-03', title: "Alerte proactive de replanification", description: "Mettre en place une alerte pour le dispatch lorsqu'un trajet est impacté par une alerte météo de niveau orange ou supérieur.", category: "Action Immédiate", estimatedImpact: "+1.0% OTD" }
    ]
}


const FactorNode = ({ factor, level = 0 }: { factor: Factor, level?: number }) => {
    return (
        <div style={{ marginLeft: `${level * 20}px` }} className="flex flex-col">
            <Collapsible defaultOpen={true}>
                <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                         <div className="flex items-center cursor-pointer">
                            {factor.subFactors && <ChevronsRight className="h-4 w-4 shrink-0 transition-transform duration-200 data-[state=open]:rotate-90" />}
                            {!factor.subFactors && <Dot className="h-4 w-4 shrink-0" />}
                            <span className="font-semibold">{factor.description}</span>
                         </div>
                    </CollapsibleTrigger>
                    <Badge variant={factor.impact < 0 ? "destructive" : "secondary"}>{factor.impact}%</Badge>
                    <Badge variant="outline">{factor.category}</Badge>
                </div>
                 <CollapsibleContent>
                    <div className="pl-6 border-l-2 ml-2 mt-1 space-y-2 py-2">
                        <p className="text-sm text-muted-foreground italic">{factor.reasoning}</p>
                        {factor.dataPoints && factor.dataPoints.length > 0 && (
                            <div className="text-xs space-y-1">
                                {factor.dataPoints.map((dp, i) => <p key={i} className="font-mono bg-muted/50 p-1 rounded-sm">{dp}</p>)}
                            </div>
                        )}
                        {factor.subFactors && factor.subFactors.map(sub => (
                            <FactorNode key={sub.id} factor={sub} level={level + 1} />
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}

export default function ExplainKpiPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<KpiRootCauseOutput | null>(null);

  const form = useForm<z.infer<typeof KpiRootCauseInputSchema>>({
    resolver: zodResolver(KpiRootCauseInputSchema),
    defaultValues: {
        kpi: "On-Time Delivery %",
        timeRange: "30 derniers jours",
        currentValue: "92.1%",
        targetValue: "95%",
        fleetContext: "1250 trajets complétés sur la période. 3 pannes majeures (moteur). 12 incidents mineurs (accrochages). 15% des trajets dans le sud-est ont été affectés par des alertes météo fortes pluies. Le coût du diesel a augmenté de 5% sur la période."
    },
  });

  const onSubmit = async (data: z.infer<typeof KpiRootCauseInputSchema>) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
        // Simulate a real API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setAnalysisResult(mockResponse);
    } catch (e: any) {
        setError(e.message || "An error occurred during analysis.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-headline">Explain My KPI</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-1 sticky top-6">
            <CardHeader>
                <CardTitle>Analyse de Cause Racine</CardTitle>
                <CardDescription>Sélectionnez un KPI et une période pour que l'IA identifie les facteurs d'influence.</CardDescription>
            </CardHeader>
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="kpi" render={({ field }) => (
                            <FormItem>
                                <FormLabel>KPI à analyser</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="On-Time Delivery %">On-Time Delivery %</SelectItem>
                                        <SelectItem value="Taux d'utilisation de la flotte">Taux d'utilisation de la flotte</SelectItem>
                                        <SelectItem value="TCO (Total Cost of Ownership) par km">TCO (€/km)</SelectItem>
                                        <SelectItem value="Coût du carburant par km">Coût du carburant par km</SelectItem>
                                        <SelectItem value="Coût de maintenance par km">Coût de maintenance par km</SelectItem>
                                        <SelectItem value="Score de sécurité moyen">Score de sécurité moyen</SelectItem>
                                        <SelectItem value="Taux de pannes en mission">Taux de pannes en mission</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="timeRange" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Période</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="7 derniers jours">7 derniers jours</SelectItem>
                                        <SelectItem value="30 derniers jours">30 derniers jours</SelectItem>
                                        <SelectItem value="90 derniers jours">90 derniers jours</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="currentValue" render={({ field }) => (
                                <FormItem><FormLabel>Valeur Actuelle</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )} />
                             <FormField control={form.control} name="targetValue" render={({ field }) => (
                                <FormItem><FormLabel>Cible</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                            )} />
                        </div>
                        
                        <FormField control={form.control} name="fleetContext" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contexte (Données agrégées)</FormLabel>
                                <FormControl><Textarea {...field} rows={6} placeholder="Ex: 1250 trajets, 3 pannes majeures..." /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                            Lancer l'analyse
                        </Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>

        <div className="lg:col-span-2 space-y-6">
            {!isLoading && !analysisResult && (
                <Card className="min-h-[80vh] flex items-center justify-center">
                    <CardContent className="text-center text-muted-foreground">
                        <ListTree className="h-12 w-12 mx-auto mb-4"/>
                        <h2 className="text-xl font-semibold">En attente d'analyse</h2>
                        <p>Les résultats de l'analyse par l'IA apparaîtront ici.</p>
                    </CardContent>
                </Card>
            )}
            
            {isLoading && (
                 <Card className="min-h-[80vh] flex items-center justify-center">
                    <CardContent className="text-center text-primary">
                        <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin"/>
                        <h2 className="text-xl font-semibold">Analyse en cours...</h2>
                        <p className="text-muted-foreground">L'IA examine les données pour trouver des corrélations.</p>
                    </CardContent>
                </Card>
            )}

            {error && (
                <Alert variant="destructive" className="w-full">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur d'Analyse</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {analysisResult && (
                <>
                <Card>
                    <CardHeader>
                        <CardTitle>Synthèse de l'Analyse</CardTitle>
                        <CardDescription>KPI: <span className="font-bold">{analysisResult.kpi}</span> | Écart total: <span className="font-bold text-lg">{analysisResult.deviation}</span></CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <Bot className="h-4 w-4" />
                            <AlertTitle className="font-bold">Conclusion Principale</AlertTitle>
                            <AlertDescription>{analysisResult.primaryConclusion}</AlertDescription>
                        </Alert>
                        <p className="text-sm text-muted-foreground mt-4">{analysisResult.detailedSummary}</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Arbre des Causes Racines</CardTitle>
                        <CardDescription>Visualisation hiérarchique des facteurs influençant le KPI.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {analysisResult.rootCauseTree.map(factor => <FactorNode key={factor.id} factor={factor} />)}
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Sparkles className="mr-2 text-accent"/>Recommandations de l'IA</CardTitle>
                        <CardDescription>Actions suggérées pour améliorer la performance du KPI.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {analysisResult.recommendations.map(rec => (
                            <div key={rec.recommendationId} className="p-4 border rounded-lg bg-muted/30">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{rec.title}</p>
                                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                                    </div>
                                    <Badge variant="outline">{rec.category}</Badge>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <p className="text-sm">Impact estimé: <span className="font-bold text-green-600">{rec.estimatedImpact}</span></p>
                                    <Button size="sm">Créer une tâche</Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                     <CardFooter className="justify-end gap-2">
                        <Button variant="outline"><Share2 /> Partager l'analyse</Button>
                        <Button variant="outline"><FileDown /> Exporter en PDF</Button>
                    </CardFooter>
                </Card>
                </>
            )}
        </div>
      </div>
    </div>
  );
}
