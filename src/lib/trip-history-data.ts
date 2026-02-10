

export type PastTrip = {
    id: string;
    date: string;
    client: string;
    status: 'Terminé';
    startLocation: string;
    endLocation: string;
    startTime: string;
    endTime: string;
    duration: string;
    vehicle: string;
    inspections: {
        pre: { status: 'OK' | 'Non effectuée', thumbnailUrl: string },
        post: { status: 'OK' | 'Dommage détecté' | 'Non effectuée', thumbnailUrl: string }
    },
    anomalies: { id: string, description: string }[],
    expenses: { id: string, type: string, amount: number }[]
};

const inspectionImageUrl = "https://media.licdn.com/dms/image/v2/C5622AQFde6R2BUGGZA/feedshare-shrink_1280/feedshare-shrink_1280/0/1679397203426?e=1763596800&v=beta&t=UcBsOkR54WeG99_s18x4WnFCk-kYiNLV2hy6UnsR3SU";

export const pastTrips: PastTrip[] = [
  { 
    id: "LGN-789", 
    date: "30-07-2024", 
    client: "SYSTEME U", 
    status: "Terminé",
    startLocation: "Entrepôt Corbas",
    endLocation: "Plateforme Mâcon",
    startTime: "05:10",
    endTime: "14:30",
    duration: "9h 20m",
    vehicle: "AB-123-CD",
    inspections: {
        pre: { status: 'OK', thumbnailUrl: inspectionImageUrl },
        post: { status: 'OK', thumbnailUrl: inspectionImageUrl },
    },
    anomalies: [],
    expenses: [
        { id: 'EXP-005', type: 'Péage', amount: 45.50 },
        { id: 'EXP-006', type: 'Carburant', amount: 180.25 },
    ]
  },
  { 
    id: "LGN-788", 
    date: "29-07-2024", 
    client: "CARREFOUR", 
    status: "Terminé",
    startLocation: "Entrepôt Vénissieux",
    endLocation: "Plateforme Lyon Nord",
    startTime: "04:00",
    endTime: "13:45",
    duration: "9h 45m",
    vehicle: "AB-123-CD",
    inspections: {
        pre: { status: 'OK', thumbnailUrl: inspectionImageUrl },
        post: { status: 'Dommage détecté', thumbnailUrl: inspectionImageUrl },
    },
    anomalies: [
        { id: 'ANOM-010', description: 'Rétroviseur droit éraflé au déchargement.'}
    ],
    expenses: []
  },
  { 
    id: "LGN-787", 
    date: "28-07-2024", 
    client: "LECLERC", 
    status: "Terminé",
    startLocation: "Port de Lyon",
    endLocation: "Entrepôt St-Priest",
    startTime: "06:30",
    endTime: "15:00",
    duration: "8h 30m",
    vehicle: "DE-456-FG",
    inspections: {
        pre: { status: 'OK', thumbnailUrl: inspectionImageUrl },
        post: { status: 'OK', thumbnailUrl: inspectionImageUrl },
    },
    anomalies: [],
    expenses: [
        { id: 'EXP-004', type: 'Parking', amount: 15.00 },
    ]
  },
];
