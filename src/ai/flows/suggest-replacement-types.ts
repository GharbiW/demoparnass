
import { z } from 'zod';

export const ReplacementSuggestionSchema = z.object({
    tripId: z.string().describe("The ID of the trip that needs a new driver."),
    suggestedDriverId: z.string().describe("The ID of the best replacement driver."),
    suggestedDriverName: z.string().describe("The name of the best replacement driver."),
    matchScore: z.number().min(0).max(100).describe("A confidence score (0-100) for how good the match is."),
    matchReason: z.string().describe("A very short reason for the suggestion (e.g., 'Même site', 'Polyvalent disponible')."),
    otherOptions: z.array(z.string()).describe("A list of names of 1-2 other potential replacement drivers."),
});
export type ReplacementSuggestion = z.infer<typeof ReplacementSuggestionSchema>;


export const SuggestReplacementOutputSchema = z.object({
  reasoning: z.string().describe("A summary of the replacement strategy."),
  replacements: z.array(ReplacementSuggestionSchema).describe("The list of replacement suggestions for each affected trip."),
});
