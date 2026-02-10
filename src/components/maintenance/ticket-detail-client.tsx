
"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  HardHat,
  Package,
  Paperclip,
  PlusCircle,
  Truck,
  User,
  Wrench,
} from "lucide-react"
import Link from "next/link"
import { technicians } from "@/lib/technicians-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const tickets = [
  {
    id: "TICKET-001",
    vin: "VIN-ABC-123",
    immatriculation: "AB-123-CD",
    type: "Correctif",
    priority: "Haute",
    status: "Ouvert",
    sla: "2h restantes",
    cost: "N/A",
    createdAt: "2024-07-30 10:15",
    createdBy: "Jean Dupont (Chauffeur)",
    description: "Le voyant moteur orange s'est allumé après le démarrage ce matin. Le code DTC P0420 est apparu sur le tableau de bord. Pas de perte de puissance notable pour le moment.",
    technicianId: null,
  },
  {
    id: "TICKET-003",
    vin: "VIN-JKL-101",
    immatriculation: "JK-101-LM",
    type: "Correctif",
    priority: "Critique",
    status: "En cours",
    sla: "SLA dépassé",
    cost: "1200€ (est.)",
    createdAt: "2024-07-28 09:00",
    createdBy: "Système (Alerte Télématique)",
    description: "Panne moteur totale sur l'A7. Le véhicule est immobilisé. Remorquage nécessaire.",
    technicianId: "TECH-BMA-002",
  },
]

const ticketLogs = [
    { user: "Jean Dupont", action: "a créé le ticket.", timestamp: "2024-07-30 10:15" },
    { user: "Admin", action: "a changé la priorité de 'Moyenne' à 'Haute'.", timestamp: "2024-07-30 10:20" },
    { user: "Adrien Dubois", action: "s'est assigné au ticket.", timestamp: "2024-07-30 10:30" },
]

const workOrderParts = [
    { ref: "SENSOR-NOX-01", name: "Sonde NOx", qty: 1, price: "280.00€" },
    { ref: "LABOR-DIAG-01", name: "Main d'oeuvre - Diagnostic", qty: 1, price: "90.00€" },
]

export function TicketDetailClient({ ticketId }: { ticketId: string }) {
  const ticket = tickets.find((t) => t.id === ticketId) || tickets[0]
  const assignedTechnician = technicians.find(t => t.id === ticket.technicianId);

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "Critique":
        return "destructive"
      case "Haute":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Ouvert":
        return "default"
      case "En cours":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="sticky top-0 z-10 -mx-6 -mt-6 bg-background/80 px-6 py-4 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Link href="/maintenance" className="hover:underline">
                Maintenance
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">{ticket.id}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
              <Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge>
              <Badge variant="outline">{ticket.type}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue={ticket.status}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Changer le statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ouvert">Ouvert</SelectItem>
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="En attente de pièces">En attente de pièces</SelectItem>
                <SelectItem value="Planifié">Planifié</SelectItem>
                <SelectItem value="Fermé">Fermé</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">Générer Work Order</Button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Description du Problème</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{ticket.description}</p>
              <p className="text-xs text-muted-foreground mt-4">
                Créé par {ticket.createdBy} le {ticket.createdAt}
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle>Work Order</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                     <p className="font-bold">WO-2024-049</p>
                     <p className="text-sm text-muted-foreground">Tâche: Remplacer le capteur NOx.</p>
                </div>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Référence</TableHead>
                            <TableHead>Nom Pièce</TableHead>
                            <TableHead>Qté</TableHead>
                            <TableHead>Prix</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {workOrderParts.map(part => (
                            <TableRow key={part.ref}>
                                <TableCell>{part.ref}</TableCell>
                                <TableCell>{part.name}</TableCell>
                                <TableCell>{part.qty}</TableCell>
                                <TableCell>{part.price}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline"><Package className="mr-2"/>Ajouter Pièce</Button>
                <Button><FileText className="mr-2"/>Exporter le WO</Button>
            </CardFooter>
           </Card>
          <Card>
            <CardHeader>
              <CardTitle>Commentaires & Historique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-4">
                    {ticketLogs.map((log, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <User className="h-5 w-5 text-muted-foreground mt-1"/>
                            <div>
                                <p className="text-sm"><span className="font-semibold">{log.user}</span> {log.action}</p>
                                <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                            </div>
                        </div>
                    ))}
               </div>
               <Separator />
               <div className="flex gap-3">
                    <Textarea placeholder="Ajouter un commentaire..." />
                    <Button>Envoyer</Button>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations Clés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="flex items-center"><Truck className="mr-2 h-4 w-4"/>Véhicule: <Link href={`/vehicles/${ticket.vin}`} className="ml-2 font-bold hover:underline">{ticket.immatriculation}</Link></div>
                <div className="flex items-center"><Wrench className="mr-2 h-4 w-4"/>Type: <span className="ml-2 font-bold">{ticket.type}</span></div>
                <div className="flex items-center"><Clock className="mr-2 h-4 w-4"/>SLA: <span className="ml-2 font-bold">{ticket.sla}</span></div>
                <div className="flex items-center"><DollarSign className="mr-2 h-4 w-4"/>Coût estimé: <span className="ml-2 font-bold">{ticket.cost}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assignation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedTechnician ? (
                 <div className="flex items-center gap-3">
                    <HardHat className="h-8 w-8"/>
                    <div>
                        <p className="font-bold">{assignedTechnician.name}</p>
                        <p className="text-xs text-muted-foreground">{assignedTechnician.site} - {assignedTechnician.skills[0]}</p>
                    </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun technicien assigné.</p>
              )}
               <Select defaultValue={assignedTechnician?.id}>
                <SelectTrigger>
                    <SelectValue placeholder="Assigner un technicien..." />
                </SelectTrigger>
                <SelectContent>
                    {technicians.map(tech => (
                        <SelectItem key={tech.id} value={tech.id}>{tech.name} ({tech.site})</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Pièces jointes</CardTitle>
            </CardHeader>
            <CardContent>
                <Button variant="outline" className="w-full"><PlusCircle className="mr-2"/>Ajouter une pièce jointe</Button>
            </CardContent>
           </Card>
        </div>
      </main>
    </div>
  )
}
