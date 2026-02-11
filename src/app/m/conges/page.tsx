
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LeaveRequest } from "@/lib/types";

const initialRequests: LeaveRequest[] = [
    { id: 'CONGE-DRV-001', driverId: 'DRV-JDU-001', driverName: "Jean Dupont", site: "Lyon", driverType: 'SPL', startDate: '2024-08-12', endDate: '2024-08-25', status: 'Approuvé' },
    { id: 'CONGE-DRV-002', driverId: 'DRV-JDU-001', driverName: "Jean Dupont", site: "Lyon", driverType: 'SPL', startDate: '2024-12-23', endDate: '2025-01-02', status: 'En attente' },
];

export default function DriverCongesPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState(initialRequests);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRequest = {
        id: `CONGE-DRV-${String(requests.length + 1).padStart(3, '0')}`,
        driverId: 'DRV-JDU-001',
        driverName: "Jean Dupont",
        site: "Lyon",
        driverType: 'SPL' as const,
        startDate: formData.get('start-date') as string,
        endDate: formData.get('end-date') as string,
        status: 'En attente' as const,
    };
    setRequests(prev => [newRequest, ...prev]);
    toast({
      title: "Demande de congé soumise",
      description: "Votre demande a été envoyée pour approbation.",
    });
    e.currentTarget.reset();
  };
  
    const getStatusVariant = (status: LeaveRequest['status']) => {
    switch (status) {
        case 'Approuvé': return 'secondary';
        case 'Rejeté': return 'destructive';
        case 'En attente': return 'outline';
        default: return 'default';
    }
  };


  return (
    <div className="space-y-6">
        <Card>
        <CardHeader>
            <CardTitle>Nouvelle Demande de Congé</CardTitle>
            <CardDescription>Soumettez une nouvelle demande de congé ou de RTT.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="start-date">Date de début</Label>
                    <Input id="start-date" name="start-date" type="date" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end-date">Date de fin</Label>
                    <Input id="end-date" name="end-date" type="date" required />
                </div>
            </div>
            <Button type="submit" className="w-full">Soumettre la demande</Button>
            </form>
        </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Historique de mes demandes</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Période</TableHead>
                        <TableHead>Statut</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {requests.map((req) => (
                        <TableRow key={req.id}>
                        <TableCell>
                            {new Date(req.startDate).toLocaleDateString('fr-FR')} - {new Date(req.endDate).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(req.status)}>{req.status}</Badge>
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
