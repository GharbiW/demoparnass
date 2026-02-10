

"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ListFilter, Search, MoreHorizontal, PlusCircle } from "lucide-react";
import Link from "next/link";
import { drivers } from "@/lib/planning-data";
import { technicians } from "@/lib/technicians-data";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const otherEmployees = [
    { id: 'ADM-001', name: 'Alice Dubois', site: 'Lyon (Siège)', role: 'Manager Flotte', status: 'Actif', manager: 'Direction', salary: 55000, docsStatus: 'OK' },
    { id: 'ADM-002', name: 'Bob Leclerc', site: 'Paris', role: 'Planificateur', status: 'Actif', manager: 'Alice Dubois', salary: 42000, docsStatus: 'OK' },
];

const allEmployees = [
    ...drivers.map(d => ({ ...d, role: 'Chauffeur', manager: 'Alice Dubois', salary: 32000, docsStatus: 'OK' })),
    ...technicians.map(t => ({ ...t, role: 'Technicien', manager: 'Alice Dubois', salary: 38000, docsStatus: 'OK' })),
    ...otherEmployees,
];

export default function EmployeesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [siteFilter, setSiteFilter] = useState("Tous");
  const [roleFilter, setRoleFilter] = useState("Tous");
  const [statusFilter, setStatusFilter] = useState("Tous");

  const uniqueSites = ["Tous", ...Array.from(new Set(allEmployees.map(e => e.site)))];
  const uniqueRoles = ["Tous", ...Array.from(new Set(allEmployees.map(e => e.role)))];
  const uniqueStatuses = ["Tous", ...Array.from(new Set(allEmployees.map(e => e.status)))];

  const filteredEmployees = allEmployees.filter(employee => {
    const searchMatch = employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const siteMatch = siteFilter === "Tous" || employee.site === siteFilter;
    const roleMatch = roleFilter === "Tous" || employee.role === roleFilter;
    const statusMatch = statusFilter === "Tous" || employee.status === statusFilter;
    return searchMatch && siteMatch && roleMatch && statusMatch;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Actif": return "secondary";
      case "En congé": return "outline";
      case "En Intervention": return "default";
      default: return "outline";
    }
  };
  
  const getProfileLink = (employee: typeof allEmployees[0]) => {
      // This is the unified HR profile page
      return `/employees/${employee.id}`;
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-headline">Gestion des Employés (RH)</h1>
        <Button><PlusCircle className="mr-2"/>Ajouter un employé</Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Liste du Personnel</CardTitle>
              <CardDescription>Gérez tous les employés de l'entreprise.</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher par nom..." 
                    className="pl-8 w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={siteFilter} onValueChange={setSiteFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {uniqueSites.map(site => <SelectItem key={site} value={site}>{site === "Tous" ? "Tous les sites" : site}</SelectItem>)}
                </SelectContent>
              </Select>
               <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {uniqueRoles.map(role => <SelectItem key={role} value={role}>{role === "Tous" ? "Tous les rôles" : role}</SelectItem>)}
                </SelectContent>
              </Select>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {uniqueStatuses.map(status => <SelectItem key={status} value={status}>{status === "Tous" ? "Tous les statuts" : status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Salaire Annuel (brut)</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    <Link href={getProfileLink(employee)} className="text-primary hover:underline">
                      {employee.name}
                    </Link>
                  </TableCell>
                  <TableCell>{employee.site}</TableCell>
                  <TableCell><Badge variant="outline">{employee.role}</Badge></TableCell>
                  <TableCell><Badge variant={getStatusVariant(employee.status)}>{employee.status}</Badge></TableCell>
                  <TableCell>{employee.manager}</TableCell>
                  <TableCell>{employee.salary.toLocaleString('fr-FR')} €</TableCell>
                  <TableCell>{employee.docsStatus}</TableCell>
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
                        <DropdownMenuItem asChild><Link href={getProfileLink(employee)}>Voir le profil RH</Link></DropdownMenuItem>
                        <DropdownMenuItem>Modifier le contrat</DropdownMenuItem>
                        <DropdownMenuItem>Gérer les documents</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            {filteredEmployees.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Aucun employé ne correspond à vos critères de recherche.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
    
