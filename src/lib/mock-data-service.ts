
// A simple in-memory data store with a basic event emitter to simulate a reactive data source.
// This allows different components to react to data changes.

import { trips as initialTrips, drivers as initialDrivers, vehicles as initialVehicles } from '@/lib/planning-data';
import { vehicles as initialVehiclesData } from '@/lib/vehicles-data';
import { driverAssignments as initialDriverAssignments } from './driver-profile-data';
import { Trip, Contract } from './types';
import { contracts as initialContracts } from './commercial-data';


// Deep copy to prevent direct mutation of original mock data
let trips: Trip[] = JSON.parse(JSON.stringify(initialTrips));
let drivers = JSON.parse(JSON.stringify(initialDrivers));
let vehicles = JSON.parse(JSON.stringify(initialVehicles));
let vehiclesData = JSON.parse(JSON.stringify(initialVehiclesData));
let driverAssignments = JSON.parse(JSON.stringify(initialDriverAssignments));
let contracts: Contract[] = JSON.parse(JSON.stringify(initialContracts));


type ChangeListener = () => void;
const listeners = new Set<ChangeListener>();

const emitChange = () => {
  listeners.forEach(listener => listener());
};

export const mockDataService = {
  getTrips: () => trips,
  getDrivers: () => drivers,
  getVehicles: () => vehicles,
  getVehiclesData: () => vehiclesData,
  getDriverAssignments: () => driverAssignments,
  getContracts: () => contracts,

  addTrip: (newTrip: any) => {
    trips.push(newTrip);

    // Update vehicle status
    const vehicle = vehiclesData.find((v: any) => v.vin === newTrip.vin);
    if (vehicle) {
      vehicle.statut = 'En mission';
    }
    const planningVehicle = vehicles.find((v: any) => v.vin === newTrip.vin);
    if(planningVehicle) {
        planningVehicle.status = 'En mission';
    }

    // Update driver status and assignments
    const driver = drivers.find((d: any) => d.id === newTrip.driverId);
    if (driver) {
      driver.status = 'Actif';
      const newAssignment = {
        id: `AS-${Date.now().toString().slice(-4)}`,
        vehicle: vehicle?.immatriculation || newTrip.vin,
        from: new Date(newTrip.plannedStart).toLocaleDateString('fr-CA'),
        to: null,
        status: 'Actif'
      };
      driverAssignments.push(newAssignment);
    }
    
    emitChange();
  },

  addContract: (newContract: Contract) => {
    contracts.push(newContract);
    emitChange();
  },
  
  subscribe: (listener: ChangeListener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
