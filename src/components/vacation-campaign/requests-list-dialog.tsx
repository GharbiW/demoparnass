
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, ThumbsUp, X, Sparkles } from "lucide-react";
import type { CampaignRequest, CapacityNeed } from "@/lib/vacation-campaign-data";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import { Separator } from "../ui/separator";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface RequestsListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: CampaignRequest[];
  title: string;
  onUpdateRequest: (requestId: string, status: CampaignRequest['status']) => void;
  capacity?: number;
}

export function RequestsListDialog({ open, onOpenChange, requests, title, onUpdateRequest, capacity = 0 }: RequestsListDialogProps) {
    const { toast } = useToast();

    const handleAction = (request: CampaignRequest, status: 'accepted' | 'rejected') => {
        onUpdateRequest(request.id, status);
        toast({
            title: `Demande ${status === 'accepted' ? 'Approuvée' : 'Rejetée'}`,
            description: `La demande de ${request.driverName} a été mise à jour.`
        })
    }
    
    const sortedRequests = useMemo(() => {
        // Filter for only pending requests and then sort them
        return requests
            .filter(r => r.status === 'pending')
            .sort((a,b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    }, [requests]);
    
    const handleBatchApprove = () => {
        let approvedCount = 0;
        sortedRequests.forEach((req, index) => {
            if (req.status === 'pending' && index < capacity) {
                onUpdateRequest(req.id, 'accepted');
                approvedCount++;
            }
        });
        toast({
            title: "Approbation en masse",
            description: `${approvedCount} demande(s) ont été approuvée(s) en respectant la capacité.`,
        })
    }

    const pendingRequestsCount = sortedRequests.length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Liste des demandes en attente pour cette période, triées par score de priorité. Capacité de congé pour cette sélection : {capacity}.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Chauffeur</TableHead>
                                <TableHead>Durée</TableHead>
                                <TableHead className="text-center">Score Priorité</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        Aucune demande en attente pour cette sélection.
                                    </TableCell>
                                </TableRow>
                            )}
                            {sortedRequests.map((req, index) => {
                                const isWithinCapacity = index < capacity;
                                return (
                                <>
                                    {index === capacity && pendingRequestsCount > 0 && (
                                         <TableRow>
                                            <TableCell colSpan={5} className="p-0">
                                                <div className="flex items-center gap-2">
                                                    <Separator className="flex-grow"/>
                                                    <span className="text-xs text-destructive font-semibold">Dépassement de Capacité</span>
                                                    <Separator className="flex-grow"/>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow key={req.id} className={cn(!isWithinCapacity && 'bg-destructive/10')}>
                                        <TableCell className="font-semibold">{req.driverName}</TableCell>
                                        <TableCell>{differenceInDays(new Date(req.endDate), new Date(req.startDate))} jours</TableCell>
                                        <TableCell className="text-center font-bold">{req.priorityScore || 'N/A'}</TableCell>
                                        <TableCell><Badge variant={'outline'}>{req.status}</Badge></TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" variant="secondary" onClick={() => handleAction(req, 'accepted')}><ThumbsUp className="mr-1"/> Approuver</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleAction(req, 'rejected')}><X className="mr-1"/> Rejeter</Button>
                                        </TableCell>
                                    </TableRow>
                                </>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
                 <DialogFooter className="justify-between">
                     <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
                    <Button onClick={handleBatchApprove} disabled={pendingRequestsCount === 0 || capacity === 0}>
                        <Sparkles className="mr-2"/>Approuver en priorité ({Math.min(pendingRequestsCount, capacity)})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
