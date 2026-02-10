
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, GanttChartSquare } from "lucide-react"
import { useMockData } from "@/hooks/use-mock-data";
import { Contract } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { PlanRequestDialog } from "@/components/planning/plan-request-dialog";

export default function PlanningRequestsPage() {
  const { contracts: initialContracts } = useMockData();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const router = useRouter();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (initialContracts) {
      // Logic to determine which contracts are "à planifier"
      setContracts(initialContracts.filter(c => !c.isSuspended).slice(0, 10));
    }
  }, [initialContracts]);
  
  if (!contracts) {
    return <div>Chargement des prestations...</div>;
  }
  
  const handlePlanify = (contract: Contract) => {
    setSelectedContract(contract);
  }

  const handleSelectOption = (option: 'new' | 'attach', contract: Contract) => {
    if (option === 'new') {
        const query = new URLSearchParams({
            action: 'create',
            client: contract.client,
            pickup: contract.originSite,
            delivery: contract.destinationSite,
            contractId: contract.id,
        });
        router.push(`/planning?${query.toString()}`);
    } else {
        // Here you would implement the logic to attach to an existing trip
        alert(`Logique de rattachement pour ${contract.id} à implémenter.`);
    }
    setSelectedContract(null); // Close dialog
  }

  return (
    <>
      {selectedContract && (
        <PlanRequestDialog
            contract={selectedContract}
            open={!!selectedContract}
            onOpenChange={() => setSelectedContract(null)}
            onSelect={handleSelectOption}
        />
      )}
      <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-headline">Prestations à Planifier</h1>
          <div className="flex items-center gap-2">
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher par client..." className="pl-8 w-64" />
              </div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Demandes Commerciales ({contracts.length})</CardTitle>
            <CardDescription>Liste de toutes les nouvelles prestations et contrats clients à intégrer dans le planning de transport.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Trajet</TableHead>
                  <TableHead>Fréquence</TableHead>
                  <TableHead>Contraintes</TableHead>
                  <TableHead>Validité Contrat</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.client}</TableCell>
                    <TableCell>
                      <div>{contract.originSite}</div>
                      <div className="text-muted-foreground text-xs">vers {contract.destinationSite}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">{contract.daysOfWeek.map(day => <Badge key={day} variant="outline" className="text-xs">{day}</Badge>)}</div>
                      <div className="text-xs mt-1">{contract.departureTime} - {contract.arrivalTime}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="w-fit">{contract.vehicleType}</Badge>
                          {contract.driverSkills.map(skill => <Badge key={skill} variant="outline" className="w-fit">{skill}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{format(new Date(contract.contractStart), "dd/MM/yyyy", { locale: fr })}</div>
                      <div>{format(new Date(contract.contractEnd), "dd/MM/yyyy", { locale: fr })}</div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handlePlanify(contract)}>
                        <GanttChartSquare className="mr-2" />
                        Planifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {contracts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Toutes les prestations sont planifiées. Aucune demande en attente.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
