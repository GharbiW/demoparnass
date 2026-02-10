
"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ListFilter, Search, MoreHorizontal, FileText, Bot, Loader2 } from "lucide-react";
import { clientInvoices, type ClientInvoice } from "@/lib/billing-data";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { InvoiceDetailDialog } from "@/components/commercial/invoice-detail-dialog";

export default function ClientBillingPage() {
    const [invoices, setInvoices] = useState<ClientInvoice[]>(clientInvoices.filter(inv => inv.status !== 'Brouillon'));
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null);

    const getStatusVariant = (status: ClientInvoice['status']) => {
        switch (status) {
            case "Payée": return "secondary";
            case "En retard": return "destructive";
            case "Envoyée": return "default";
            case "Brouillon": return "outline";
            default: return "outline";
        }
    };
    
    const handleGenerateDrafts = () => {
        setIsLoading(true);
        setTimeout(() => {
            const drafts = clientInvoices.filter(inv => inv.status === 'Brouillon');
            setInvoices(prev => [...drafts, ...prev].sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()));
            setIsLoading(false);
            toast({
                title: "Factures générées",
                description: `${drafts.length} brouillons de facture ont été générés à partir des contrats actifs.`
            })
        }, 1500);
    }
    
    const handleValidateAndSend = () => {
        const drafts = invoices.filter(inv => inv.status === 'Brouillon');
        setInvoices(prev => prev.map(inv => inv.status === 'Brouillon' ? {...inv, status: 'Envoyée'} : inv));
        toast({
            title: "Factures envoyées",
            description: `${drafts.length} factures ont été validées et marquées comme envoyées.`
        })
    }
    
    const draftCount = invoices.filter(inv => inv.status === 'Brouillon').length;

    return (
        <>
        <InvoiceDetailDialog 
            invoice={selectedInvoice}
            open={!!selectedInvoice}
            onOpenChange={() => setSelectedInvoice(null)}
        />
        <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold font-headline">Facturation Client</h1>
            <div className="flex items-center gap-2">
                <Button onClick={handleGenerateDrafts} variant="outline" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Bot className="mr-2"/>}
                    Générer les brouillons (IA)
                </Button>
                 <Button onClick={handleValidateAndSend} disabled={draftCount === 0}>
                    Valider & Envoyer les brouillons ({draftCount})
                </Button>
            </div>
        </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Suivi de la Facturation</CardTitle>
                        <CardDescription>Suivez le statut de toutes les factures clients.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Rechercher par client, contrat..." className="pl-8 w-64" />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-1">
                                    <ListFilter className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only">Filtres</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Statut</DropdownMenuItem>
                                <DropdownMenuItem>Mois</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Contrat</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Montant HT</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.id}</TableCell>
                        <TableCell>{invoice.client}</TableCell>
                        <TableCell>{invoice.contractId}</TableCell>
                        <TableCell>{format(new Date(invoice.periodStart), 'dd/MM/yyyy')} - {format(new Date(invoice.periodEnd), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="font-bold">{invoice.amount.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</TableCell>
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
                            <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}><FileText className="mr-2"/>Voir la facture</DropdownMenuItem>
                            {invoice.status === 'Envoyée' && <DropdownMenuItem>Marquer comme payée</DropdownMenuItem>}
                            {invoice.status === 'Brouillon' && <DropdownMenuItem>Valider & Envoyer</DropdownMenuItem>}
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
        </>
    );
}
