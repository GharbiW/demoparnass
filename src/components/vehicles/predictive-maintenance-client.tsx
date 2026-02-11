

"use client"

import { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@/lib/zod-resolver"
import { z } from "zod"
import { predictVehicleMaintenance, type PredictiveMaintenanceInput, type PredictiveMaintenanceOutput } from "@/ai/flows/predictive-maintenance"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { BotMessageSquare, Wrench, Loader2, Gauge as GaugeIcon, List, Milestone, AlertTriangle } from "lucide-react"
import { Gauge } from "@/components/ui/gauge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"

const formSchema = z.object({
  vehicleVin: z.string().min(1, "Le VIN est requis."),
  odometer: z.coerce.number().positive("L'odomètre doit être positif."),
  engineHours: z.coerce.number().positive("Les heures moteur doivent être positives."),
  dtcCodes: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
  tpmsAlerts: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
  avgTempDeviation: z.coerce.number(),
  fuelL100km: z.coerce.number().positive("La consommation doit être positive."),
  idlePct: z.coerce.number().min(0).max(100, "Le pourcentage doit être entre 0 et 100."),
  maintEvents30d: z.coerce.number().int().min(0, "Doit être un entier positif."),
  ageDays: z.coerce.number().int().positive("L'âge doit être positif."),
  lastServiceKm: z.coerce.number().positive("Le kilométrage doit être positif."),
  tireTreadMin: z.coerce.number().optional(),
  ambientTempAvg: z.coerce.number(),
  routeProfile: z.string().min(1, "Le profil de route est requis."),
  trailerUtilPct: z.coerce.number().min(0).max(100, "Le pourcentage doit être entre 0 et 100."),
  demoMode: z.boolean().default(false),
});

const mockPrediction: PredictiveMaintenanceOutput = {
    ettfHours: 250,
    ettfKm: 12500,
    riskBreakdown: 0.65,
    nextServiceAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    componentHealth: {
        engine: 0.75,
        tires: 0.60,
        brakes: 0.85,
        reefer: 0.90,
    },
    topFactors: ["Kilométrage élevé depuis le dernier service", "Code DTC P0420 actif", "Augmentation de la consommation de carburant"],
    recommendations: ["Planifier un service de maintenance dans les 200 heures.", "Inspecter le système de catalyseur.", "Vérifier la pression des pneus."],
    confidence: 0.92,
};

export function PredictiveMaintenanceClient({ vin }: { vin: string }) {
  const [prediction, setPrediction] = useState<PredictiveMaintenanceOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      vehicleVin: vin,
      odometer: 125000,
      engineHours: 3500,
      dtcCodes: "P0420, U0100",
      tpmsAlerts: "Pneu AVG basse pression",
      avgTempDeviation: 1.5,
      fuelL100km: 29.5,
      idlePct: 15,
      maintEvents30d: 1,
      ageDays: 730,
      lastServiceKm: 110000,
      tireTreadMin: 4.5,
      ambientTempAvg: 18,
      routeProfile: "Autoroute",
      trailerUtilPct: 80,
      demoMode: true,
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setPrediction(null);
    setError(null);

    if (data.demoMode) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        setPrediction(mockPrediction);
        setIsLoading(false);
        return;
    }

    try {
      // The data object from form.handleSubmit is already parsed and validated
      const result = await predictVehicleMaintenance(data);
      setPrediction(result);
    } catch (e: any) {
      console.error("Error getting predictive maintenance:", e);
      setError(e.message || "Une erreur est survenue lors de la prédiction.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Données du Véhicule</CardTitle>
          <CardDescription>Renseignez les données télématiques pour la prédiction.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 overflow-y-auto max-h-[600px] p-1">
              <FormField name="vehicleVin" render={({ field }) => (
                <FormItem><FormLabel>VIN</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField name="odometer" render={({ field }) => (
                  <FormItem><FormLabel>Odomètre (km)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="engineHours" render={({ field }) => (
                  <FormItem><FormLabel>Heures Moteur</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField name="dtcCodes" render={({ field }) => (
                <FormItem><FormLabel>Codes DTC (séparés par virgule)</FormLabel><FormControl><Input {...field} value={Array.isArray(field.value) ? field.value.join(', ') : field.value} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="tpmsAlerts" render={({ field }) => (
                <FormItem><FormLabel>Alertes TPMS (séparés par virgule)</FormLabel><FormControl><Input {...field} value={Array.isArray(field.value) ? field.value.join(', ') : field.value} /></FormControl><FormMessage /></FormItem>
              )} />
               <div className="grid grid-cols-2 gap-4">
                <FormField name="fuelL100km" render={({ field }) => (
                  <FormItem><FormLabel>Conso (L/100km)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="idlePct" render={({ field }) => (
                  <FormItem><FormLabel>Ralenti (%)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
               <div className="grid grid-cols-2 gap-4">
                <FormField name="lastServiceKm" render={({ field }) => (
                  <FormItem><FormLabel>Dernier service (km)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="ageDays" render={({ field }) => (
                  <FormItem><FormLabel>Âge (jours)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
               <FormField
                control={form.control}
                name="demoMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Mode Démo
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
               <Button type="submit" disabled={isLoading} className="w-full !mt-6 bg-accent hover:bg-accent/90">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BotMessageSquare className="mr-2 h-4 w-4" />}
                Lancer la Prédiction
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résultats de la Maintenance Prédictive</CardTitle>
          <CardDescription>Analyse et recommandations de l'IA.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {!isLoading && !prediction && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <BotMessageSquare className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Les résultats de la prédiction apparaîtront ici.</p>
            </div>
          )}
          {error && (
             <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur de Prédiction</AlertTitle>
              <AlertDescription>
                <p>L'API a retourné une erreur. Cela peut être dû à un dépassement de quota (Too Many Requests).</p>
                <p className="text-xs mt-2 font-mono">{error}</p>
              </AlertDescription>
            </Alert>
          )}
          {prediction && (
            <div className="space-y-4">
               <div>
                <h3 className="text-md font-semibold flex items-center mb-4"><GaugeIcon className="w-4 h-4 mr-2 text-primary"/>Santé des Composants</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <Gauge value={prediction.componentHealth.engine * 100} label="Moteur" size="medium" />
                    <Gauge value={prediction.componentHealth.tires * 100} label="Pneus" size="medium" />
                    <Gauge value={prediction.componentHealth.brakes * 100} label="Freins" size="medium" />
                    {prediction.componentHealth.reefer != null && <Gauge value={prediction.componentHealth.reefer * 100} label="Reefer" size="medium" />}
                </div>
              </div>
              <Separator />
               <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="font-medium">Risque de panne: <span className="font-bold text-lg text-destructive">{(prediction.riskBreakdown * 100).toFixed(1)}%</span></div>
                  <div className="font-medium">Confiance: <span className="font-bold text-lg text-primary">{(prediction.confidence * 100).toFixed(0)}%</span></div>
                  <div className="font-medium">ETTF: <span className="font-bold text-foreground">{prediction.ettfKm} km</span></div>
                  <div className="font-medium">Prochain service: <span className="font-bold text-foreground">{new Date(prediction.nextServiceAt).toLocaleDateString('fr-FR')}</span></div>
              </div>
              <Separator />
              <div>
                <h3 className="text-md font-semibold flex items-center"><List className="w-4 h-4 mr-2 text-primary"/>Recommandations</h3>
                <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-foreground">
                    {prediction.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>
               <Separator />
                <Alert>
                <Milestone className="h-4 w-4" />
                <AlertTitle>Principaux Facteurs</AlertTitle>
                <AlertDescription>
                    {prediction.topFactors.join(', ')}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
