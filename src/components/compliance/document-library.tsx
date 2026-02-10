
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Download, Upload, Loader2, Sparkles } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { Document } from "@/lib/compliance-data";
import { CardFooter } from "../ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DocumentLibraryProps {
  initialData: Document[];
}

const getStatusVariant = (status: Document['status']): "destructive" | "secondary" | "outline" => {
  switch (status) {
    case 'Expiré': return 'destructive';
    case 'Vérifié': return 'secondary';
    case 'En attente':
    default: return 'outline';
  }
};

export function DocumentLibrary({ initialData }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>(initialData);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAiAnalysis = (docId: string) => {
    setAnalyzingId(docId);
    setTimeout(() => {
        setDocuments(docs => docs.map(d => d.id === docId ? {...d, status: 'Vérifié'} : d));
        setAnalyzingId(null);
        toast({
            title: "Analyse IA terminée",
            description: "Le document a été vérifié et les informations extraites.",
        })
    }, 1500);
  }

  const handleStatusChange = (docId: string, status: Document['status']) => {
     setDocuments(docs => docs.map(d => d.id === docId ? {...d, status} : d));
  }

  return (
    <>
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Nom du Fichier</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Propriétaire</TableHead>
            <TableHead>Date d'expiration</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Vérification IA</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {documents.map((doc) => (
            <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell>{doc.type}</TableCell>
                <TableCell>{doc.owner} <Badge variant="default" className="ml-1">{doc.ownerType}</Badge></TableCell>
                <TableCell>{doc.expiryDate}</TableCell>
                <TableCell><Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge></TableCell>
                <TableCell>
                    {doc.status === 'En attente' ? (
                        <Button variant="outline" size="sm" onClick={() => handleAiAnalysis(doc.id)} disabled={analyzingId === doc.id}>
                           {analyzingId === doc.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                           Analyser (IA)
                        </Button>
                    ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                    )}
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
                        <DropdownMenuItem><Download className="mr-2 h-4 w-4"/> Télécharger</DropdownMenuItem>
                        <DropdownMenuItem>Remplacer</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(doc.id, 'Vérifié')}>Marquer comme vérifié</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(doc.id, 'Rejeté')}>Marquer comme rejeté</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
        <CardFooter className="mt-4 border-t pt-4">
            <Button><Upload className="mr-2 h-4 w-4"/> Uploader un document</Button>
        </CardFooter>
    </>
  );
}
