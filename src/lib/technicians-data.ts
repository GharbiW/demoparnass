
export type Technician = {
    id: string;
    name: string;
    site: string;
    status: 'Actif' | 'En Pause' | 'En Intervention';
    email: string;
    phone: string;
    skills: string[];
    certifications: string[];
    avgRepairTime: number; // in hours
    successRate: number; // percentage
};

export const technicians: Technician[] = [
    {
        id: "TECH-ADI-001",
        name: "Adrien Dubois",
        site: "Lyon",
        status: "Actif",
        email: "adrien.dubois@example.com",
        phone: "06 11 22 33 44",
        skills: ["Moteur Diesel", "Systèmes hydrauliques", "Électronique embarquée"],
        certifications: ["IVECO Master Tech", "BOSCH Injection"],
        avgRepairTime: 3.5,
        successRate: 98,
    },
    {
        id: "TECH-BMA-002",
        name: "Béatrice Martin",
        site: "Paris",
        status: "En Intervention",
        email: "beatrice.martin@example.com",
        phone: "06 55 66 77 88",
        skills: ["Réfrigération (Reefer)", "Pneumatique", "Transmission"],
        certifications: ["Carrier Certified", "Thermo King Certified"],
        avgRepairTime: 4.2,
        successRate: 95,
    },
    {
        id: "TECH-CLE-003",
        name: "Cédric Leroy",
        site: "Lyon",
        status: "Actif",
        email: "cedric.leroy@example.com",
        phone: "07 99 88 77 66",
        skills: ["Diagnostic électronique", "MAN & Scania", "GNC/GNL"],
        certifications: ["MAN CATS II", "Scania Diagnos"],
        avgRepairTime: 2.8,
        successRate: 99,
    },
];

export const workOrders = [
    { id: "WO-2024-050", ticketId: "TICKET-003", technicianId: "TECH-BMA-002", vehicle: "VIN-JKL-101", task: "Diagnostiquer et réparer la panne moteur.", status: "En cours", estimatedHours: 8, actualHours: 6 },
    { id: "WO-2024-049", ticketId: "TICKET-001", technicianId: "TECH-ADI-001", vehicle: "VIN-ABC-123", task: "Remplacer le capteur NOx.", status: "Terminé", estimatedHours: 2, actualHours: 1.5 },
];
