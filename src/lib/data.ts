import { ChartData, KpiCardProps } from "@/lib/types";
import { Truck, AlertTriangle, Users, Fuel, Leaf, DatabaseZap, CheckCircle, Clock } from 'lucide-react';

export const kpiData: KpiCardProps[] = [
  {
    title: "Flotte dispo %",
    value: "94.5%",
    icon: Truck,
    description: "Pourcentage de véhicules opérationnels",
    change: "+1.2%",
    changeType: "increase",
  },
  {
    title: "% On-Time (7j)",
    value: "96.8%",
    icon: CheckCircle,
    description: "Taux de livraison à l'heure",
    change: "-0.5%",
    changeType: "decrease",
  },
  {
    title: "€ Carburant (7j)",
    value: "45,821 €",
    icon: Fuel,
    description: "Coût total du carburant",
    change: "+2.1%",
    changeType: "increase",
  },
   {
    title: "CO₂ (t, 7j)",
    value: "12.3 t",
    icon: Leaf,
    description: "Émissions de dioxyde de carbone",
    change: "+1.5%",
    changeType: "increase",
  },
  {
    title: "Anomalies Critiques (24h)",
    value: "8",
    icon: AlertTriangle,
    description: "Anomalies nécessitant une action",
    change: "+3",
    changeType: "increase",
  },
  {
    title: "DLQ erreurs (24h)",
    value: "152",
    icon: DatabaseZap,
    description: "Messages en erreur non traités",
    change: "+12",
    changeType: "increase",
  },
];

export const activityChartData: ChartData[] = [
  { name: '00:00', Evénements: 1200 },
  { name: '02:00', Evénements: 1500 },
  { name: '04:00', Evénements: 1300 },
  { name: '06:00', Evénements: 2400 },
  { name: '08:00', Evénements: 3200 },
  { name: '10:00', Evénements: 3500 },
  { name: '12:00', Evénements: 3000 },
  { name: '14:00', Evénements: 3800 },
  { name: '16:00', Evénements: 4200 },
  { name: '18:00', Evénements: 3700 },
  { name: '20:00', Evénements: 2500 },
  { name: '22:00', Evénements: 1800 },
];

export const energyCostData: ChartData[] = [
  { name: 'Semaine -4', Diesel: 40000, Gaz: 12000, Electrique: 3000 },
  { name: 'Semaine -3', Diesel: 42000, Gaz: 11000, Electrique: 3500 },
  { name: 'Semaine -2', Diesel: 38000, Gaz: 13000, Electrique: 4000 },
  { name: 'Semaine -1', Diesel: 45000, Gaz: 12500, Electrique: 4200 },
];

export const onTimeDeliveryData: ChartData[] = [
    { name: 'Lun', 'On-Time': 92, 'Delayed': 8 },
    { name: 'Mar', 'On-Time': 95, 'Delayed': 5 },
    { name: 'Mer', 'On-Time': 88, 'Delayed': 12 },
    { name: 'Jeu', 'On-Time': 97, 'Delayed': 3 },
    { name: 'Ven', 'On-Time': 91, 'Delayed': 9 },
    { name: 'Sam', 'On-Time': 98, 'Delayed': 2 },
    { name: 'Dim', 'On-Time': 100, 'Delayed': 0 },
];

export const fleetStatusData = [
  { name: 'Disponible', value: 45 },
  { name: 'En maintenance', value: 3 },
  { name: 'En panne', value: 2 },
];

export const anomalyData = [
    { name: 'Carburant', value: 12 },
    { name: 'Conformité', value: 5 },
    { name: 'Heures de service', value: 8 },
    { name: 'Télématique', value: 7 },
    { name: 'Température', value: 2 },
];
