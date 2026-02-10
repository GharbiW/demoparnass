
export type FuelTransaction = {
  id: string;
  date: string;
  vin: string;
  card: string;
  station: string;
  litres: number;
  pricePerLitre: number;
  amount: number;
};

export const fuelTransactions: FuelTransaction[] = [
  { id: 'TXN001', date: '2024-07-30 08:15', vin: 'VIN-ABC-123', card: '**** **** **** 1234', station: 'AS24 Lyon Corbas', litres: 150, pricePerLitre: 1.75, amount: 262.50 },
  { id: 'TXN002', date: '2024-07-30 09:45', vin: 'VIN-DEF-456', card: '**** **** **** 5678', station: 'TotalEnergies A7 Aire de Montélimar', litres: 220, pricePerLitre: 1.82, amount: 400.40 },
  { id: 'TXN003', date: '2024-07-29 22:10', vin: 'VIN-JKL-101', card: '**** **** **** 9012', station: 'Shell Paris Porte de la Chapelle', litres: 180, pricePerLitre: 1.88, amount: 338.40 },
  { id: 'TXN004', date: '2024-07-29 18:30', vin: 'VIN-GHI-789', card: '**** **** **** 3456', station: 'BP Nantes Porte de la Beaujoire', litres: 80, pricePerLitre: 1.79, amount: 143.20 },
];

export type FuelException = {
    id: string;
    date: string;
    vin: string;
    type: string;
    description: string;
    severity: 'Haute' | 'Moyenne' | 'Basse';
};

export const fuelExceptions: FuelException[] = [
    { id: 'EX001', date: '2024-07-29 22:10', vin: 'VIN-JKL-101', type: 'Prise nocturne', description: 'Transaction entre 22h et 5h', severity: 'Moyenne' },
    { id: 'EX002', date: '2024-07-28 14:00', vin: 'VIN-ABC-123', type: 'Sur-remplissage', description: 'Volume > 20% capacité réservoir', severity: 'Haute' },
    { id: 'EX003', date: '2024-07-28 11:00', vin: 'VIN-DEF-456', type: 'Hors-route', description: 'Station à 50km+ du trajet prévu', severity: 'Haute' },
];

export type FuelCard = {
    id: string;
    provider: 'AS24' | 'TotalEnergies' | 'Shell';
    assignedVin: string | null;
    status: 'Active' | 'Verrouillée';
    lastUsed: string;
}

export const fuelCards: FuelCard[] = [
    { id: 'AS24-A01B', provider: 'AS24', assignedVin: 'VIN-ABC-123', status: 'Active', lastUsed: '2024-07-30' },
    { id: 'TOTAL-C02D', provider: 'TotalEnergies', assignedVin: 'VIN-DEF-456', status: 'Active', lastUsed: '2024-07-30' },
    { id: 'SHELL-E03F', provider: 'Shell', assignedVin: 'VIN-JKL-101', status: 'Verrouillée', lastUsed: '2024-07-29' },
    { id: 'AS24-G04H', provider: 'AS24', assignedVin: null, status: 'Active', lastUsed: 'N/A' },
]
