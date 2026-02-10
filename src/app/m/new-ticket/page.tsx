
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function NewTicketPage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Anomalie déclarée",
      description: "Votre ticket a été créé et envoyé au support.",
    });
    router.back();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signaler une Anomalie</CardTitle>
        <CardDescription>Décrivez le problème que vous rencontrez.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type de problème</Label>
            <Select required>
              <SelectTrigger id="type">
                <SelectValue placeholder="Sélectionner une catégorie..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mecanique">Mécanique (Véhicule)</SelectItem>
                <SelectItem value="trajet">Trajet (Adresse, client...)</SelectItem>
                <SelectItem value="securite">Sécurité</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Ex: Le pneu avant droit semble dégonflé..." required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="photo">Ajouter une photo (optionnel)</Label>
            <Input id="photo" type="file" accept="image/*" />
          </div>
          <Button type="submit" className="w-full">Créer le ticket</Button>
        </form>
      </CardContent>
    </Card>
  );
}
