
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { generateProspectEmail, type ProspectEmailOutput } from "@/ai/flows/prospect-email-flow";
import { Bot, Loader2, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

interface ProspectEmailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
}

const mockEmail: ProspectEmailOutput = {
    subject: "Optimisation de votre logistique avec Parnass",
    body: `<p>Bonjour [Nom du prospect],</p><p>En tant que Responsable Logistique chez BioCoop, vous êtes certainement à la recherche de partenaires de transport fiables et performants.</p><p>Chez Parnass, nous nous spécialisons dans le transport sous température dirigée avec une flotte moderne et un suivi en temps réel garantissant une traçabilité sans faille, un atout majeur pour des produits comme les vôtres.</p><p>Seriez-vous disponible pour un bref échange de 15 minutes la semaine prochaine pour discuter de vos défis logistiques ?</p><p>Cordialement,<br/>L'équipe Commerciale Parnass</p>`,
}


export function ProspectEmailDialog({ isOpen, onOpenChange, selectedCount }: ProspectEmailDialogProps) {
  const { toast } = useToast();
  const [objective, setObjective] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<ProspectEmailOutput | null>(null);

  const handleGenerate = async () => {
    if (!objective) return;
    setIsLoading(true);
    setGeneratedEmail(null);
    try {
        // For demo, we use mock data. In a real app, you'd call the AI flow.
        await new Promise(res => setTimeout(res, 1500));
        setGeneratedEmail(mockEmail);

        // Actual API call would look like this:
        /*
        const result = await generateProspectEmail({
            objective: objective as any,
            prospectName: "[Nom du prospect]",
            prospectCompany: "[Société du prospect]",
            prospectPosition: "[Poste du prospect]",
            companyContext: "Parnass est un leader du transport frigorifique avec une flotte moderne et une technologie de suivi avancée."
        });
        setGeneratedEmail(result);
        */

    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erreur de génération",
            description: "L'IA n'a pas pu générer l'email. Veuillez réessayer."
        })
    } finally {
        setIsLoading(false);
    }
  }

  const handleSend = () => {
    toast({
      title: "Emails Envoyés",
      description: `La campagne d'emailing a été lancée pour ${selectedCount} prospect(s).`,
    });
    onOpenChange(false);
    setGeneratedEmail(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email de Prospection par IA</DialogTitle>
          <DialogDescription>
            Générez et envoyez un email personnalisé à vos {selectedCount} prospect(s) sélectionné(s).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Objectif de l'email</Label>
            <div className="flex gap-2">
                 <Select onValueChange={setObjective}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un objectif..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Prise de contact initiale">Prise de contact initiale</SelectItem>
                        <SelectItem value="Relance après un salon">Relance après un salon</SelectItem>
                        <SelectItem value="Proposition de valeur ciblée">Proposition de valeur ciblée</SelectItem>
                        <SelectItem value="Demande de rendez-vous">Demande de rendez-vous</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleGenerate} disabled={!objective || isLoading}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Bot className="mr-2"/>}
                    Générer
                </Button>
            </div>
          </div>

          {generatedEmail && (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Email Généré</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Sujet</Label>
                        <Input readOnly value={generatedEmail.subject} />
                    </div>
                     <div>
                        <Label>Corps de l'email</Label>
                        <div className="prose prose-sm max-w-none p-4 border rounded-md h-64 overflow-y-auto" dangerouslySetInnerHTML={{ __html: generatedEmail.body }} />
                        <Alert variant="default" className="mt-2">
                            <Bot className="h-4 w-4"/>
                            <AlertTitle>Personnalisation</AlertTitle>
                            <AlertDescription>Les champs comme [Nom du prospect] seront automatiquement remplacés pour chaque destinataire.</AlertDescription>
                        </Alert>
                    </div>
                </CardContent>
            </Card>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSend} disabled={!generatedEmail}>
            <Send className="mr-2" /> Envoyer à {selectedCount} prospect(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
