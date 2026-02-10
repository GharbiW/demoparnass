
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ImageIcon, Download, Copy, Sparkles } from 'lucide-react';
import Image from 'next/image';

const sampleImages = [
    'https://i.postimg.cc/8Pj321Vq/image.png',
    'https://i.postimg.cc/k4G3rG0s/image.png',
    'https://i.postimg.cc/Y0SYfV6L/image.png',
    'https://i.postimg.cc/j2y2LprY/image.png',
]

export default function VisualsPage() {
    const [prompt, setPrompt] = useState("Un visuel professionnel pour un post LinkedIn sur l'impact de l'IA dans la logistique, avec un camion autonome Parnass en arrière-plan.");
    const [generating, setGenerating] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    
    const handleGenerate = async () => {
        if (!prompt) return;
        setGenerating(true);
        setGeneratedImages([]);
        await new Promise(r => setTimeout(r, 2000));
        setGeneratedImages(sampleImages);
        setGenerating(false);
    }
    
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Labo Visuels LinkedIn</h1>
      <p className="text-slate-500 dark:text-slate-400">Générez des images percutantes pour vos posts et articles LinkedIn en décrivant simplement votre idée.</p>
      
      <Card>
        <CardHeader>
          <CardTitle>Générateur d'Images pour LinkedIn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="prompt-input">Prompt</Label>
                <Textarea id="prompt-input" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Décrivez le visuel que vous souhaitez créer..."/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="aspect-ratio">Format LinkedIn</Label>
                    <Select defaultValue="1:1">
                        <SelectTrigger id="aspect-ratio"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1:1">Post Carré (1:1)</SelectItem>
                            <SelectItem value="4:5">Post Vertical (4:5)</SelectItem>
                            <SelectItem value="1.91:1">Article / Lien (1.91:1)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="style">Style Visuel</Label>
                    <Select defaultValue="photorealistic">
                        <SelectTrigger id="style"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="photorealistic">Photoréaliste</SelectItem>
                            <SelectItem value="cinematic">Cinématographique</SelectItem>
                            <SelectItem value="3d-render">Rendu 3D</SelectItem>
                            <SelectItem value="vector">Infographie / Vectoriel</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tone">Ton</Label>
                    <Select defaultValue="professional">
                        <SelectTrigger id="tone"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="professional">Professionnel / Corporate</SelectItem>
                            <SelectItem value="inspirational">Inspirant</SelectItem>
                            <SelectItem value="tech">Technologique / Futuriste</SelectItem>
                            <SelectItem value="human">Humain / Collaboratif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button onClick={handleGenerate} disabled={generating || !prompt}>
                {generating ? <Loader2 className="mr-2 animate-spin"/> : <Sparkles className="mr-2"/>}
                Générer ({sampleImages.length} images)
            </Button>
        </CardFooter>
      </Card>

      {generating && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({length: 4}).map((_, i) => (
                 <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center animate-pulse">
                    <ImageIcon className="h-10 w-10 text-slate-400 dark:text-slate-600"/>
                 </div>
            ))}
        </div>
      )}

      {generatedImages.length > 0 && (
        <Card>
            <CardHeader><CardTitle>Résultats</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {generatedImages.map((src, i) => (
                    <div key={i} className="group relative aspect-square">
                         <Image src={src} alt={`Generated image ${i+1}`} fill className="object-cover rounded-lg"/>
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="icon" variant="secondary"><Download/></Button>
                            <Button size="icon" variant="secondary"><Copy/></Button>
                         </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      )}

    </div>
  );
}
