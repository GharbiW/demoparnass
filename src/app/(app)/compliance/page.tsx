
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComplianceTable } from "@/components/compliance/compliance-table";
import { DocumentLibrary } from "@/components/compliance/document-library";
import { ZfeCompliance } from "@/components/compliance/zfe-compliance";
import { driverComplianceData, vehicleComplianceData, documentLibrary, zfeComplianceData } from "@/lib/compliance-data";
import { Button } from "@/components/ui/button";
import { ListFilter, Search, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";


export default function CompliancePage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-headline">Gestion de la Conformité</h1>
         <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher..." className="pl-8 w-64" />
            </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filtres
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Statut: Tous</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Site: Tous</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Type: Tous</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
           <Button variant="outline" size="sm" className="h-9 gap-1">
                <FileDown className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Exporter</span>
            </Button>
        </div>
      </div>
      <Tabs defaultValue="drivers" className="flex flex-col flex-grow">
        <TabsList>
          <TabsTrigger value="drivers">Échéances</TabsTrigger>
          <TabsTrigger value="vehicles">Véhicules</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="zfe">Routage &amp; ZFE</TabsTrigger>
        </TabsList>
        <TabsContent value="drivers" className="flex-grow mt-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Échéances de Conformité - Chauffeurs</CardTitle>
              <CardDescription>Suivi des permis, FCO, visites médicales et autres documents des chauffeurs.</CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceTable data={driverComplianceData} type="driver" />
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="vehicles" className="flex-grow mt-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Échéances de Conformité - Véhicules</CardTitle>
              <CardDescription>Suivi des assurances, contrôles techniques et autres documents des véhicules.</CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceTable data={vehicleComplianceData} type="vehicle" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="flex-grow mt-4">
             <Card className="h-full">
                <CardHeader>
                    <CardTitle>Bibliothèque de Documents</CardTitle>
                    <CardDescription>Gestion centralisée de tous les documents de conformité.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DocumentLibrary initialData={documentLibrary} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="zfe" className="flex-grow mt-4">
             <Card className="h-full">
                <CardHeader>
                    <CardTitle>Conformité ZFE (Zones à Faibles Émissions)</CardTitle>
                    <CardDescription>Vérification de l'éligibilité de la flotte pour les principales ZFE françaises.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ZfeCompliance data={zfeComplianceData} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
