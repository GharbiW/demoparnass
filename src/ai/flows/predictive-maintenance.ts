'use server';

/**
 * @fileOverview This file defines a Genkit flow for predictive maintenance of vehicles.
 *
 * - predictVehicleMaintenance - An exported function that triggers the predictive maintenance flow.
 * - PredictiveMaintenanceInput - The input type for the predictVehicleMaintenance function.
 * - PredictiveMaintenanceOutput - The return type for the predictVehicleMaintenance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictiveMaintenanceInputSchema = z.object({
  vehicleVin: z.string().describe('The Vehicle Identification Number (VIN) of the vehicle to predict maintenance for.'),
  odometer: z.number().describe('The current odometer reading of the vehicle in kilometers.'),
  engineHours: z.number().describe('The total number of hours the engine has been running.'),
  dtcCodes: z.array(z.string()).describe('An array of Diagnostic Trouble Codes (DTCs) reported by the vehicle.'),
  tpmsAlerts: z.array(z.string()).describe('An array of Tire Pressure Monitoring System (TPMS) alerts.'),
  avgTempDeviation: z.number().describe('The average temperature deviation from the optimal range.'),
  fuelL100km: z.number().describe('The average fuel consumption in liters per 100 kilometers.'),
  idlePct: z.number().describe('The percentage of time the vehicle has been idling.'),
  maintEvents30d: z.number().describe('The number of maintenance events in the last 30 days.'),
  ageDays: z.number().describe('The age of the vehicle in days.'),
  lastServiceKm: z.number().describe('The odometer reading at the last service.'),
  tireTreadMin: z.number().optional().describe('The minimum tire tread depth in millimeters.'),
  ambientTempAvg: z.number().describe('The average ambient temperature.'),
  routeProfile: z.string().describe('The typical route profile of the vehicle (e.g., city, highway).'),
  trailerUtilPct: z.number().describe('The percentage of time the vehicle is used with a trailer.'),
});
export type PredictiveMaintenanceInput = z.infer<typeof PredictiveMaintenanceInputSchema>;

const PredictiveMaintenanceOutputSchema = z.object({
  ettfHours: z.number().describe('The estimated time to failure in hours.'),
  ettfKm: z.number().describe('The estimated time to failure in kilometers.'),
  riskBreakdown: z.number().describe('The risk of breakdown (0-1).'),
  nextServiceAt: z.string().describe('The estimated date of the next service.'),
  componentHealth: z.object({
    engine: z.number().describe('The health of the engine (0-1).'),
    tires: z.number().describe('The health of the tires (0-1).'),
    brakes: z.number().describe('The health of the brakes (0-1).'),
    reefer: z.number().optional().describe('The health of the reefer (0-1), if applicable.'),
  }).describe('Component Health'),
  topFactors: z.array(z.string()).describe('The top factors contributing to the prediction.'),
  recommendations: z.array(z.string()).describe('The recommended maintenance actions.'),
  confidence: z.number().describe('The confidence level of the prediction (0-1).'),
});
export type PredictiveMaintenanceOutput = z.infer<typeof PredictiveMaintenanceOutputSchema>;

export async function predictVehicleMaintenance(input: PredictiveMaintenanceInput): Promise<PredictiveMaintenanceOutput> {
  return predictVehicleMaintenanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictVehicleMaintenancePrompt',
  input: {schema: PredictiveMaintenanceInputSchema},
  output: {schema: PredictiveMaintenanceOutputSchema},
  prompt: `You are an expert in predictive maintenance for vehicles. Analyze the provided vehicle data to predict potential failures and recommend maintenance actions.

  Vehicle VIN: {{{vehicleVin}}}
  Odometer: {{{odometer}}} km
  Engine Hours: {{{engineHours}}}
  DTC Codes: {{#each dtcCodes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  TPMS Alerts: {{#each tpmsAlerts}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Average Temperature Deviation: {{{avgTempDeviation}}}
  Fuel Consumption: {{{fuelL100km}}} L/100km
  Idle Percentage: {{{idlePct}}}
  Maintenance Events (30d): {{{maintEvents30d}}}
  Vehicle Age: {{{ageDays}}} days
  Last Service: {{{lastServiceKm}}} km
  Tire Tread (Min): {{{tireTreadMin}}} mm
  Average Ambient Temperature: {{{ambientTempAvg}}}
  Route Profile: {{{routeProfile}}}
  Trailer Utilization: {{{trailerUtilPct}}}

  Based on this data, provide the following:
  - Estimated Time To Failure (ETTF) in hours and kilometers.
  - Risk of breakdown (0-1).
  - Estimated date of the next service.
  - Component health (engine, tires, brakes, reefer if applicable) (0-1).
  - Top factors contributing to the prediction.
  - Recommended maintenance actions.
  - Confidence level of the prediction (0-1).

  Format your output as a JSON object matching the following schema, include descriptions from the schema as a comment in the JSON:
  {
    "ettfHours": "", // Estimated time to failure in hours.
    "ettfKm": "", // Estimated time to failure in kilometers.
    "riskBreakdown": "", // Risk of breakdown (0-1).
    "nextServiceAt": "", // Estimated date of the next service.
    "componentHealth": {
      "engine": "", // The health of the engine (0-1).
      "tires": "", // The health of the tires (0-1).
      "brakes": "", // The health of the brakes (0-1).
      "reefer": "" // The health of the reefer (0-1), if applicable.
    },
    "topFactors": [], // The top factors contributing to the prediction.
    "recommendations": [], // The recommended maintenance actions.
    "confidence": "" // Confidence level of the prediction (0-1).
  }
  `,
});

const predictVehicleMaintenanceFlow = ai.defineFlow(
  {
    name: 'predictVehicleMaintenanceFlow',
    inputSchema: PredictiveMaintenanceInputSchema,
    outputSchema: PredictiveMaintenanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
