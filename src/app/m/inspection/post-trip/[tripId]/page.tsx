
"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Video, Upload, AlertCircle, Camera } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function PostTripInspectionPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { tripId } = params;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Fonctionnalité non supportée',
          description: 'Votre navigateur ne supporte pas l\'accès à la caméra.',
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Accès Caméra Refusé',
          description: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
        });
      }
    };
    getCameraPermission();

    return () => {
        // Cleanup function to stop camera when component unmounts
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  const handleStartRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      setRecordedChunks([]);
      const stream = videoRef.current.srcObject as MediaStream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = () => {
    if (recordedChunks.length === 0) return;
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    console.log(`Uploading post-trip video for trip ${tripId}:`, blob);

    // Stop the camera stream
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }

    toast({
      title: 'Vidéo post-trajet enregistrée',
      description: `Fichier de ${(blob.size / 1024 / 1024).toFixed(2)} Mo sauvegardé. Trajet terminé.`,
    });
    
    // Redirect to the home page
    router.push('/m/home');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspection Vidéo Post-Trajet</CardTitle>
        <CardDescription>Enregistrez une vidéo du véhicule après avoir terminé le trajet {tripId}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCameraPermission === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Accès Caméra Requis</AlertTitle>
            <AlertDescription>
              Impossible d'accéder à la caméra. Veuillez vérifier les permissions de votre navigateur.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            {hasCameraPermission === null && <p className="text-muted-foreground">Demande d'accès caméra...</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button onClick={isRecording ? handleStopRecording : handleStartRecording} disabled={!hasCameraPermission}>
            <Camera className="mr-2" />
            {isRecording ? 'Arrêter' : 'Démarrer'}
          </Button>
          <Button onClick={handleUpload} disabled={recordedChunks.length === 0}>
            <Upload className="mr-2" />
            Valider et finir le trajet
          </Button>
        </div>
        {recordedChunks.length > 0 && !isRecording && (
            <p className="text-sm text-center text-muted-foreground">Vidéo prête à être validée.</p>
        )}
      </CardContent>
       <CardFooter>
          <p className="text-xs text-muted-foreground">Marchez lentement autour du véhicule en filmant tous les côtés.</p>
      </CardFooter>
    </Card>
  );
}
