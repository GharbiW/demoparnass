
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { FileDown, PackagePlus, Bot, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const forecastData = [
  { partNumber: "FIL-H-01", name: "Filtre à huile", stock: 12, forecast30: 8, forecast60: 15, forecast90: 22, suggestion: 15 },
  { partNumber: "PLA-F-05", name: "Plaquettes de frein (jeu)", stock: 5, forecast30: 4, forecast60: 9, forecast90: 14, suggestion: 10 },
  { partNumber: "PN-MCH-295", name: "Pneu Michelin X Line", stock: 25, forecast30: 10, forecast60: 20, forecast90: 30, suggestion: 10 },
  { partNumber: "SENSOR-NOX-01", name: "Sonde NOx", stock: 3, forecast30: 2, forecast60: 5, forecast90: 8, suggestion: 5 },
  { partNumber: "BAT-HD-02", name: "Batterie Poids Lourd", stock: 8, forecast30: 3, forecast60: 6, forecast90: 9, suggestion: 5 },
];


export function PredictivePartsForecast() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateDraft = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            toast({
                title: "Brouillon de commande créé",
                description: "La commande a été créée et est en attente de validation.",
            });
        }, 1500);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Bot className="mr-2"/>Prévisions de Pièces Détachées</CardTitle>
                <CardDescription>Prévisions de consommation basées sur les plans de maintenance et les alertes de maintenance prédictive.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom de la Pièce</TableHead>
                            <TableHead>Référence</TableHead>
                            <TableHead>Stock Actuel</TableHead>
                            <TableHead>Prévision 30j</TableHead>
                            <TableHead>Prévision 60j</TableHead>
                            <TableHead>Prévision 90j</TableHead>
                            <TableHead>Commande Suggérée</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {forecastData.map((part) => (
                            <TableRow key={part.partNumber}>
                                <TableCell className="font-medium">{part.name}</TableCell>
                                <TableCell>{part.partNumber}</TableCell>
                                <TableCell>{part.stock}</TableCell>
                                <TableCell>{part.forecast30}</TableCell>
                                <TableCell>{part.forecast60}</TableCell>
                                <TableCell>{part.forecast90}</TableCell>
                                <TableCell className="font-bold">{part.suggestion}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter className="gap-2">
                 <Button onClick={handleCreateDraft} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PackagePlus className="mr-2"/>}
                    Créer brouillon commande
                </Button>
                <Button variant="outline">
                    <FileDown className="mr-2"/>
                    Exporter
                </Button>
            </CardFooter>
        </Card>
    )
}
