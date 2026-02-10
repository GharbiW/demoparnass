
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video } from "lucide-react";

const inspectionHistory = [
  { id: "INSP-001", tripId: "TRIP-LY-001", type: "Pré-trajet", date: "2024-08-01 03:55", status: "Analysée", result: "OK" },
  { id: "INSP-002", tripId: "TRIP-PA-001", type: "Pré-trajet", date: "2024-08-01 05:58", status: "En attente" },
  { id: "INSP-003", tripId: "TRIP-OLD-999", type: "Post-trajet", date: "2024-07-31 18:30", status: "Analysée", result: "Dommage détecté" },
];

export default function InspectionsHistoryPage() {
  const getStatusVariant = (status: string) => {
    if (status === "Analysée") return "secondary";
    return "outline";
  };
   const getResultVariant = (result?: string) => {
    if (result === "Dommage détecté") return "destructive";
    return "default";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Inspections</CardTitle>
        <CardDescription>Vos 30 dernières inspections vidéo.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {inspectionHistory.map((insp) => (
            <div key={insp.id} className="flex justify-between items-start p-3 bg-muted rounded-lg">
              <div>
                <p className="font-semibold flex items-center"><Video className="h-4 w-4 mr-2"/>{insp.type} - Trajet {insp.tripId}</p>
                <p className="text-sm text-muted-foreground">{insp.date}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={getStatusVariant(insp.status)}>{insp.status}</Badge>
                {insp.result && <Badge variant={getResultVariant(insp.result)}>{insp.result}</Badge>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

