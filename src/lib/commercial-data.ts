

export type Contract = {
  id: string;
  client: string;
  originSite: string;
  destinationSite: string;
  daysOfWeek: string[];
  departureTime: string;
  arrivalTime: string;
  vehicleType: 'Semi-remorque' | 'Caisse mobile' | 'Frigo' | 'ADR' | 'VUL';
  driverSkills: ('ADR' | 'Aéroportuaire' | 'Habilitation sûreté')[];
  contractStart: string;
  contractEnd: string;
  isSuspended: boolean;
  suspensionPeriods?: { start: string; end: string }[];
};

const clients = [
    'CARREFOUR', 'LECLERC', 'INTERMARCHE', 'SYSTEME U', 'AMAZON', 'DASSAULT', 
    'MICHELIN', 'NESTLE', 'SANOFI', 'LACTALIS', 'DANONE', 'AIRBUS', 
    'LVMH', 'PROCTER & GAMBLE', 'SAFRAN', 'SODEXO', 'L\'OREAL', 'TOTALENERGIES',
    'GEODIS', 'SCHNEIDER ELECTRIC'
];

const sites = ["Lyon", "Paris", "Marseille", "Nantes", "Lille", "Bordeaux", "Strasbourg", "Toulouse"];
const vehicleTypes: Contract['vehicleType'][] = ['Semi-remorque', 'Caisse mobile', 'Frigo', 'ADR', 'VUL'];
const skills: Contract['driverSkills'][0][] = ['ADR', 'Aéroportuaire', 'Habilitation sûreté'];
const days = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Generate 50 Contracts for 20 Clients
export const contracts: Contract[] = Array.from({ length: 50 }, (_, i) => {
    const client = clients[i % 20];
    const origin = sample(sites);
    let destination = sample(sites);
    while (destination === origin) {
        destination = sample(sites);
    }
    const startDate = randomDate(new Date(2023, 0, 1), new Date(2024, 6, 1));
    const endDate = randomDate(new Date(2025, 0, 1), new Date(2027, 11, 31));

    return {
        id: `CTR-${String(i + 1).padStart(3, '0')}`,
        client,
        originSite: `${origin} Hub`,
        destinationSite: `${destination} Plateforme`,
        daysOfWeek: Array.from({ length: sample([1,2,3,4,5,6,7]) }, () => sample(days)).filter((v,i,a) => a.indexOf(v) === i),
        departureTime: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${sample(['00', '15', '30', '45'])}`,
        arrivalTime: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${sample(['00', '15', '30', '45'])}`,
        vehicleType: sample(vehicleTypes),
        driverSkills: Math.random() > 0.7 ? [sample(skills)] : [],
        contractStart: startDate.toISOString().split('T')[0],
        contractEnd: endDate.toISOString().split('T')[0],
        // Make 10 contracts un-suspended for the "prestations à planifier" page
        isSuspended: i >= 10, 
    };
});
