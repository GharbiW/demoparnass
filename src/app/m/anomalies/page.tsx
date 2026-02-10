
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const reportedAnomalies = [
  { id: "TICKET-DRV-001", date: "2024-07-28", description: "Pneu avant droit semble dégonflé", status: "Résolu" },
  { id: "TICKET-DRV-002", date: "2024-07-15", description: "Voyant moteur allumé par intermittence", status: "En cours d'analyse" },
  { id: "TICKET-DRV-003", date: "2024-06-30", description: "Porte latérale difficile à fermer", status: "Résolu" },
];

export default function AnomaliesHistoryPage() {
  const getStatusVariant = (status: string) => {
    if (status === "Résolu") return "secondary";
    if (status.startsWith("En cours")) return "outline";
    return "default";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Anomalies</CardTitle>
        <CardDescription>Vos 30 derniers tickets signalés.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reportedAnomalies.map((anomaly) => (
            <div key={anomaly.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">{anomaly.id} - {anomaly.description}</p>
                <p className="text-sm text-muted-foreground">{anomaly.date}</p>
              </div>
              <Badge variant={getStatusVariant(anomaly.status)}>{anomaly.status}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
