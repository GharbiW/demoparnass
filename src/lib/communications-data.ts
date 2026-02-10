
export type Communication = {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string; // Format: YYYY-MM-DD
  target: 'Tous' | 'Chauffeurs' | 'Techniciens' | 'Site: Lyon' | 'Site: Paris';
};

export const communications: Communication[] = [
  {
    id: "COMM-001",
    title: "Rappel de Sécurité : Vérification des Arrimages",
    content: "Bonjour à tous, un rappel amical pour vérifier systématiquement le double arrimage de toutes les charges, en particulier pour les trajets sur autoroute. La sécurité est notre priorité absolue. Merci de votre vigilance.",
    author: "Direction Sécurité",
    date: "2024-08-01",
    target: "Chauffeurs",
  },
  {
    id: "COMM-002",
    title: "Joyeux Anniversaire à Jean Dupont !",
    content: "Toute l'équipe Parnass souhaite un excellent anniversaire à notre chauffeur Jean Dupont du site de Lyon ! Profite bien de ta journée.",
    author: "Équipe RH",
    date: "2024-07-31",
    target: "Site: Lyon",
  },
  {
    id: "COMM-003",
    title: "Newsletter Mensuelle - Juillet 2024",
    content: "Découvrez les dernières nouvelles de l'entreprise : nouveaux contrats, performances du mois, et un focus sur nos initiatives RSE. Cliquez ici pour lire la newsletter complète...",
    author: "Direction Générale",
    date: "2024-07-28",
    target: "Tous",
  },
];
