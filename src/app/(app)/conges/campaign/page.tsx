

"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyCapacityDashboard } from "@/components/vacation-campaign/weekly-capacity-dashboard";
import { DriversGrid } from "@/components/vacation-campaign/drivers-grid";
import { DriverSheet } from "@/components/vacation-campaign/driver-sheet";
import { campaignRequests as initialRequests, capacityNeeds, campaignDrivers, type CampaignDriver, type CampaignRequest } from "@/lib/vacation-campaign-data";
import { WorkforceIntelligence } from "@/components/vacation-campaign/workforce-intelligence";
import { RequestsConflictsView } from "@/components/vacation-campaign/requests-conflicts-view";
import { AnalyticsReporting } from "@/components/vacation-campaign/analytics-reporting";
import { leaveRequests as individualLeaveRequests } from "@/lib/conges-data";
import { useToast } from "@/hooks/use-toast";


export default function VacationCampaignPage() {
    const [selectedDriver, setSelectedDriver] = useState<CampaignDriver | null>(null);
    const [requests, setRequests] = useState<CampaignRequest[]>(initialRequests);
    const { toast } = useToast();

    const handleDriverSelect = (driver: CampaignDriver) => {
        // If the same driver is clicked, unselect them, otherwise select the new one.
        setSelectedDriver(prev => prev?.id === driver.id ? null : driver);
    };
    
    const handleUpdateRequestStatus = (requestId: string, status: CampaignRequest['status']) => {
        
        // When a request is approved in the campaign, instead of just changing the status,
        // we simulate adding it to the individual leave requests pool for operational validation.
        if (status === 'accepted') {
            const requestToForward = requests.find(r => r.id === requestId);
            if (requestToForward) {
                const existingIndividualRequest = individualLeaveRequests.find(ilr => ilr.driverId === requestToForward.driverId && ilr.startDate === requestToForward.startDate);
                if (!existingIndividualRequest) {
                     individualLeaveRequests.push({
                        id: `CONGE-${requestToForward.driverId.slice(-3)}-${Date.now().toString().slice(-3)}`,
                        driverId: requestToForward.driverId,
                        driverName: requestToForward.driverName,
                        driverType: requestToForward.skill,
                        site: requestToForward.site,
                        startDate: requestToForward.startDate,
                        endDate: requestToForward.endDate,
                        status: 'En attente',
                    });
                }
                toast({
                    title: "Demande pré-approuvée",
                    description: `La demande de ${requestToForward.driverName} a été envoyée pour validation opérationnelle et analyse d'impact.`,
                });
            }
        }
        
        setRequests(currentRequests => 
            currentRequests.map(req => 
                req.id === requestId ? { ...req, status } : req
            )
        );
    }
    
    const handleBatchUpdate = (updates: { requestId: string, status: CampaignRequest['status'] }[]) => {
        // Forward accepted requests to individual leave processing
        updates.forEach(update => {
            if (update.status === 'accepted') {
                const requestToForward = requests.find(r => r.id === update.requestId);
                if (requestToForward) {
                    const existing = individualLeaveRequests.find(ilr => ilr.driverId === requestToForward.driverId && ilr.startDate === requestToForward.startDate);
                    if (!existing) {
                        individualLeaveRequests.push({
                            id: `CONGE-${requestToForward.driverId.slice(-3)}-${Date.now().toString().slice(-3)}`,
                            driverId: requestToForward.driverId,
                            driverName: requestToForward.driverName,
                            driverType: requestToForward.skill,
                            site: requestToForward.site,
                            startDate: requestToForward.startDate,
                            endDate: requestToForward.endDate,
                            status: 'En attente',
                        });
                    }
                }
            }
        });

        setRequests(currentRequests => {
            const updatesMap = new Map(updates.map(u => [u.requestId, u.status]));
            return currentRequests.map(req => {
                const newStatus = updatesMap.get(req.id);
                return newStatus ? { ...req, status: newStatus } : req;
            });
        });
    }
    
    const handleSimulationRun = (updatedRequests: CampaignRequest[]) => {
        setRequests(updatedRequests);
    }

    const selectedDriverRequests = requests.filter(r => r.driverId === selectedDriver?.id);

    return (
        <div className="flex flex-col h-full space-y-4">
            <h1 className="text-2xl font-bold font-headline">Campagne de Congés Été 2025</h1>
            
            <Tabs defaultValue="dashboard" className="flex-grow flex flex-col">
                <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
                    <TabsTrigger value="planning">Planning Chauffeurs</TabsTrigger>
                    <TabsTrigger value="requests">Toutes les Demandes</TabsTrigger>
                    <TabsTrigger value="intelligence">Intelligence & Prévisions (IA)</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics & Reporting</TabsTrigger>
                </TabsList>
                
                <TabsContent value="dashboard" className="mt-4 flex-grow">
                     <Card>
                        <CardHeader>
                            <CardTitle>Synthèse des Capacités</CardTitle>
                            <CardDescription>Analyse de la charge et de la capacité par semaine, site et compétence.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <WeeklyCapacityDashboard 
                                capacityNeeds={capacityNeeds}
                                requests={requests}
                                onUpdateRequest={handleUpdateRequestStatus}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="planning" className="mt-4 flex-grow">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
                        <div className={selectedDriver ? "lg:col-span-2 h-full" : "lg:col-span-3 h-full"}>
                            <DriversGrid 
                                drivers={campaignDrivers}
                                requests={requests}
                                onDriverSelect={handleDriverSelect}
                                selectedDriverId={selectedDriver?.id}
                            />
                        </div>

                        {selectedDriver && (
                            <div className="lg:col-span-1 h-full">
                                <DriverSheet 
                                    driver={selectedDriver}
                                    requests={selectedDriverRequests}
                                    onClose={() => setSelectedDriver(null)}
                                    onUpdateRequest={handleUpdateRequestStatus}
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="requests" className="mt-4 flex-grow">
                    <RequestsConflictsView
                        requests={requests}
                        capacityNeeds={capacityNeeds}
                        onRunSimulation={handleSimulationRun}
                        onSelectDriver={(driverId) => {
                            const driver = campaignDrivers.find(d => d.id === driverId);
                            if (driver) {
                                setSelectedDriver(driver);
                                // You might want to switch to the 'planning' tab here
                            }
                        }}
                    />
                </TabsContent>
                 <TabsContent value="intelligence" className="mt-4 flex-grow">
                   <WorkforceIntelligence 
                        drivers={campaignDrivers} 
                        capacityNeeds={capacityNeeds} 
                        requests={requests}
                        onBatchUpdate={handleBatchUpdate}
                    />
                </TabsContent>
                 <TabsContent value="analytics" className="mt-4 flex-grow">
                   <AnalyticsReporting 
                        drivers={campaignDrivers}
                        requests={requests}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}