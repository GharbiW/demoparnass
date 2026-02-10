

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
import { ListFilter, Search, Wrench } from "lucide-react"
import { technicians as initialTechnicians, type Technician } from "@/lib/technicians-data"
import { useState } from "react"
import { AddTechnicianDialog } from "@/components/technicians/add-technician-dialog"
import { AssignWorkOrderDialog } from "@/components/technicians/assign-work-order-dialog"
import { useToast } from "@/hooks/use-toast"

export default function TechniciansPage() {
    const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);
    const [isAddTechnicianOpen, setAddTechnicianOpen] = useState(false);
    const [isAssignWorkOrderOpen, setAssignWorkOrderOpen] = useState(false);
    const { toast } = useToast();

    const handleAddTechnician = (newTechnician: Omit<Technician, 'id' | 'avgRepairTime' | 'successRate'>) => {
        const newTech: Technician = {
            id: `TECH-NEW-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            ...newTechnician,
            avgRepairTime: 4.0, // Default value
            successRate: 95, // Default value
        };
        setTechnicians(prev => [newTech, ...prev]);
        toast({
            title: "Technicien Ajouté",
            description: `${newTechnician.name} a été ajouté à la liste.`,
        });
    }

  return (
    <>
    <AddTechnicianDialog
        open={isAddTechnicianOpen}
        onOpenChange={setAddTechnicianOpen}
        onAddTechnician={handleAddTechnician}
    />
    <AssignWorkOrderDialog
        open={isAssignWorkOrderOpen}
        onOpenChange={setAssignWorkOrderOpen}
    />
    <div className="flex flex-col h-full space-y-4">
      <h1 className="text-2xl font-bold font-headline">Techniciens (Opérationnel)</h1>
      <Card className="flex-grow">
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Liste des Techniciens</CardTitle>
                    <CardDescription>Gérez les techniciens de maintenance de votre flotte.</CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher nom, compétence..." className="pl-8 w-64" />
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
                            <DropdownMenuCheckboxItem>Certification: Toutes</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" onClick={() => setAssignWorkOrderOpen(true)}><Wrench className="mr-2"/>Assigner une intervention</Button>
                    <Button onClick={() => setAddTechnicianOpen(true)}>Ajouter Technicien</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Compétences Principales</TableHead>
                <TableHead>Taux Succès</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicians.map((tech) => (
                <TableRow key={tech.id}>
                  <TableCell className="font-medium">
                    <Link href={`/technicians/${tech.id}`} className="hover:underline text-primary">
                      {tech.name}
                    </Link>
                  </TableCell>
                  <TableCell>{tech.phone}</TableCell>
                  <TableCell>{tech.site}</TableCell>
                  <TableCell>{tech.skills.slice(0, 2).join(', ')}</TableCell>
                  <TableCell><Badge variant={tech.successRate > 95 ? 'secondary' : 'outline'}>{tech.successRate}%</Badge></TableCell>
                  <TableCell>
                    <Badge variant={
                      tech.status === "Actif" ? "secondary" : tech.status === "En Intervention" ? "default" : "outline"
                    }>
                      {tech.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </>
  )
}
