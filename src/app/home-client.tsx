
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export function HomeClient() {
  const { user, claims, loading } = useUser();
  const router = useRouter();

  // This effect handles automatic redirection for users who are not logged in.
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <p>Chargement...</p>
        </div>
    );
  }
  
  // If user is logged in, show role-based navigation buttons
  if (user) {
    return (
        <div className="relative flex h-screen w-full items-center justify-center">
           <Image
            src="https://groupe-parnass.com/wp-content/uploads/2025/05/groupe-parnass-2.webp"
            alt="Background"
            fill
            style={{objectFit: 'cover'}}
            className="z-0"
            data-ai-hint="trucks warehouse"
          />
          <div className="absolute inset-0 bg-black/50 z-10" />
          <div className="z-20">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-2xl">Sélectionner une vue</CardTitle>
                <CardDescription>
                  Simulez une connexion en tant que différents types d'utilisateurs pour accéder à l'application correspondante.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Button size="lg" onClick={() => router.replace('/dashboard')}>
                  Vue Administrateur / Opérateur
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.replace('/m/home')}>
                  Vue Chauffeur
                </Button>
                <p className="pt-4 text-center text-sm text-muted-foreground">
                  Votre rôle actuel est : <span className="font-bold">{claims?.role || 'Non défini'}</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
  }

  // Fallback loading message while waiting for the redirect effect to run
  return (
    <div className="flex h-screen items-center justify-center">
      <p>Redirection...</p>
    </div>
  );
}
