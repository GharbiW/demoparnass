

"use client"

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
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ListFilter, Search } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LeaderboardTable } from "@/components/drivers/leaderboard"
import { useMockData } from "@/hooks/use-mock-data"
import { DriverSafetyPanel } from "@/components/drivers/driver-safety-panel";

export default function DriversPage() {
  const { drivers, trips } = useMockData();

  const getStatusVariant = (status: string) => {
    switch (status) {
        case "Actif": return "secondary";
        case "En panne": return "destructive";
        default: return "outline";
    }
  }

  const visibleTrips = trips.filter(trip => drivers.some(d => d.id === trip.driverId));

  return (
    <div className="flex flex-col h-full space-y-4">
      <h1 className="text-2xl font-bold font-headline">Chauffeurs (Opérationnel)</h1>
      <Tabs defaultValue="list">
        <div className="flex justify-between items-center">
            <TabsList>
                <TabsTrigger value="list">Liste</TabsTrigger>
                <TabsTrigger value="leaderboard">Classement</TabsTrigger>
            </TabsList>
             <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher nom, camion..." className="pl-8 w-64" />
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
                        <DropdownMenuCheckboxItem>Score Sécurité: Tous</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>Score Éco-conduite: Tous</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button>Ajouter Chauffeur</Button>
            </div>
        </div>

        <TabsContent value="list">
            <Card className="flex-grow">
                <CardHeader>
                    <CardTitle>Liste des Chauffeurs</CardTitle>
                    <CardDescription>Recherchez, filtrez et gérez les chauffeurs de votre flotte.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Camion Attribué</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Score Sécurité</TableHead>
                        <TableHead>Score Éco</TableHead>
                        <TableHead>Statut</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {drivers.map((driver) => (
                        <TableRow key={driver.id}>
                        <TableCell className="font-medium">
                            <Link href={`/chauffeurs/${driver.id}`} className="hover:underline text-primary">
                            {driver.name}
                            </Link>
                        </TableCell>
                        <TableCell>{driver.phone}</TableCell>
                        <TableCell>{driver.truck}</TableCell>
                        <TableCell>{driver.site}</TableCell>
                        <TableCell><Badge variant={(driver.scoreSecurite ?? 0) > 90 ? 'secondary' : 'outline'}>{driver.scoreSecurite ?? '-'}</Badge></TableCell>
                        <TableCell><Badge variant={(driver.scoreEco ?? 0) > 90 ? 'secondary' : 'outline'}>{driver.scoreEco ?? '-'}</Badge></TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(driver.status)}>
                              {driver.status}
                            </Badge>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="leaderboard">
            <Card className="flex-grow">
                <CardHeader>
                    <CardTitle>Classements Sécurité & Éco-conduite</CardTitle>
                    <CardDescription>Comparez les performances des chauffeurs et identifiez les opportunités d'amélioration.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LeaderboardTable drivers={drivers} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      <DriverSafetyPanel visibleTrips={visibleTrips} />
    </div>
  )
}
