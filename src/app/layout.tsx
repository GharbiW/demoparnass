"use client";

import type { Metadata } from 'next';
import { Inter, Source_Code_Pro } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { cn } from '@/lib/utils';

const metadata: Metadata = {
  title: 'Parnass Platform',
  description: 'Plateforme de gestion de transport pour Groupe Parnass',
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <title>{metadata.title as React.ReactNode}</title>
        <meta name="description" content={metadata.description as string} />
      </head>
      <body 
        className={cn(
          "font-body antialiased",
          inter.variable,
          sourceCodePro.variable
        )} 
        suppressHydrationWarning
      >
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
