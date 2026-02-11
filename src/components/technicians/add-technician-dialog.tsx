
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zod-resolver";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Technician } from "@/lib/technicians-data";

interface AddTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTechnician: (technician: Omit<Technician, 'id' | 'avgRepairTime' | 'successRate'>) => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  site: z.string().min(1, "Le site est requis."),
  email: z.string().email("L'email n'est pas valide."),
  phone: z.string().min(1, "Le téléphone est requis."),
  status: z.enum(["Actif", "En Pause", "En Intervention"]),
  skills: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
  certifications: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
});

export function AddTechnicianDialog({ open, onOpenChange, onAddTechnician }: AddTechnicianDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      site: "Lyon",
      email: "",
      phone: "",
      status: "Actif",
      skills: "",
      certifications: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onAddTechnician(values);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un Technicien</DialogTitle>
          <DialogDescription>
            Remplissez les informations du nouveau technicien.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="site" render={({ field }) => (
              <FormItem><FormLabel>Site</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="skills" render={({ field }) => (
              <FormItem><FormLabel>Compétences (séparées par virgule)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <DialogFooter>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Annuler</Button>
                <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
