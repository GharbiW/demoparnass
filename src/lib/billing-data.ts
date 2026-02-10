
export type ClientInvoice = {
    id: string;
    client: string;
    contractId: string;
    periodStart: string; // YYYY-MM-DD
    periodEnd: string; // YYYY-MM-DD
    amount: number;
    status: 'Brouillon' | 'Envoyée' | 'Payée' | 'En retard';
    details: { description: string, quantity: number, unitPrice: number, total: number }[];
};

// This data simulates what an AI or a batch process would generate
// based on active contracts and completed trips.
export const clientInvoices: ClientInvoice[] = [
    {
        id: 'FACT-2024-001',
        client: 'CARREFOUR',
        contractId: 'CTR-001',
        periodStart: '2024-07-01',
        periodEnd: '2024-07-31',
        amount: 25000,
        status: 'Payée',
        details: [
            { description: "Prestation Ligne Lyon-Paris", quantity: 20, unitPrice: 800, total: 16000 },
            { description: "Prestation Express Lyon-Marseille", quantity: 10, unitPrice: 900, total: 9000 },
        ]
    },
    {
        id: 'FACT-2024-002',
        client: 'AMAZON',
        contractId: 'CTR-005',
        periodStart: '2024-07-01',
        periodEnd: '2024-07-31',
        amount: 12500,
        status: 'Envoyée',
        details: [
            { description: "Prestation Caisse Mobile Nantes", quantity: 50, unitPrice: 250, total: 12500 },
        ]
    },
     {
        id: 'FACT-2024-003',
        client: 'DASSAULT',
        contractId: 'CTR-006',
        periodStart: '2024-07-01',
        periodEnd: '2024-07-31',
        amount: 8000,
        status: 'En retard',
        details: [
            { description: "Prestation Convoi Exceptionnel", quantity: 2, unitPrice: 4000, total: 8000 },
        ]
    },
     {
        id: 'FACT-2024-004',
        client: 'CARREFOUR',
        contractId: 'CTR-001',
        periodStart: '2024-08-01',
        periodEnd: '2024-08-31',
        amount: 22000,
        status: 'Brouillon',
        details: [
            { description: "Prestation Ligne Lyon-Paris", quantity: 18, unitPrice: 800, total: 14400 },
            { description: "Prestation Express Lyon-Marseille", quantity: 8, unitPrice: 900, total: 7200 },
            { description: "Prestation Frigo", quantity: 2, unitPrice: 200, total: 400 },
        ]
    },
    {
        id: 'FACT-2024-005',
        client: 'AMAZON',
        contractId: 'CTR-005',
        periodStart: '2024-08-01',
        periodEnd: '2024-08-31',
        amount: 15000,
        status: 'Brouillon',
        details: [
             { description: "Prestation Caisse Mobile Nantes", quantity: 60, unitPrice: 250, total: 15000 },
        ]
    },
];
