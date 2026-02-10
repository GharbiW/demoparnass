
export type Invoice = {
    id: string;
    date: string;
    driverId: string;
    driverName: string;
    tripId: string;
    category: 'Carburant' | 'Péage' | 'Parking' | 'Restaurant' | 'Autre';
    amount: number;
    status: 'En attente' | 'Approuvé' | 'Rejeté';
    receiptUrl?: string;
};

export const invoices: Invoice[] = [
    {
        id: 'INV-001',
        date: '2024-07-31',
        driverId: 'DRV-JDU-001',
        driverName: 'Jean Dupont',
        tripId: 'LGN-003',
        category: 'Carburant',
        amount: 250.75,
        status: 'En attente',
    },
    {
        id: 'INV-002',
        date: '2024-07-30',
        driverId: 'DRV-MDU-002',
        driverName: 'Marie Dubois',
        tripId: 'LGN-002',
        category: 'Péage',
        amount: 85.50,
        status: 'Approuvé',
    },
    {
        id: 'INV-003',
        date: '2024-07-29',
        driverId: 'DRV-PMA-003',
        driverName: 'Paul Martin',
        tripId: 'LGN-001',
        category: 'Restaurant',
        amount: 18.90,
        status: 'Approuvé',
    },
    {
        id: 'INV-004',
        date: '2024-07-28',
        driverId: 'DRV-JDU-001',
        driverName: 'Jean Dupont',
        tripId: 'LGN-002',
        category: 'Parking',
        amount: 25.00,
        status: 'Rejeté',
    },
        {
        id: 'INV-005',
        date: '2024-08-01',
        driverId: 'DRV-SBE-004',
        driverName: 'Sophie Bernard',
        tripId: 'EXP-101',
        category: 'Autre',
        amount: 12.30,
        status: 'En attente',
    },
];
