
"use client"

import { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@/lib/zod-resolver"
import { z } from "zod"
import { aiPoweredTripRiskAssessment, type AiPoweredTripRiskAssessmentInput, type AiPoweredTripRiskAssessmentOutput } from "@/ai/flows/ai-powered-trip-risk-assessment"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Bot, BotMessageSquare, CheckCircle, Lightbulb, List, Loader2, Milestone, Percent, Thermometer, ThumbsUp, Wrench } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Checkbox } from "../ui/checkbox"

const formSchema = z.object({
  tripId: z.string().min(1, "L'ID du trajet est requis."),
  plannedRoute: z.string().min(1, "L'itinéraire prévu est requis."),
  historicalData: z.string().min(1, "Les données historiques sont requises."),
  trafficConditions: z.string().min(1, "Les conditions de trafic sont requises."),
  weatherConditions: z.string().min(1, "Les conditions météo sont requises."),
  cargoType: z.string().min(1, "Le type de cargaison est requis."),
  tempSetpointC: z.coerce.number().optional(),
});

const mockPrediction: AiPoweredTripRiskAssessmentOutput = {
    riskEtaBreach: 72,
    riskRouteDeviation: 45,
    riskColdChainDrift: 15,
    recommendations: ["Notifier le client d'un retard potentiel de 15 minutes.", "Envisager un itinéraire alternatif via A39 pour éviter le trafic.", "Vérifier le setpoint du reefer au prochain arrêt."],
    reasoning: "Le risque d'ETA est élevé en raison d'un accident signalé sur l'A6 et de conditions météorologiques dégradées. Les données historiques montrent une sensibilité aux retards dans ce secteur. Le risque de déviation est modéré car le chauffeur pourrait choisir un itinéraire non optimal pour compenser. Le risque pour la chaîne du froid reste faible mais à surveiller."
};


export function TripRiskAssessmentClient({ tripId }: { tripId: string }) {
  const [prediction, setPrediction] = useState<AiPoweredTripRiskAssessmentOutput | null>(mockPrediction);
  const [isLoading, setIsLoading] = useState(false);
  const [useMock, setUseMock] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AiPoweredTripRiskAssessmentInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tripId: tripId,
      plannedRoute: "Paris -> Lyon via A6",
      historicalData: "Retards moyens de 15min sur ce trajet le vendredi après-midi.",
      trafficConditions: "Trafic dense à la sortie de Paris, accident signalé près d'Auxerre.",
      weatherConditions: "Pluie légère, visibilité réduite.",
      cargoType: "Produits pharmaceutiques",
      tempSetpointC: 5,
    },
  });

  const onSubmit = async (data: AiPoweredTripRiskAssessmentInput) => {
    setIsLoading(true);
    setPrediction(null);
    setError(null);

    if (useMock) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setPrediction(mockPrediction);
        setIsLoading(false);
        return;
    }

    try {
      const result = await aiPoweredTripRiskAssessment(data);
      setPrediction(result);
    } catch (e: any) {
      console.error("Error getting trip risk assessment:", e);
      setError(e.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const RiskIndicator = ({ label, value }: { label: string; value: number }) => (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-bold text-lg">{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );

  return (
    <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Bot className="mr-2 text-primary"/>IA • Risque & Prédictions</CardTitle>
          <CardDescription>Analyse des risques et recommandations pour le trajet.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {!isLoading && !prediction && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <BotMessageSquare className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Les résultats de l'analyse apparaîtront ici.</p>
               <Button onClick={() => onSubmit(form.getValues())} disabled={isLoading} className="mt-4">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BotMessageSquare className="mr-2 h-4 w-4" />}
                Lancer l'Analyse
              </Button>
            </div>
          )}
           {error && (
             <Alert variant="destructive">
                <BotMessageSquare className="h-4 w-4" />
                <AlertTitle>Erreur de Prédiction</AlertTitle>
                <AlertDescription>
                    <p>L'API a retourné une erreur. Cela peut être dû à un dépassement de quota (Too Many Requests).</p>
                    <p className="text-xs mt-2 font-mono">{error}</p>
                </AlertDescription>
            </Alert>
          )}
          {prediction && (
            <div className="space-y-6">
              <div className="grid gap-4">
                  <h3 className="text-md font-semibold flex items-center"><Percent className="w-4 h-4 mr-2 text-primary"/>Niveaux de Risque</h3>
                  <RiskIndicator label="Rupture d'ETA" value={prediction.riskEtaBreach} />
                  <RiskIndicator label="Déviation d'itinéraire" value={prediction.riskRouteDeviation} />
                  <RiskIndicator label="Dérive chaîne du froid" value={prediction.riskColdChainDrift} />
              </div>
              <Separator />
               <div>
                <h3 className="text-md font-semibold flex items-center"><List className="w-4 h-4 mr-2 text-primary"/>Recommandations</h3>
                <ul className="mt-2 list-disc list-inside space-y-2 text-sm text-foreground">
                    {prediction.recommendations.map((rec, i) => <li key={i} className="flex justify-between items-center"><span>{rec}</span><Button size="sm" variant="outline">Appliquer</Button></li>)}
                </ul>
              </div>
              <Separator />
              <Alert>
                <Milestone className="h-4 w-4" />
                <AlertTitle>Raisonnement de l'IA</AlertTitle>
                <AlertDescription>
                  {prediction.reasoning}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
         <CardFooter className="flex justify-between">
            <div className="flex items-center space-x-2">
                <Checkbox id="demo-mode" checked={useMock} onCheckedChange={(checked) => setUseMock(!!checked)} />
                <label htmlFor="demo-mode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Mode Démo
                </label>
            </div>
            <div className="space-x-2">
                 <Button variant="ghost" size="sm"><Lightbulb className="mr-1"/>Expliquer</Button>
                 <Button variant="ghost" size="sm"><ThumbsUp className="mr-1"/>Feedback</Button>
            </div>
         </CardFooter>
    </Card>
  )
}

    