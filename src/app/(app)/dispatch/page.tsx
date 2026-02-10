
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Search, SlidersHorizontal } from "lucide-react";
import { TripCard } from "@/components/dispatch/trip-card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMockData } from "@/hooks/use-mock-data";
import { Trip } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DispatchPage() {
  const { trips: allTrips, vehiclesData, drivers } = useMockData();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("all");
  const [driverTypeFilter, setDriverTypeFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");


  const liveTrips = useMemo(() => allTrips.filter(t => t.status === 'in_progress'), [allTrips]);
  
  const { uniqueVehicleTypes, uniqueDriverTypes, uniqueDestinations, uniqueZones } = useMemo(() => {
    const vehicleTypes = new Set<string>();
    const driverTypes = new Set<string>();
    const destinations = new Set<string>();
    const zones = new Set<string>();

    liveTrips.forEach(trip => {
      const vehicle = vehiclesData.find(v => v.vin === trip.vin);
      if (vehicle) vehicleTypes.add(vehicle.energie);

      const driver = drivers.find(d => d.id === trip.driverId);
      if (driver?.driverType) driverTypes.add(driver.driverType);
      
      if(trip.deliveryLocation) destinations.add(trip.deliveryLocation);
      if(trip.site) zones.add(trip.site);
    });

    return {
      uniqueVehicleTypes: Array.from(vehicleTypes),
      uniqueDriverTypes: Array.from(driverTypes),
      uniqueDestinations: Array.from(destinations),
      uniqueZones: Array.from(zones),
    };
  }, [liveTrips, vehiclesData, drivers]);


  const filteredTrips = useMemo(() => {
    return liveTrips.filter(trip => {
      const vehicle = vehiclesData.find(v => v.vin === trip.vin);
      const driver = drivers.find(d => d.id === trip.driverId);
      
      const searchTermLower = searchTerm.toLowerCase();
      const searchMatch = (
        trip.id.toLowerCase().includes(searchTermLower) ||
        trip.client.toLowerCase().includes(searchTermLower) ||
        vehicle?.immatriculation.toLowerCase().includes(searchTermLower)
      );

      const vehicleTypeMatch = vehicleTypeFilter === 'all' || vehicle?.energie === vehicleTypeFilter;
      const driverTypeMatch = driverTypeFilter === 'all' || driver?.driverType === driverTypeFilter;
      const destinationMatch = destinationFilter === 'all' || trip.deliveryLocation === destinationFilter;
      const zoneMatch = zoneFilter === 'all' || trip.site === zoneFilter;

      return searchMatch && vehicleTypeMatch && driverTypeMatch && destinationMatch && zoneMatch;
    });
  }, [liveTrips, searchTerm, vehiclesData, drivers, vehicleTypeFilter, driverTypeFilter, destinationFilter, zoneFilter]);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold font-headline">Dispatch Board - Live</h1>
          <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher trajet, client, immat..." 
                    className="pl-8 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous types véhicule</SelectItem>
                    {uniqueVehicleTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={driverTypeFilter} onValueChange={setDriverTypeFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous types chauffeur</SelectItem>
                    {uniqueDriverTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Toutes destinations</SelectItem>
                    {uniqueDestinations.map(dest => <SelectItem key={dest} value={dest}>{dest}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Toutes zones</SelectItem>
                    {uniqueZones.map(zone => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}
                </SelectContent>
              </Select>
          </div>
        </div>

        <Card className="flex-grow">
          <CardContent className="p-4">
            {filteredTrips.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
                  {filteredTrips.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-16">
                  <Search className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-semibold">Aucun trajet en cours ne correspond à votre recherche</h3>
                  <p className="text-sm">Essayez de modifier vos filtres ou votre terme de recherche.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
