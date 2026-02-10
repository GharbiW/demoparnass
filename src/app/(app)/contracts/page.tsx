
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { ListFilter, Search, PlusCircle } from "lucide-react"
import { useMockData } from "@/hooks/use-mock-data";
import { Contract } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CreateContractDialog } from "@/components/commercial/create-contract-dialog";
import { useToast } from "@/hooks/use-toast";
import { mockDataService } from "@/lib/mock-data-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

export default function ContractsPage() {
  const { contracts: initialContracts } = useMockData();
  const [contracts, setContracts] = useState<Contract[]>(initialContracts || []);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");

  const uniqueVehicleTypes = useMemo(() => ["all", ...Array.from(new Set(initialContracts.map(c => c.vehicleType)))], [initialContracts]);
  const uniqueSkills = useMemo(() => ["all", ...Array.from(new Set(initialContracts.flatMap(c => c.driverSkills)))], [initialContracts]);

  useEffect(() => {
    if (initialContracts) {
      setContracts(initialContracts);
    }
  }, [initialContracts]);

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
        const searchMatch = contract.client.toLowerCase().includes(searchTerm.toLowerCase());
        const vehicleMatch = vehicleTypeFilter === 'all' || contract.vehicleType === vehicleTypeFilter;
        const skillMatch = skillFilter === 'all' || contract.driverSkills.includes(skillFilter as any);
        return searchMatch && vehicleMatch && skillMatch;
    });
  }, [contracts, searchTerm, vehicleTypeFilter, skillFilter]);


  const handleAddContract = (newContractData: Omit<Contract, 'id' | 'isSuspended'>) => {
    const newContract: Contract = {
        id: `CTR-${String(contracts.length + 1).padStart(3, '0')}`,
        isSuspended: false,
        ...newContractData,
    };
    mockDataService.addContract(newContract); 
    setContracts(prev => [newContract, ...prev]);
    toast({
        title: "Contrat créé",
        description: `Le contrat pour ${newContract.client} a été ajouté avec succès.`,
    });
  }
  
  if (!contracts) {
    return <div>Chargement des contrats...</div>;
  }

  return (
    <>
      <CreateContractDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        onAddContract={handleAddContract}
      />
      <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-headline">Cahier des Charges Client</h1>
          <div className="flex items-center gap-2">
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher par client..." 
                    className="pl-8 w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                <SelectContent>
                    {uniqueVehicleTypes.map(type => <SelectItem key={type} value={type}>{type === 'all' ? 'Tous types véhicule' : type}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue/></SelectTrigger>
                <SelectContent>
                    {uniqueSkills.map(skill => <SelectItem key={skill} value={skill}>{skill === 'all' ? 'Toutes compétences' : skill}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2"/>Nouveau Contrat</Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Contrats Actifs & Spécifications</CardTitle>
            <CardDescription>Cette table contient toutes les contraintes et spécifications pour chaque prestation client.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Trajet</TableHead>
                  <TableHead>Fréquence</TableHead>
                  <TableHead>Contraintes</TableHead>
                  <TableHead>Validité</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      <Link href={`/commercial/${encodeURIComponent(contract.client)}`} className="text-primary hover:underline">
                        {contract.client}
                      </Link>
                    </TableCell>
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
                      <Badge variant={contract.isSuspended ? "destructive" : "secondary"}>
                        {contract.isSuspended ? "Suspendu" : "Actif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredContracts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Aucun contrat ne correspond à vos critères de recherche.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
