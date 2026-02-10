

'use client'

import type { Trip } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Bot, MoreVertical, Snowflake, Thermometer, User, Truck, Clock, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { drivers } from "@/lib/planning-data";
import { vehicles } from "@/lib/vehicles-data";
import { format } from "date-fns";

interface TripCardProps {
    trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {

    const getSlaColor = (sla?: Trip['slaStatus']) => {
        if (!sla) return 'border-border';
        switch (sla) {
            case 'on_time':
                return 'border-green-500';
            case 'at_risk':
                return 'border-amber-500';
            case 'late':
                return 'border-red-500';
            default:
                return 'border-border';
        }
    }

    const getRiskColor = (risk?: number) => {
        if (!risk) return 'text-primary';
        if (risk > 75) return 'text-destructive';
        if (risk > 50) return 'text-amber-600';
        return 'text-primary';
    }

    const vehicle = vehicles.find(v => v.vin === trip.vin);
    const driver = drivers.find(d => d.id === trip.driverId);


    return (
        <Card className={cn("flex flex-col", getSlaColor(trip.slaStatus))}>
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base">{trip.client}</CardTitle>
                        <CardDescription className="text-xs">{trip.id}</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Reassigner véhicule</DropdownMenuItem>
                            <DropdownMenuItem>Reassigner chauffeur</DropdownMenuItem>
                            <DropdownMenuItem>Notifier client</DropdownMenuItem>
                            <DropdownMenuItem>Ouvrir anomalie</DropdownMenuItem>
                            <DropdownMenuItem>Ouvrir dans Trajet</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                 <div className="flex items-center gap-2 pt-2">
                    {trip.isColdChain && <Badge variant="outline" className="border-blue-400 text-blue-500"><Snowflake className="mr-1 h-3 w-3"/>Froid</Badge>}
                    {trip.isAdr && <Badge variant="outline" className="border-orange-400 text-orange-500"><Thermometer className="mr-1 h-3 w-3"/>ADR</Badge>}
                </div>
            </CardHeader>
            <CardContent className="p-4 text-sm space-y-3 flex-grow">
                <div className="flex flex-col">
                    <span className="font-medium text-muted-foreground">Enlèvement</span>
                    <span>{trip.pickupLocation} à <span className="font-bold">{format(new Date(trip.plannedStart), "HH:mm")}</span></span>
                </div>
                 <div className="flex flex-col">
                    <span className="font-medium text-muted-foreground">Livraison</span>
                    <span>{trip.deliveryLocation} à <span className="font-bold">{format(new Date(trip.plannedEnd), "HH:mm")}</span></span>
                </div>
                 <div className="flex flex-col text-xs space-y-1 mt-2">
                    <span className="flex items-center"><Truck className="mr-2 h-3 w-3 text-muted-foreground"/> {vehicle?.immatriculation || trip.vin}</span>
                    <span className="flex items-center"><User className="mr-2 h-3 w-3 text-muted-foreground"/>{driver?.name || trip.driverId}</span>
                </div>

            </CardContent>
            <CardFooter className="p-4 bg-muted/50 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button size="icon" variant="outline" className="h-7 w-7 bg-amber-100 border-amber-300 hover:bg-amber-200">
                                <Zap className="h-4 w-4 text-amber-600" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Re-planifier (IA)</p></TooltipContent>
                    </Tooltip>
                    {trip.riskEta != null && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={cn("flex items-center gap-1 font-bold", getRiskColor(trip.riskEta))}>
                                <Bot className="h-4 w-4" />
                                <span>{trip.riskEta}%</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Risque de retard estimé par IA</p>
                        </TooltipContent>
                    </Tooltip>
                )}
                </div>
                 <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary"/>
                    <div>
                        <span className="text-muted-foreground">ETA: </span>
                        <span className="font-bold">{trip.eta || format(new Date(trip.plannedEnd), "HH:mm")}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
