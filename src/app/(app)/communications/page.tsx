
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Send, Users, Globe } from "lucide-react";
import { communications as initialCommunications, type Communication } from "@/lib/communications-data";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const CreateCommunicationDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
    const { toast } = useToast();
    
    const handleSend = () => {
        toast({
            title: "Communication Envoyée",
            description: "Votre message a été envoyé aux destinataires sélectionnés.",
        });
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rédiger une Communication</DialogTitle>
                    <DialogDescription>
                        Créez un message à envoyer à vos équipes.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre</Label>
                        <Input id="title" placeholder="Ex: Rappel de sécurité important" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">Message</Label>
                        <Textarea id="content" placeholder="Entrez votre message ici..." rows={6} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="target">Destinataires</Label>
                        <Select>
                            <SelectTrigger id="target">
                                <SelectValue placeholder="Sélectionner une audience..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les employés</SelectItem>
                                <SelectItem value="drivers">Tous les chauffeurs</SelectItem>
                                <SelectItem value="technicians">Tous les techniciens</SelectItem>
                                <SelectItem value="site-lyon">Site: Lyon</SelectItem>
                                <SelectItem value="site-paris">Site: Paris</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleSend}><Send className="mr-2"/>Envoyer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function CommunicationsPage() {
    const [communications, setCommunications] = useState<Communication[]>(initialCommunications);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
        <CreateCommunicationDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
        <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold font-headline">Communications</h1>
            <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2" /> Rédiger</Button>
        </div>

        <div className="space-y-4">
            {communications.map((comm) => (
            <Card key={comm.id}>
                <CardHeader>
                <CardTitle>{comm.title}</CardTitle>
                <CardDescription>
                    Par {comm.author} le {comm.date}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <p className="text-sm line-clamp-2">{comm.content}</p>
                </CardContent>
                <CardFooter>
                    <Badge variant="outline" className="flex items-center gap-2">
                        {comm.target === 'Tous' ? <Globe className="h-3 w-3" /> : <Users className="h-3 w-3"/>}
                        {comm.target}
                    </Badge>
                </CardFooter>
            </Card>
            ))}
        </div>
        </div>
    </>
  );
}
