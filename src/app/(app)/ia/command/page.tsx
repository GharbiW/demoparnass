
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, Bot, Sparkles, AlertTriangle, Check, X, Pencil, Play, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"


const mockMessages = [
    { sender: 'user', text: "Quels sont les trajets avec un risque ETA de plus de 70% aujourd'hui ?" },
    { 
        sender: 'ai', 
        text: "J'ai identifié 2 trajets avec un risque de retard élevé :",
        actions: [
            { type: 'view_trip', label: 'Ouvrir LGN-003', payload: { tripId: 'LGN-003' }, impact: 'ETA Risk: 85%' },
            { type: 'view_trip', label: 'Ouvrir EXP-102', payload: { tripId: 'EXP-102' }, impact: 'ETA Risk: 72%' },
        ],
        sqlPreview: "SELECT tripId, riskEta, driverId, plannedEnd FROM v_trips WHERE status = 'in_progress' AND riskEta > 0.7 ORDER BY riskEta DESC;"
    },
     { sender: 'user', text: "Ok, suggère une replanification pour LGN-003" },
     { 
        sender: 'ai', 
        text: "J'ai trouvé un itinéraire alternatif pour LGN-003 qui pourrait réduire l'ETA de 12 minutes en évitant un accident sur l'A7. Le coût en péage augmenterait de 4,50€.",
        actions: [
            { type: 'replan_trip', label: 'Appliquer l\'itinéraire', payload: { tripId: 'LGN-003', newRoute: 'A43' }, impact: 'ETA -12min, +4.50€', needsConfirmation: true },
        ]
    },
];

const quickIntents = [
  "Quels trajets à risque > 70% ?",
  "Optimise le planning de demain (Lyon)",
  "Envoie un message à propos de LGN-002",
  "Explique la hausse des coûts carburant S36",
];

const AnalystConfirmationDialog = ({onConfirm}: {onConfirm: () => void}) => {
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirmation d'exécution</DialogTitle>
                <DialogDescription className="py-4">
                    <p className="font-bold">Vous êtes sur le point d'appliquer l'action suivante :</p>
                    <pre className="mt-2 p-2 bg-muted rounded-md text-sm">
                        REPLAN_TRIP(tripId: 'LGN-003', newRoute: 'A43')
                    </pre>
                    <p className="mt-4">Cette action modifiera les données de production.</p>
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogTrigger asChild><Button variant="outline">Annuler</Button></DialogTrigger>
                <Button onClick={onConfirm}>Confirmer et exécuter</Button>
            </DialogFooter>
        </DialogContent>
    )
}

export default function CommandPage() {
    const [messages, setMessages] = useState(mockMessages);
    const [input, setInput] = useState("");
    const [isDemo, setIsDemo] = useState(true);
    const [activeActions, setActiveActions] = useState(mockMessages[3].actions); // Show last actions by default
    const [activeSql, setActiveSql] = useState(mockMessages[1].sqlPreview); // Show last SQL by default
    const { toast } = useToast();
    const role = 'dispatcher'; // 'analyst' to test disabled state
    
    const handleSend = () => {
        if (!input) return;
        setMessages([...messages, { sender: 'user', text: input }]);
        setInput("");
        // Here you would call the actual AI endpoint
    };
    
    const handleExecute = (action: any) => {
        toast({
            title: "Action exécutée",
            description: `L'action "${action.label}" a été appliquée avec succès.`
        })
        setActiveActions([]);
    }

  return (
    <div className="flex flex-col h-full">
        <header className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold font-headline">Ask Parnass AI</h1>
            <div className="flex items-center gap-4">
                <Badge variant="outline">Site: Tous</Badge>
                <div className="flex items-center space-x-2">
                    <Switch id="demo-mode" checked={isDemo} onCheckedChange={setIsDemo} />
                    <Label htmlFor="demo-mode">Demo Mode (Mock)</Label>
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
            {/* Chat Pane */}
            <Card className="lg:col-span-2 flex flex-col">
                <CardContent className="p-0 flex-grow">
                    <ScrollArea className="h-[calc(100vh-22rem)]">
                        <div className="p-6 space-y-6">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                    {msg.sender === 'ai' && <div className="p-2 rounded-full bg-primary text-primary-foreground"><Bot size={20}/></div>}
                                    <div className={`p-3 rounded-lg max-w-[80%] ${msg.sender === 'user' ? 'bg-muted' : 'bg-card'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                        {'actions' in msg && msg.actions && msg.actions.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {msg.actions.map((action, i) => (
                                                    <Button key={i} size="sm" variant="outline" onClick={() => { setActiveActions(msg.actions || []); setActiveSql(msg.sqlPreview) }}>
                                                        <Sparkles className="mr-2 h-3 w-3" />
                                                        {action.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                         {'sqlPreview' in msg && msg.sqlPreview && (
                                            <div className="mt-3">
                                                 <Button size="sm" variant="link" className="p-0 h-auto" onClick={() => { setActiveActions([]); setActiveSql(msg.sqlPreview) }}>
                                                    Voir la requête SQL
                                                </Button>
                                            </div>
                                         )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="p-4 border-t flex-col items-start gap-2">
                     <div className="flex flex-wrap gap-2">
                        {quickIntents.map(intent => (
                            <Button key={intent} size="sm" variant="outline" onClick={() => setInput(intent)}>{intent}</Button>
                        ))}
                    </div>
                    <div className="flex w-full gap-2 pt-2">
                        <Button variant="ghost" size="icon"><Paperclip/></Button>
                        <Textarea 
                            placeholder="Demandez: replanifier, notifier un client, expliquer un KPI..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            className="h-10 min-h-10 max-h-48 resize-y"
                        />
                        <Button onClick={handleSend}><Send/></Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Actions/Preview Pane */}
            <div className="flex flex-col gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Actions Proposées</CardTitle>
                        <CardDescription>Actions suggérées par l'IA.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         {activeActions.length === 0 && <p className="text-sm text-muted-foreground">Aucune action proposée.</p>}
                         {activeActions.map((action, i) => (
                             <Dialog key={i}>
                                <div className="p-3 rounded-lg border bg-muted/30">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-sm">{action.label}</p>
                                        <Badge variant="secondary">{action.impact}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{action.type}</p>
                                    <div className="flex justify-end gap-2 mt-3">
                                        <Button size="sm" variant="ghost"><Pencil className="mr-1"/>Modifier</Button>
                                        <Button size="sm" variant="outline" onClick={() => setActiveActions(prev => prev.filter(a => a.payload.tripId !== action.payload.tripId))}><X className="mr-1"/>Ignorer</Button>
                                        {role === 'analyst' ? (
                                            <Button size="sm" disabled><Check className="mr-1"/>Exécuter</Button>
                                        ) : (
                                            <DialogTrigger asChild>
                                                <Button size="sm"><Check className="mr-1"/>Exécuter</Button>
                                            </DialogTrigger>
                                        )}
                                    </div>
                                </div>
                                <AnalystConfirmationDialog onConfirm={() => handleExecute(action)} />
                             </Dialog>
                         ))}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Aperçu SQL</CardTitle>
                        <CardDescription>Requête générée pour répondre à votre demande.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activeSql ? (
                            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto font-code">
                                <code>{activeSql}</code>
                            </pre>
                        ) : (
                             <p className="text-sm text-muted-foreground">Aucune requête SQL générée.</p>
                        )}
                    </CardContent>
                    <CardFooter className="gap-2">
                        {role === 'analyst' ? (
                            <Button variant="outline" disabled={!activeSql} className="w-full"><Play className="mr-2"/>Exécuter (lecture seule)</Button>
                        ): (
                            <Button variant="outline" disabled={!activeSql} className="w-full"><Play className="mr-2"/>Exécuter (lecture seule)</Button>
                        )}
                        
                        <Button variant="secondary" disabled={!activeSql} className="w-full"><Download className="mr-2"/>Exporter</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
  );
}

    