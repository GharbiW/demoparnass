
export type Prospect = {
    id: string;
    name: string;
    company: string;
    position: string;
    email: string;
    phone: string;
    source: 'Formulaire Web' | 'Appel Entrant' | 'Référence' | 'Salon';
    status: 'Nouveau' | 'Contacté' | 'En négociation' | 'Perdu' | 'Gagné';
    lastContact?: string;
    industry: 'Agro-alimentaire' | 'Pharmaceutique' | 'Grande Distribution' | 'Industrie' | 'E-commerce';
};

const firstNames = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];
const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'];
const companies = [
    'BioCoop', 'Sanofi', 'Lactalis', 'Danone', 'Nestlé Waters', 'Procter & Gamble',
    'Unilever', 'Colgate-Palmolive', 'Henkel', 'Reckitt', 'PepsiCo', 'Coca-Cola',
    'Mars', 'Mondelez', 'Ferrero', 'Heineken', 'AB InBev', 'Pernod Ricard'
];
const positions = ['Responsable Logistique', 'Coordinateur Transport', 'Directeur des Achats', 'Supply Chain Manager', 'Gérant'];
const sources: Prospect['source'][] = ['Formulaire Web', 'Appel Entrant', 'Référence', 'Salon'];
const statuses: Prospect['status'][] = ['Nouveau', 'Contacté', 'En négociation', 'Perdu', 'Gagné'];
const industries: Prospect['industry'][] = ['Agro-alimentaire', 'Pharmaceutique', 'Grande Distribution', 'Industrie', 'E-commerce'];


// Generate 100 prospects
export const prospects: Prospect[] = Array.from({ length: 100 }, (_, i) => {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const company = companies[i % companies.length];
    const lastContactDate = new Date();
    lastContactDate.setDate(lastContactDate.getDate() - Math.floor(Math.random() * 30));

    return {
        id: `PRO-${String(i + 1).padStart(3, '0')}`,
        name: `${firstName} ${lastName}`,
        company: `${company} ${i % 3 === 0 ? 'France' : 'Logistique'}`,
        position: positions[i % positions.length],
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${company.toLowerCase().replace(/\s/g, '')}.fr`,
        phone: `06 ${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        source: sources[i % sources.length],
        status: statuses[i % statuses.length],
        lastContact: i % 2 === 0 ? lastContactDate.toISOString().split('T')[0] : undefined,
        industry: industries[i % industries.length],
    };
});
