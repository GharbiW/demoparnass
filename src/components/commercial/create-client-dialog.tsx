
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "../ui/textarea";

const formSchema = z.object({
    clientName: z.string().min(1, "Le nom du client est requis."),
    contactName: z.string().min(1, "Le nom du contact est requis."),
    contactEmail: z.string().email("L'email n'est pas valide."),
    productType: z.string().min(1, "Le type de produit est requis."),
    expectedVolume: z.coerce.number().positive("Le volume doit être un nombre positif."),
    category: z.enum(['Grand Compte', 'PME', 'Prospect']),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type DialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddClient: (clientData: FormValues) => void;
}

export function CreateClientDialog({ open, onOpenChange, onAddClient }: DialogProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clientName: "",
            contactName: "",
            contactEmail: "",
            productType: "Marchandises générales",
            expectedVolume: 10,
            category: 'Prospect',
            notes: "",
        },
    });

    function onSubmit(data: FormValues) {
        onAddClient(data);
        form.reset();
        onOpenChange(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] !overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Ajouter un Nouveau Prospect / Client</DialogTitle>
                    <DialogDescription>
                        Remplissez les informations pour créer un nouveau profil client.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-2">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="clientName" render={({ field }) => (
                                <FormItem><FormLabel>Nom du Client</FormLabel><FormControl><Input {...field} placeholder="Ex: Acme Corp" /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="contactName" render={({ field }) => (
                                    <FormItem><FormLabel>Nom du Contact</FormLabel><FormControl><Input {...field} placeholder="Ex: Jean Martin" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="contactEmail" render={({ field }) => (
                                    <FormItem><FormLabel>Email du Contact</FormLabel><FormControl><Input {...field} type="email" placeholder="Ex: j.martin@acme.corp" /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                             <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem><FormLabel>Catégorie</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Prospect">Prospect</SelectItem>
                                        <SelectItem value="PME">PME</SelectItem>
                                        <SelectItem value="Grand Compte">Grand Compte</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage/></FormItem>
                            )}/>
                             <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="productType" render={({ field }) => (
                                    <FormItem><FormLabel>Type de produits</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="expectedVolume" render={({ field }) => (
                                    <FormItem><FormLabel>Contrats / an (estimé)</FormLabel><FormControl><Input {...field} type="number" /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem><FormLabel>Notes / Documents</FormLabel><FormControl><Textarea {...field} placeholder="Uploader Kbis, CDC initial... (fonctionnalité à venir)" /></FormControl><FormMessage /></FormItem>
                            )}/>

                            <DialogFooter className="sticky bottom-0 bg-background pt-4">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                                <Button type="submit">Créer le Client</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
