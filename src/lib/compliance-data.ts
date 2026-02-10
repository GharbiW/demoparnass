
export type ComplianceItem = {
    id: string;
    ownerId: string; // driverId or VIN
    site: string;
    documentType: 'Permis de Conduire' | 'FCO' | 'Visite Médicale' | 'Carte Tachy' | 'Assurance' | 'Contrôle Technique' | 'Crit\'Air';
    expiryDate: string; // YYYY-MM-DD
} & ({ driverName: string; vehicleId?: never } | { driverName?: never; vehicleId: string });


export const driverComplianceData: ComplianceItem[] = [
    { id: 'D-COMP-001', ownerId: 'DRV-JDU-001', driverName: 'Jean Dupont', site: 'Lyon', documentType: 'Visite Médicale', expiryDate: '2024-08-15' },
    { id: 'D-COMP-002', ownerId: 'DRV-MDU-002', driverName: 'Marie Dubois', site: 'Paris', documentType: 'FCO', expiryDate: '2025-01-20' },
    { id: 'D-COMP-003', ownerId: 'DRV-PMA-003', driverName: 'Paul Martin', site: 'Marseille', documentType: 'Permis de Conduire', expiryDate: '2024-07-29' },
    { id: 'D-COMP-004', ownerId: 'DRV-SBE-004', driverName: 'Sophie Bernard', site: 'Nantes', documentType: 'Carte Tachy', expiryDate: '2026-11-10' },
    { id: 'D-COMP-005', ownerId: 'DRV-JDU-001', driverName: 'Jean Dupont', site: 'Lyon', documentType: 'Permis de Conduire', expiryDate: '2025-12-31' },
     { id: 'D-COMP-006', ownerId: 'DRV-JDU-001', driverName: 'Jean Dupont', site: 'Lyon', documentType: 'FCO', expiryDate: '2024-08-05' },

];

export const vehicleComplianceData: ComplianceItem[] = [
    { id: 'V-COMP-001', ownerId: 'VIN-ABC-123', vehicleId: 'AB-123-CD', site: 'Lyon', documentType: 'Contrôle Technique', expiryDate: '2024-08-25' },
    { id: 'V-COMP-002', ownerId: 'VIN-DEF-456', vehicleId: 'DE-456-FG', site: 'Paris', documentType: 'Assurance', expiryDate: '2025-03-10' },
    { id: 'V-COMP-003', ownerId: 'VIN-GHI-789', vehicleId: 'GH-789-IJ', site: 'Marseille', documentType: 'Crit\'Air', expiryDate: '2030-01-01' },
    { id: 'V-COMP-004', ownerId: 'VIN-JKL-101', vehicleId: 'JK-101-LM', site: 'Nantes', documentType: 'Contrôle Technique', expiryDate: '2024-07-20' },
    { id: 'V-COMP-005', ownerId: 'VIN-ABC-123', vehicleId: 'AB-123-CD', site: 'Lyon', documentType: 'Assurance', expiryDate: '2024-09-01' },
];

export type Document = {
    id: string;
    name: string;
    type: string;
    owner: string; // Driver name or vehicle immat
    ownerType: 'Chauffeur' | 'Véhicule';
    uploadDate: string;
    expiryDate: string;
    status: 'Vérifié' | 'En attente' | 'Expiré' | 'Rejeté';
    url: string;
};

export const documentLibrary: Document[] = [
    { id: 'DOC-001', name: 'Permis_JDU.pdf', type: 'Permis de Conduire', owner: 'Jean Dupont', ownerType: 'Chauffeur', uploadDate: '2023-01-15', expiryDate: '2025-12-31', status: 'Vérifié', url: '#' },
    { id: 'DOC-002', name: 'Assurance_ABC-123.pdf', type: 'Assurance', owner: 'AB-123-CD', ownerType: 'Véhicule', uploadDate: '2023-09-01', expiryDate: '2024-09-01', status: 'Vérifié', url: '#' },
    { id: 'DOC-003', name: 'FCO_MDU.pdf', type: 'FCO', owner: 'Marie Dubois', ownerType: 'Chauffeur', uploadDate: '2023-02-20', expiryDate: '2025-01-20', status: 'Vérifié', url: '#' },
    { id: 'DOC-004', name: 'CT_DEF-456.pdf', type: 'Contrôle Technique', owner: 'DE-456-FG', ownerType: 'Véhicule', uploadDate: '2024-03-01', expiryDate: '2025-03-10', status: 'En attente', url: '#' },
    { id: 'DOC-005', name: 'Visite_Medicale_PMA.jpg', type: 'Visite Médicale', owner: 'Paul Martin', ownerType: 'Chauffeur', uploadDate: '2024-07-25', expiryDate: '2024-07-29', status: 'Expiré', url: '#' },
];

export type ZfeComplianceData = {
    vin: string;
    immatriculation: string;
    critair: number;
    energie: 'Diesel' | 'Gaz' | 'Électrique';
    zfeStatus: {
        [key: string]: 'Autorisé' | 'Restreint' | 'Interdit';
    }
}
export const zfeComplianceData: ZfeComplianceData[] = [
    { vin: 'VIN-ABC-123', immatriculation: 'AB-123-CD', critair: 1, energie: 'Gaz', zfeStatus: { paris: 'Autorisé', lyon: 'Autorisé', marseille: 'Autorisé' } },
    { vin: 'VIN-DEF-456', immatriculation: 'DE-456-FG', critair: 2, energie: 'Diesel', zfeStatus: { paris: 'Autorisé', lyon: 'Autorisé', marseille: 'Autorisé' } },
    { vin: 'VIN-GHI-789', immatriculation: 'GH-789-IJ', critair: 0, energie: 'Électrique', zfeStatus: { paris: 'Autorisé', lyon: 'Autorisé', marseille: 'Autorisé' } },
    { vin: 'VIN-JKL-101', immatriculation: 'JK-101-LM', critair: 3, energie: 'Diesel', zfeStatus: { paris: 'Restreint', lyon: 'Autorisé', marseille: 'Autorisé' } },
    { vin: 'VIN-MNO-234', immatriculation: 'MN-234-OP', critair: 4, energie: 'Diesel', zfeStatus: { paris: 'Interdit', lyon: 'Restreint', marseille: 'Autorisé' } },
];
