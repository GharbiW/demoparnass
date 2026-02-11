

import { Trip, Vehicle, Driver } from './types';
import { vehicles as allVehicleDetails } from './vehicles-data';
import { format } from 'date-fns';

const sites = ["Lyon", "Paris", "Marseille", "Nantes", "Lille", "Bordeaux", "Strasbourg", "Toulouse", "Nice", "Rennes", "Montpellier"];
const clients = [
    'CARREFOUR', 'LECLERC', 'INTERMARCHE', 'SYSTEME U', 'AMAZON', 'DASSAULT', 
    'MICHELIN', 'NESTLE', 'SANOFI', 'LACTALIS', 'DANONE', 'AIRBUS', 
    'LVMH', 'PROCTER & GAMBLE', 'SAFRAN', 'SODEXO', 'L\'OREAL', 'TOTALENERGIES',
    'GEODIS', 'SCHNEIDER ELECTRIC'
];

const locations = {
    "Lyon": ["Entrepôt Vénissieux", "Plateforme Lyon Nord", "Port de Lyon"],
    "Paris": ["Entrepôt St-Quentin", "Plateforme Paris Sud", "CDG Hub"],
    "Marseille": ["Port de Marseille", "Entrepôt Avignon", "Plateforme Miramas"],
    "Nantes": ["Entrepôt Nantes", "Plateforme Rennes", "Port de St-Nazaire"],
    "Lille": ["Entrepôt Lesquin", "Plateforme Dourges", "Port de Dunkerque"],
    "Bordeaux": ["Site de Mérignac", "Aéroport de Blagnac", "Port de Bordeaux"],
    "Strasbourg": ["Port de Strasbourg", "Entrepôt Reichstett"],
    "Toulouse": ["Plateforme logistique Eurocentre", "Aéroport de Blagnac"],
    "Nice": ["Aéroport Nice Côte d'Azur", "Marché d'Intérêt National"],
    "Rennes": ["Plateforme Logistique Rennes"],
    "Montpellier": ["Garosud", "Port de Sète"],
}

const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// === DRIVERS ===
export const drivers: Driver[] = [
    { id: 'DRV-JDU-001', name: 'Jean Dupont', site: 'Lyon', status: 'Actif', driverType: 'SPL', phone: '0612345678', truck: 'TRK-001', scoreSecurite: 95, scoreEco: 88 },
    { id: 'DRV-MDU-002', name: 'Marie Dubois', site: 'Paris', status: 'Actif', driverType: 'CM', phone: '0623456789', truck: 'TRK-002', scoreSecurite: 92, scoreEco: 91 },
    { id: 'DRV-PMA-003', name: 'Paul Martin', site: 'Marseille', status: 'Actif', driverType: 'CM', phone: '0634567890', truck: 'TRK-003', scoreSecurite: 88, scoreEco: 85 },
    { id: 'DRV-SBE-004', name: 'Sophie Bernard', site: 'Paris', status: 'Actif', driverType: 'Polyvalent', phone: '0645678901', truck: 'TRK-004', scoreSecurite: 98, scoreEco: 94 },
    { id: 'DRV-LLE-005', name: 'Luc Lefevre', site: 'Lille', status: 'En repos', driverType: 'SPL', phone: '0656789012', truck: 'TRK-005', scoreSecurite: 90, scoreEco: 90 },
    ...Array.from({ length: 95 }, (_, i) => {
        const id = `DRV-DEMO-${String(i+6).padStart(3, '0')}`;
        const site = sample(sites);
        return {
            id,
            name: `Chauffeur ${i + 6}`,
            site,
            status: sample(['Actif', 'En repos', 'En congé'] as const),
            driverType: sample(['CM', 'Polyvalent', 'SPL', 'VL'] as const),
            phone: `06 ${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
            truck: `TRK-${String(i+6).padStart(3, '0')}`,
            scoreSecurite: Math.floor(Math.random() * 30) + 70,
            scoreEco: Math.floor(Math.random() * 30) + 70,
        }
    })
];


// === VEHICLES (for planning) ===
// We link this to the detailed vehicle data to ensure consistency.
export const vehicles: Vehicle[] = allVehicleDetails.map(v => ({
    immatriculation: v.immatriculation,
    vin: v.vin,
    site: v.site,
    status: v.statut,
}));


// === TRIPS (100) ===
let tripsData: Trip[] = Array.from({ length: 100 }, (_, i) => {
    const driver = sample(drivers);
    const vehicle = sample(vehicles);
    const site = sample(sites);
    const startLocations = locations[site as keyof typeof locations];
    
    const otherSites = sites.filter(s => s !== site);
    const endSite = sample(otherSites);
    const endLocations = endSite ? locations[endSite as keyof typeof locations] : [];

    const now = new Date();
    const startDate = randomDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
    startDate.setMinutes(sample([0, 15, 30, 45]));
    startDate.setSeconds(0);

    const isRelayTrip = i % 10 === 0; // Make 10% of trips relay trips
    const tripDurationHours = isRelayTrip ? 12 : Math.floor(Math.random() * 8) + 2;
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + tripDurationHours);

    let status: Trip['status'] = 'planned';
    if (startDate < now && endDate > now) {
        status = 'in_progress';
    } else if (endDate < now) {
        status = 'completed';
    }
    // Add some conflicts
    if (i % 15 === 0) status = 'conflict';

    const isHautLePied = Math.random() > 0.9;

    let slaStatus: Trip['slaStatus'] = 'on_time';
    if (status === 'in_progress') {
        const rand = Math.random();
        if (rand < 0.2) slaStatus = 'late';
        else if (rand < 0.5) slaStatus = 'at_risk';
    }

    let driver2Id: string | undefined = undefined;
    let relayPoint: string | undefined = undefined;
    if (isRelayTrip) {
        const driver2 = sample(drivers.filter(d => d.id !== driver.id));
        driver2Id = driver2.id;
        relayPoint = `Aire de ${sample(['Beaune', 'Montélimar', 'Nemours', 'Lançon-Provence'])}`;
    }

    return {
        id: `TRIP-DEMO-${String(i+1).padStart(4, '0')}`,
        client: isHautLePied ? 'Interne' : sample(clients),
        pickupLocation: isHautLePied ? `Garage ${site}` : sample(startLocations),
        deliveryLocation: isHautLePied ? sample(startLocations) : sample(endLocations),
        plannedStart: startDate.toISOString(),
        plannedEnd: endDate.toISOString(),
        actualStart: status !== 'planned' ? new Date(startDate.getTime() + (Math.random() - 0.2) * 30 * 60000).toISOString() : undefined,
        actualEnd: status === 'completed' ? new Date(endDate.getTime() + (Math.random() - 0.3) * 60 * 60000).toISOString() : undefined,
        vin: vehicle.vin,
        driverId: driver.id,
        driver2Id: driver2Id,
        relayPoint: relayPoint,
        status: status,
        type: isHautLePied ? 'haut_le_pied' : sample(['ligne', 'express']),
        site: site,
        eta: status === 'in_progress' ? format(new Date(endDate.getTime() + (Math.random() - 0.5) * 60 * 60000), 'HH:mm') : undefined,
        slaStatus: slaStatus,
        riskEta: status === 'in_progress' ? Math.floor(Math.random() * 90) : undefined,
        isColdChain: Math.random() > 0.7,
        isAdr: Math.random() > 0.9,
        coldChainSetpoint: Math.random() > 0.7 ? 4 : undefined,
        hosRemainingMin: Math.floor(Math.random() * 400) + 60, // 1 to 7.6 hours
    };
});

// Add a specific conflicting trip for Jean Dupont for demo purposes
tripsData.push({
    id: "TRIP-CONFLICT-01",
    client: "SANOFI",
    pickupLocation: "Lyon Hub",
    deliveryLocation: "Genève Hub",
    plannedStart: "2024-08-14T08:00:00.000Z", // This is during his leave request
    plannedEnd: "2024-08-14T16:00:00.000Z",
    vin: "VIN-DEMO-025",
    driverId: "DRV-JDU-001",
    status: 'planned',
    type: 'express',
    site: 'Lyon',
    isAdr: true,
});

export const trips: Trip[] = tripsData;


// This is here to support trip-card component which still uses the old trip type
// TODO: Refactor trip-card and remove this
export const allTrips = trips.map(t => ({...t}));
