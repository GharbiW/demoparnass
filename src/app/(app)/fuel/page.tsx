
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ListFilter, MoreHorizontal, Search, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fuelTransactions, fuelExceptions, fuelCards } from "@/lib/fuel-data";
import { Badge } from "@/components/ui/badge";

export default function FuelPage() {
    const getExceptionBadgeVariant = (severity: string) => {
        switch (severity) {
            case 'Haute': return 'destructive';
            case 'Moyenne': return 'secondary';
            default: return 'outline';
        }
    }
     const getCardStatusBadgeVariant = (status: string) => {
        return status === 'Active' ? 'secondary' : 'destructive';
    }


  return (
    <div className="flex flex-col h-full space-y-4">
      <h1 className="text-2xl font-bold font-headline">Carburant</h1>
      <Tabs defaultValue="transactions" className="flex flex-col flex-grow">
        <div className="flex justify-between items-center">
            <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
            <TabsTrigger value="cards">Cartes</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="transactions" className="flex-grow mt-4">
          <Card className="h-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Transactions Carburant</CardTitle>
                        <CardDescription>Liste de toutes les transactions de carburant.</CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Rechercher VIN, carte..." className="pl-8 w-64" />
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
                            <DropdownMenuCheckboxItem checked>Site: Tous</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Plage de dates</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" size="sm" className="h-9 gap-1">
                            <FileDown className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Exporter</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Carte</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Litres</TableHead>
                    <TableHead>Prix/L</TableHead>
                    <TableHead>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell className="font-medium">{tx.vin}</TableCell>
                      <TableCell>{tx.card}</TableCell>
                      <TableCell>{tx.station}</TableCell>
                      <TableCell>{tx.litres.toFixed(2)}</TableCell>
                      <TableCell>{tx.pricePerLitre.toFixed(3)} €</TableCell>
                      <TableCell className="font-bold">{tx.amount.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="exceptions" className="flex-grow mt-4">
          <Card className="h-full">
             <CardHeader>
                <CardTitle>Exceptions de Carburant</CardTitle>
                <CardDescription>Anomalies détectées lors des transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>VIN</TableHead>
                            <TableHead>Type d'Exception</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Sévérité</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fuelExceptions.map(ex => (
                            <TableRow key={ex.id}>
                                <TableCell>{ex.date}</TableCell>
                                <TableCell>{ex.vin}</TableCell>
                                <TableCell className="font-medium">{ex.type}</TableCell>
                                <TableCell>{ex.description}</TableCell>
                                <TableCell><Badge variant={getExceptionBadgeVariant(ex.severity)}>{ex.severity}</Badge></TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem>Valider</DropdownMenuItem>
                                            <DropdownMenuItem>Invalider</DropdownMenuItem>
                                            <DropdownMenuItem>Ouvrir une anomalie</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cards" className="flex-grow mt-4">
          <Card className="h-full">
            <CardHeader>
                <CardTitle>Gestion des Cartes Carburant</CardTitle>
                <CardDescription>Visualisez et gérez les cartes de votre flotte.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {fuelCards.map(card => (
                        <Card key={card.id}>
                            <CardHeader>
                                <CardTitle className="text-base">{card.id}</CardTitle>
                                <CardDescription>{card.provider}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <p><strong>VIN Assigné:</strong> {card.assignedVin || 'Aucun'}</p>
                                <p><strong>Dernière Util.:</strong> {card.lastUsed}</p>
                                <div><Badge variant={getCardStatusBadgeVariant(card.status)}>{card.status}</Badge></div>
                            </CardContent>
                            <CardContent className="flex gap-2">
                                <Button size="sm" variant={card.status === 'Active' ? 'destructive' : 'secondary'}>
                                    {card.status === 'Active' ? 'Verrouiller' : 'Déverrouiller'}
                                </Button>
                                <Button size="sm" variant="outline">Réassigner</Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
