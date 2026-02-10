
"use client";

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { pastTrips } from "@/lib/trip-history-data";
import { Separator } from "@/components/ui/separator";
import { Truck, Calendar, Clock, User, Building, MapPin, Video, ShieldAlert, CircleDollarSign } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export default function TripHistoryDetailPage() {
  const params = useParams();
  const tripId = params.tripId;
  const trip = pastTrips.find((t) => t.id === tripId);

  if (!trip) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trajet non trouvé</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Le trajet que vous recherchez n'a pas pu être trouvé.</p>
        </CardContent>
      </Card>
    );
  }

  const getResultVariant = (result?: string) => {
    if (result === "Dommage détecté") return "destructive";
    return "secondary";
  };


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{trip.id}</CardTitle>
          <CardDescription>Détails du trajet du {trip.date}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center">
            <Building className="h-5 w-5 mr-3 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-semibold">{trip.client}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center">
            <MapPin className="h-5 w-5 mr-3 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Départ</p>
              <p className="font-semibold">{trip.startLocation}</p>
            </div>
          </div>
          <div className="flex items-center">
            <MapPin className="h-5 w-5 mr-3 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Arrivée</p>
              <p className="font-semibold">{trip.endLocation}</p>
            </div>
          </div>
           <Separator />
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-3 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Horaires</p>
              <p className="font-semibold">{trip.startTime} - {trip.endTime} ({trip.duration})</p>
            </div>
          </div>
           <Separator />
            <div className="flex items-center">
            <Truck className="h-5 w-5 mr-3 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Véhicule</p>
              <p className="font-semibold">{trip.vehicle}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
              <CardTitle className="flex items-center text-lg"><Video className="mr-2"/>Inspections Vidéo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                    <p className="font-semibold">Pré-trajet</p>
                    <div className="aspect-video w-full relative rounded-md overflow-hidden bg-muted">
                        <Image src={trip.inspections.pre.thumbnailUrl} alt="Pré-trajet" layout="fill" objectFit="cover" data-ai-hint="truck side" />
                    </div>
                    <Badge variant={getResultVariant(trip.inspections.pre.status)}>{trip.inspections.pre.status}</Badge>
               </div>
                <div className="space-y-2">
                    <p className="font-semibold">Post-trajet</p>
                    <div className="aspect-video w-full relative rounded-md overflow-hidden bg-muted">
                        <Image src={trip.inspections.post.thumbnailUrl} alt="Post-trajet" layout="fill" objectFit="cover" data-ai-hint="truck front" />
                    </div>
                     <Badge variant={getResultVariant(trip.inspections.post.status)}>{trip.inspections.post.status}</Badge>
               </div>
          </CardContent>
      </Card>
      
       <Card>
          <CardHeader>
              <CardTitle className="flex items-center text-lg"><ShieldAlert className="mr-2"/>Anomalies Déclarées</CardTitle>
          </CardHeader>
          <CardContent>
              {trip.anomalies.length > 0 ? (
                <ul className="space-y-2">
                  {trip.anomalies.map(anomaly => (
                    <li key={anomaly.id} className="text-sm p-2 bg-muted rounded-md">{anomaly.description}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune anomalie déclarée pour ce trajet.</p>
              )}
          </CardContent>
      </Card>
      
       <Card>
          <CardHeader>
              <CardTitle className="flex items-center text-lg"><CircleDollarSign className="mr-2"/>Notes de Frais</CardTitle>
          </CardHeader>
          <CardContent>
              {trip.expenses.length > 0 ? (
                 <ul className="space-y-2">
                  {trip.expenses.map(expense => (
                    <li key={expense.id} className="flex justify-between items-center text-sm p-2 bg-muted rounded-md">
                      <span>{expense.type}</span>
                      <span className="font-semibold">{expense.amount.toFixed(2)}€</span>
                    </li>
                  ))}
                </ul>
              ) : (
                 <p className="text-sm text-muted-foreground">Aucune note de frais soumise pour ce trajet.</p>
              )}
          </CardContent>
      </Card>

    </div>
  );
}
