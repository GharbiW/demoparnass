

"use client";

import { useState, useEffect } from "react";
import { drivers, allTrips } from "@/lib/planning-data";
import type { Vehicle, Driver } from "@/lib/types";
import { Trip } from "@/lib/types";
import { addDays, differenceInDays, differenceInMinutes, format, startOfDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

type GanttChartProps = {
    resources: (Vehicle | Driver)[];
    trips: Trip[];
    viewMode: 'vehicles' | 'drivers';
    startDate: Date;
    endDate: Date;
    onTripClick: (trip: Trip) => void;
}

const HOUR_WIDTH_PX = 50; // Width of one hour column in pixels
const DAY_WIDTH_PX = HOUR_WIDTH_PX * 24;

const GanttHeader = ({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const days = Array.from({ length: totalDays }, (_, i) => addDays(startDate, i));
    const showHours = totalDays <= 7; // Show hours for day and week view

    return (
        <div className="sticky top-0 z-10 flex bg-card border-b" style={{ width: DAY_WIDTH_PX * totalDays }}>
            {days.map(day => (
                <div key={day.toISOString()} className="flex-shrink-0 border-r text-center" style={{ width: DAY_WIDTH_PX }}>
                     <div className="py-1 border-b">
                        <p className="text-sm font-semibold">{format(day, 'EEE d MMM')}</p>
                    </div>
                    {showHours && (
                        <div className="flex">
                            {Array.from({ length: 24 }).map((_, hour) => (
                                <div key={hour} className="flex-shrink-0 border-r text-center py-1 w-[50px]">
                                    <p className="text-xs text-muted-foreground">{String(hour).padStart(2,'0')}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const GanttRow = ({ resource, trips, viewMode, startDate, onTripClick }: { resource: (Vehicle | Driver), trips: Trip[], viewMode: 'vehicles' | 'drivers', startDate: Date, onTripClick: (trip: Trip) => void }) => {
    const resourceId = 'vin' in resource ? resource.vin : resource.id;
    const resourceTrips = trips.filter(trip => 
        viewMode === 'vehicles' ? trip.vin === resourceId : trip.driverId === resourceId
    );
    
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);

    if (!isClient) {
        return <div className="relative flex items-center h-16 border-b" style={{ width: DAY_WIDTH_PX }}></div>;
    }

    const getTripStyle = (trip: Trip) => {
        const timelineStart = startOfDay(startDate);
        const start = new Date(trip.plannedStart);
        const end = new Date(trip.plannedEnd);

        const left = differenceInMinutes(start, timelineStart) / 60 * HOUR_WIDTH_PX;
        const width = Math.max(differenceInMinutes(end, start) / 60 * HOUR_WIDTH_PX, 20); // Min width

        return {
            left: `${left}px`,
            width: `${width}px`
        };
    }
    
    const getStatusClass = (status: Trip['status']) => {
        switch(status) {
            case 'in_progress': return 'bg-blue-500';
            case 'completed': return 'bg-green-500';
            case 'planned': return 'bg-gray-400';
            case 'conflict': return 'bg-destructive/70 border-2 border-destructive ring-2 ring-destructive/50';
            default: return 'bg-primary';
        }
    }


    return (
        <div className="relative flex items-center h-16 border-b">
            {resourceTrips.map(trip => (
                 <TooltipProvider key={trip.id}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div 
                                onClick={() => onTripClick(trip)}
                                className={cn("absolute h-10 rounded-lg p-2 text-white text-xs overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary", getStatusClass(trip.status))}
                                style={getTripStyle(trip)}
                            >
                                <p className="font-bold truncate">{trip.id} - {trip.client}</p>
                                <p className="truncate">{format(new Date(trip.plannedStart), 'HH:mm')} - {format(new Date(trip.plannedEnd), 'HH:mm')}</p>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p><strong>Trajet:</strong> {trip.id}</p>
                           <p><strong>Client:</strong> {trip.client}</p>
                           <p><strong>Statut:</strong> {trip.status}</p>
                           {trip.status === 'conflict' && (
                               <p className="flex items-center text-destructive"><AlertTriangle className="mr-1 h-4 w-4"/>Conflit d'horaire détecté.</p>
                           )}
                           {viewMode === 'vehicles' && <p><strong>Chauffeur:</strong> {drivers.find(d => d.id === trip.driverId)?.name}</p>}
                           {viewMode === 'drivers' && <p><strong>Véhicule:</strong> {trip.vin}</p>}
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            ))}
        </div>
    )
};


export const GanttChart = ({ resources, trips, viewMode, startDate, endDate, onTripClick }: GanttChartProps) => {
    const totalDays = differenceInDays(endDate, startDate) + 1;
    const totalWidth = DAY_WIDTH_PX * totalDays;

    return (
        <div className="relative h-full flex">
            {/* Resource Lanes */}
            <div className="sticky left-0 z-20 flex flex-col bg-muted/50 border-r w-48">
                <div className="h-[65px] flex-shrink-0 border-b flex items-center px-4">
                    <p className="font-semibold text-sm">{viewMode === 'vehicles' ? 'Véhicules' : 'Chauffeurs'}</p>
                </div>
                {resources.map(resource => (
                    <div key={'vin' in resource ? resource.vin : resource.id} className="h-16 border-b flex items-center px-4">
                         <div>
                            <p className="font-medium text-sm">{'immatriculation' in resource ? resource.immatriculation : resource.name}</p>
                            <p className="text-xs text-muted-foreground">{'vin' in resource ? resource.vin : resource.site}</p>
                         </div>
                    </div>
                ))}
            </div>

            {/* Gantt Area */}
            <div className="flex-grow">
                <div className="relative" style={{ width: totalWidth }}>
                    <GanttHeader startDate={startDate} endDate={endDate} />
                     <div className="relative">
                         {resources.map(resource => (
                            <GanttRow 
                                key={'vin' in resource ? resource.vin : resource.id} 
                                resource={resource}
                                trips={trips}
                                viewMode={viewMode}
                                startDate={startDate}
                                onTripClick={onTripClick}
                            />
                        ))}
                     </div>
                </div>
            </div>
        </div>
    )
}
