
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CreateTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockAiResponse = `
<h2>Chapitre 1: Comprendre les Risques ADR</h2>
<p>La réglementation ADR (Accord pour le transport des marchandises Dangereuses par la Route) est conçue pour prévenir les accidents. Les risques principaux incluent l'inflammation, l'explosion, la toxicité et la corrosion.</p>

<h2>Chapitre 2: Documents Requis</h2>
<p>Pour tout transport ADR, les documents suivants sont obligatoires à bord du véhicule :</p>
<ul>
    <li>La déclaration de chargement (lettre de voiture).</li>
    <li>Les consignes de sécurité écrites.</li>
    <li>Le certificat de formation ADR du conducteur.</li>
    <li>Le certificat d'agrément du véhicule.</li>
</ul>

<h2>Chapitre 3: Signalisation et Équipement</h2>
<p>Le véhicule doit être équipé de panneaux orange vierges à l'avant et à l'arrière, ainsi que des plaques-étiquettes de danger correspondant à la marchandise. L'équipement de sécurité personnel (gilets, gants, lunettes) et le matériel de lutte contre l'incendie (extincteurs) sont également obligatoires.</p>
`;

export function CreateTrainingDialog({ open, onOpenChange }: CreateTrainingDialogProps) {
  const [activeTab, setActiveTab] = useState("ia");
  const [isLoading, setIsLoading] = useState(false);
  const [aiContent, setAiContent] = useState("");
  const { toast } = useToast();

  const handleCreateManual = () => {
    toast({
        title: "Formation Créée",
        description: "Le nouveau module de formation a été créé manuellement.",
    });
    onOpenChange(false);
  }
  
  const handleGenerateAi = async () => {
    setIsLoading(true);
    setAiContent("");
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    setAiContent(mockAiResponse);
    setIsLoading(false);
  }

  const handleCreateAi = () => {
    toast({
        title: "Formation Créée par IA",
        description: "Le nouveau module a été généré et ajouté au catalogue.",
    });
    onOpenChange(false);
    setAiContent("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle formation</DialogTitle>
          <DialogDescription>
            Créez un module de formation manuellement ou laissez ParnassGPT le générer pour vous.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ia"><Sparkles className="mr-2" />Création par IA</TabsTrigger>
            <TabsTrigger value="manuel">Création Manuelle</TabsTrigger>
          </TabsList>

          <TabsContent value="ia" className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-topic">Sujet de la formation</Label>
              <div className="flex gap-2">
                <Input id="ai-topic" defaultValue="Principes de base de la réglementation ADR" />
                <Button onClick={handleGenerateAi} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2"/>}
                    Générer
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">L'IA va utiliser les documents de la base de connaissance (ParnassGPT) pour générer le contenu.</p>
            </div>
            
            {aiContent && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center"><BookOpen className="mr-2"/>Contenu Généré</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none dark:prose-invert max-h-60 overflow-y-auto" dangerouslySetInnerHTML={{ __html: aiContent }} />
                    <CardFooter>
                         <Button className="w-full" onClick={handleCreateAi}>Accepter et Créer le Module</Button>
                    </CardFooter>
                </Card>
            )}

          </TabsContent>

          <TabsContent value="manuel" className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-title">Titre de la formation</Label>
              <Input id="manual-title" placeholder="Ex: Éco-conduite pour débutants" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="manual-category">Catégorie</Label>
              <Select>
                <SelectTrigger id="manual-category">
                  <SelectValue placeholder="Sélectionner une catégorie..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="securite">Sécurité</SelectItem>
                  <SelectItem value="eco-conduite">Éco-conduite</SelectItem>
                  <SelectItem value="reglementation">Réglementation</SelectItem>
                  <SelectItem value="technique">Technique</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="manual-content">Contenu (supporte le HTML)</Label>
              <Textarea id="manual-content" rows={10} placeholder="<h2>Chapitre 1</h2><p>Contenu...</p>" />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                <Button onClick={handleCreateManual}>Créer le Module</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
