
export const driverProfile = {
  id: "DRV-JDU-001",
  name: "Jean Dupont",
  site: "Lyon",
  status: "Actif",
  email: "jean.dupont@parnass.fr",
  phone: "06 12 34 56 78",
  languages: ["Français", "Anglais"],
  emergencyContact: "Marie Dupont - 06 98 76 54 32",
  scoreSecurite: 96,
  scoreEco: 90,
  truck: "IVECO-123",
}

export const driverCompliance = {
  licenceC: { number: "L-12345678", expiry: "2025-12-31" },
  fco: { expiry: "2026-06-15" },
  adr: { expiry: "2025-08-20" },
  caces: { expiry: "2027-01-10" },
  tachyCard: { number: "T-98765432", expiry: "2028-11-01" },
  medical: { fit: true, nextCheckAt: "2024-08-15" },
}

export const driverDocs = [
  { id: "DOC-01", type: "Permis de Conduire", expiry: "2025-12-31", status: "Vérifié" },
  { id: "DOC-02", type: "Carte Tachy", expiry: "2028-11-01", status: "Vérifié" },
  { id: "DOC-03", type: "Visite Médicale", expiry: "2024-08-15", status: "Vérifié" },
  { id: "DOC-04", type: "FCO", expiry: "2026-06-15", status: "En attente" },
]

export const driverAssignments = [
    {id: 'AS-1', driverId: 'DRV-JDU-001', vehicle: 'PL-ABC-123', from: '2024-07-01', to: '2024-07-15', status: 'Terminé', tripId: 'LGN-001'},
    {id: 'AS-2', driverId: 'DRV-JDU-001', vehicle: 'PL-DEF-456', from: '2024-07-16', to: '2024-07-31', status: 'Terminé', tripId: 'LGN-002'},
    {id: 'AS-3', driverId: 'DRV-JDU-001', vehicle: 'PL-GHI-789', from: '2024-08-01', to: null, status: 'Actif', tripId: 'LGN-003'},
]

export const driverShifts = [
    {id: 'SH-1', date: '2024-07-29', start: '04:05', end: '13:58', hours: '9h 53m', pauses: '1h 10m', status: 'Validé'},
    {id: 'SH-2', date: '2024-07-30', start: '04:12', end: '14:02', hours: '9h 50m', pauses: '1h 05m', status: 'Validé'},
    {id: 'SH-3', date: '2024-07-31', start: '03:58', end: '11:30', hours: '7h 32m', pauses: '0h 45m', status: 'En cours'},
]

export const telematicsData = {
    idleMinutes: [15, 18, 12, 25, 20, 14, 16],
    overspeedEvents: [2, 3, 1, 5, 2, 1, 0],
    harshBraking: [4, 2, 3, 1, 3, 2, 1],
    securityScore: [92, 90, 95, 88, 91, 94, 96],
    ecoScore: [85, 82, 88, 79, 83, 87, 90],
    siteAvg: { security: 91, eco: 84 },
    badTrends: ["Augmentation du temps de ralenti (+15%)", "Pics de vitesse sur autoroute", "Freinages tardifs en zone urbaine"]
}

export const driverIncidents = [
    { id: 'INC-01', date: '2024-06-15', category: 'Accrochage léger', cost: '350€', status: 'Clos' },
    { id: 'INC-02', date: '2024-07-22', category: 'Bris de glace', cost: '800€ (est.)', status: 'Ouvert' },
]

export const driverInfractions = [
    { id: 'INF-01', code: 'Excès de vitesse < 20km/h', fine: '135€', points: 1, status: 'Payée', tripId: 'TRIP-1234' },
]

export const driverTrainings = [
    { id: 'TRN-01', topic: 'Éco-conduite 2.0', dueAt: '2024-09-01', completedAt: '2024-08-15', score: '92%', certificate: 'CERT-ECO-123' },
    { id: 'TRN-02', topic: 'Gestion du stress', dueAt: '2024-10-15', completedAt: null, score: null, certificate: null },
]

export const aiPrediction = {
    predictionId: 'PRED-DRV-XYZ',
    riskAccident: 25,
    riskFatigue: 65,
    riskInfraction: 40,
    confidence: 0.88,
    topFactors: ["Séquences de conduite longues (>4h) sur les 7 derniers jours", "Augmentation des freinages brusques de 20%", "Visite médicale expirant dans moins de 30 jours"],
}

export const contractInfo = {
    type: "CDI",
    startDate: "2021-03-15",
    manager: "Alice Dubois",
    salary: 32000,
    leaveBalance: {
        paid: 12,
        rtt: 5,
    }
}

export const absenceHistory = [
    { id: "ABS-01", period: "15/04/2024 - 19/04/2024", type: "Congé Payé", status: "Approuvé" },
    { id: "ABS-02", period: "10/06/2024", type: "RTT", status: "Approuvé" },
]

export const managerNotes = [
    { id: "NOTE-01", date: "2024-07-15", author: "Alice Dubois", content: "Jean montre une excellente attitude et est toujours ponctuel. Point de vigilance sur la consommation de carburant qui pourrait être optimisée." },
    { id: "NOTE-02", date: "2024-01-20", author: "Alice Dubois", content: "Entretien annuel : objectifs atteints. Souhaite se former sur la conduite en montagne." },
]

    
