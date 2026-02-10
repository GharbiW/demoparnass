
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ListFilter, Search, MoreHorizontal, PlusCircle, BarChart, Percent, MousePointerClick, Send } from "lucide-react";
import { campaigns as initialCampaigns, type Campaign } from "@/lib/campaigns-data";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export default function CampaignsPage() {

    const kpiData = [
        { title: "Total Emails Envoyés (30j)", value: "1,250", icon: Send },
        { title: "Taux d'Ouverture Moyen", value: "45.2%", icon: Percent },
        { title: "Taux de Clics Moyen", value: "8.7%", icon: MousePointerClick },
        { title: "Nouveaux Prospects Générés", value: "28", icon: PlusCircle },
    ];

  const getStatusVariant = (status: Campaign['status']) => {
    switch (status) {
      case "Terminée": return "secondary";
      case "En cours": return "default";
      case "Brouillon": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-headline">Campagnes d'Emailing</h1>
        <Button asChild>
            <Link href="/commercial/campaigns/new">
                <PlusCircle className="mr-2"/>Nouvelle Campagne
            </Link>
        </Button>
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
                </CardContent>
            </Card>
          ))}
        </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Liste des Campagnes</CardTitle>
              <CardDescription>Analysez la performance de vos campagnes de prospection.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher une campagne..." className="pl-8 w-64" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Filtres</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>Statut: Tous</DropdownMenuItem>
                    <DropdownMenuItem>Date: 30 derniers jours</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de la Campagne</TableHead>
                <TableHead>Date d'envoi</TableHead>
                <TableHead>Destinataires</TableHead>
                <TableHead>Taux d'Ouverture</TableHead>
                <TableHead>Taux de Clics</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                     <Link href={`/commercial/campaigns/${campaign.id}`} className="hover:underline text-primary">
                        {campaign.name}
                     </Link>
                  </TableCell>
                  <TableCell>{campaign.sendDate}</TableCell>
                  <TableCell>{campaign.recipientCount}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <span className="w-12">{campaign.openRate.toFixed(1)}%</span>
                        <Progress value={campaign.openRate} className="h-2 w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-2">
                        <span className="w-12">{campaign.clickRate.toFixed(1)}%</span>
                        <Progress value={campaign.clickRate} className="h-2 w-24" />
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={getStatusVariant(campaign.status)}>{campaign.status}</Badge></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem asChild>
                            <Link href={`/commercial/campaigns/${campaign.id}`}>Voir les détails</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                        <DropdownMenuItem>Archiver</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
