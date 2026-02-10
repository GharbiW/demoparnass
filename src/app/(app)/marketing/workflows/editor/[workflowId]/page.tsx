
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Play, Settings, UploadCloud, Link2, MessageSquare, Bot, Clock, Linkedin, Mail, Webhook, Scissors, Clapperboard, ImageIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

// Placeholder data for nodes and connections
const nodes = [
  { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { label: 'Upload de Fichier Audio' } },
  { id: '2', type: 'action', position: { x: 300, y: 100 }, data: { label: 'Transcrire l\'Audio (IA)' } },
  { id: '3', type: 'action', position: { x: 550, y: 150 }, data: { label: 'Identifier Moments Clés (IA)' } },
  { id: '4', type: 'action', position: { x: 800, y: 100 }, data: { label: 'Générer Clips Vidéo' } },
  { id: '5', type: 'action', position: { x: 800, y: 200 }, data: { label: 'Générer Carrousel LinkedIn' } },
];

const edges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e3-5', source: '3', target: '5' },
];


const Node = ({ data, position }: { data: { label: string }, position: { x: number, y: number } }) => (
    <div 
        className="absolute bg-white dark:bg-slate-800 border rounded-lg shadow-md p-3 w-48"
        style={{ left: position.x, top: position.y }}
    >
        <p className="text-sm font-medium">{data.label}</p>
    </div>
);

const Edge = ({ sourcePos, targetPos }: { sourcePos: { x: number, y: number }, targetPos: { x: number, y: number } }) => {
    const pathData = `M ${sourcePos.x + 192} ${sourcePos.y + 28} C ${sourcePos.x + 242} ${sourcePos.y + 28}, ${targetPos.x - 50} ${targetPos.y + 28}, ${targetPos.x} ${targetPos.y + 28}`;
    return <path d={pathData} stroke="#9ca3af" strokeWidth="2" fill="none" />;
};


export default function WorkflowEditorPage() {
    const params = useParams();
    const router = useRouter();
    const workflowId = params.workflowId;

    const nodePositions: { [key: string]: { x: number, y: number } } = nodes.reduce((acc, node) => ({...acc, [node.id]: node.position}), {});
    
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/marketing/workflows')}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">Éditeur de Workflow</h1>
                        <p className="text-sm text-muted-foreground">Workflow ID: {workflowId}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline"><Play className="mr-2"/>Tester</Button>
                    <Button><Save className="mr-2"/>Sauvegarder</Button>
                </div>
            </header>

            <div className="flex-grow flex">
                {/* Node Palette */}
                <Card className="w-64 border-r rounded-none">
                    <CardHeader><CardTitle className="text-base">Boîte à outils</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm font-semibold">Déclencheurs</p>
                         <div className="p-2 border rounded-md cursor-grab bg-background text-sm"><UploadCloud className="inline mr-2"/>Fichier Uploadé</div>
                         <div className="p-2 border rounded-md cursor-grab bg-background text-sm"><Link2 className="inline mr-2"/>URL de Webinaire</div>
                         <div className="p-2 border rounded-md cursor-grab bg-background text-sm"><Clock className="inline mr-2"/>Planifié (temps)</div>
                         <div className="p-2 border rounded-md cursor-grab bg-background text-sm"><Linkedin className="inline mr-2"/>Nouveau lead LinkedIn</div>
                         <div className="p-2 border rounded-md cursor-grab bg-background text-sm"><Webhook className="inline mr-2"/>Webhook Reçu</div>

                         <p className="text-sm font-semibold pt-4">Actions IA (Parnass)</p>
                         <div className="p-2 border rounded-md cursor-grab bg-background text-sm"><MessageSquare className="inline mr-2"/>Transcrire Audio</div>
                         <div className="p-2 border rounded-md cursor-grab bg-background text-sm"><Scissors className="inline mr-2"/>Extraire moments-clés</div>
                         <div className="p-2 border rounded-md cursor-grab bg-background text-sm"><Clapperboard className="inline mr-2"/>Créer vidéo Avatar</div>
                         <div className="p-2 border rounded-md cursor-grab bg-background text-sm"><ImageIcon className="inline mr-2"/>Générer visuel</div>
                         
                         <p className="text-sm font-semibold pt-4">Actions de Publication</p>
                         <div className="p-2 border rounded-md cursor-grab bg-background text-sm"><Linkedin className="inline mr-2"/>Publier sur LinkedIn</div>
                         <div className="p-2 border rounded-md cursor-grab bg-background text-sm"><Mail className="inline mr-2"/>Envoyer un Email</div>
                         <div className="p-2 border rounded-md cursor-grab bg-background text-sm"><Bot className="inline mr-2"/>Notifier sur Slack</div>
                    </CardContent>
                </Card>

                {/* Canvas */}
                <div className="flex-grow relative bg-slate-100 dark:bg-slate-900/50">
                    <svg className="absolute inset-0 w-full h-full">
                        {edges.map(edge => {
                            const sourcePos = nodePositions[edge.source];
                            const targetPos = nodePositions[edge.target];
                            if (!sourcePos || !targetPos) return null;
                            return <Edge key={edge.id} sourcePos={sourcePos} targetPos={targetPos} />;
                        })}
                    </svg>
                    {nodes.map(node => (
                        <Node key={node.id} data={node.data} position={node.position} />
                    ))}
                </div>

                {/* Settings Panel */}
                <Card className="w-80 border-l rounded-none">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center"><Settings className="mr-2"/>Paramètres du Nœud</CardTitle>
                        <CardDescription>Transcrire l'Audio (IA)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <label className="text-sm font-medium">Modèle</label>
                            <p className="text-sm p-2 bg-muted rounded-md">Whisper V3</p>
                        </div>
                         <div>
                            <label className="text-sm font-medium">Langue</label>
                             <p className="text-sm p-2 bg-muted rounded-md">Détection automatique</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
