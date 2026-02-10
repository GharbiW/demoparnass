
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Calendar, Check, ThumbsUp, User, X } from "lucide-react";
import type { CampaignDriver, CampaignRequest } from "@/lib/vacation-campaign-data";
import { useToast } from "@/hooks/use-toast";

interface DriverSheetProps {
  driver: CampaignDriver;
  requests: CampaignRequest[];
  onClose: () => void;
  onUpdateRequest: (requestId: string, status: CampaignRequest['status']) => void;
}

export function DriverSheet({ driver, requests, onClose, onUpdateRequest }: DriverSheetProps) {
    const { toast } = useToast();

    const handleAction = (action: CampaignRequest['status'], request: CampaignRequest) => {
        onUpdateRequest(request.id, action);
        let actionText = '';
        switch(action) {
            case 'accepted': actionText = 'approuvée'; break;
            case 'rejected': actionText = 'rejetée'; break;
            case 'negotiate': actionText = 'marquée pour négociation'; break;
        }
        toast({
            title: `Demande ${actionText}`,
            description: `La demande de ${driver.name} a été ${actionText}.`
        });
    }

  return (
    <Card className="h-[80vh] flex flex-col sticky top-4">
      <CardHeader className="flex-row items-start justify-between">
        <div>
            <CardTitle>{driver.name}</CardTitle>
            <CardDescription>{driver.id}</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X/></Button>
      </CardHeader>
      <CardContent className="flex-grow space-y-4 overflow-y-auto">
        <div className="space-y-1">
            <p className="font-semibold text-sm">Informations</p>
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{driver.zone}</Badge>
                <Badge variant="outline">{driver.skill}</Badge>
                <Badge variant="secondary">{driver.seniority} ans</Badge>
            </div>
        </div>
        <Separator/>
        <div className="space-y-2">
            <p className="font-semibold text-sm">Compétences Spécifiques</p>
            <div className="flex flex-wrap gap-1">
                {driver.specialSkills.map(skill => <Badge key={skill} variant="default">{skill}</Badge>)}
            </div>
        </div>
         <Separator/>
        <div className="space-y-2">
            <p className="font-semibold text-sm">Historique &amp; Soldes</p>
            <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground">Solde CP Annuel</p>
                    <p className="font-bold">{driver.leaveBalance} jours</p>
                </div>
                 <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground">Eté 2024</p>
                    <p className="font-bold">{driver.lastSummerLeave}</p>
                </div>
            </div>
        </div>
        <Separator/>
         <div className="space-y-2">
            <p className="font-semibold text-sm">Demandes de la Campagne</p>
            {requests.length > 0 ? requests.map(req => (
                 <Card key={req.id} className="bg-muted/50">
                    <CardHeader className="p-3">
                        <CardTitle className="text-base">
                            Du {new Date(req.startDate).toLocaleDateString('fr-FR')} au {new Date(req.endDate).toLocaleDateString('fr-FR')}
                        </CardTitle>
                         <CardDescription>Statut: <Badge variant={req.status === 'accepted' ? 'secondary' : (req.status === 'rejected' ? 'destructive' : 'outline')}>{req.status}</Badge></CardDescription>
                    </CardHeader>
                    <CardFooter className="p-3 flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleAction('accepted', req)}><ThumbsUp className="mr-1"/>Approuver</Button>
                        <Button size="sm" variant="outline" onClick={() => handleAction('negotiate', req)}><Calendar className="mr-1"/>Négocier</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction('rejected', req)}><X className="mr-1"/>Rejeter</Button>
                    </CardFooter>
                </Card>
            )) : <p className="text-xs text-muted-foreground">Aucune demande pour cette campagne.</p>}
        </div>
        <Separator/>
        <div>
            <p className="font-semibold text-sm flex items-center gap-2"><Bot /> Analyse IA</p>
             <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mt-2 space-y-2">
                 <div className="flex justify-between items-center">
                    <p>Probabilité d'approbation:</p>
                    <p className="font-bold text-lg text-green-600">85%</p>
                </div>
                <div className="flex justify-between items-center">
                    <p>Score de priorité:</p>
                    <p className="font-bold text-lg">75</p>
                </div>
                <div className="flex justify-between items-center">
                    <p>Risque opérationnel:</p>
                    <Badge variant="secondary">Faible</Badge>
                </div>
             </div>
        </div>
      </CardContent>
    </Card>
  );
}
