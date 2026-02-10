export type Recommendation = {
  recommendationId: string;
  type: "DriverSwap" | "VehicleSwap" | "RouteOptimization" | "FuelStop";
  title: string;
  description: string;
  reasoning: string;
  impact: string;
};

export const recommendations: Recommendation[] = [
  {
    recommendationId: "REC-SWAP-001",
    type: "DriverSwap",
    title: "Permutation de chauffeurs",
    description: "Permuter Jean D. (TRIP-123) et Marie L. (TRIP-456) à l'entrepôt de Lyon.",
    reasoning: "Marie L. terminera plus près de son domicile, réduisant les heures supplémentaires de 45min. Jean D. est qualifié pour le trajet de Marie.",
    impact: "-45€ COGS",
  },
  {
    recommendationId: "REC-ROUTE-002",
    type: "RouteOptimization",
    title: "Optimisation d'itinéraire",
    description: "Détourner le TRIP-789 via l'A43 au lieu de l'A7 pour éviter un accident.",
    reasoning: "Un accident majeur est signalé sur l'A7, avec un retard estimé à 60-90 min. L'A43 est fluide.",
    impact: "+35% On-Time Probability",
  },
  {
    recommendationId: "REC-FUEL-003",
    type: "FuelStop",
    title: "Arrêt carburant optimisé",
    description: "Suggérer au chauffeur du TRIP-246 de faire le plein à la station AS24 de Mâcon.",
    reasoning: "Le prix du diesel y est inférieur de 0,08€/L par rapport aux stations suivantes sur son itinéraire.",
    impact: "-12€ Cost",
  },
   {
    recommendationId: "REC-VSWAP-004",
    type: "VehicleSwap",
    title: "Échange de véhicule",
    description: "Assigner le véhicule GNC-05 (Gaz) au TRIP-555 au lieu du DSL-12.",
    reasoning: "Le trajet est long et principalement sur autoroute, où le coût au km du GNC est 12% inférieur à celui du diesel.",
    impact: "-25€ COGS",
  },
];
