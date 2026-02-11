
"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignRequest, CapacityNeed } from "@/lib/vacation-campaign-data";
import { RequestsListDialog } from "./requests-list-dialog";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";

interface WeeklyCapacityDashboardProps {
  capacityNeeds: CapacityNeed[];
  requests: CampaignRequest[];
  onUpdateRequest: (requestId: string, status: CampaignRequest['status']) => void;
}

const getWeekNumber = (d: Date): number => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

const getDeltaClass = (delta: number) => {
    if (delta < 0) return 'bg-destructive/20 text-destructive-foreground';
    if (delta <= 2) return 'bg-amber-500/20 text-amber-700';
    return ''; // Default is fine for positive
}

const getDeltaCardClass = (delta: number) => {
    if (delta < 0) return 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20';
    if (delta <= 2) return 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20';
    return 'bg-muted/50 hover:bg-muted';
}


export function WeeklyCapacityDashboard({ capacityNeeds, requests, onUpdateRequest }: WeeklyCapacityDashboardProps) {
    const [selectedRequests, setSelectedRequests] = useState<CampaignRequest[] | null>(null);
    const [dialogTitle, setDialogTitle] = useState("");
    const [currentCapacity, setCurrentCapacity] = useState(0);
    const [zoneFilter, setZoneFilter] = useState('all');
    const [skillFilter, setSkillFilter] = useState('all');

    const uniqueZones = useMemo(() => ['all', ...Array.from(new Set(capacityNeeds.map(n => n.zone)))], [capacityNeeds]);
    const uniqueSkills = useMemo(() => ['all', ...Array.from(new Set(capacityNeeds.map(n => n.skill)))], [capacityNeeds]);

    const handleOpenDialog = (item: any) => {
        setSelectedRequests(item.requests);
        setCurrentCapacity(item.capacity);
        setDialogTitle(`Demandes pour S${item.week} - ${item.zone} - ${item.skill}`);
    }

    const processData = useMemo(() => {
        return capacityNeeds
            .filter(need => 
                (zoneFilter === 'all' || need.zone === zoneFilter) &&
                (skillFilter === 'all' || need.skill === skillFilter)
            )
            .map(need => {
                const relevantRequests = requests.filter(r => {
                    const startWeek = getWeekNumber(new Date(r.startDate));
                    const endWeek = getWeekNumber(new Date(r.endDate));
                    return r.zone === need.zone && r.skill === need.skill && startWeek <= need.week && endWeek >= need.week;
                });

                const totalRequested = relevantRequests.length;
                const validatedCount = relevantRequests.filter(r => r.status === 'accepted').length;
                const delta = need.capacity - validatedCount;
                
                return { ...need, validatedCount, delta, totalRequested, requests: relevantRequests };
            });
    }, [capacityNeeds, requests, zoneFilter, skillFilter]);


    return (
        <>
            <RequestsListDialog 
                open={!!selectedRequests}
                onOpenChange={() => setSelectedRequests(null)}
                requests={selectedRequests || []}
                title={dialogTitle}
                capacity={currentCapacity}
                onUpdateRequest={onUpdateRequest}
            />

            <div className="flex justify-start items-center gap-2 mb-4">
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

            <Tabs defaultValue="grid">
                <TabsList>
                    <TabsTrigger value="grid">Vue Visuelle</TabsTrigger>
                    <TabsTrigger value="table">Vue Tableau</TabsTrigger>
                </TabsList>
                <TabsContent value="grid" className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {processData.map((item, index) => (
                             <Card key={index} className={cn("cursor-pointer transition-colors", getDeltaCardClass(item.delta))} onClick={() => handleOpenDialog(item)}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold">S{item.week}</p>
                                            <p className="text-xs">{item.zone}</p>
                                            <Badge variant="outline" className="mt-1">{item.skill}</Badge>
                                        </div>
                                        <div className={cn("text-right")}>
                                            <p className="text-3xl font-bold">{item.delta}</p>
                                            <p className="text-xs text-muted-foreground">Marge</p>
                                        </div>
                                    </div>
                                    <div className="text-xs mt-4 grid grid-cols-2 gap-x-2 gap-y-1">
                                         <span>Capacité:</span><span className="font-semibold text-right">{item.capacity}</span>
                                         <span>Validés:</span><span className="font-semibold text-right">{item.validatedCount}</span>
                                         <span>Demandes:</span><span className="font-semibold text-right">{item.totalRequested}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="table" className="mt-4">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Semaine</TableHead>
                                <TableHead>Zone</TableHead>
                                <TableHead>Compétence</TableHead>
                                <TableHead className="text-center">Besoin Min.</TableHead>
                                <TableHead className="text-center">Capacité Congés</TableHead>
                                <TableHead className="text-center">Demandes</TableHead>
                                <TableHead className="text-center">Validés</TableHead>
                                <TableHead className="text-center">Marge</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processData.map((item, index) => (
                                <TableRow key={index} className={cn(getDeltaClass(item.delta))}>
                                    <TableCell className="font-semibold">S{item.week}</TableCell>
                                    <TableCell>{item.zone}</TableCell>
                                    <TableCell><Badge variant="outline">{item.skill}</Badge></TableCell>
                                    <TableCell className="text-center">{item.minRequired}</TableCell>
                                    <TableCell className="text-center font-bold">{item.capacity}</TableCell>
                                    <TableCell className="text-center">
                                        <Button 
                                            variant="link" 
                                            className="font-bold p-0 h-auto"
                                            onClick={() => handleOpenDialog(item)}
                                            disabled={item.totalRequested === 0}
                                        >
                                            {item.totalRequested}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-center font-bold">{item.validatedCount}</TableCell>
                                    <TableCell className={cn("text-center font-bold text-lg")}>{item.delta}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
}
