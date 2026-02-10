
import { Warehouse, Truck, CheckCircle, MapPin } from "lucide-react";

export const tripEvents = [
    { label: "Départ de l'entrepôt", timestamp: "04:05", status: "done", icon: Warehouse },
    { label: "Enlèvement Client A", timestamp: "05:15", status: "done", icon: Truck },
    { label: "Arrivée Plateforme Mâcon", timestamp: "09:30 (est.)", status: "pending", icon: MapPin },
    { label: "Livraison Finale", timestamp: "14:00 (est.)", status: "pending", icon: CheckCircle },
];

export const waypoints = [
    { step: "Départ", plannedEta: "04:00", actualEta: "04:05", delta: 5, remainingSlack: 25, deviation: false },
    { step: "Client A", plannedEta: "05:00", actualEta: "05:15", delta: 15, remainingSlack: 10, deviation: false },
    { step: "Client B", plannedEta: "07:30", actualEta: "08:05", delta: 35, remainingSlack: -25, deviation: true },
    { step: "Livraison", plannedEta: "09:00", actualEta: "09:45 (est.)", delta: 45, remainingSlack: -45, deviation: true },
];

export const tripCosts = {
    fuel: { value: "150L", cost: 262.50 },
    tolls: { value: "3 sections", cost: 85.50 },
    detention: { value: "45 min", cost: 30.00 },
    revenue: 550.00,
    margin: 172.00,
};
