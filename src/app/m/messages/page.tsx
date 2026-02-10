
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { communications } from "@/lib/communications-data";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DispatchChat = () => (
    <div className="flex flex-col h-full">
        <CardContent className="flex-grow space-y-4 overflow-y-auto pt-6">
           <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3 max-w-[80%]">
              <p className="text-sm">Bonjour Jean, pouvez-vous confirmer votre arrivée à l'entrepôt ?</p>
              <p className="text-xs text-muted-foreground text-right mt-1">10:32</p>
            </div>
          </div>
           <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-[80%]">
              <p className="text-sm">Bonjour, oui bien arrivé. J'attends au quai 7.</p>
               <p className="text-xs text-primary-foreground/80 text-right mt-1">10:33</p>
            </div>
          </div>
        </CardContent>
        <CardContent className="border-t pt-4">
          <div className="flex gap-2">
            <Input placeholder="Écrire un message..."/>
            <Button>Envoyer</Button>
          </div>
        </CardContent>
    </div>
);

const CommunicationsFeed = () => (
    <div className="space-y-4 p-4 overflow-y-auto">
        {communications.map((comm) => (
            <Card key={comm.id}>
                <CardHeader className="p-4">
                    <CardTitle className="text-base">{comm.title}</CardTitle>
                    <CardDescription>Par {comm.author} - {comm.date}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <p className="text-sm">{comm.content}</p>
                </CardContent>
                <CardContent className="p-4 pt-0">
                    <Badge variant="secondary">{comm.target}</Badge>
                </CardContent>
            </Card>
        ))}
    </div>
);

const mockNegotiations = [
    {
        id: 'NEG-001',
        requestId: 'CONGE-002',
        originalRequest: { startDate: '2024-08-05', endDate: '2024-08-18' },
        proposedRequest: { startDate: '2024-08-19', endDate: '2024-09-01' },
        message: "Bonjour Jean, la semaine du 15 août est très chargée. Serait-il possible de décaler vos congés d'une semaine ? Merci de votre flexibilité."
    }
];

const NegotiationsFeed = () => {
    const { toast } = useToast();

    const handleResponse = (negotiationId: string, response: 'accept' | 'reject') => {
        toast({
            title: "Réponse envoyée",
            description: `Vous avez ${response === 'accept' ? 'accepté' : 'refusé'} la proposition. L'opérateur a été notifié.`,
        });
    }

    return (
        <div className="space-y-4 p-4 overflow-y-auto">
            {mockNegotiations.map((neg) => (
                <Card key={neg.id}>
                    <CardHeader className="p-4">
                        <CardTitle className="text-base">Proposition de modification de congé</CardTitle>
                        <CardDescription>Demande initiale : CONGE-002</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                        <div>
                            <p className="font-semibold text-sm">Demande Originale:</p>
                            <p className="text-sm text-muted-foreground">{new Date(neg.originalRequest.startDate).toLocaleDateString('fr-FR')} au {new Date(neg.originalRequest.endDate).toLocaleDateString('fr-FR')}</p>
                        </div>
                         <div>
                            <p className="font-semibold text-sm">Nouvelle Proposition:</p>
                            <p className="text-sm font-bold">{new Date(neg.proposedRequest.startDate).toLocaleDateString('fr-FR')} au {new Date(neg.proposedRequest.endDate).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <Separator />
                        <p className="text-sm italic bg-muted/50 p-2 rounded-md">"{neg.message}"</p>
                    </CardContent>
                    <CardContent className="p-4 pt-0 flex gap-2 justify-end">
                        <Button variant="destructive" size="sm" onClick={() => handleResponse(neg.id, 'reject')}><X className="mr-1"/>Refuser</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleResponse(neg.id, 'accept')}><Check className="mr-1"/>Accepter</Button>
                    </CardContent>
                </Card>
            ))}
             {mockNegotiations.length === 0 && <p className="text-center text-muted-foreground pt-8">Aucune négociation en cours.</p>}
        </div>
    )
}

export default function MessagesPage() {
  return (
      <Tabs defaultValue="dispatch" className="flex-grow flex flex-col h-full">
        <CardHeader>
            <CardTitle>Messagerie</CardTitle>
            <TabsList className="grid w-full grid-cols-3 mt-2">
                <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
                <TabsTrigger value="communications">Communications</TabsTrigger>
                <TabsTrigger value="negotiations">Négociations</TabsTrigger>
            </TabsList>
        </CardHeader>
        <TabsContent value="dispatch" className="flex-grow m-0">
             <Card className="flex-grow flex flex-col border-0 shadow-none rounded-none">
                <DispatchChat />
            </Card>
        </TabsContent>
        <TabsContent value="communications" className="flex-grow m-0">
             <Card className="flex-grow flex flex-col border-0 shadow-none rounded-none">
                <CommunicationsFeed />
            </Card>
        </TabsContent>
        <TabsContent value="negotiations" className="flex-grow m-0">
             <Card className="flex-grow flex flex-col border-0 shadow-none rounded-none">
                <NegotiationsFeed />
            </Card>
        </TabsContent>
      </Tabs>
  );
}
