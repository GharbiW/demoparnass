
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Clapperboard, Send } from 'lucide-react';
import { marketingData } from '@/lib/marketing-data';
import Image from 'next/image';

const avatars = [
    { id: 'avatar-1', name: 'Laura', image: 'https://i.postimg.cc/mD4T3dK0/image.png' },
    { id: 'avatar-2', name: 'David', image: 'https://i.postimg.cc/x8P90YjC/image.png' },
    { id: 'avatar-3', name: 'Sophie', image: 'https://i.postimg.cc/L823TcnN/image.png' },
    { id: 'avatar-4', name: 'Nicolas', image: 'https://i.postimg.cc/8Pj321Vq/image.png' },
    { id: 'avatar-5', name: 'Yann', image: 'https://i.postimg.cc/k4G3rG0s/image.png' },
];

const voices = [
    { id: 'voice-1', name: 'Voix Féminine (Français)', lang: 'fr-FR' },
    { id: 'voice-2', name: 'Voix Masculine (Français)', lang: 'fr-FR' },
    { id: 'voice-3', name: 'Voix Féminine (Anglais US)', lang: 'en-US' },
];

export default function AvatarPage() {
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0].id);
    const [script, setScript] = useState("Bonjour et bienvenue sur la chaîne Parnass ! Aujourd'hui, nous allons parler de l'avenir de la logistique.");
    const [generating, setGenerating] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState('');

    const handleGenerate = async () => {
        setGenerating(true);
        setGeneratedVideoUrl('');
        await new Promise(r => setTimeout(r, 2500)); // Simulate generation time
        setGeneratedVideoUrl('/placeholder-video.mp4');
        setGenerating(false);
    }
    
    const avatarImage = avatars.find(a => a.id === selectedAvatar)?.image || '';

    return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold">Studio Avatar</h1>
        <p className="text-slate-500 dark:text-slate-400">Générez des vidéos professionnelles à partir d'un simple script en utilisant nos avatars IA.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Configuration de la Vidéo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label>1. Choisissez votre Avatar</Label>
                        <div className="flex flex-wrap gap-4 mt-2">
                            {avatars.map(avatar => (
                                <div key={avatar.id} onClick={() => setSelectedAvatar(avatar.id)} className={`rounded-lg overflow-hidden cursor-pointer border-4 ${selectedAvatar === avatar.id ? 'border-primary' : 'border-transparent'}`}>
                                    <Image src={avatar.image} alt={avatar.name} width={100} height={100} className="aspect-square object-cover"/>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="voice-select">2. Choisissez une Voix</Label>
                        <Select defaultValue={voices[0].id}>
                            <SelectTrigger id="voice-select"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                {voices.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="script-input">3. Écrivez votre script</Label>
                        <Textarea id="script-input" value={script} onChange={e => setScript(e.target.value)} rows={8} placeholder="Votre script ici..."/>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleGenerate} disabled={generating || !script}>
                        {generating ? <Loader2 className="mr-2 animate-spin"/> : <Clapperboard className="mr-2"/>}
                        Générer la vidéo
                    </Button>
                </CardFooter>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Aperçu</CardTitle>
                    <CardDescription>La vidéo générée apparaîtra ici.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                    <div className="w-full aspect-[9/16] bg-black rounded-lg relative">
                        {generating ? (
                            <div className="flex flex-col items-center justify-center h-full text-white">
                                <Loader2 className="animate-spin h-10 w-10"/>
                                <p className="mt-2 text-sm">Génération en cours...</p>
                            </div>
                        ) : generatedVideoUrl ? (
                            <video src={generatedVideoUrl} controls className="w-full h-full rounded-lg" />
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full">
                                <Image src={avatarImage} alt="Avatar Preview" width={150} height={150} className="rounded-full mb-4"/>
                                <p className="text-center text-sm text-slate-500">L'aperçu de la vidéo apparaîtra ici.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
                 {generatedVideoUrl && (
                    <CardFooter>
                        <Button className="w-full" variant="secondary">Exporter</Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    </div>
  );
}
