
"use client";

import { useState, useEffect } from 'react';
import { mockDataService } from '@/lib/mock-data-service';
import { Trip, Driver, Vehicle, Contract } from '@/lib/types';
import { vehicles as VehicleData } from '@/lib/vehicles-data';
import { driverAssignments as DriverAssignment } from '@/lib/driver-profile-data';

interface MockData {
    trips: Trip[];
    drivers: Driver[];
    vehicles: Vehicle[];
    vehiclesData: typeof VehicleData;
    driverAssignments: typeof DriverAssignment;
    contracts: Contract[];
}

// This hook allows components to subscribe to our mock data service and re-render when data changes.
export function useMockData(): MockData {
  const [data, setData] = useState<MockData>({
    trips: [],
    drivers: [],
    vehicles: [],
    vehiclesData: [],
    driverAssignments: [],
    contracts: [],
  });

  useEffect(() => {
    const updateData = () => {
      setData({
        trips: mockDataService.getTrips(),
        drivers: mockDataService.getDrivers(),
        vehicles: mockDataService.getVehicles(),
        vehiclesData: mockDataService.getVehiclesData(),
        driverAssignments: mockDataService.getDriverAssignments(),
        contracts: mockDataService.getContracts(),
      });
    };

    const unsubscribe = mockDataService.subscribe(updateData);
    updateData(); // Initial data load
    
    return unsubscribe;
  }, []);

  return data;
}
