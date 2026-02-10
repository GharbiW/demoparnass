

export type Campaign = {
    id: string;
    name: string;
    sendDate: string;
    recipientCount: number;
    openRate: number; // as percentage
    clickRate: number; // as percentage
    status: 'Terminée' | 'En cours' | 'Brouillon';
    subject?: string;
    content?: string;
    targetSegment?: string;
};

export const campaigns: Campaign[] = [
    {
        id: 'CAMP-001',
        name: 'Lancement IA Logistique (T3)',
        sendDate: '2024-07-15',
        recipientCount: 500,
        openRate: 52.3,
        clickRate: 12.1,
        status: 'Terminée',
        subject: "Révolutionnez votre logistique avec l'IA de Parnass",
        content: "<p>Bonjour, découvrez comment notre nouvelle plateforme IA peut optimiser vos opérations...</p>",
        targetSegment: "Prospects secteur e-commerce",
    },
    {
        id: 'CAMP-002',
        name: 'Offre Spéciale Transport Frigo',
        sendDate: '2024-07-25',
        recipientCount: 1200,
        openRate: 41.8,
        clickRate: 7.5,
        status: 'Terminée',
        subject: "Garantissez votre chaîne du froid cet été",
        content: "<p>Profitez de -10% sur votre premier transport frigorifique avec Parnass...</p>",
        targetSegment: "Industrie agro-alimentaire",
    },
    {
        id: 'CAMP-003',
        name: 'Relance Prospects Inactifs (T3)',
        sendDate: '2024-08-01',
        recipientCount: 350,
        openRate: 25.0,
        clickRate: 3.2,
        status: 'En cours',
        subject: "Parnass : Toujours à votre service pour votre logistique",
        content: "<p>Cela fait un moment que nous n'avons pas échangé, y a-t-il un projet sur lequel nous pourrions vous aider ?</p>",
        targetSegment: "Prospects non contactés depuis 90 jours",
    },
    {
        id: 'CAMP-004',
        name: 'Invitation Salon Logi-Tech',
        sendDate: '2024-08-05',
        recipientCount: 2500,
        openRate: 0,
        clickRate: 0,
        status: 'Brouillon',
    },
];
