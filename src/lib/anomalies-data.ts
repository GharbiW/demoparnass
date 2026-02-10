

export type Anomaly = {
  id: string;
  scope: 'Carburant' | 'Télématique' | 'Conformité' | 'Trajet' | 'Maintenance';
  severity: 'Critique' | 'Haute' | 'Moyenne' | 'Basse';
  description: string;
  context: string; // e.g., VIN, Trip ID, Driver Name
  status: 'Ouvert' | 'Pris en compte' | 'Fermé';
  timestamp: string;
};

const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Generate 50 anomalies
export const anomalies: Anomaly[] = Array.from({ length: 50 }, (_, i) => {
    const scopes: Anomaly['scope'][] = ['Carburant', 'Télématique', 'Conformité', 'Trajet', 'Maintenance'];
    const severities: Anomaly['severity'][] = ['Critique', 'Haute', 'Moyenne', 'Basse'];
    const statuses: Anomaly['status'][] = ['Ouvert', 'Pris en compte', 'Fermé'];
    const descriptions = {
        Carburant: ['Sur-remplissage détecté', 'Prise nocturne', 'Utilisation carte hors-zone'],
        Télématique: ['Perte de signal > 15min', 'Freinage brusque', 'Accélération rapide'],
        Conformité: ['Assurance expire bientôt', 'FCO expiré', 'Visite médicale dépassée'],
        Trajet: ['Écart d\'itinéraire > 20%', 'Risque ETA élevé', 'Arrêt non planifié'],
        Maintenance: ['DTC Moteur Actif', 'Alerte TPMS', 'Surchauffe moteur'],
    };
    
    const scope = sample(scopes);
    const severity = sample(severities);

    // Make some anomalies "live"
    const now = new Date();
    const timestamp = i < 5 
        ? new Date(now.getTime() - Math.floor(Math.random() * 8 * 60000)).toISOString() // in the last 8 minutes
        : new Date(now.getTime() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000)).toISOString();

    return {
        id: `ANOM-${String(i+1).padStart(3,'0')}`,
        scope: scope,
        severity: severity,
        description: sample(descriptions[scope]),
        context: `TRIP-DEMO-${String(Math.floor(Math.random() * 100) + 1).padStart(4,'0')}`,
        status: i < 5 && severity === 'Critique' ? 'Ouvert' : sample(statuses),
        timestamp: timestamp,
    };
});
