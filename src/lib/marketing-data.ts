

export type Workflow = {
  id: string;
  name: string;
  trigger: string;
  status: 'Actif' | 'Inactif';
  lastRun: string;
  runCount: number;
  description: string;
};


export const marketingData = {
    projects: [
        { id: 'project-1', name: 'Campagne Marketing T3' },
        { id: 'project-2', name: 'Extraits de Podcast' },
    ],
    brandKits: [
        { id: 'bk-1', name: 'Marque par Défaut', logo: 'https://placehold.co/100x40/000066/59FFCC?text=LOGO', colors: ['#000066', '#59FFCC', '#F3F4F6'], font: 'Inter' },
    ],
    videos: [
        { id: 'vid-1', title: 'Discours sur l\'Avenir de l\'IA', duration: 3600, topics: ['IA', 'Future Tech', 'Innovation'], lang: 'Anglais', thumbnail: 'https://placehold.co/600x400/000066/FFFFFF?text=Keynote' },
        { id: 'vid-2', title: 'Analyse Approfondie de la Stratégie Marketing', duration: 1850, topics: ['Marketing', 'Branding', 'SEO'], lang: 'Anglais', thumbnail: 'https://placehold.co/600x400/FF851B/FFFFFF?text=Marketing' },
        { id: 'vid-morgane', title: 'Interview de Morgane Jeudy', duration: 1200, topics: ['Interview', 'Expert'], lang: 'Français', thumbnail: 'https://placehold.co/600x400/6A0DAD/FFFFFF?text=Morgane+J.', isSpecial: true },
    ],
    detectedHighlights: {
        'vid-1': Array.from({ length: 15 }, (_, i) => ({ id: `hl-1-${i}`, timecode: `${Math.floor(i*2.5)}:${String(Math.floor(Math.random()*60)).padStart(2, '0')}`, title: `Idée clé sur le modèle d'IA ${i+1}`, virality: 70 + Math.floor(Math.random() * 30), sentiment: 'Positif', tags: ['IA', 'Prédiction']})),
        'vid-2': Array.from({ length: 10 }, (_, i) => ({ id: `hl-2-${i}`, timecode: `${Math.floor(i*3)}:${String(Math.floor(Math.random()*60)).padStart(2, '0')}`, title: `Tactique marketing n°${i+1}`, virality: 65 + Math.floor(Math.random() * 25), sentiment: 'Neutre', tags: ['SEO', 'Growth Hack']}))
    },
    detectedCarouselConcepts: {
        'vid-1': [
            { id: 'cc-1-1', title: `Chapitre 1 : L'Ascension des LLM`, summary: 'Exploration des concepts fondamentaux des grands modèles de langage...', image: 'https://i.postimg.cc/JywxQN7T/1.png'},
            { id: 'cc-1-2', title: `Chapitre 2 : Impact sur la Tech`, summary: 'Analyse de l\'influence des LLM sur les industries technologiques...', image: 'https://i.postimg.cc/TLfczTDg/2.png'},
        ],
        'vid-2': [
             { id: 'cc-2-1', title: `Pilier 1 : Le Contenu est Roi`, summary: 'Création de contenu convaincant qui résonne avec votre public...', image: 'https://i.postimg.cc/JywxQN7T/1.png'},
             { id: 'cc-2-2', title: `Pilier 2 : Stratégie SEO`, summary: 'Optimisation de votre contenu pour les moteurs de recherche...', image: 'https://i.postimg.cc/TLfczTDg/2.png'},
        ]
    },
    renderJobs: [
        { id: 'job-1', title: 'Clip Discours - Éthique de l\'IA', type: 'Clip', status: 'Terminé', progress: 100, date: 'Il y a 2 jours' },
        { id: 'job-2', title: 'Vidéo de Bienvenue - Nouvelle Recrue', type: 'Avatar', status: 'Terminé', progress: 100, date: 'Il y a 3 jours' },
        { id: 'job-3', title: 'Carrousel Statistiques T3', type: 'Visuel', status: 'Échoué', progress: 0, date: 'Il y a 4 jours' },
        { id: 'job-4', title: 'Clip Analyse Marketing #1', type: 'Clip', status: 'En cours', progress: 75, date: 'Il y a 1 heure' },
    ],
    usage: {
        renders: { current: 128, total: 500, label: 'Rendus (7j)' },
        renderTime: { current: 45, total: 60, label: 'Temps de rendu moyen (s)' },
        clips: { current: 350, total: 1000, label: 'Clips générés (mois)' },
        avatars: { current: 45, total: 100, label: 'Vidéos avatar (mois)' },
        visuals: { current: 890, total: 2000, label: 'Visuels exportés (mois)' },
    },
};
