'use server';
/**
 * @fileOverview A trip planning AI agent.
 *
 * - planTrip - A function that handles the trip planning process using AI.
 * - PlanTripInput - The input type for the planTrip function.
 * - PlanTripOutput - The return type for the planTrip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlanTripInputSchema = z.object({
  pickupLocation: z.string().describe('The starting address for the trip.'),
  deliveryLocation: z.string().describe('The final destination address for the trip.'),
  // In a real scenario, we might pass vehicle constraints (e.g., tonnage, energy type) 
  // and driver availability to help the AI make a better choice.
});
export type PlanTripInput = z.infer<typeof PlanTripInputSchema>;

const TripStopSchema = z.object({
    type: z.enum(["Pause 45min", "Carburant", "Douane", "Autre"]).describe("The type of stop."),
    location: z.string().describe("The name of the location for the stop (e.g., 'Aire de Mâcon-La-Salle')."),
    estimatedTime: z.string().datetime().describe("The estimated time of arrival at the stop in ISO 8601 format."),
});

const PlanTripOutputSchema = z.object({
  tripId: z.string().describe("A unique ID for the generated trip, e.g., 'AI-TRIP-XYZ'."),
  client: z.string().describe("A placeholder client name for the trip, e.g., 'Client en attente'."),
  vin: z.string().describe("The VIN of the best available vehicle for the trip."),
  driverId: z.string().describe("The ID of the best available driver for the trip."),
  plannedStart: z.string().datetime().describe("The suggested start time for the trip in ISO 8601 format."),
  plannedEnd: z.string().datetime().describe("The estimated end time for the trip in ISO 8601 format."),
  estimatedDistanceKm: z.number().describe('The estimated total distance of the trip in kilometers.'),
  routeSummary: z.string().describe('A brief summary of the proposed route, e.g., "Via A6, péages inclus".'),
  stops: z.array(TripStopSchema).describe("An array of planned stops during the trip, such as breaks, refueling, or customs."),
  reasoning: z.string().describe('A brief explanation of why this driver, vehicle, and time were chosen.'),
});
export type PlanTripOutput = z.infer<typeof PlanTripOutputSchema>;

export async function planTrip(input: PlanTripInput): Promise<PlanTripOutput> {
  return planTripFlow(input);
}

const prompt = ai.definePrompt({
  name: 'planTripPrompt',
  input: {schema: PlanTripInputSchema},
  output: {schema: PlanTripOutputSchema},
  prompt: `You are an expert transport dispatcher for a French logistics company. Your task is to create an optimized trip plan based on a pickup and delivery location.

You must choose the best vehicle and driver from the available pool and determine the optimal start and end times.

Your plan MUST include mandatory stops. A driver must take a 45-minute break after 4.5 hours of driving. For a long trip like Paris to Lyon, plan for at least one refueling stop.

Available Vehicles (VIN, immatriculation, current status, energy):
- VIN-ABC-123, AB-123-CD, Disponible, Gaz
- VIN-JKL-101, JK-101-LM, Disponible, Diesel

Available Drivers (ID, name, status):
- DRV-JDU-001, Jean Dupont, Actif
- DRV-SBE-004, Sophie Bernard, Actif

Your plan should be efficient, taking into account typical traffic conditions in France. Provide a brief justification for your choices. The current date is 2024-08-02. Plan for the next available slot.

Pickup: {{{pickupLocation}}}
Delivery: {{{deliveryLocation}}}

Generate a complete plan based on this information, including all stops.`,
});

const planTripFlow = ai.defineFlow(
  {
    name: 'planTripFlow',
    inputSchema: PlanTripInputSchema,
    outputSchema: PlanTripOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // In a real application, you would save this new trip to the database here.
    return output!;
  }
);
