
'use server';
/**
 * @fileOverview Analyzes the root causes behind Key Performance Indicator (KPI) deviations.
 *
 * - explainKpiRootCause - A function that handles the KPI root cause analysis.
 */

import { ai } from '@/ai/genkit';
import { KpiRootCauseInputSchema, KpiRootCauseOutputSchema, type KpiRootCauseInput, type KpiRootCauseOutput } from './kpi-root-cause-types';

export async function explainKpiRootCause(input: KpiRootCauseInput): Promise<KpiRootCauseOutput> {
  return explainKpiRootCauseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainKpiRootCausePrompt',
  input: { schema: KpiRootCauseInputSchema },
  output: { schema: KpiRootCauseOutputSchema },
  prompt: `You are an expert logistics and transport analyst AI for a French company. Your task is to perform a detailed, multi-layered root cause analysis for a given Key Performance Indicator (KPI). Your analysis must be thorough, insightful, and provide concrete, actionable recommendations.

Analyze the provided data to identify the primary, secondary, and tertiary factors contributing to the KPI's deviation from its target. Structure your analysis as a hierarchical tree of factors.

KPI to Analyze: {{{kpi}}}
Current Value: {{{currentValue}}}
Target Value: {{{targetValue}}}
Time Range: {{{timeRange}}}
Contextual Data (fleet size, trip counts, incidents, etc.):
{{{fleetContext}}}

**Analysis Requirements:**

1.  **Root Cause Tree:**
    *   Identify at least 3-4 top-level factors.
    *   For at least two top-level factors, provide nested sub-factors (at least one level deep).
    *   For each factor and sub-factor, you MUST provide:
        *   'description': A clear and concise label for the factor.
        *   'impact': An estimated percentage contribution to the total KPI deviation. The sum of top-level impacts should approximate the total deviation.
        *   'reasoning': A detailed explanation of *how* and *why* this factor influenced the KPI.
        *   'category': Classify the factor into one of the provided categories.
        *   'dataPoints': Provide 1-2 specific, concrete data points or examples from the contextual data that support your reasoning. For example: "Driver Jean Dupont had 5 harsh braking events", "Vehicle AB-123-CD had 2 unplanned maintenance stops".

2.  **Summaries:**
    *   'primaryConclusion': A powerful, one-sentence executive summary of the single most important finding.
    *   'detailedSummary': A detailed paragraph that elaborates on the interplay between the main factors.

3.  **Recommendations:**
    *   Generate 2-3 specific, actionable recommendations.
    *   For each recommendation, provide a title, a clear description of the action to take, a category, and an estimated impact on the KPI.

Your response must be comprehensive and demonstrate a deep understanding of transport logistics. Use French for all descriptions, reasoning, and summaries.`,
});

const explainKpiRootCauseFlow = ai.defineFlow(
  {
    name: 'explainKpiRootCauseFlow',
    inputSchema: KpiRootCauseInputSchema,
    outputSchema: KpiRootCauseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
