
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";

const documents = [
  { name: "Permis de Conduire", expiry: "31/12/2025", status: "Valide" },
  { name: "Visite Médicale", expiry: "15/08/2024", status: "Expire bientôt" },
  { name: "Carte FCO", expiry: "15/06/2026", status: "Valide" },
];

export default function DocumentsPage() {
  const getStatusVariant = (status: string) => {
    if (status === "Expire bientôt") return "secondary";
    if (status === "Expiré") return "destructive";
    return "outline";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mes Documents</CardTitle>
        <CardDescription>Consultez et mettez à jour vos documents professionnels.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.name} className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <div>
              <p className="font-semibold">{doc.name}</p>
              <p className="text-sm text-muted-foreground">Expire le: {doc.expiry}</p>
            </div>
            <Badge variant={getStatusVariant(doc.status)}>{doc.status}</Badge>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          <Upload className="mr-2 h-4 w-4" /> Uploader un document
        </Button>
      </CardFooter>
    </Card>
  );
}
