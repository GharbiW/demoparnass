
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ListFilter, Search, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { vehicles } from "@/lib/vehicles-data"

export default function VehiclesPage() {

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Disponible":
        return "secondary"
      case "En mission":
        return "default"
      case "En maintenance":
        return "outline"
      case "En panne":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-headline">Gestion des Véhicules</h1>
      </div>
      <Card>
        <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Flotte de Véhicules</CardTitle>
                    <CardDescription>Recherchez et gérez les véhicules de votre flotte.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Immat, VIN..." className="pl-8 w-64" />
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
                        <DropdownMenuCheckboxItem checked>
                            Statut: Tous
                        </DropdownMenuCheckboxItem>
                         <DropdownMenuCheckboxItem>
                            Énergie: Tous
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>
                            Alertes: Aucune
                        </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button>Ajouter Véhicule</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Immatriculation</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead>Marque/Modèle</TableHead>
                <TableHead>Énergie</TableHead>
                <TableHead>Kilométrage</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Prochain Service</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.vin}>
                  <TableCell className="font-medium">{vehicle.immatriculation}</TableCell>
                  <TableCell>{vehicle.vin}</TableCell>
                  <TableCell>{vehicle.marque} {vehicle.modele}</TableCell>
                  <TableCell>{vehicle.energie}</TableCell>
                  <TableCell>{vehicle.kilometrage.toLocaleString('fr-FR')} km</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(vehicle.statut)}>
                      {vehicle.statut}
                    </Badge>
                  </TableCell>
                  <TableCell>{vehicle.prochainService}</TableCell>
                   <TableCell>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                           <DropdownMenuItem asChild>
                            <Link href={`/vehicles/${vehicle.vin}`}>Détails 360</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Ouvrir ticket maintenance</DropdownMenuItem>
                          <DropdownMenuItem>Verrouiller carte carburant</DropdownMenuItem>
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
