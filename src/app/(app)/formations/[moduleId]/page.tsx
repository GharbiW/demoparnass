
"use client";

import { useParams } from 'next/navigation';
import { trainingModules, trainingAssignments as allAssignments, drivers, technicians } from '@/lib/trainings-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, PlusCircle, User, Users } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';


const AssignTrainingDialog = ({ open, onOpenChange, onAssign }: { open: boolean, onOpenChange: (open: boolean) => void, onAssign: (count: number) => void }) => {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const allUsers = [...drivers, ...technicians];

    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    }
    
    const handleAssign = () => {
        if (selectedUsers.length > 0) {
            onAssign(selectedUsers.length);
            onOpenChange(false);
            setSelectedUsers([]);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assigner une Formation</DialogTitle>
                    <DialogDescription>Sélectionnez les employés à qui assigner cette formation.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label>Employés</Label>
                         <ScrollArea className="h-64 w-full rounded-md border p-4">
                            <div className="space-y-2">
                                {allUsers.map(user => (
                                    <div key={user.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`user-${user.id}`}
                                            onCheckedChange={() => handleSelectUser(user.id)}
                                            checked={selectedUsers.includes(user.id)}
                                        />
                                        <label htmlFor={`user-${user.id}`} className="text-sm font-medium leading-none">
                                            {user.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="due-date">Échéance</Label>
                        <Input id="due-date" type="date" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleAssign} disabled={selectedUsers.length === 0}>Assigner ({selectedUsers.length})</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function FormationDetailPage() {
    const params = useParams();
    const moduleId = params.moduleId as string;
    const { toast } = useToast();
    const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);

    const module = trainingModules.find(m => m.id === moduleId);
    const assignments = allAssignments.filter(a => a.moduleId === moduleId);

     const getStatusVariant = (status: string) => {
        switch (status) {
        case "Terminé": return "secondary";
        case "En retard": return "destructive";
        case "En cours":
        default: return "outline";
        }
    };
    
    const handleAssign = (count: number) => {
        toast({
            title: "Formation Assignée",
            description: `La formation a été assignée à ${count} employé(s).`,
        });
    }

    if (!module) {
        return <Card><CardHeader><CardTitle>Formation non trouvée</CardTitle></CardHeader></Card>;
    }

    return (
        <div className="space-y-6">
            <AssignTrainingDialog open={isAssignDialogOpen} onOpenChange={setAssignDialogOpen} onAssign={handleAssign} />
            <div>
                 <Button variant="ghost" asChild className="mb-4">
                    <Link href="/formations"><ArrowLeft className="mr-2"/>Retour à la liste</Link>
                </Button>
                <h1 className="text-3xl font-bold font-headline">{module.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{module.category}</Badge>
                    <Badge variant="outline">{module.durationMinutes} min</Badge>
                     <Badge variant="outline">{assignments.length} participants</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Contenu de la Formation</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                        <div dangerouslySetInnerHTML={{ __html: module.content || "<p>Contenu non disponible.</p>" }} />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Button onClick={() => setAssignDialogOpen(true)}><Users className="mr-2"/>Assigner</Button>
                        <Button variant="outline">Modifier le contenu</Button>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Progrès des Employés</CardTitle>
                    <CardDescription>Suivi des assignations pour ce module.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employé</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Temps passé</TableHead>
                                <TableHead>Échéance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {assignments.map(assignment => {
                                const link = assignment.userType === 'Chauffeur' ? `/chauffeurs/${assignment.userId}` : `/technicians/${assignment.userId}`;
                                return (
                                    <TableRow key={assignment.id}>
                                        <TableCell className="font-medium">
                                            <Link href={link} className="hover:underline text-primary">
                                                {assignment.userName}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{assignment.userType}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(assignment.status)}>{assignment.status}</Badge></TableCell>
                                        <TableCell>{assignment.score ? `${assignment.score}%` : 'N/A'}</TableCell>
                                        <TableCell>{assignment.timeSpentMinutes ? `${assignment.timeSpentMinutes} min` : 'N/A'}</TableCell>
                                        <TableCell>{assignment.dueDate}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
