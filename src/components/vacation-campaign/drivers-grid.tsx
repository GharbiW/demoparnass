
"use client";

import { useState, useMemo } from "react";
import { format, addDays, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { CampaignDriver, CampaignRequest } from "@/lib/vacation-campaign-data";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Users, Map } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "../ui/badge";

interface DriversGridProps {
  drivers: CampaignDriver[];
  requests: CampaignRequest[];
  onDriverSelect: (driver: CampaignDriver) => void;
  selectedDriverId?: string | null;
}

const getStatusColor = (status: CampaignRequest['status']) => {
    switch (status) {
        case 'accepted': return 'bg-green-500/80';
        case 'pending': return 'bg-blue-500/80';
        case 'negotiate': return 'bg-amber-500/80';
        case 'rejected': return 'bg-red-500/80';
        default: return 'bg-gray-300';
    }
}

const getDeltaClass = (delta: number) => {
    if (delta < 0) return 'bg-destructive/20 text-destructive-foreground';
    if (delta < 3) return 'bg-amber-500/20 text-amber-700';
    return '';
}

const CompetenceView = ({ drivers, requests, daysInMonth }: { drivers: CampaignDriver[], requests: CampaignRequest[], daysInMonth: Date[] }) => {
    const skills: CampaignDriver['skill'][] = ['SPL', 'CM', 'Polyvalent'];
    const summary = skills.map(skill => {
        const skillDrivers = drivers.filter(d => d.skill === skill);
        const dailyData = daysInMonth.map(day => {
            const driversOnLeave = requests.filter(r => 
                r.skill === skill && 
                r.status === 'accepted' && 
                new Date(r.startDate) <= day && 
                new Date(r.endDate) >= day
            ).length;
            const available = skillDrivers.length - driversOnLeave;
            return { available, total: skillDrivers.length, onLeave: driversOnLeave };
        });
        return { skill, drivers: skillDrivers, dailyData };
    });

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="sticky left-0 bg-background z-0 w-40">Compétence</TableHead>
                    {daysInMonth.map(day => (
                        <TableHead key={day.toISOString()} className="w-16 text-center">{format(day, 'd')}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {summary.map(({ skill, drivers, dailyData }) => (
                    <TableRow key={skill}>
                        <TableCell className="sticky left-0 bg-background z-0 font-semibold w-40">{skill} ({drivers.length})</TableCell>
                        {dailyData.map((data, index) => {
                            const capacity = Math.ceil(data.total * 0.7); // 70% capacity
                            const delta = capacity - data.onLeave;
                            return (
                                <TableCell key={index} className={cn("text-center p-1", getDeltaClass(delta))}>
                                    <p className="font-bold text-sm">{data.available}</p>
                                    <p className="text-xs text-muted-foreground">{data.onLeave} off</p>
                                </TableCell>
                            )
                        })}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const ZoneView = ({ drivers, requests, daysInMonth }: { drivers: CampaignDriver[], requests: CampaignRequest[], daysInMonth: Date[] }) => {
    const zones: CampaignDriver['zone'][] = ['IDF', 'Sud-Est', 'Ouest'];
    const summary = zones.map(zone => {
        const zoneDrivers = drivers.filter(d => d.zone === zone);
        const dailyData = daysInMonth.map(day => {
            const driversOnLeave = requests.filter(r => 
                r.zone === zone && 
                r.status === 'accepted' && 
                new Date(r.startDate) <= day && 
                new Date(r.endDate) >= day
            ).length;
            const available = zoneDrivers.length - driversOnLeave;
            return { available, total: zoneDrivers.length, onLeave: driversOnLeave };
        });
        return { zone, drivers: zoneDrivers, dailyData };
    });

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="sticky left-0 bg-background z-0 w-40">Zone</TableHead>
                    {daysInMonth.map(day => (
                        <TableHead key={day.toISOString()} className="w-16 text-center">{format(day, 'd')}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {summary.map(({ zone, drivers, dailyData }) => (
                    <TableRow key={zone}>
                        <TableCell className="sticky left-0 bg-background z-0 font-semibold w-40">{zone} ({drivers.length})</TableCell>
                        {dailyData.map((data, index) => {
                            const capacity = Math.ceil(data.total * 0.7);
                            const delta = capacity - data.onLeave;
                            return (
                                <TableCell key={index} className={cn("text-center p-1", getDeltaClass(delta))}>
                                    <p className="font-bold text-sm">{data.available}</p>
                                    <p className="text-xs text-muted-foreground">{data.onLeave} off</p>
                                </TableCell>
                            )
                        })}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const DriverView = ({ drivers, requestsByDriverDay, daysInMonth, onDriverSelect, selectedDriverId }: { drivers: CampaignDriver[], requestsByDriverDay: Record<string, CampaignRequest>, daysInMonth: Date[], onDriverSelect: (driver: CampaignDriver) => void, selectedDriverId?: string | null }) => (
    <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 bg-background z-10">
            <tr>
            <th className="sticky left-0 bg-background p-2 border-b border-r w-48 z-10">Chauffeur</th>
            {daysInMonth.map((day) => (
                <th key={day.toISOString()} className="p-2 border-b w-8 text-center font-normal">
                    <div>{format(day, 'd')}</div>
                    <div className="text-muted-foreground">{format(day, 'EEE', {locale: fr}).slice(0,2)}</div>
                </th>
            ))}
            </tr>
        </thead>
        <tbody>
            {drivers.map((driver) => (
            <tr key={driver.id} className={cn("hover:bg-muted/50", selectedDriverId === driver.id && "bg-primary/10")}>
                <td 
                    className="sticky left-0 bg-inherit p-2 border-b border-r w-48 cursor-pointer z-10"
                    onClick={() => onDriverSelect(driver)}
                >
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4"/>
                        <div>
                                <p className="font-semibold">{driver.name}</p>
                                <p className="text-muted-foreground text-[10px]">{driver.zone} - {driver.skill}</p>
                        </div>
                    </div>
                </td>
                {daysInMonth.map((day) => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const driverKey = `${driver.id}-${dayKey}`;
                    const request = requestsByDriverDay[driverKey];
                    return (
                        <TooltipProvider key={day.toISOString()}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <td className="border-b text-center p-0 h-12">
                                        {request && (
                                            <div className={cn("w-full h-full", getStatusColor(request.status))}></div>
                                        )}
                                    </td>
                                </TooltipTrigger>
                                {request && (
                                    <TooltipContent>
                                        <p>Statut: <span className="font-semibold">{request.status}</span></p>
                                        <p>Type: Congé Payé</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    )
                })}
            </tr>
            ))}
        </tbody>
    </table>
)


export function DriversGrid({ drivers, requests, onDriverSelect, selectedDriverId }: DriversGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 6, 1)); // July 2025
  const [zoneFilter, setZoneFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');
  const [view, setView] = useState<'driver' | 'skill' | 'zone'>('driver');
  
  const uniqueZones = useMemo(() => ['all', ...Array.from(new Set(drivers.map(d => d.zone)))], [drivers]);
  const uniqueSkills = useMemo(() => ['all', ...Array.from(new Set(drivers.map(d => d.skill)))], [drivers]);

  const filteredDrivers = useMemo(() => {
      return drivers.filter(driver => 
          (zoneFilter === 'all' || driver.zone === zoneFilter) &&
          (skillFilter === 'all' || driver.skill === skillFilter)
      );
  }, [drivers, zoneFilter, skillFilter]);

  const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = eachDayOfInterval({ start, end });

  const requestsByDriverDay = requests.reduce((acc, req) => {
    const reqDays = eachDayOfInterval({ start: new Date(req.startDate), end: new Date(req.endDate) });
    for (const day of reqDays) {
        const dayKey = format(day, 'yyyy-MM-dd');
        const driverKey = `${req.driverId}-${dayKey}`;
        acc[driverKey] = req;
    }
    return acc;
  }, {} as Record<string, CampaignRequest>);

  const changeMonth = (amount: number) => {
      setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  }

  const renderView = () => {
    switch (view) {
        case 'skill':
            return <CompetenceView drivers={filteredDrivers} requests={requests} daysInMonth={daysInMonth} />;
        case 'zone':
            return <ZoneView drivers={filteredDrivers} requests={requests} daysInMonth={daysInMonth} />;
        case 'driver':
        default:
            return <DriverView drivers={filteredDrivers} requestsByDriverDay={requestsByDriverDay} daysInMonth={daysInMonth} onDriverSelect={onDriverSelect} selectedDriverId={selectedDriverId} />;
    }
  }

  return (
    <div className="h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">Planning des Chauffeurs</h2>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}><ChevronLeft/></Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4"/>
                            {format(currentMonth, "MMMM yyyy", { locale: fr })}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentMonth} onSelect={(d) => d && setCurrentMonth(d)} initialFocus/></PopoverContent>
                </Popover>
                 <Button variant="outline" size="icon" onClick={() => changeMonth(1)}><ChevronRight/></Button>
            </div>
        </div>
        <div className="p-4 border-b flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
                 <Select value={zoneFilter} onValueChange={setZoneFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrer par zone..." />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueZones.map(zone => <SelectItem key={zone} value={zone}>{zone === 'all' ? 'Toutes les zones' : zone}</SelectItem>)}
                    </SelectContent>
                </Select>
                 <Select value={skillFilter} onValueChange={setSkillFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrer par compétence..." />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueSkills.map(skill => <SelectItem key={skill} value={skill}>{skill === 'all' ? 'Toutes les compétences' : skill}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                <Button variant={view === 'driver' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('driver')}><User className="mr-2"/>Par Chauffeur</Button>
                <Button variant={view === 'skill' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('skill')}><Users className="mr-2"/>Par Compétence</Button>
                <Button variant={view === 'zone' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('zone')}><Map className="mr-2"/>Par Zone</Button>
            </div>
        </div>
        <div className="flex-grow overflow-auto">
            {renderView()}
        </div>
      </div>
    );
}
