
"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Workflow } from '@/lib/marketing-data';

// This component is now deprecated and will be removed in a future refactor.
// The functionality is being replaced by the new visual editor page.
interface WorkflowEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workflow?: Workflow;
    onSave: (data: Workflow) => void;
}

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Le nom du workflow est requis."),
  trigger: z.string().min(1, "Le déclencheur est requis."),
  description: z.string().min(1, "La description est requise."),
  status: z.enum(['Actif', 'Inactif']).default('Actif'),
  lastRun: z.string().optional(),
  runCount: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function WorkflowEditorDialog({ open, onOpenChange, workflow, onSave }: WorkflowEditorDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (workflow) {
      form.reset(workflow);
    } else {
      form.reset({
        name: '',
        trigger: '',
        description: '',
        status: 'Actif',
      });
    }
  }, [workflow, open, form]);

  const onSubmit = (data: FormValues) => {
    onSave({
        ...data,
        id: workflow?.id || '', // Keep existing ID or let parent handle new ID
        runCount: workflow?.runCount || 0,
        lastRun: workflow?.lastRun || 'Jamais',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{workflow ? 'Modifier le Workflow' : 'Créer un Nouveau Workflow'}</DialogTitle>
          <DialogDescription>
            Définissez les étapes et le déclencheur de votre automatisation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nom du Workflow</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="trigger" render={({ field }) => (
              <FormItem><FormLabel>Déclencheur</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionnez un déclencheur..."/></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Nouveau fichier audio uploadé">Nouveau fichier audio uploadé</SelectItem>
                        <SelectItem value="Nouvel enregistrement de webinaire">Nouvel enregistrement de webinaire</SelectItem>
                        <SelectItem value="Tous les jours à 9h00">Tous les jours à 9h00</SelectItem>
                        <SelectItem value="Manuellement">Manuellement</SelectItem>
                    </SelectContent>
                </Select>
              <FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description des actions</FormLabel><FormControl><Textarea {...field} placeholder="Ex: 1. Transcrire l'audio. 2. Extraire les points clés. 3. Générer 5 clips vidéo."/></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Annuler</Button>
                <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
