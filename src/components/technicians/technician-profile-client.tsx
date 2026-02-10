
"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ClipboardList,
  Award,
  Wrench,
  Clock,
  CheckCircle,
  Star,
  Settings,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  technicians,
  workOrders,
} from "@/lib/technicians-data";
import { Separator } from "@/components/ui/separator";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  value: {
    label: "Valeur",
  },
} satisfies ChartConfig;


export function TechnicianProfileClient({
  technicianId,
}: {
  technicianId: string;
}) {
    const technician = technicians.find(t => t.id === technicianId) || technicians[0];

    const performanceData = [
        { metric: 'Temps moyen', value: technician.avgRepairTime, unit: 'h' },
        { metric: 'Taux succès', value: technician.successRate, unit: '%' },
    ]

  return (
    <div className="flex flex-col gap-6">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm -mx-6 -mt-6 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link href="/technicians" className="hover:underline">
                Techniciens
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">
                {technician.name}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{technician.site}</Badge>
                <Badge variant={technician.status === 'Actif' ? 'secondary' : 'default'}>{technician.status}</Badge>
            </div>
          </div>
           <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-sm font-semibold">Tps. Réparation Moyen</p>
                    <p className="text-lg font-bold">{technician.avgRepairTime}h</p>
                </div>
                 <div className="text-right">
                    <p className="text-sm font-semibold">Taux de Succès (1ère fois)</p>
                    <p className="text-lg font-bold">{technician.successRate}%</p>
                </div>
                 <div className="text-right">
                    <p className="text-sm font-semibold">Interventions (30j)</p>
                    <p className="text-lg font-bold">12</p>
                </div>
                <Separator orientation="vertical" className="h-10"/>
                <Button>Assigner un Work Order</Button>
            </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="col-span-1 flex flex-col gap-6">
            <Card>
                <CardHeader><CardTitle>Profil & Contact</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                        <span>Email</span><span>{technician.email}</span>
                        <span>Téléphone</span><span>{technician.phone}</span>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Compétences & Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <h4 className="font-semibold mb-2 flex items-center"><Star className="mr-2 h-4 w-4 text-amber-500"/>Compétences</h4>
                        <div className="flex flex-wrap gap-2">
                            {technician.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                        </div>
                     </div>
                     <Separator />
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center"><Award className="mr-2 h-4 w-4 text-amber-500"/>Certifications</h4>
                        <div className="flex flex-wrap gap-2">
                            {technician.certifications.map(cert => <Badge key={cert} variant="outline">{cert}</Badge>)}
                        </div>
                     </div>
                </CardContent>
            </Card>
        </div>

        <div className="col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Work Orders Assignés</CardTitle>
                    <CardDescription>Liste des interventions en cours et passées.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Work Order</TableHead>
                                <TableHead>Véhicule</TableHead>
                                <TableHead>Tâche</TableHead>
                                <TableHead>Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workOrders.filter(wo => wo.technicianId === technician.id).map(wo => (
                                <TableRow key={wo.id}>
                                    <TableCell className="font-medium">{wo.id}</TableCell>
                                    <TableCell>{wo.vehicle}</TableCell>
                                    <TableCell className="max-w-xs truncate">{wo.task}</TableCell>
                                    <TableCell><Badge variant={wo.status === 'Terminé' ? 'secondary' : 'default'}>{wo.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
