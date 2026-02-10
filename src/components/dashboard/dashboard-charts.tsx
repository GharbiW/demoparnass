
"use client"

import { Bar, BarChart, Line, LineChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { activityChartData, energyCostData } from "@/lib/data"
import { ChartTooltipContent, ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Button } from '../ui/button';
import { Bot, FileWarning, PlaySquare, Settings2 } from 'lucide-react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AiCortexRecommendations } from './ai-cortex-recommendations';

const activityChartConfig = {
  "Evénements": {
    label: "Evénements",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const energyCostChartConfig = {
  "Diesel": {
    label: "Diesel",
    color: "hsl(var(--chart-1))",
  },
  "Gaz": {
    label: "Gaz",
    color: "hsl(var(--chart-2))",
  },
  "Electrique": {
    label: "Électrique",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const latestAlerts = [
    {id: 'PASS123', type: 'PASSalert', description: 'Freinage brusque détecté', vehicle: 'VIN-ABC-123', timestamp: '2024-07-30 10:45:12'},
    {id: 'COMP456', type: 'Compliance', description: "Expiration de l'assurance", vehicle: 'VIN-DEF-456', timestamp: 'Expire dans 3 jours'},
    {id: 'PASS789', type: 'PASSalert', description: 'Accélération rapide', vehicle: 'VIN-GHI-789', timestamp: '2024-07-30 10:42:01'},
    {id: 'COMP101', type: 'Compliance', description: 'Prochain contrôle technique', vehicle: 'VIN-JKL-101', timestamp: 'Expire dans 15 jours'},
];


export function DashboardCharts() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Événements d'ingestion / heure (24h)</CardTitle>
          <CardDescription>Volume d'événements traités par la plateforme.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ChartContainer config={activityChartConfig} className="min-h-[300px] w-full">
            <LineChart
                data={activityChartData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="Evénements" stroke="var(--color-Evénements)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <AiCortexRecommendations />

      <Card>
        <CardHeader>
          <CardTitle>Coûts énergie par type (30j)</CardTitle>
          <CardDescription>Comparaison des dépenses énergétiques.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ChartContainer config={energyCostChartConfig} className="min-h-[300px] w-full">
            <BarChart data={energyCostData} layout="vertical" stackOffset="expand">
                <XAxis type="number" hide={true} domain={[0, 1]} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip content={<ChartTooltipContent formatter={(value, name, props) => [`${(props.payload[name] as number).toLocaleString('fr-FR', {style:'currency', currency:'EUR'})}`, name]} />} />
                <Legend content={<ChartLegendContent />} />
                <Bar dataKey="Diesel" fill="var(--color-Diesel)" stackId="a" />
                <Bar dataKey="Gaz" fill="var(--color-Gaz)" stackId="a" />
                <Bar dataKey="Electrique" fill="var(--color-Electrique)" stackId="a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card className="h-[360px] flex flex-col">
        <CardHeader>
            <CardTitle>Positions Live</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center bg-muted/50 text-muted-foreground">
            <p>Composant de carte à venir...</p>
        </CardContent>
      </Card>

        <Card className="xl:col-span-2">
            <CardHeader>
                <CardTitle>Dernières alertes PASSalert & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Véhicule</TableHead>
                            <TableHead>Horodatage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {latestAlerts.map(alert => (
                            <TableRow key={alert.id}>
                                <TableCell>
                                    <Badge variant={alert.type === 'PASSalert' ? 'secondary' : 'destructive'}>{alert.type}</Badge>
                                </TableCell>
                                <TableCell>{alert.description}</TableCell>
                                <TableCell>{alert.vehicle}</TableCell>
                                <TableCell>{alert.timestamp}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
        <Card className="xl:col-span-3">
             <CardHeader>
                <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Button variant="outline"><PlaySquare /> Rejouer un lot</Button>
                <Button variant="outline"><Bot /> Générer données démo</Button>
                <Button variant="outline" asChild><Link href="/dlq"><FileWarning/> Ouvrir DLQ</Link></Button>
                <Button variant="outline"><Settings2/> Paramétrer seuils IA</Button>
            </CardContent>
        </Card>

    </div>
  )
}
