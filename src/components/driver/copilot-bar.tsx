
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, Volume2, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { textToSpeechFlow } from "@/ai/flows/tts-flow";
import { Card, CardContent } from "../ui/card";

const demoCommands = [
  { command: "Prochaine étape ?", response: "Votre prochaine étape est la livraison chez CARREFOUR Vénissieux, ETA 14:30." },
  { command: "Déclarer un incident", response: "Ok, j'ouvre le formulaire de déclaration d'incident pour vous.", action: "/m/new-ticket" },
  { command: "Démarrer l'inspection pré-trajet", response: "Affichage de l'écran d'inspection vidéo pré-trajet.", action: "/m/inspection/pre-trip/DEMO-TRIP" },
  { command: "Terminer mon shift", response: "Shift terminé. N'oubliez pas de faire votre inspection post-trajet." },
];


export function CopilotBar({ isFloating = true }: { isFloating?: boolean }) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isApiThrottled, setIsApiThrottled] = useState(false);
  const [displayText, setDisplayText] = useState("Appuyez pour parler au Copilote");
  const [commandIndex, setCommandIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isListening) {
      // 1. Show "Listening..."
      setDisplayText("Écoute en cours...");

      // 2. Simulate hearing a command
      timeoutId = setTimeout(() => {
        const currentCommand = demoCommands[commandIndex];
        setDisplayText(`"${currentCommand.command}"`);
        
        // 3. Generate and play the response
        timeoutId = setTimeout(async () => {
          setIsListening(false);
          try {
            const { audio } = await textToSpeechFlow(currentCommand.response);
            setDisplayText(currentCommand.response);
            
            if (audioRef.current) {
              audioRef.current.src = audio;
              audioRef.current.play();
              setIsSpeaking(true);
              audioRef.current.onended = () => {
                setIsSpeaking(false);
                if (currentCommand.action) {
                  router.push(currentCommand.action);
                }
              };
            }
          } catch (error: any) {
            console.error("TTS Error:", error);
            if (error.message?.includes('429')) {
                setDisplayText("Service audio temporairement indisponible (quota atteint).");
                setIsApiThrottled(true);
                 setTimeout(() => setIsApiThrottled(false), 30000); // Re-enable after 30s
            } else {
                setDisplayText("Désolé, une erreur audio est survenue.");
            }
          }
          
          setCommandIndex((prevIndex) => (prevIndex + 1) % demoCommands.length);
        }, 2000);

      }, 1500);
    } else {
        // Reset text after a while if not listening or speaking
        if (!isSpeaking && !isApiThrottled) {
             timeoutId = setTimeout(() => {
                setDisplayText("Appuyez pour parler au Copilote");
            }, 5000);
        }
    }

    return () => clearTimeout(timeoutId);
  }, [isListening, commandIndex, router, isSpeaking, isApiThrottled]);

  const handleMicClick = () => {
    if (!isListening && !isSpeaking && !isApiThrottled) {
      setIsListening(true);
    }
  };
  
  const isDisabled = isListening || isSpeaking || isApiThrottled;

  const content = (
     <div className="flex items-center gap-4 rounded-full p-2 mx-auto w-full max-w-md bg-background/80 backdrop-blur-sm border shadow-lg">
        <Button
            size="icon"
            className={cn(
              "rounded-full h-12 w-12 flex-shrink-0",
              isListening && "bg-destructive animate-pulse",
              isSpeaking && "bg-blue-500",
              isApiThrottled && "bg-muted-foreground",
              !isDisabled && "bg-primary"
            )}
            onClick={handleMicClick}
            disabled={isDisabled}
          >
            {isListening && <Loader2 className="h-6 w-6 animate-spin" />}
            {isSpeaking && <Volume2 className="h-6 w-6" />}
            {isApiThrottled && <MicOff className="h-6 w-6" />}
            {!isDisabled && <Mic className="h-6 w-6" />}
        </Button>
        <p className="flex-grow text-center text-sm text-muted-foreground pr-4">
            {displayText}
        </p>
    </div>
  )

  if (isFloating) {
    return (
        <div className="fixed bottom-20 left-0 right-0 z-40 p-2">
            {content}
            <audio ref={audioRef} className="hidden" />
        </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-2">
        {content}
      </CardContent>
       <audio ref={audioRef} className="hidden" />
    </Card>
  )
}
