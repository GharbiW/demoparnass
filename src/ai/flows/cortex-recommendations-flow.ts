'use server';
/**
 * @fileOverview The AI Cortex flow for generating autonomous recommendations.
 *
 * - generateCortexRecommendations - A function that generates operational recommendations.
 * - CortexRecommendationsInput - The input type for the function.
 * - CortexRecommendationsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const CortexRecommendationSchema = z.object({
  recommendationId: z.string().describe("A unique ID for the recommendation, e.g., 'REC-SWAP-001'."),
  type: z.enum(["DriverSwap", "VehicleSwap", "RouteOptimization", "FuelStop"]).describe("The category of the recommendation."),
  title: z.string().describe("A short, catchy title for the recommendation."),
  description: z.string().describe("A one-sentence description of the recommended action."),
  reasoning: z.string().describe("A brief explanation for why the recommendation is being made."),
  impact: z.string().describe("The estimated positive impact, e.g., '-15€ COGS', '+8% On-Time Probability'."),
});

const CortexRecommendationsInputSchema = z.object({
  fleetStatus: z.string().describe("A summary of the current fleet status, including driver availability and vehicle positions."),
  ongoingTrips: z.string().describe("A summary of all trips currently in progress."),
  complianceStatus: z.string().describe("A summary of any upcoming compliance issues."),
});
export type CortexRecommendationsInput = z.infer<typeof CortexRecommendationsInputSchema>;

const CortexRecommendationsOutputSchema = z.object({
  recommendations: z.array(CortexRecommendationSchema),
});
export type CortexRecommendationsOutput = z.infer<typeof CortexRecommendationsOutputSchema>;

export async function generateCortexRecommendations(input: CortexRecommendationsInput): Promise<CortexRecommendationsOutput> {
  return generateCortexRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCortexRecommendationsPrompt',
  input: { schema: CortexRecommendationsInputSchema },
  output: { schema: CortexRecommendationsOutputSchema },
  prompt: `You are AI Cortex, an autonomous logistics coordinator for a French transport company. Your task is to analyze the fleet's real-time data and generate actionable recommendations to optimize operations, reduce costs, and improve on-time performance.

Current Fleet & Trip Data:
- Fleet Status: {{{fleetStatus}}}
- Ongoing Trips: {{{ongoingTrips}}}
- Compliance Status: {{{complianceStatus}}}

Based on this data, generate 2-3 specific, high-impact recommendations. For each recommendation, provide a clear title, a description of the action to take, the reasoning behind it, and the expected impact. Focus on driver swaps, vehicle swaps for efficiency, route optimizations, or suggesting better fuel stops.`,
});

const generateCortexRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateCortexRecommendationsFlow',
    inputSchema: CortexRecommendationsInputSchema,
    outputSchema: CortexRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
