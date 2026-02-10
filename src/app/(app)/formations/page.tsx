
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ListFilter, Search, MoreHorizontal, PlusCircle, BarChart, CheckCircle, Clock, Users } from "lucide-react";
import Link from "next/link";
import { trainingModules as initialModules, trainingAssignments, type TrainingModule } from "@/lib/trainings-data";
import { CreateTrainingDialog } from "@/components/trainings/create-training-dialog";
import { AssignTrainingDialog } from "@/components/trainings/assign-training-dialog";

export default function TrainingsPage() {
  const [modules, setModules] = useState<TrainingModule[]>(initialModules);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
  
  const completionRate = (trainingAssignments.filter(a => a.status === 'Terminé').length / trainingAssignments.length) * 100;
  const avgScore = trainingAssignments.filter(a => a.score).reduce((acc, a) => acc + a.score!, 0) / trainingAssignments.filter(a => a.score).length;

  const countAssignments = (moduleId: string) => {
    return trainingAssignments.filter(a => a.moduleId === moduleId).length;
  }

  return (
    <div className="flex flex-col h-full space-y-4">
        <CreateTrainingDialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen} />
        <AssignTrainingDialog open={isAssignDialogOpen} onOpenChange={setAssignDialogOpen} />
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold font-headline">Catalogue des Formations</h1>
             <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setAssignDialogOpen(true)}><Users className="mr-2"/>Assigner une formation</Button>
                <Button onClick={() => setCreateDialogOpen(true)}><PlusCircle className="mr-2"/>Créer une formation</Button>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Complétion Global</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">sur tous les modules assignés</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Moyen Global</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{avgScore.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">pour les modules terminés avec quiz</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temps total de formation</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">128 Heures</div>
                 <p className="text-xs text-muted-foreground">sur les 30 derniers jours</p>
                </CardContent>
            </Card>
        </div>
        
        <Card className="flex-grow">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Modules de Formation</CardTitle>
                        <CardDescription>Gérez les formations disponibles pour vos équipes.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Rechercher une formation..." className="pl-8 w-64" />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-1">
                                <ListFilter className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only">Filtres</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked>Catégorie: Toutes</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Titre de la Formation</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Durée</TableHead>
                            <TableHead>Participants</TableHead>
                            <TableHead>Quiz</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {modules.map(module => (
                            <TableRow key={module.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/formations/${module.id}`} className="hover:underline text-primary">
                                        {module.title}
                                    </Link>
                                </TableCell>
                                <TableCell><Badge variant="outline">{module.category}</Badge></TableCell>
                                <TableCell>{module.durationMinutes} min</TableCell>
                                <TableCell className='flex items-center gap-1'><Users className="h-4 w-4 text-muted-foreground" />{countAssignments(module.id)}</TableCell>
                                <TableCell>{module.hasQuiz ? 'Oui' : 'Non'}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem asChild><Link href={`/formations/${module.id}`}>Voir les détails</Link></DropdownMenuItem>
                                            <DropdownMenuItem>Assigner</DropdownMenuItem>
                                            <DropdownMenuItem>Modifier</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
