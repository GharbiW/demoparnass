
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function ExpensesPage() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Note de frais soumise",
      description: "Votre note de frais a été envoyée pour approbation.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes de Frais</CardTitle>
        <CardDescription>Soumettez une nouvelle note de frais.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type de dépense</Label>
            <Select>
              <SelectTrigger id="type">
                <SelectValue placeholder="Sélectionner un type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carburant">Carburant</SelectItem>
                <SelectItem value="peage">Péage</SelectItem>
                <SelectItem value="parking">Parking</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (€)</Label>
            <Input id="amount" type="number" step="0.01" placeholder="55.80" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt">Justificatif (Photo/PDF)</Label>
            <Input id="receipt" type="file" required />
          </div>
          <Button type="submit" className="w-full">Soumettre la dépense</Button>
        </form>
      </CardContent>
    </Card>
  );
}
