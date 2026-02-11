
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, Check, AlertCircle, MessageSquare, Paperclip, Video } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const inspectionItems = [
    { id: 'exterior', label: 'État extérieur du camion' },
    { id: 'cabin', label: 'État de la cabine' },
    { id: 'storage', label: 'État du stockage / remorque' },
    { id: 'lights', label: 'Feux et signalisations' },
    { id: 'video_cabin', label: 'Inspection vidéo cabine' },
    { id: 'video_exterior', label: 'Inspection vidéo extérieur' },
    { id: 'cargo', label: 'Inspection du chargement' },
];

const InspectionItem = ({ item, onStatusChange, onCommentChange, onFileChange }: { item: typeof inspectionItems[0], onStatusChange: any, onCommentChange: any, onFileChange: any }) => {
    const [status, setStatus] = useState<'ok' | 'anomaly' | null>(null);

    const handleStatusChange = (value: 'ok' | 'anomaly') => {
        setStatus(value);
        onStatusChange(item.id, value);
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="text-base">{item.label}</CardTitle>
                 {status === 'ok' && <Check className="h-6 w-6 text-green-500" />}
                {status === 'anomaly' && <AlertCircle className="h-6 w-6 text-destructive" />}
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
                <RadioGroup onValueChange={handleStatusChange} value={status || ""} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ok" id={`${item.id}-ok`} />
                        <Label htmlFor={`${item.id}-ok`}>OK</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="anomaly" id={`${item.id}-anomaly`} />
                        <Label htmlFor={`${item.id}-anomaly`}>Signaler une anomalie</Label>
                    </div>
                </RadioGroup>

                {status === 'anomaly' && (
                     <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label htmlFor={`${item.id}-comment`}>Commentaire</Label>
                            <Textarea id={`${item.id}-comment`} placeholder="Décrire l'anomalie..." onChange={(e) => onCommentChange(item.id, e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`${item.id}-file`}>Photo / Vidéo</Label>
                            <Input id={`${item.id}-file`} type="file" onChange={(e) => onFileChange(item.id, e.target.files)} />
                        </div>
                    </div>
                )}
                 {(item.id.includes('video')) && (
                    <div className="space-y-2 pt-4 border-t">
                        <div className="w-full max-w-sm mx-auto aspect-video bg-muted rounded-md flex items-center justify-center">
                             <Button variant="outline" size="icon"><Camera/></Button>
                        </div>
                         <p className="text-xs text-muted-foreground text-center">La fonctionnalité caméra sera intégrée ici.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
    )
}


export default function PreTripInspectionPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { tripId } = params;

  const [formState, setFormState] = useState<Record<string, any>>({});
  
  const handleStateChange = (id: string, field: 'status' | 'comment' | 'file', value: any) => {
      setFormState(prev => ({
          ...prev,
          [id]: {
              ...prev[id],
              [field]: value
          }
      }));
  }
  
  const handleSubmit = () => {
    console.log("Inspection data:", formState);
    toast({
        title: "Inspection Pré-trajet Terminée",
        description: `Les données pour le trajet ${tripId} ont été sauvegardées.`
    });
    router.push('/m/trip');
  }
  
  const isFormComplete = inspectionItems.every(item => formState[item.id]?.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspection Pré-Trajet</CardTitle>
        <CardDescription>Veuillez compléter tous les points de contrôle avant de démarrer le trajet {tripId}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {inspectionItems.map(item => (
            <InspectionItem 
                key={item.id} 
                item={item} 
                onStatusChange={(id: string, val: any) => handleStateChange(id, 'status', val)}
                onCommentChange={(id: string, val: any) => handleStateChange(id, 'comment', val)}
                onFileChange={(id: string, val: any) => handleStateChange(id, 'file', val)}
            />
        ))}
      </CardContent>
       <CardFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={!isFormComplete}>
            Valider l'inspection et Démarrer le trajet
          </Button>
      </CardFooter>
    </Card>
  );
}
