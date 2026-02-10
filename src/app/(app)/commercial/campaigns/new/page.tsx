
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Bot, Wand2, Loader2, Sparkles, Eye } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { emailTemplates, type EmailTemplate } from '@/lib/email-templates';
import { Separator } from '@/components/ui/separator';

export default function NewCampaignPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // State for the form inputs
    const [campaignName, setCampaignName] = useState('');
    const [targetSegment, setTargetSegment] = useState('');
    
    // State for AI guidance
    const [aiObjective, setAiObjective] = useState('');
    const [aiValueProp, setAiValueProp] = useState('');
    const [aiPainPoint, setAiPainPoint] = useState('');
    
    // State for email content
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');

    const handleTemplateSelect = (templateId: string) => {
        const template = emailTemplates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(template);
            setEmailSubject(template.subject);
            setEmailBody(template.body);
        }
    };

    const handleGenerateAi = async () => {
        if (!aiObjective || !aiValueProp || !aiPainPoint) {
            toast({ variant: 'destructive', title: "Veuillez guider l'IA", description: "Sélectionnez une option pour chaque champ de l'assistant IA."});
            return;
        }
        setIsLoading(true);
        
        // Simulate AI logic: choose template based on objective
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const isFollowUp = aiObjective.includes('relance');
        const isColdChain = aiValueProp.includes('froid');

        let chosenTemplate: EmailTemplate;

        if (isFollowUp) {
            chosenTemplate = emailTemplates.find(t => t.id === 'b2b-cold-outreach')!;
        } else if (isColdChain) {
            chosenTemplate = emailTemplates.find(t => t.id === 'webinar-invitation')!;
        } else {
            chosenTemplate = emailTemplates.find(t => t.id === 'modern-welcome')!;
        }

        // Simulate filling the template
        const filledBody = chosenTemplate.body
            .replace('{painPoint}', aiPainPoint === 'retards' ? 'aux défis des retards de livraison' : 'à la complexité de la gestion de la chaîne du froid')
            .replace('{valueProp}', aiValueProp === 'fiabilite' ? 'notre solution de suivi en temps réel qui garantit l\'intégrité de votre chaîne du froid' : 'nos solutions de transport durable pour réduire votre empreinte carbone')
            .replace('{cta}', aiObjective === 'rdv' ? 'Seriez-vous disponible pour un bref échange de 15 minutes' : 'Souhaitez-vous recevoir une proposition personnalisée');

        setSelectedTemplate(chosenTemplate);
        setEmailSubject(chosenTemplate.subject);
        setEmailBody(filledBody);
        
        setIsLoading(false);
        toast({ title: "Contenu généré par l'IA", description: "L'email a été pré-rempli. Vous pouvez le modifier." });
    };

    const handleCreateCampaign = () => {
        toast({
            title: "Campagne Créée",
            description: "Votre nouvelle campagne a été enregistrée en tant que brouillon.",
        });
        router.push('/commercial/campaigns');
    };

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" asChild>
                    <Link href="/commercial/campaigns"><ArrowLeft className="mr-2"/>Retour aux campagnes</Link>
                </Button>
                <h1 className="text-3xl font-bold font-headline mt-2">Nouvelle Campagne</h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                 <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Paramètres de la Campagne</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="campaign-name">Nom de la Campagne</Label>
                                <Input id="campaign-name" placeholder="Ex: Lancement produit T4" value={campaignName} onChange={e => setCampaignName(e.target.value)}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="target-segment">Segment Cible</Label>
                                <Select onValueChange={setTargetSegment}>
                                    <SelectTrigger><SelectValue placeholder="Sélectionner un segment de prospects..."/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les prospects</SelectItem>
                                        <SelectItem value="agro">Secteur: Agro-alimentaire</SelectItem>
                                        <SelectItem value="pharma">Secteur: Pharmaceutique</SelectItem>
                                        <SelectItem value="inactive">Statut: Prospects Inactifs (90j+)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Bot className="mr-2"/>2. Assistant IA</CardTitle>
                            <CardDescription>Guidez l'IA pour rédiger un email percutant, ou choisissez un template ci-dessous.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label>Proposition de valeur</Label>
                                <Select onValueChange={setAiValueProp}>
                                    <SelectTrigger><SelectValue placeholder="Choisir un argument..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fiabilite">Fiabilité de la chaîne du froid</SelectItem>
                                        <SelectItem value="couts">Réduction des coûts de transport</SelectItem>
                                        <SelectItem value="durable">Solution de transport durable (GNC/Électrique)</SelectItem>
                                        <SelectItem value="visibilite">Visibilité et suivi en temps réel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Problème client à adresser</Label>
                                <Select onValueChange={setAiPainPoint}>
                                    <SelectTrigger><SelectValue placeholder="Choisir un problème..."/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="retards">Retards de livraison fréquents</SelectItem>
                                        <SelectItem value="pertes">Pertes de marchandises</SelectItem>
                                        <SelectItem value="complexite">Complexité de la gestion logistique</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label>Appel à l'action</Label>
                                <Select onValueChange={setAiObjective}>
                                    <SelectTrigger><SelectValue placeholder="Choisir un objectif..."/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="rdv">Planifier une démo de 15min</SelectItem>
                                        <SelectItem value="devis">Demander un devis personnalisé</SelectItem>
                                        <SelectItem value="relance">Relance simple</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <Button onClick={handleGenerateAi} className="w-full" disabled={isLoading}>
                                 {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Wand2 className="mr-2"/>}
                                Générer le contenu
                            </Button>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>3. Templates d'email</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            {emailTemplates.map(t => (
                                <div key={t.id} onClick={() => handleTemplateSelect(t.id)} className={`p-2 border rounded-md cursor-pointer ${selectedTemplate?.id === t.id ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                                    <p className="font-semibold text-sm">{t.name}</p>
                                    <p className="text-xs text-muted-foreground">{t.description}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Eye className="mr-2"/>4. Éditeur & Aperçu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="subject">Sujet</Label>
                            <Input id="subject" placeholder="Sujet de votre email" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                        </div>
                        <Separator />
                        <div>
                            <Label className="mb-2 block">Aperçu en direct (modifiable)</Label>
                            <div
                                contentEditable
                                suppressContentEditableWarning
                                onInput={(e) => setEmailBody(e.currentTarget.innerHTML)}
                                dangerouslySetInnerHTML={{ __html: emailBody }}
                                className="p-4 border rounded-md min-h-[200px] prose prose-sm max-w-none focus:ring-2 focus:ring-ring focus:outline-none"
                            />
                        </div>
                    </CardContent>
                     <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => router.push('/commercial/campaigns')}>Annuler</Button>
                        <Button onClick={handleCreateCampaign}>Sauvegarder en brouillon</Button>
                    </CardFooter>
                </Card>

            </div>
        </div>
    );
}
