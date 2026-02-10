
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClientInvoice } from "@/lib/billing-data";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Separator } from "../ui/separator";

interface InvoiceDetailDialogProps {
  invoice: ClientInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailDialog({ invoice, open, onOpenChange }: InvoiceDetailDialogProps) {
  if (!invoice) return null;

  const getStatusVariant = (status: ClientInvoice['status']) => {
    switch (status) {
      case "Payée": return "secondary";
      case "En retard": return "destructive";
      case "Envoyée": return "default";
      default: return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
                <DialogTitle>Facture {invoice.id}</DialogTitle>
                <DialogDescription>
                    Pour le client {invoice.client}
                </DialogDescription>
            </div>
            <Badge variant={getStatusVariant(invoice.status)}>{invoice.status}</Badge>
          </div>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Période du {invoice.periodStart} au {invoice.periodEnd}</p>
            <Separator />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qté</TableHead>
                        <TableHead className="text-right">Prix Unitaire</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoice.details.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{item.unitPrice.toFixed(2)} €</TableCell>
                            <TableCell className="text-right">{item.total.toFixed(2)} €</TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                        <TableCell colSpan={3} className="text-right">Total HT</TableCell>
                        <TableCell className="text-right">{invoice.amount.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={3} className="text-right">TVA (20%)</TableCell>
                        <TableCell className="text-right">{(invoice.amount * 0.2).toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</TableCell>
                    </TableRow>
                     <TableRow className="font-bold">
                        <TableCell colSpan={3} className="text-right">Total TTC</TableCell>
                        <TableCell className="text-right">{(invoice.amount * 1.2).toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button>Télécharger en PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
