
"use client";

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';

// This page is deprecated and replaced by the new multi-step workflow.
// It now redirects to the new workflow page to avoid breaking old links.
export default function DeprecatedWorkflowPage() {
    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId;

    useEffect(() => {
        if (tripId) {
            // Redirect to the new, consolidated inspection page
            router.replace(`/m/inspection/pre-trip/${tripId}`);
        }
    }, [router, tripId]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Redirection vers le nouveau processus d'inspection...</p>
        </div>
    );
}
