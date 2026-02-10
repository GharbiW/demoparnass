
'use server';
/**
 * @fileOverview Suggests driver replacements for trips affected by a leave request.
 *
 * - suggestReplacement - A function that suggests replacements.
 * - SuggestReplacementInput - The input type for the function.
 * - SuggestReplacementOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Trip, Driver } from '@/lib/types';
import { mockDataService } from '@/lib/mock-data-service';
import { ReplacementSuggestionSchema, SuggestReplacementOutputSchema } from './suggest-replacement-types';

// We can't pass full objects in Zod schemas for AI flows, so we pass IDs and re-hydrate
const SuggestReplacementInputSchema = z.object({
  driverId: z.string().describe("The ID of the driver requesting leave."),
  startDate: z.string().describe("The start date of the leave period (YYYY-MM-DD)."),
  endDate: z.string().describe("The end date of the leave period (YYYY-MM-DD)."),
});
export type SuggestReplacementInput = z.infer<typeof SuggestReplacementInputSchema>;
export type SuggestReplacementOutput = z.infer<typeof SuggestReplacementOutputSchema>;


// This is a mock implementation that simulates the AI logic.
// In a real scenario, this would be a sophisticated Genkit flow with tools.
const mockSuggestReplacement = (input: SuggestReplacementInput): SuggestReplacementOutput => {
    const { driverId, startDate, endDate } = input;
    
    // Get master data from the service
    const allDrivers: Driver[] = mockDataService.getDrivers();
    const allTrips: Trip[] = mockDataService.getTrips();
    
    const requestingDriver = allDrivers.find((d: Driver) => d.id === driverId);
    if (!requestingDriver) {
        throw new Error(`Critical Error: Requesting driver with ID ${driverId} not found in master data.`);
    }
    
    const availableDrivers = allDrivers.filter(d => d.id !== driverId && d.status === 'Actif');

    const leaveStart = new Date(startDate);
    const leaveEnd = new Date(endDate);

    const affectedTrips = allTrips.filter((trip: Trip) => {
        const tripStart = new Date(trip.plannedStart);
        return trip.driverId === driverId && tripStart >= leaveStart && tripStart <= leaveEnd;
    });

    if (affectedTrips.length === 0) {
        return {
            reasoning: "Aucun trajet n'est impacté par cette demande de congé. L'approbation est simple.",
            replacements: [],
        };
    }

    const replacements: z.infer<typeof ReplacementSuggestionSchema>[] = [];

    for (const trip of affectedTrips) {
        const scoredReplacements = availableDrivers.map((d: Driver) => {
            let score = 50;
            let reason = "Basique";

            if (d.site === requestingDriver.site) {
                score += 30;
                reason = "Même site"
            }
            if (d.driverType === requestingDriver.driverType) {
                 score += 15;
            }
            if (d.name.includes("Sophie")) { // Simulate a "polyvalent" driver
                 score += 20;
                 reason = "Polyvalent"
            }
            return { ...d, score, reason };
        }).sort((a, b) => b.score - a.score);

        if (scoredReplacements.length > 0) {
            const bestMatch = scoredReplacements[0];
            replacements.push({
                tripId: trip.id,
                suggestedDriverId: bestMatch.id,
                suggestedDriverName: bestMatch.name,
                matchScore: Math.min(99, bestMatch.score),
                matchReason: bestMatch.reason,
                otherOptions: scoredReplacements.slice(1, 3).map(d => d.name),
            });
        }
    }
    
    return {
        reasoning: `Le système a identifié ${affectedTrips.length} trajet(s) impacté(s). Les remplacements sont suggérés en priorisant les chauffeurs du même site et les profils polyvalents.`,
        replacements: replacements,
    };
};


export async function suggestReplacement(input: SuggestReplacementInput): Promise<SuggestReplacementOutput> {
  // In a real app, you would use a Genkit prompt here.
  // For this demo, we use a mock function to simulate the AI's logic without API calls.
  return mockSuggestReplacement(input);
}


// The actual flow definition (currently unused in favor of the mock)
const suggestReplacementFlow = ai.defineFlow(
  {
    name: 'suggestReplacementFlow',
    inputSchema: SuggestReplacementInputSchema,
    outputSchema: SuggestReplacementOutputSchema,
  },
  async (input) => {
    // This is where you would define the prompt and call the AI model.
    // For now, we return mock data.
    return mockSuggestReplacement(input);
  }
);
