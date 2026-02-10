
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Workflow, Play, PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Workflow as WorkflowType } from '@/lib/marketing-data';
import Link from 'next/link';

const initialWorkflows: WorkflowType[] = [
    { id: 'wf-1', name: 'Podcast → Clips & Carrousel LinkedIn', trigger: 'Nouveau fichier audio uploadé', status: 'Actif', lastRun: 'Il y a 2 heures', runCount: 12, description: 'Prend un fichier audio, le transcrit, identifie les moments clés et génère des clips vidéo et un carrousel d\'images pour LinkedIn.' },
    { id: 'wf-2', name: 'Webinaire → Post de blog & Visuels', trigger: 'Nouvel enregistrement de webinaire', status: 'Actif', lastRun: 'Hier', runCount: 5, description: 'Convertit un enregistrement de webinaire en un article de blog SEO-friendly et crée des visuels pertinents.' },
    { id: 'wf-3', name: 'Idées de contenu quotidiennes', trigger: 'Tous les jours à 9h00', status: 'Inactif', lastRun: 'Il y a 3 jours', runCount: 30, description: 'Analyse les tendances du secteur et propose 3 nouvelles idées de contenu chaque matin.' },
];

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState(initialWorkflows);
    const { toast } = useToast();
    
    const toggleStatus = (id: string) => {
        setWorkflows(workflows.map(wf => wf.id === id ? {...wf, status: wf.status === 'Actif' ? 'Inactif' : 'Actif'} : wf));
    }
    
    const handleDelete = (workflowId: string) => {
        setWorkflows(workflows.filter(wf => wf.id !== workflowId));
        toast({
            title: "Workflow supprimé",
            variant: "destructive",
            description: "Le workflow a été supprimé de votre liste.",
        });
    }

  return (
    <>
        <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold">Workflows d'Automatisation</h1>
                <p className="text-slate-500 dark:text-slate-400">Automatisez vos tâches de création et de publication de contenu les plus répétitives.</p>
            </div>
             <Button asChild>
                <Link href="/marketing/workflows/editor/new">
                    <PlusCircle className="mr-2"/>Nouveau Workflow
                </Link>
            </Button>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Mes Workflows</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom du Workflow</TableHead>
                            <TableHead>Déclencheur</TableHead>
                            <TableHead>Dernière Exécution</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {workflows.map(wf => (
                            <TableRow key={wf.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Workflow className="text-primary"/> 
                                    <div>
                                        {wf.name}
                                        <p className="text-xs text-muted-foreground line-clamp-1">{wf.description}</p>
                                    </div>
                                </TableCell>
                                <TableCell>{wf.trigger}</TableCell>
                                <TableCell>{wf.lastRun}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={wf.status === 'Actif'} onCheckedChange={() => toggleStatus(wf.id)}/>
                                        <Badge variant={wf.status === 'Actif' ? 'secondary' : 'outline'}>{wf.status}</Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button variant="outline" size="sm"><Play className="mr-2"/>Exécuter</Button>
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/marketing/workflows/editor/${wf.id}`}><Edit/></Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(wf.id)}><Trash2 className="text-destructive"/></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        </div>
    </>
  );
}
