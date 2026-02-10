
"use client";

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
import { ListFilter, Search, MoreHorizontal, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { invoices } from "@/lib/invoices-data";
import { useToast } from "@/hooks/use-toast";

export default function InvoicesPage() {
    const { toast } = useToast();

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "Approuvé": return "secondary";
            case "Rejeté": return "destructive";
            case "En attente":
            default: return "outline";
        }
    }

    const handleAction = (invoiceId: string, action: "approved" | "rejected") => {
        toast({
            title: `Facture ${action === 'approved' ? 'Approuvée' : 'Rejetée'}`,
            description: `La facture ${invoiceId} a été marquée comme ${action === 'approved' ? 'approuvée' : 'rejetée'}.`,
        });
    };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-headline">Gestion des Factures & Notes de Frais</h1>
      </div>
      <Card>
        <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Factures des Chauffeurs</CardTitle>
                    <CardDescription>Consultez, filtrez et validez les notes de frais soumises.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher par trajet, chauffeur..." className="pl-8 w-64" />
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
                            Catégorie: Toutes
                        </DropdownMenuCheckboxItem>
                         <DropdownMenuCheckboxItem>
                            Chauffeur: Tous
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>
                            Statut: Tous
                        </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button>Exporter</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Chauffeur</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Trajet Associé</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell className="font-medium">
                        <Link href={`/chauffeurs/${invoice.driverId}`} className="hover:underline text-primary">
                            {invoice.driverName}
                        </Link>
                    </TableCell>
                    <TableCell>{invoice.category}</TableCell>
                    <TableCell>
                        <Link href={`/trips/${invoice.tripId}`} className="hover:underline text-primary">
                            {invoice.tripId}
                        </Link>
                    </TableCell>
                    <TableCell className="font-bold">{invoice.amount.toFixed(2)} €</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
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
                          <DropdownMenuItem>Voir le justificatif</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction(invoice.id, 'approved')}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Approuver
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleAction(invoice.id, 'rejected')}>
                            <XCircle className="mr-2 h-4 w-4" /> Rejeter
                          </DropdownMenuItem>
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
