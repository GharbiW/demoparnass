
"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { Contract } from "@/lib/types";

const weekDays = [
  { id: 'Lu', label: 'Lundi' },
  { id: 'Ma', label: 'Mardi' },
  { id: 'Me', label: 'Mercredi' },
  { id: 'Je', label: 'Jeudi' },
  { id: 'Ve', label: 'Vendredi' },
  { id: 'Sa', label: 'Samedi' },
  { id: 'Di', label: 'Dimanche' },
];

const driverSkillsOptions = [
    { id: 'ADR', label: 'ADR' },
    { id: 'Aéroportuaire', label: 'Aéroportuaire' },
    { id: 'Habilitation sûreté', label: 'Habilitation sûreté' },
];

const formSchema = z.object({
    client: z.string().min(1, "Le nom du client est requis."),
    originSite: z.string().min(1, "Le site de départ est requis."),
    destinationSite: z.string().min(1, "Le site d'arrivée est requis."),
    daysOfWeek: z.array(z.string()).refine(value => value.some(Boolean), {
        message: "Vous devez sélectionner au moins un jour.",
    }),
    departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:mm invalide."),
    arrivalTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format HH:mm invalide."),
    vehicleType: z.enum(['Semi-remorque', 'Caisse mobile', 'Frigo', 'ADR']),
    driverSkills: z.array(z.string()).optional(),
    contractStart: z.date({ required_error: "Date de début requise." }),
    contractEnd: z.date({ required_error: "Date de fin requise." }),
});

type FormValues = z.infer<typeof formSchema>;
type DialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddContract: (contract: Omit<Contract, 'id'| 'isSuspended'>) => void;
    clientName?: string;
}

export function CreateContractDialog({ open, onOpenChange, onAddContract, clientName }: DialogProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            client: clientName || "",
            originSite: "",
            destinationSite: "",
            daysOfWeek: [],
            departureTime: "08:00",
            arrivalTime: "17:00",
            vehicleType: 'Semi-remorque',
            driverSkills: [],
        },
    });

    React.useEffect(() => {
        if (clientName) {
            form.setValue('client', clientName);
        }
    }, [clientName, form]);

    function onSubmit(data: FormValues) {
        const submissionData = {
            ...data,
            contractStart: format(data.contractStart, 'yyyy-MM-dd'),
            contractEnd: format(data.contractEnd, 'yyyy-MM-dd'),
        };
        onAddContract(submissionData);
        form.reset();
        onOpenChange(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] !overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Créer un Nouveau Contrat Client</DialogTitle>
                    <DialogDescription>
                        Remplissez les détails du cahier des charges pour ce nouveau contrat.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto pr-2">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                             <FormField control={form.control} name="client" render={({ field }) => (
                                <FormItem><FormLabel>Nom du Client</FormLabel><FormControl><Input {...field} placeholder="Ex: CARREFOUR" disabled={!!clientName} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="originSite" render={({ field }) => (
                                    <FormItem><FormLabel>Site de départ</FormLabel><FormControl><Input {...field} placeholder="Ex: Entrepôt Vénissieux" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="destinationSite" render={({ field }) => (
                                    <FormItem><FormLabel>Site d'arrivée</FormLabel><FormControl><Input {...field} placeholder="Ex: Plateforme Mâcon" /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                 <FormField control={form.control} name="departureTime" render={({ field }) => (
                                    <FormItem><FormLabel>Heure départ</FormLabel><FormControl><Input {...field} type="time" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                  <FormField control={form.control} name="arrivalTime" render={({ field }) => (
                                    <FormItem><FormLabel>Heure arrivée</FormLabel><FormControl><Input {...field} type="time" /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                             <FormField control={form.control} name="daysOfWeek" render={() => (
                                <FormItem>
                                    <FormLabel>Jours de la semaine</FormLabel>
                                    <div className="flex flex-wrap gap-4">
                                    {weekDays.map(day => (
                                        <FormField key={day.id} control={form.control} name="daysOfWeek" render={({ field }) => (
                                            <FormItem key={day.id} className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(day.id)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                            ? field.onChange([...field.value, day.id])
                                                            : field.onChange(field.value?.filter(value => value !== day.id))
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal">{day.label}</FormLabel>
                                            </FormItem>
                                        )}/>
                                    ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                             )} />
                             <FormField control={form.control} name="vehicleType" render={({ field }) => (
                                <FormItem><FormLabel>Type de véhicule</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Semi-remorque">Semi-remorque</SelectItem>
                                        <SelectItem value="Caisse mobile">Caisse mobile</SelectItem>
                                        <SelectItem value="Frigo">Frigo</SelectItem>
                                        <SelectItem value="ADR">ADR</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage/></FormItem>
                            )}/>
                            <FormField control={form.control} name="driverSkills" render={() => (
                                <FormItem>
                                    <FormLabel>Compétences chauffeur requises</FormLabel>
                                    <div className="flex flex-wrap gap-4">
                                        {driverSkillsOptions.map(skill => (
                                            <FormField key={skill.id} control={form.control} name="driverSkills" render={({ field }) => (
                                                <FormItem key={skill.id} className="flex items-center space-x-2 space-y-0">
                                                    <FormControl>
                                                        <Checkbox
                                                        checked={field.value?.includes(skill.id)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                            ? field.onChange([...(field.value || []), skill.id])
                                                            : field.onChange(field.value?.filter(value => value !== skill.id))
                                                        }}
                                                    />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">{skill.label}</FormLabel>
                                                </FormItem>
                                            )}/>
                                        ))}
                                    </div>
                                </FormItem>
                            )}/>

                             <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="contractStart" render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Début de contrat</FormLabel>
                                    <Popover><PopoverTrigger asChild>
                                        <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover>
                                    <FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="contractEnd" render={({ field }) => (
                                    <FormItem className="flex flex-col"><FormLabel>Fin de contrat</FormLabel>
                                    <Popover><PopoverTrigger asChild>
                                        <FormControl>
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Choisir une date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover>
                                    <FormMessage /></FormItem>
                                )}/>
                            </div>
                            <DialogFooter className="sticky bottom-0 bg-background pt-4">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                                <Button type="submit">Créer le contrat</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
