

import type { LeaveRequest } from './types';
import { drivers } from './planning-data';

const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Generate 40 leave requests
export const leaveRequests: LeaveRequest[] = [
    // Add specific requests for Jean Dupont to test conflicts
    {
        id: 'CONGE-JDU-01',
        driverId: 'DRV-JDU-001',
        driverName: 'Jean Dupont',
        driverType: 'SPL',
        site: 'Lyon',
        startDate: '2024-08-12',
        endDate: '2024-08-25',
        status: 'En attente', // This will be handled by the "Congés Individuels" page
    },
    ...Array.from({ length: 39 }, (_, i) => {
        const driver = sample(drivers.filter(d => d.id !== 'DRV-JDU-001')); // Avoid adding more for Jean Dupont
        const startDate = randomDate(new Date(2024, 6, 1), new Date(2024, 9, 30));
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + sample([2, 4, 7, 10, 14]));
        
        let status: LeaveRequest['status'] = 'Approuvé';
        if (i < 20) {
            status = sample(['En attente', 'Rejeté']);
        }

        return {
            id: `CONGE-${String(i+1).padStart(3,'0')}`,
            driverId: driver.id,
            driverName: driver.name,
            driverType: driver.driverType || 'SPL',
            site: driver.site,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            status: status,
        };
    })
];


export const weeklyCapacity = [
    { weekNumber: 31, dateRange: "29 juil. - 4 août", capacity: 5 },
    { weekNumber: 32, dateRange: "5 août - 11 août", capacity: 4 },
    { weekNumber: 33, dateRange: "12 août - 18 août", capacity: 4 },
    { weekNumber: 34, dateRange: "19 août - 25 août", capacity: 5 },
    { weekNumber: 35, dateRange: "26 août - 1 sept.", capacity: 6 },
    { weekNumber: 36, dateRange: "2 sept. - 8 sept.", capacity: 8 },
]

export type { LeaveRequest };
