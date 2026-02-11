
"use client";

// This is a placeholder for the "Long→Court" page.
// The full implementation requires significant state management and logic
// which would be built out here.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { marketingData } from "@/lib/marketing-data";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function LongShortPage() {
    const { toast } = useToast();
    const [outputType, setOutputType] = useState('clips');
    const [selectedVideoId, setSelectedVideoId] = useState('');
    const [processing, setProcessing] = useState(false);
    const [highlights, setHighlights] = useState<any[]>([]);
    const [concepts, setConcepts] = useState<any[]>([]);
    const [renderQueue, setRenderQueue] = useState<any[]>([]);

    const video = marketingData.videos.find(v => v.id === selectedVideoId);

    const handleProcess = async () => {
        if (!video) return;
        setProcessing(true);
        setHighlights([]);
        setConcepts([]);

        await new Promise(r => setTimeout(r, 2000)); // Simulate AI processing

        if (outputType === 'clips') {
            setHighlights((marketingData.detectedHighlights as any)[video.id] || []);
            toast({ title: "Moments forts détectés avec succès !" });
        } else {
            setConcepts((marketingData.detectedCarouselConcepts as any)[video.id] || []);
            toast({ title: "Concepts de carrousel extraits avec succès !" });
        }
        setProcessing(false);
    };

    const handleBatchRender = () => {
        const newJob = {
            id: `job-${marketingData.renderJobs.length + 1}`,
            title: 'Nouveau Rendu de Clip par Lot',
            type: 'Clip',
            status: 'En attente',
            progress: 0,
            date: 'À l\'instant'
        };
        setRenderQueue(prev => [newJob, ...prev]);
        toast({ title: "Rendu par lot démarré !", description: "Le nouveau clip a été ajouté à la file d'attente." });
    }

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-2">Studio Long→Court</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Montez automatiquement des vidéos longues en clips courts viraux ou en carrousels engageants.</p>

            <div className="flex-1 grid grid-cols-10 gap-6 overflow-hidden">
                {/* Left Panel */}
                <Card className="col-span-3 flex flex-col">
                    <CardHeader>
                        <CardTitle>Projet & Entrée</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium mb-2">Type de Sortie</label>
                            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1">
                               <Button onClick={() => setOutputType('clips')} variant={outputType === 'clips' ? 'secondary' : 'ghost'} className="flex-1">Clips Courts</Button>
                               <Button onClick={() => setOutputType('carousel')} variant={outputType === 'carousel' ? 'secondary' : 'ghost'} className="flex-1">Carrousel</Button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Sélectionner une Vidéo</label>
                            <Select onValueChange={setSelectedVideoId}>
                                <SelectTrigger><SelectValue placeholder="-- Choisissez une vidéo --" /></SelectTrigger>
                                <SelectContent>
                                    {marketingData.videos.map(v => <SelectItem key={v.id} value={v.id}>{v.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedVideoId && (
                             <div>
                                 <Button onClick={handleProcess} disabled={processing} className="w-full">
                                    {processing ? 'Analyse en cours...' : (outputType === 'clips' ? 'Détecter les Moments Forts' : 'Extraire les Concepts')}
                                 </Button>
                             </div>
                        )}
                    </CardContent>
                </Card>

                {/* Center and Right Panels */}
                <div className="col-span-7 grid grid-cols-7 gap-6">
                   {outputType === 'clips' ? (
                       <>
                        {/* Highlights Panel */}
                        <Card className="col-span-4 flex flex-col">
                           <CardHeader><CardTitle>Moments Forts & Chronologie</CardTitle></CardHeader>
                           <CardContent className="flex-1 overflow-y-auto space-y-3">
                                {highlights.length > 0 ? highlights.map(h => (
                                    <div key={h.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-start space-x-3">
                                       <Checkbox className="mt-1" />
                                       <div className="flex-1">
                                         <p className="font-medium">{h.title}</p>
                                         <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            <span>{h.timecode}</span> &bull;
                                            <span>Viralité : <span className="font-bold text-accent">{h.virality}</span></span> &bull;
                                            <span>{h.sentiment}</span>
                                         </div>
                                       </div>
                                    </div>
                                )) : <div className="text-center py-10 text-slate-500">Sélectionnez une vidéo et détectez les moments forts.</div>}
                           </CardContent>
                        </Card>

                        {/* Preview & Export Panel */}
                        <Card className="col-span-3 flex flex-col">
                            <CardHeader><CardTitle>Aperçu & Exportation</CardTitle></CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                               <div className="w-full aspect-[9/16] bg-black rounded-lg relative flex items-center justify-center mb-4">
                                  <img src={video?.thumbnail || "https://placehold.co/270x480/000000/333333?text=Aperçu"} alt="Preview" className="w-full h-full object-cover rounded-lg"/>
                               </div>
                               <Button onClick={handleBatchRender} className="w-full bg-accent text-primary font-bold">Rendu par Lot</Button>
                               <div className="mt-4 pt-4 border-t">
                                   <h3 className="font-bold mb-2">File de Rendu</h3>
                                   <div className="space-y-3">
                                       {renderQueue.map(job => <p key={job.id} className="text-sm text-slate-500">{job.title} - {job.status}</p>)}
                                       {renderQueue.length === 0 && <p className="text-sm text-slate-500">Aucun rendu actif.</p>}
                                   </div>
                               </div>
                            </CardContent>
                        </Card>
                       </>
                   ) : (
                       <>
                        {/* Concepts Panel */}
                         <Card className="col-span-4 flex flex-col">
                           <CardHeader><CardTitle>Concepts de Carrousel</CardTitle></CardHeader>
                           <CardContent className="flex-1 overflow-y-auto space-y-3">
                               {concepts.length > 0 ? concepts.map(c => (
                                    <div key={c.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-start space-x-3">
                                       <Checkbox className="mt-1" defaultChecked/>
                                       <img src={c.image} alt={c.title} className="w-16 h-16 rounded-md object-cover"/>
                                       <div className="flex-1">
                                         <p className="font-bold">{c.title}</p>
                                         <p className="text-sm text-slate-500">{c.summary}</p>
                                       </div>
                                    </div>
                               )) : <div className="text-center py-10 text-slate-500">Sélectionnez une vidéo et extrayez les concepts.</div>}
                           </CardContent>
                        </Card>
                         {/* Carousel Preview Panel */}
                        <Card className="col-span-3 flex flex-col">
                             <CardHeader><CardTitle>Aperçu & Exportation</CardTitle></CardHeader>
                             <CardContent className="flex-1 flex flex-col">
                               <div className="w-full aspect-square bg-slate-100 dark:bg-slate-900 rounded-lg relative flex items-center justify-center mb-4">
                                 {concepts.length > 0 ? <img src={concepts[0].image} alt="Preview" className="w-full h-full object-cover rounded-lg"/> : <p>Aperçu</p>}
                               </div>
                               <Button className="w-full bg-accent text-primary font-bold">Générer le Carrousel</Button>
                             </CardContent>
                        </Card>
                       </>
                   )}
                </div>
            </div>
        </div>
    );
}
