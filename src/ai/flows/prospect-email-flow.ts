
'use server';
/**
 * @fileOverview Generates personalized prospecting emails.
 *
 * - generateProspectEmail - A function that generates an email.
 * - ProspectEmailInput - The input type for the function.
 * - ProspectEmailOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ProspectEmailInputSchema = z.object({
  prospectName: z.string().describe("The prospect's full name."),
  prospectCompany: z.string().describe("The prospect's company name."),
  prospectPosition: z.string().describe("The prospect's job title or position."),
  objective: z.enum([
    "Prise de contact initiale",
    "Relance après un salon",
    "Proposition de valeur ciblée",
    "Demande de rendez-vous",
  ]).describe("The main goal of the email."),
  companyContext: z.string().describe("A brief summary of Parnass's value proposition and strengths."),
});
export type ProspectEmailInput = z.infer<typeof ProspectEmailInputSchema>;

export const ProspectEmailOutputSchema = z.object({
  subject: z.string().describe("A catchy and professional subject line for the email."),
  body: z.string().describe("The full, personalized body of the email in HTML format."),
});
export type ProspectEmailOutput = z.infer<typeof ProspectEmailOutputSchema>;

export async function generateProspectEmail(input: ProspectEmailInput): Promise<ProspectEmailOutput> {
  return generateProspectEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProspectEmailPrompt',
  input: { schema: ProspectEmailInputSchema },
  output: { schema: ProspectEmailOutputSchema },
  prompt: `You are an expert sales assistant for Parnass, a leading French transport and logistics company. Your task is to write a compelling and personalized prospecting email.

The email should be professional, concise, and tailored to the recipient.

**Recipient Information:**
- Name: {{{prospectName}}}
- Company: {{{prospectCompany}}}
- Position: {{{prospectPosition}}}

**Email Goal:** {{{objective}}}

**Parnass's Strengths & Context:**
{{{companyContext}}}

**Instructions:**
1.  Write a compelling email subject line that grabs attention.
2.  Write the email body in French. Use a professional but friendly tone.
3.  Personalize the email by mentioning the prospect's company or role.
4.  Clearly state the purpose of the email based on the objective.
5.  End with a clear call-to-action.
6.  The body should be formatted in simple HTML (using <p>, <strong>, <ul>, <li> tags).
7.  Start with "Bonjour {{{prospectName}}}" and end with a professional closing.`,
});

const generateProspectEmailFlow = ai.defineFlow(
  {
    name: 'generateProspectEmailFlow',
    inputSchema: ProspectEmailInputSchema,
    outputSchema: ProspectEmailOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
