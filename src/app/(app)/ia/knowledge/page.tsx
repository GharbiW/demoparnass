
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ThumbsUp, ThumbsDown, Copy, BookUser, PlusCircle, Settings, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const mockSearchResult = {
    answer: "Pour un chargement ADR de classe 3 (liquides inflammables), la procédure est la suivante :\n1. **Vérification des documents** : S'assurer que la déclaration de chargement est complète et que le chauffeur possède sa certification ADR.\n2. **Équipement du véhicule** : Vérifier la présence d'extincteurs, de cales, et du panneau orange.\n3. **Arrimage** : Le chargement doit être solidement arrimé avec des sangles adaptées, en évitant tout contact métal-métal si possible.\n4. **Ventilation** : Assurer une ventilation adéquate de la remorque.",
    citations: [
        { title: "SOP-ADR-001.pdf", sourceId: "SRC01", page: 3, score: 0.89 },
        { title: "Réglementation ADR 2023", sourceId: "SRC02", page: 112, score: 0.82 },
    ],
    snippets: [
        { text: "...l'arrimage des matières inflammables doit se faire avec des sangles non-métalliques...", sourceId: "SRC01", page: 3 },
        { text: "Le conducteur doit présenter une attestation de formation ADR en cours de validité...", sourceId: "SRC02", page: 45 },
    ]
};

const knowledgeSources = [
    { id: 'SRC01', title: 'SOP-ADR-001.pdf', type: 'pdf', status: 'Indexé', chunks: 152, lastIndexed: '2024-07-30' },
    { id: 'SRC02', title: 'Réglementation ADR 2023', type: 'web', status: 'Indexé', chunks: 2450, lastIndexed: '2024-07-29' },
    { id: 'SRC03', title: 'FAQ Chauffeurs', type: 'faq', status: 'En attente', chunks: 0, lastIndexed: 'N/A' },
];

export default function KnowledgePage() {
    const [query, setQuery] = useState("");
    const [searchResult, setSearchResult] = useState<typeof mockSearchResult | null>(null);

    const handleSearch = () => {
        if (!query) return;
        setSearchResult(mockSearchResult);
    }

  return (
    <Tabs defaultValue="search" className="h-full flex flex-col">
         <header className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold font-headline">ParnassGPT</h1>
            <TabsList>
                <TabsTrigger value="search">Connaissances & Formation</TabsTrigger>
                <TabsTrigger value="admin">Gestion des Sources</TabsTrigger>
            </TabsList>
        </header>

        <TabsContent value="search" className="flex-grow">
            <div className="flex flex-col h-full gap-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Ex: Procédure ADR chargement, Comment déclarer un incident froid ?"
                        className="pl-10 h-12 text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                {searchResult ? (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                        {/* Answer Pane */}
                        <Card className="lg:col-span-2 flex flex-col">
                            <CardHeader>
                                <CardTitle>Réponse de l'IA</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                               <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: searchResult.answer.replace(/\n/g, '<br/>') }} />
                               <Separator />
                               <div>
                                   <p className="text-sm font-semibold mb-2">Citations :</p>
                                   <div className="flex flex-wrap gap-2">
                                       {searchResult.citations.map(c => (
                                           <Badge key={c.sourceId} variant="secondary">{c.title} (p. {c.page})</Badge>
                                       ))}
                                   </div>
                               </div>
                            </CardContent>
                            <CardFooter className="justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Utile ?</span>
                                    <Button variant="outline" size="icon" className="h-8 w-8"><ThumbsUp className="h-4 w-4"/></Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8"><ThumbsDown className="h-4 w-4"/></Button>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline"><Copy className="mr-2"/>Copier</Button>
                                    <Button><BookUser className="mr-2"/>Ajouter à une formation</Button>
                                </div>
                            </CardFooter>
                        </Card>
                        {/* Sources Pane */}
                        <Card>
                             <CardHeader>
                                <CardTitle>Sources & Snippets</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {searchResult.snippets.map((s, i) => (
                                    <div key={i} className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs italic">"{s.text}"</p>
                                        <p className="text-right text-xs font-medium mt-1">{searchResult.citations.find(c => c.sourceId === s.sourceId)?.title}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                     </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center flex-grow bg-muted/40 rounded-lg">
                        <div className="p-6 rounded-full bg-background"><Search className="h-12 w-12 text-primary" /></div>
                        <h2 className="text-xl font-semibold mt-4">Posez vos questions à ParnassGPT</h2>
                        <p className="text-muted-foreground mt-1 max-w-md">Utilisez la barre de recherche pour trouver des informations dans les procédures, réglementations, et documents internes de l'entreprise.</p>
                    </div>
                )}
            </div>
        </TabsContent>
         <TabsContent value="admin" className="flex-grow">
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des Sources de Connaissance</CardTitle>
                    <CardDescription>Ajoutez, supprimez et gérez les documents utilisés par ParnassGPT.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-end gap-2 mb-4">
                        <Button variant="outline"><Upload className="mr-2"/>Uploader un PDF</Button>
                        <Button><PlusCircle className="mr-2"/>Ajouter une URL</Button>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Titre</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Chunks</TableHead>
                                <TableHead>Dernière Indexation</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {knowledgeSources.map(source => (
                                <TableRow key={source.id}>
                                    <TableCell className="font-medium">{source.title}</TableCell>
                                    <TableCell><Badge variant="outline">{source.type}</Badge></TableCell>
                                    <TableCell><Badge variant={source.status === 'Indexé' ? 'secondary' : 'default'}>{source.status}</Badge></TableCell>
                                    <TableCell>{source.chunks}</TableCell>
                                    <TableCell>{source.lastIndexed}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon"><Settings /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
         </TabsContent>
    </Tabs>
  );
}
    