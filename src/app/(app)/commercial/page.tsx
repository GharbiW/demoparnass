
"use client";

import * as React from "react";
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
import { Search, ArrowRight, PlusCircle, Building, FileText, Star } from "lucide-react"
import { useRouter } from "next/navigation";
import { mockDataService } from "@/lib/mock-data-service";
import type { Contract } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { CreateClientDialog } from "@/components/commercial/create-client-dialog";
import Link from "next/link";

export default function ClientsPage() {
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

   React.useEffect(() => {
    const unsubscribe = mockDataService.subscribe(() => {
      setContracts(mockDataService.getContracts());
    });
    setContracts(mockDataService.getContracts());
    return unsubscribe;
  }, []);
  
  const handleAddClient = () => {
    // In a real app, this would involve adding a client to the DB.
    // For now, we just show a toast and the user would then create a contract.
    toast({
        title: "Client Ajouté",
        description: `Le nouveau profil client a été créé. Vous pouvez maintenant lui créer un contrat.`,
    });
  }

  if (contracts.length === 0) {
    return <div>Chargement...</div>;
  }

  const uniqueClients = Array.from(new Set(contracts.map(c => c.client))).map(clientName => {
    const clientContracts = contracts.filter(c => c.client === clientName);
    const isActive = clientContracts.some(c => !c.isSuspended);
    const totalVolume = clientContracts.length;
    const skills = Array.from(new Set(clientContracts.flatMap(c => c.driverSkills)));
    return {
        name: clientName,
        status: isActive ? 'Actif' : 'Suspendu',
        contractCount: totalVolume,
        requiredSkills: skills,
        category: clientName === 'CARREFOUR' ? 'Grand Compte' : 'Standard'
    }
  });


  return (
    <>
       <CreateClientDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        onAddClient={handleAddClient}
      />
      <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold font-headline">Clients</h1>
          <div className="flex items-center gap-2">
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher un client..." className="pl-8 w-64" />
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2"/>Ajouter Client</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueClients.map((client) => (
              <Link key={client.name} href={`/commercial/${encodeURIComponent(client.name)}`} className="flex">
                <Card className="flex flex-col w-full cursor-pointer hover:border-primary transition-all">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span className="flex items-center gap-2"><Building/>{client.name}</span>
                            <Badge variant={client.status === 'Actif' ? "secondary" : "destructive"}>
                                {client.status}
                            </Badge>
                        </CardTitle>
                         <CardDescription>{client.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-sm">
                        <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/> {client.contractCount} Contrat(s) Actif(s)</div>
                        {client.requiredSkills.length > 0 && (
                             <div className="flex items-start gap-2 pt-2">
                                 <Star className="h-4 w-4 text-muted-foreground mt-0.5"/>
                                <div className="flex flex-wrap gap-1">
                                    {client.requiredSkills.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                </Link>
            ))}
        </div>
      </div>
    </>
  );
}
