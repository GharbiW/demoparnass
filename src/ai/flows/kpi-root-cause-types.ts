
import { z } from 'zod';

export const KpiRootCauseInputSchema = z.object({
  kpi: z.enum([
    // Operations
    "On-Time Delivery %",
    "Taux d'utilisation de la flotte",
    "Distance moyenne par trajet (km)",
    // Finance
    "TCO (Total Cost of Ownership) par km",
    "Coût du carburant par km",
    "Coût de maintenance par km",
    "Marge par trajet",
    // RSE
    "Émissions CO₂ (g/km)",
    "Consommation Carburant (L/100km)",
    "Pourcentage de conduite Éco",
    // Chauffeurs
    "Score de sécurité moyen",
    "Taux d'incidents (par 1M km)",
    "Taux de turnover des chauffeurs",
    // Maintenance
    "Taux de pannes en mission",
    "Temps moyen de réparation (heures)",
  ]).describe("The Key Performance Indicator to analyze."),
  timeRange: z.enum(["7 derniers jours", "30 derniers jours", "90 derniers jours"]).describe("The time period for the analysis."),
  currentValue: z.string().describe("The current value of the KPI, e.g., '92.1%' or '0.45€/km'."),
  targetValue: z.string().describe("The target value for the KPI, e.g., '95%' or '0.42€/km'."),
  fleetContext: z.string().describe("A summary of relevant fleet data for the period, such as number of trips, incidents, vehicle statuses, etc."),
});
export type KpiRootCauseInput = z.infer<typeof KpiRootCauseInputSchema>;

export type Factor = {
    id: string;
    description: string;
    impact: number;
    reasoning: string;
    category: "Comportement Chauffeur" | "Performance Véhicule" | "Conditions Externes" | "Planification" | "Maintenance" | "Économique" | "Réglementaire";
    dataPoints?: string[];
    subFactors?: Factor[];
};

export const FactorSchema: z.ZodType<Factor> = z.object({
    id: z.string().describe("A unique identifier for the factor, e.g., F-01."),
    description: z.string().describe("A concise description of the contributing factor."),
    impact: z.number().min(-100).max(100).describe("The estimated percentage impact of this factor on the KPI deviation. Positive for over-performance, negative for under-performance."),
    reasoning: z.string().describe("A brief explanation of how this factor contributed to the result."),
    category: z.enum(["Comportement Chauffeur", "Performance Véhicule", "Conditions Externes", "Planification", "Maintenance", "Économique", "Réglementaire"]).describe("The category of the factor."),
    dataPoints: z.array(z.string()).optional().describe("Specific data points or examples supporting the reasoning, e.g., 'VIN-XYZ had 3 breakdowns'."),
    subFactors: z.array(z.lazy(() => FactorSchema)).optional().describe("A list of sub-factors that contribute to this main factor."),
});

export const KpiRootCauseOutputSchema = z.object({
    kpi: z.string().describe("The KPI that was analyzed."),
    deviation: z.string().describe("A summary of the deviation from the target, e.g., '-2.9 points'."),
    primaryConclusion: z.string().describe("A one-sentence summary of the main reason for the KPI performance."),
    detailedSummary: z.string().describe("A more detailed paragraph summarizing the findings."),
    rootCauseTree: z.array(FactorSchema).describe("A hierarchical tree of root causes contributing to the KPI's performance."),
    recommendations: z.array(z.object({
        recommendationId: z.string(),
        title: z.string(),
        description: z.string(),
        category: z.enum(["Action Immédiate", "Processus", "Formation"]),
        estimatedImpact: z.string().describe("Estimated impact of implementing the recommendation, e.g., '+1.5% OTD', '-0.02€/km TCO'."),
    })).describe("A list of actionable recommendations to improve the KPI.")
});
export type KpiRootCauseOutput = z.infer<typeof KpiRootCauseOutputSchema>;
