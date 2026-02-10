

export type TrainingModule = {
    id: string;
    title: string;
    category: 'Sécurité' | 'Éco-conduite' | 'Réglementation' | 'Technique';
    durationMinutes: number;
    hasQuiz: boolean;
    content?: string;
};

const ecoConduiteContent = `
<h2>Chapitre 1: Anticipation et Prévision</h2>
<p>L'anticipation est la clé de l'éco-conduite. En regardant loin devant, vous pouvez anticiper les ralentissements, les feux rouges et les virages, ce qui vous permet de gérer votre vitesse en douceur.</p>
<ul>
    <li>Maintenez une distance de sécurité suffisante avec le véhicule qui vous précède.</li>
    <li>Utilisez le frein moteur plutôt que les freins de service lorsque c'est possible.</li>
    <li>Analysez le trafic pour éviter les accélérations et les freinages inutiles.</li>
</ul>

<h2>Chapitre 2: Gestion de la Vitesse et du Régime Moteur</h2>
<p>Une vitesse stable et un régime moteur optimal sont essentiels pour réduire la consommation de carburant.</p>
<ul>
    <li>Passez les rapports supérieurs dès que possible sans faire forcer le moteur.</li>
    <li>Utilisez le régulateur de vitesse sur les portions de route plates et dégagées.</li>
    <li>Le régime moteur idéal se situe généralement dans la "zone verte" du compte-tours, entre 1200 et 1600 tr/min pour la plupart des camions modernes.</li>
</ul>

<h2>Chapitre 3: Optimisation des Arrêts</h2>
<p>Chaque redémarrage consomme une quantité importante de carburant. Limiter les arrêts complets est donc une priorité.</p>
`;

export const trainingModules: TrainingModule[] = [
    { id: 'ECO-01', title: 'Éco-conduite Avancée', category: 'Éco-conduite', durationMinutes: 45, hasQuiz: true, content: ecoConduiteContent },
    { id: 'SEC-01', title: 'Arrimage des Charges', category: 'Sécurité', durationMinutes: 30, hasQuiz: true, content: "Le contenu pour l'arrimage des charges est en cours de rédaction." },
    { id: 'REG-01', title: 'Mise à jour ADR 2024', category: 'Réglementation', durationMinutes: 60, hasQuiz: false, content: "Ce module couvre les dernières mises à jour de la réglementation ADR." },
    { id: 'TECH-01', title: 'Diagnostic Moteur Diesel N1', category: 'Technique', durationMinutes: 90, hasQuiz: true, content: "Principes de base du diagnostic des moteurs diesel." },
];

export type TrainingAssignment = {
    id: string;
    userId: string;
    userName: string;
    userType: 'Chauffeur' | 'Technicien';
    moduleId: string;
    moduleTitle: string;
    assignedDate: string;
    dueDate: string;
    status: 'À faire' | 'En cours' | 'Terminé' | 'En retard';
    score?: number;
    timeSpentMinutes?: number;
};

export const trainingAssignments: TrainingAssignment[] = [
    {
        id: 'ASN-001',
        userId: 'DRV-JDU-001',
        userName: 'Jean Dupont',
        userType: 'Chauffeur',
        moduleId: 'ECO-01',
        moduleTitle: 'Éco-conduite Avancée',
        assignedDate: '2024-07-15',
        dueDate: '2024-08-15',
        status: 'Terminé',
        score: 92,
        timeSpentMinutes: 42,
    },
    {
        id: 'ASN-002',
        userId: 'DRV-MDU-002',
        userName: 'Marie Dubois',
        userType: 'Chauffeur',
        moduleId: 'SEC-01',
        moduleTitle: 'Arrimage des Charges',
        assignedDate: '2024-07-20',
        dueDate: '2024-08-20',
        status: 'En cours',
        timeSpentMinutes: 15,
    },
    {
        id: 'ASN-003',
        userId: 'TECH-ADI-001',
        userName: 'Adrien Dubois',
        userType: 'Technicien',
        moduleId: 'TECH-01',
        moduleTitle: 'Diagnostic Moteur Diesel N1',
        assignedDate: '2024-07-01',
        dueDate: '2024-07-31',
        status: 'En retard',
    },
     {
        id: 'ASN-004',
        userId: 'DRV-JDU-001',
        userName: 'Jean Dupont',
        userType: 'Chauffeur',
        moduleId: 'REG-01',
        moduleTitle: 'Mise à jour ADR 2024',
        assignedDate: '2024-07-10',
        dueDate: '2024-08-10',
        status: 'Terminé',
        timeSpentMinutes: 55,
    },
      {
        id: 'ASN-005',
        userId: 'DRV-PMA-003',
        userName: 'Paul Martin',
        userType: 'Chauffeur',
        moduleId: 'ECO-01',
        moduleTitle: 'Éco-conduite Avancée',
        assignedDate: '2024-07-18',
        dueDate: '2024-08-18',
        status: 'À faire',
    },
];


// Re-exporting from other mock data files to be used in the dialog
export const drivers = [
    { id: 'DRV-JDU-001', name: 'Jean Dupont' },
    { id: 'DRV-MDU-002', name: 'Marie Dubois' },
];

export const technicians = [
    { id: 'TECH-ADI-001', name: 'Adrien Dubois' },
    { id: 'TECH-BMA-002', name: 'Béatrice Martin' },
];
