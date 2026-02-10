

"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Leaf, Droplets, Wind, Battery, ArrowDown, ArrowUp, Truck } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMockData } from "@/hooks/use-mock-data";

const initialKpiData = [
  { title: "CO₂ (t, 30j)", value: "48.7 t", icon: Leaf, change: "-2.5%", isIncrease: false },
  { title: "% Flotte Verte", value: "28%", icon: Battery, change: "+3%", isIncrease: true },
  { title: "Ralenti (%, 30j)", value: "12.4%", icon: Wind, change: "-0.8%", isIncrease: false },
  { title: "Conso moyenne (L/100)", value: "28.9L", icon: Droplets, change: "-0.2L", isIncrease: false },
];

const co2EvolutionData = [
  { month: "Jan", co2: 55 },
  { month: "Fev", co2: 52 },
  { month: "Mar", co2: 53 },
  { month: "Avr", co2: 49 },
  { month: "Mai", co2: 48 },
  { month: "Juin", co2: 47 },
];

const co2ChartConfig = {
  co2: {
    label: "CO₂ (tonnes)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;


const initialTransitionRecommendations = [
    { vehicle: "PL-JKL-101", currentEnergy: "Diesel", recommendedEnergy: "Gaz", co2Gain: "-15%", tcoGain: "-8%" },
    { vehicle: "PL-DEF-456", currentEnergy: "Diesel", recommendedEnergy: "Électrique", co2Gain: "-100%", tcoGain: "+5% (init)" },
    { vehicle: "VUL-PQR-567", currentEnergy: "Diesel", recommendedEnergy: "Électrique", co2Gain: "-12%", tcoGain: "-12%" },
];


export default function RSEPage() {
    const { vehiclesData } = useMockData();
    const [selectedVin, setSelectedVin] = useState<string>("all");
    const [kpiData, setKpiData] = useState(initialKpiData);
    const [transitionRecommendations, setTransitionRecommendations] = useState(initialTransitionRecommendations);

    const handleVehicleChange = (vin: string) => {
        setSelectedVin(vin);
        if (vin === 'all') {
            setKpiData(initialKpiData);
            setTransitionRecommendations(initialTransitionRecommendations);
        } else {
            const vehicle = vehiclesData.find(v => v.vin === vin);
            if (vehicle) {
                const isGaz = vehicle.energie === 'Gaz';
                const isElectric = vehicle.energie === 'Électrique';
                setKpiData([
                    { title: "CO₂ (g/km)", value: isElectric ? "0" : (isGaz ? "750" : "950"), icon: Leaf, change: isGaz ? "-18%" : "+2%", isIncrease: !isGaz },
                    { title: "Type Énergie", value: vehicle.energie, icon: Battery, change: "", isIncrease: true },
                    { title: "Ralenti (%, 30j)", value: isElectric ? "0%" : "8.2%", icon: Wind, change: "+0.5%", isIncrease: true },
                    { title: "Conso moyenne", value: isElectric ? "22kWh/100" : `${isGaz ? '25kg' : '31L'}/100`, icon: Droplets, change: isGaz ? "-0.1L" : "+0.3L", isIncrease: !isGaz },
                ]);
                setTransitionRecommendations(
                  vehicle.energie === 'Diesel' 
                  ? [{ vehicle: vehicle.immatriculation, currentEnergy: "Diesel", recommendedEnergy: "Gaz", co2Gain: "-15%", tcoGain: "-8%" }]
                  : []
                )
            }
        }
    }


  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold font-headline">RSE & CO₂</h1>
            <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground"/>
                <Select value={selectedVin} onValueChange={handleVehicleChange}>
                    <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Filtrer par véhicule..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toute la flotte</SelectItem>
                        {vehiclesData.map(v => (
                            <SelectItem key={v.vin} value={v.vin}>{v.immatriculation} ({v.marque} {v.modele})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map(kpi => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.change && (
                <p className="text-xs text-muted-foreground flex items-center">
                  <span className={`flex items-center ${kpi.isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.isIncrease ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                    {kpi.change}
                  </span>
                  <span className="ml-1">vs mois dernier</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Évolution des Émissions de CO₂ (6 mois)</CardTitle>
            <CardDescription>
                {selectedVin === 'all' ? "Suivi des émissions totales de la flotte." : `Suivi des émissions pour le véhicule ${vehiclesData.find(v => v.vin === selectedVin)?.immatriculation}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={co2ChartConfig} className="min-h-[250px] w-full">
                <BarChart data={co2EvolutionData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} unit="t" />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="co2" fill="var(--color-co2)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
         <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mix Énergétique</CardTitle>
             <CardDescription>
                {selectedVin === 'all' ? "Répartition de la flotte par type d'énergie." : `Type d'énergie pour le véhicule sélectionné.`}
             </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
             <p className="text-muted-foreground">Graphique à venir...</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommandations de Transition Énergétique</CardTitle>
          <CardDescription>
             {selectedVin === 'all' ? "Véhicules et lignes éligibles pour une transition vers des énergies plus propres." : `Recommandations pour le véhicule sélectionné.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Véhicule</TableHead>
                <TableHead>Énergie Actuelle</TableHead>
                <TableHead>Énergie Recommandée</TableHead>
                <TableHead>Gain CO₂ Estimé</TableHead>
                <TableHead>Gain TCO Estimé</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transitionRecommendations.length > 0 ? transitionRecommendations.map((rec) => (
                <TableRow key={rec.vehicle}>
                  <TableCell className="font-medium">{rec.vehicle}</TableCell>
                  <TableCell><Badge variant="outline">{rec.currentEnergy}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{rec.recommendedEnergy}</Badge></TableCell>
                  <TableCell className="font-bold text-green-600">{rec.co2Gain}</TableCell>
                  <TableCell className="font-bold text-green-600">{rec.tcoGain}</TableCell>
                  <TableCell><Button variant="outline" size="sm">Lancer une simulation</Button></TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Aucune recommandation pour ce véhicule.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
