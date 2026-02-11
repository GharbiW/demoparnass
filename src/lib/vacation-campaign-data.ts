// === NEW DATA STRUCTURES FOR VACATION CAMPAIGN MODULE ===

export type CampaignDriver = {
  id: string;
  name: string;
  zone: 'IDF' | 'Sud-Est' | 'Ouest';
  site: 'Paris' | 'Lyon' | 'Marseille' | 'Nantes';
  skill: 'CM' | 'SPL' | 'Polyvalent'; // Competence family
  specialSkills: ('ADR' | 'Aéroportuaire' | 'Frigo')[];
  seniority: number; // in years
  leaveBalance: number;
  lastSummerLeave: string; // e.g., "S30-S32"
};

export type CapacityNeed = {
    week: number;
    zone: 'IDF' | 'Sud-Est' | 'Ouest';
    skill: 'CM' | 'SPL' | 'Polyvalent';
    totalDrivers: number;
    minRequired: number;
    capacity: number; // total - min
};

export type CampaignRequest = {
    id: string;
    driverId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    status: 'pending' | 'accepted' | 'rejected' | 'negotiate';
    // These would be populated by the simulation engine
    impact?: 'OK' | 'Tight' | 'KO';
    delta?: number;
    priorityScore?: number;
    // Simplified driver info for joins
    zone: 'IDF' | 'Sud-Est' | 'Ouest';
    skill: 'CM' | 'SPL' | 'Polyvalent';
    driverName: string;
    site: 'Paris' | 'Lyon' | 'Marseille' | 'Nantes';
};

// --- MOCK DATA GENERATION ---

const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Drivers
export const campaignDrivers: CampaignDriver[] = Array.from({ length: 80 }, (_, i) => {
    const zone = sample([
        ...Array(35).fill('IDF'), 
        ...Array(25).fill('Sud-Est'), 
        ...Array(20).fill('Ouest')
    ] as CampaignDriver['zone'][]);
    
    let site: CampaignDriver['site'];
    if (zone === 'IDF') site = 'Paris';
    else if (zone === 'Sud-Est') site = sample(['Lyon', 'Marseille']);
    else site = 'Nantes';

    const specialSkills: CampaignDriver['specialSkills'] = [];
    if (Math.random() > 0.7) specialSkills.push('ADR');
    if (Math.random() > 0.8) specialSkills.push('Frigo');

    return {
        id: `DRV-${String(i+1).padStart(3, '0')}`,
        name: `Chauffeur ${i+1}`,
        zone,
        site,
        skill: sample(['CM', 'SPL', 'Polyvalent', 'SPL', 'SPL', 'CM']),
        specialSkills,
        seniority: Math.floor(Math.random() * 20) + 1,
        leaveBalance: Math.floor(Math.random() * 10) + 20,
        lastSummerLeave: `S${Math.floor(Math.random() * 5) + 29}-S${Math.floor(Math.random() * 4) + 33}`
    }
});

// Capacity Needs
export const capacityNeeds: CapacityNeed[] = [];
const zones: CampaignDriver['zone'][] = ['IDF', 'Sud-Est', 'Ouest'];
const skills: CampaignDriver['skill'][] = ['CM', 'SPL', 'Polyvalent'];
const weeks = [27, 28, 29, 30, 31, 32, 33, 34, 35, 36];

for (const week of weeks) {
    for (const zone of zones) {
        for (const skill of skills) {
            const totalDrivers = campaignDrivers.filter(d => d.zone === zone && d.skill === skill).length;
            if (totalDrivers > 0) {
                 const minRequired = Math.ceil(totalDrivers * sample([0.6, 0.7, 0.75, 0.8]));
                 capacityNeeds.push({
                    week, zone, skill, totalDrivers, minRequired,
                    capacity: totalDrivers - minRequired,
                 });
            }
        }
    }
}

// Vacation Requests for the Campaign
export const campaignRequests: CampaignRequest[] = [];
campaignDrivers.slice(0, 75).forEach((driver, i) => {
    // Make week 32 in Sud-Est for SPL drivers overloaded
    let startWeek: number;
    if (driver.zone === 'Sud-Est' && driver.skill === 'SPL' && i < 10) {
        startWeek = 32;
    } else {
        startWeek = sample(weeks);
    }

    const durationWeeks = sample([1, 2, 2, 3, 1, 2, 1, 1]);
    const startDate = new Date(2025, 0, 1);
    startDate.setDate(startDate.getDate() + (startWeek - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (durationWeeks * 7) - 1);
    
    const isOverloadRequest = driver.zone === 'Sud-Est' && driver.skill === 'SPL' && i < 10;
    const status = isOverloadRequest ? 'pending' as const : sample(['pending' as const, 'pending' as const, 'pending' as const, 'accepted' as const, 'rejected' as const, 'negotiate' as const]);


    campaignRequests.push({
        id: `REQ-${String(i+1).padStart(3,'0')}`,
        driverId: driver.id,
        driverName: driver.name,
        site: driver.site,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: status,
        zone: driver.zone,
        skill: driver.skill,
        priorityScore: 50 + Math.floor(driver.seniority * 1.5) + Math.floor(Math.random() * 20), // Simulate a score
    });
});
