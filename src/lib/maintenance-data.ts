
export type MaintenanceEvent = {
    id: string;
    date: string;
    vehicle: string;
    description: string;
    status: 'Terminé' | 'En cours';
};

export const maintenanceHistory: MaintenanceEvent[] = [
    { id: 'MAINT-001', date: '2024-07-15', vehicle: 'AB-123-CD', description: 'Remplacement pneu avant droit', status: 'Terminé' },
    { id: 'MAINT-002', date: '2024-06-20', vehicle: 'AB-123-CD', description: 'Service des 100 000 km', status: 'Terminé' },
    { id: 'MAINT-003', date: '2024-05-10', vehicle: 'DE-456-FG', description: 'Réparation fuite huile moteur', status: 'Terminé' },
];
