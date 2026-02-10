
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pastTrips } from "@/lib/trip-history-data";
import Link from "next/link";

export default function TripHistoryPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Trajets</CardTitle>
        <CardDescription>Vos 30 derniers trajets terminés.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pastTrips.map((trip) => (
            <Link key={trip.id} href={`/m/trip-history/${trip.id}`} passHref>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                <div>
                  <p className="font-semibold">{trip.id} - {trip.client}</p>
                  <p className="text-sm text-muted-foreground">{trip.date}</p>
                </div>
                <Badge variant="secondary">{trip.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
