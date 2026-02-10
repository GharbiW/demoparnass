
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, FileText, CircleDollarSign, Video, User, History, ShieldAlert, Wrench, CalendarPlus } from "lucide-react";
import Link from "next/link";

const menuItems = [
  { href: "/m/profile", icon: User, label: "Mon Profil" },
  { href: "/m/conges", icon: CalendarPlus, label: "Mes Congés" },
  { href: "/m/trip-history", icon: History, label: "Historique des Trajets" },
  { href: "/m/anomalies", icon: ShieldAlert, label: "Mes Anomalies" },
  { href: "/m/maintenance", icon: Wrench, label: "Maintenance" },
  { href: "/m/inspections", icon: Video, label: "Historique Inspections" },
  { href: "/m/expenses", icon: CircleDollarSign, label: "Notes de Frais" },
  { href: "/m/documents", icon: FileText, label: "Mes Documents" },
];

export default function MorePage() {
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y">
            {menuItems.map((item, index) => (
                <li key={index}>
                    <Link href={item.href}>
                        <div className="flex items-center p-4 cursor-pointer hover:bg-muted">
                            <item.icon className="w-5 h-5 mr-4 text-primary"/>
                            <span className="flex-grow font-medium">{item.label}</span>
                            <ChevronRight className="w-5 h-5 text-muted-foreground"/>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
