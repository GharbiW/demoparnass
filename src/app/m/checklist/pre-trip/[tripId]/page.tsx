
"use client";

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

// This page is deprecated and replaced by the new multi-step workflow.
// It now redirects to the new workflow page to avoid breaking old links.
export default function DeprecatedChecklistPage() {
    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId;

    useEffect(() => {
        if (tripId) {
            router.replace(`/m/start-trip/${tripId}`);
        }
    }, [router, tripId]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Redirection vers le nouveau processus de démarrage...</p>
        </div>
    );
}
