

import { vehicles as demoVehicles } from './planning-data'; // This will cause a circular dependency, so we'll have to be careful

export type Vehicle = {
  immatriculation: string;
  vin: string;
  site: string;
  marque: string;
  modele: string;
  energie: 'Diesel' | 'Gaz' | 'Électrique';
  kilometrage: number;
  statut: 'Disponible' | 'En mission' | 'En maintenance' | 'En panne';
  prochainService: string;
  tpmsAlert: boolean;
  dtcAlert: boolean;
  dtcCodes?: string[];
};

const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Generate 30 unique vehicles
export const vehicles: Vehicle[] = Array.from({ length: 30 }, (_, i) => {
    const vin = `VIN-DEMO-${String(i+1).padStart(3, '0')}`;
    const immatriculation = `XY-${String(i+1).padStart(3, '0')}-ZZ`;
    const site = sample(['Lyon', 'Paris', 'Marseille', 'Nantes', 'Lille', 'Bordeaux']);
    const energie = sample(['Diesel', 'Gaz', 'Électrique']);
    const statut = sample(['Disponible', 'En mission', 'En maintenance', 'En panne']);
    const dtcAlert = Math.random() > 0.7;

    return {
        immatriculation,
        vin,
        site,
        marque: sample(['IVECO', 'SCANIA', 'VOLVO', 'MAN', 'RENAULT']),
        modele: sample(['S-Way', 'R 450', 'FH', 'TGX', 'T-High']),
        energie,
        kilometrage: Math.floor(Math.random() * 600000) + 5000,
        statut,
        prochainService: `Dans ${Math.floor(Math.random() * 20000)} km`,
        tpmsAlert: Math.random() > 0.8,
        dtcAlert,
        dtcCodes: dtcAlert ? [`P0${Math.floor(Math.random()*900)+100}`] : [],
    }
});


export const vehicleAssignments = [
    { id: 'VA-01', vin: 'VIN-DEMO-001', driverId: 'DRV-JDU-001', driverName: 'Jean Dupont', from: '2024-07-15', to: '2024-07-30', status: 'Terminé' },
    { id: 'VA-02', vin: 'VIN-DEMO-001', driverId: 'DRV-MDU-002', driverName: 'Marie Dubois', from: '2024-08-01', to: null, status: 'Actif' },
    { id: 'VA-03', vin: 'VIN-DEMO-002', driverId: 'DRV-PMA-003', driverName: 'Paul Martin', from: '2024-07-20', to: null, status: 'Actif' },
];

// Generate 20 maintenance tickets
export const maintenanceTickets = Array.from({ length: 20 }, (_, i) => {
    const vehicle = sample(vehicles);
    return {
        id: `TICKET-${String(i+1).padStart(3, '0')}`,
        vin: vehicle.vin,
        type: sample(['Correctif', 'Préventif', 'Amélioration']),
        priority: sample(['Critique', 'Haute', 'Moyenne', 'Basse']),
        status: sample(['Ouvert', 'En cours', 'Planifié', 'Fermé']),
        description: sample(['Vérification freins', 'Changement pneu AVG', 'Panne moteur', 'Réparation fuite huile', 'Service des 100 000 km']),
        createdAt: new Date(new Date().getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-CA')
    }
});


export const inspectionHistory = Array.from({ length: 25 }, (_, i) => {
    const vehicle = sample(vehicles);
    return {
        id: `INSP-V${String(i+1).padStart(3,'0')}`,
        vin: vehicle.vin,
        tripId: `TRIP-DEMO-${String(Math.floor(Math.random() * 100) + 1).padStart(4,'0')}`,
        type: sample(['Pré-trajet', 'Post-trajet']),
        date: new Date(new Date().getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000).toLocaleString('fr-CA'),
        result: sample(['OK', 'Dommage détecté', 'OK', 'OK']), // Skew towards OK
    }
});
