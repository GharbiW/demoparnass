
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import { CopilotBar } from "@/components/driver/copilot-bar";

// Dynamically import the map component to avoid SSR issues
const LiveTripMap = dynamic(() => import('@/components/trips/live-trip-map').then(mod => mod.LiveTripMap), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-muted"><p>Chargement de la carte...</p></div>
});


export default function TripPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isFinished, setIsFinished] = useState(false);

  const handleFinalizeStep = () => {
    toast({
      title: "Étape finalisée",
      description: "Le trajet est maintenant marqué comme terminé. Veuillez procéder à l'inspection.",
    });
    setIsFinished(true);
  };
  
  const handleProceedToInspection = () => {
    router.push('/m/inspection/post-trip/TRIP-LY-001');
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Trajet en Cours: LGN-001</CardTitle>
          <CardDescription>CARREFOUR - Entrepôt Vénissieux vers Plateforme Lyon Nord</CardDescription>
        </CardHeader>
        <CardContent className="p-0 h-80">
          <LiveTripMap />
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-4">
            {isFinished ? (
                 <Alert>
                    <CheckCircle className="h-4 w-4"/>
                    <AlertTitle>Trajet Terminé</AlertTitle>
                    <AlertDescription>
                        Vous pouvez maintenant effectuer l'inspection vidéo post-trajet.
                    </AlertDescription>
                </Alert>
            ) : (
                <Button className="w-full" variant="destructive" onClick={() => router.push('/m/new-ticket')}>
                    Signaler une anomalie
                </Button>
            )}
            
            <Button className="w-full" onClick={handleFinalizeStep} disabled={isFinished}>
                Finaliser l'étape
            </Button>

             {isFinished && (
                <Button className="w-full" onClick={handleProceedToInspection}>
                    Procéder à l'inspection
                </Button>
            )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prochaines Étapes</CardTitle>
        </CardHeader>
        <CardContent>
          <p>1. Arrivée Plateforme Lyon Nord (ETA: 06:05)</p>
          <p>2. Déchargement Quai 12</p>
          <p>3. Signature eCMR</p>
        </CardContent>
      </Card>

      <CopilotBar isFloating={false} />
    </div>
  );
}
