
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trainingModules, drivers, technicians } from "@/lib/trainings-data";

interface AssignTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignTrainingDialog({ open, onOpenChange }: AssignTrainingDialogProps) {
    const { toast } = useToast();
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const allUsers = [...drivers, ...technicians];

    const handleAssign = () => {
        if (selectedModuleId && selectedUsers.length > 0) {
            toast({
                title: "Formation Assignée",
                description: `La formation a été assignée à ${selectedUsers.length} employé(s).`,
            });
            onOpenChange(false);
            setSelectedModuleId('');
            setSelectedUsers([]);
        }
    };
    
    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Assigner une Formation</DialogTitle>
                    <DialogDescription>Sélectionnez un module, les employés, et une échéance.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="module-select">Module de Formation</Label>
                        <Select onValueChange={setSelectedModuleId}>
                            <SelectTrigger id="module-select">
                                <SelectValue placeholder="Sélectionner un module..." />
                            </SelectTrigger>
                            <SelectContent>
                                {trainingModules.map(module => (
                                    <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Employés</Label>
                         <ScrollArea className="h-48 w-full rounded-md border p-4">
                            <div className="space-y-2">
                                {allUsers.map(user => (
                                    <div key={user.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`user-assign-${user.id}`}
                                            onCheckedChange={() => handleSelectUser(user.id)}
                                            checked={selectedUsers.includes(user.id)}
                                        />
                                        <label htmlFor={`user-assign-${user.id}`} className="text-sm font-medium leading-none">
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
                    <Button onClick={handleAssign} disabled={!selectedModuleId || selectedUsers.length === 0}>Assigner</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
