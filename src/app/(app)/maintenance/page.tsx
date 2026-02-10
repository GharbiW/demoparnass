
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { ListFilter, MoreHorizontal, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { PredictivePartsForecast } from "@/components/maintenance/predictive-parts-forecast"

const tickets = [
  {
    id: "TICKET-001",
    vin: "VIN-ABC-123",
    type: "Correctif",
    priority: "Haute",
    status: "Ouvert",
    sla: "2h restantes",
    cost: "N/A",
  },
  {
    id: "TICKET-002",
    vin: "VIN-GHI-789",
    type: "Préventif",
    priority: "Moyenne",
    status: "Planifié",
    sla: "Dans 3 jours",
    cost: "350€",
  },
  {
    id: "TICKET-003",
    vin: "VIN-JKL-101",
    type: "Correctif",
    priority: "Critique",
    status: "En cours",
    sla: "SLA dépassé",
    cost: "1200€ (est.)",
  },
    {
    id: "TICKET-004",
    vin: "VIN-DEF-456",
    type: "Préventif",
    priority: "Basse",
    status: "Fermé",
    sla: "N/A",
    cost: "250€",
  },
]

export default function MaintenancePage() {

    const getPriorityVariant = (priority: string) => {
        switch (priority) {
            case "Critique":
                return "destructive"
            case "Haute":
                return "secondary"
            case "Moyenne":
                return "outline"
            default:
                return "default"
        }
    }

     const getStatusVariant = (status: string) => {
        switch (status) {
            case "Ouvert":
                return "default"
            case "En cours":
                return "secondary"
            case "Planifié":
                return "outline"
            case "Fermé":
                return "default"
            default:
                return "outline"
        }
    }


  return (
    <div className="flex flex-col h-full space-y-4">
      <h1 className="text-2xl font-bold font-headline">Maintenance</h1>
       <Tabs defaultValue="tickets" className="flex flex-col flex-grow">
        <div className="flex justify-between items-center">
            <TabsList>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
                <TabsTrigger value="parts">Pièces & Stocks (IA)</TabsTrigger>
                <TabsTrigger value="preventif" disabled>Calendrier Préventif</TabsTrigger>
                <TabsTrigger value="work-orders" disabled>Work Orders</TabsTrigger>
                <TabsTrigger value="inspections-ia" disabled>Inspections IA</TabsTrigger>
            </TabsList>
             <div className="flex items-center gap-2">
                <Button>Créer Ticket</Button>
            </div>
        </div>
        <TabsContent value="tickets" className="flex-grow mt-4">
            <Card className="h-full">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Tickets de Maintenance</CardTitle>
                            <CardDescription>Gérez les interventions sur votre flotte.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Rechercher ticket, VIN..." className="pl-8 w-64" />
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
                                    Priorité: Tous
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>
                                    Type: Tous
                                </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>ID Ticket</TableHead>
                            <TableHead>VIN</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Priorité</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>SLA</TableHead>
                            <TableHead>Coût</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {tickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.id}</TableCell>
                            <TableCell>{ticket.vin}</TableCell>
                            <TableCell>{ticket.type}</TableCell>
                            <TableCell>
                                <Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge>
                            </TableCell>
                            <TableCell>
                                 <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
                            </TableCell>
                            <TableCell>{ticket.sla}</TableCell>
                            <TableCell>{ticket.cost}</TableCell>
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
                                      <Link href={`/maintenance/${ticket.id}`}>Voir Détails</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Assigner Technicien</DropdownMenuItem>
                                    <DropdownMenuItem>Changer Statut</DropdownMenuItem>
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
        <TabsContent value="parts" className="flex-grow mt-4">
            <PredictivePartsForecast />
        </TabsContent>
        <TabsContent value="preventif">
            <Card>
                <CardContent className="p-6">
                    <p>Fonctionnalité de calendrier préventif à venir.</p>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="work-orders">
             <Card>
                <CardContent className="p-6">
                    <p>Fonctionnalité des ordres de travail (Work Orders) à venir.</p>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="inspections-ia">
             <Card>
                <CardContent className="p-6">
                    <p>Fonctionnalité des inspections par IA à venir.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
