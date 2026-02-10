
"use client";

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { FileDown, FileText, BarChart, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignDriver, CampaignRequest } from "@/lib/vacation-campaign-data";
import { Progress } from '../ui/progress';

interface AnalyticsReportingProps {
  drivers: CampaignDriver[];
  requests: CampaignRequest[];
}

const StatCard = ({ title, value, subValue, Icon, variant = 'default' }: { title: string, value: string | number, subValue?: string, Icon: React.ElementType, variant?: 'default' | 'destructive' | 'secondary' }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={cn("h-4 w-4 text-muted-foreground", {
                'text-destructive': variant === 'destructive',
                'text-green-600': variant === 'secondary'
            })} />
        </CardHeader>
        <CardContent>
            <div className={cn("text-2xl font-bold", {
                 'text-destructive': variant === 'destructive',
            })}>{value}</div>
            {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        </CardContent>
    </Card>
);

export function AnalyticsReporting({ drivers, requests }: AnalyticsReportingProps) {

    const analytics = useMemo(() => {
        const totalRequests = requests.length;
        const accepted = requests.filter(r => r.status === 'accepted').length;
        const rejected = requests.filter(r => r.status === 'rejected').length;
        const rejectedForCapacity = requests.filter(r => r.status === 'rejected' && r.impact === 'KO').length;
        
        const fulfillmentRate = totalRequests > 0 ? (accepted / totalRequests) * 100 : 0;
        const denialRate = totalRequests > 0 ? (rejected / totalRequests) * 100 : 0;
        const denialForCapacityRate = rejected > 0 ? (rejectedForCapacity / rejected) * 100 : 0;

        const atRiskZones = new Set(requests.filter(r => r.impact === 'Tight' || r.impact === 'KO').map(r => r.zone));
        const atRiskSkills = new Set(requests.filter(r => r.impact === 'Tight' || r.impact === 'KO').map(r => r.skill));
        
        return {
            fulfillmentRate,
            denialRate,
            denialForCapacityRate,
            atRiskZones: Array.from(atRiskZones),
            atRiskSkills: Array.from(atRiskSkills),
        }
    }, [requests]);
    
    const fairnessData = useMemo(() => {
        return drivers.map(driver => {
            const driverRequests = requests.filter(r => r.driverId === driver.id);
            const accepted = driverRequests.filter(r => r.status === 'accepted').length;
            const rejected = driverRequests.filter(r => r.status === 'rejected').length;
            const pending = driverRequests.filter(r => r.status === 'pending').length;
            return {
                ...driver,
                acceptedCount: accepted,
                rejectedCount: rejected,
                pendingCount: pending,
                satisfactionRate: driverRequests.length > 0 ? (accepted / driverRequests.length) * 100 : 100,
            }
        }).sort((a,b) => a.satisfactionRate - b.satisfactionRate);
    }, [drivers, requests]);

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Tableau de Bord Exécutif</CardTitle>
                <CardDescription>KPIs principaux de la campagne de congés en cours.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                    title="Taux d'Acceptation" 
                    value={`${analytics.fulfillmentRate.toFixed(1)}%`} 
                    subValue={`${requests.filter(r=>r.status === 'accepted').length} / ${requests.length} demandes`}
                    Icon={CheckCircle}
                    variant="secondary"
                />
                 <StatCard 
                    title="Taux de Refus" 
                    value={`${analytics.denialRate.toFixed(1)}%`} 
                     subValue={`${requests.filter(r=>r.status === 'rejected').length} / ${requests.length} demandes`}
                    Icon={XCircle}
                    variant="destructive"
                />
                <StatCard 
                    title="Zones à Risque" 
                    value={analytics.atRiskZones.length}
                    subValue={analytics.atRiskZones.join(', ')} 
                    Icon={AlertTriangle}
                    variant={analytics.atRiskZones.length > 0 ? "destructive" : "default"}
                />
                 <StatCard 
                    title="Compétences en Tension" 
                    value={analytics.atRiskSkills.length} 
                    subValue={analytics.atRiskSkills.join(', ')} 
                    Icon={BarChart}
                    variant={analytics.atRiskSkills.length > 0 ? "destructive" : "default"}
                />
            </CardContent>
             <CardFooter className="flex justify-end gap-2">
                <Button variant="outline"><FileText className="mr-2"/>Exporter en PDF</Button>
                <Button><FileDown className="mr-2"/>Exporter en Excel</Button>
            </CardFooter>
        </Card>

        <Card>
             <CardHeader>
                <CardTitle>Index d'Équité Chauffeur</CardTitle>
                <CardDescription>Analyse de la répartition des congés pour assurer un traitement équitable.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Chauffeur</TableHead>
                            <TableHead>Taux de Satisfaction</TableHead>
                            <TableHead>Acceptées</TableHead>
                            <TableHead>Refusées</TableHead>
                            <TableHead>En attente</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fairnessData.map(driver => (
                            <TableRow key={driver.id}>
                                <TableCell className="font-medium">{driver.name}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Progress value={driver.satisfactionRate} className="w-24 h-2"/>
                                        <span>{driver.satisfactionRate.toFixed(0)}%</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-green-600 font-semibold">{driver.acceptedCount}</TableCell>
                                <TableCell className="text-red-600 font-semibold">{driver.rejectedCount}</TableCell>
                                <TableCell>{driver.pendingCount}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
         <Card>
            <CardHeader>
                <CardTitle>Analyse Post-Campagne</CardTitle>
                <CardDescription>Disponible une fois la campagne clôturée.</CardDescription>
            </CardHeader>
             <CardContent className="text-center text-muted-foreground py-12">
                <p>Comparez les congés planifiés vs. la réalité, analysez les surcharges et obtenez des recommandations pour l'année prochaine.</p>
            </CardContent>
        </Card>
    </div>
  );
}

