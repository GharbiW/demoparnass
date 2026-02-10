
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { maintenanceHistory } from "@/lib/maintenance-data";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function MaintenanceHistoryPage() {
  const getStatusVariant = (status: string) => {
    return status === "Terminé" ? "secondary" : "default";
  };

  return (
    <div className="space-y-4">
        <div className="flex justify-end">
            <Button asChild>
                <Link href="/m/new-ticket">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Signaler une Anomalie
                </Link>
            </Button>
        </div>
        <Card>
        <CardHeader>
            <CardTitle>Historique de Maintenance</CardTitle>
            <CardDescription>Dernières interventions sur les véhicules que vous avez conduits.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
            {maintenanceHistory.map((event) => (
                <div key={event.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                    <p className="font-semibold">{event.vehicle} - {event.description}</p>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                </div>
                <Badge variant={getStatusVariant(event.status)}>{event.status}</Badge>
                </div>
            ))}
            </div>
        </CardContent>
        </Card>
    </div>
  );
}
