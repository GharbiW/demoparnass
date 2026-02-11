"use client";

import { useState } from "react";
import { UnassignedRideTable } from "@/components/planning/unassigned-ride-table";
import { UnassignedRideDrawer } from "@/components/planning/unassigned-ride-drawer";
import { UnassignedFilter } from "@/components/planning/unassigned-filter";
import { mockUnassignedRides, UnassignedRide } from "@/lib/data/unassigned-rides";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UnassignedFilter as FilterComponent } from "@/components/planning/unassigned-filter";

export default function UnassignedRidesPage() {
    const [selectedRide, setSelectedRide] = useState<UnassignedRide | null>(null);
    const [search, setSearch] = useState("");

    const filteredRides = mockUnassignedRides.filter(ride =>
        ride.client.toLowerCase().includes(search.toLowerCase()) ||
        ride.ref.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <UnassignedRideDrawer
                ride={selectedRide}
                open={!!selectedRide}
                onOpenChange={(open) => {
                    if (!open) setSelectedRide(null);
                }}
            />

            <div className="flex flex-col h-full space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-bold font-headline">A Placer</h1>
                        <p className="text-muted-foreground text-sm">Gérez les prestations qui nécessitent une intervention manuelle.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle>Liste des prestations</CardTitle>
                        <FilterComponent search={search} setSearch={setSearch} />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <UnassignedRideTable
                            rides={filteredRides}
                            onSelectRide={setSelectedRide}
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
