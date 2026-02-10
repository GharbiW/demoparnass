
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This is a placeholder page that redirects to the inspections history.
// The main inspection workflow is now pre-trip and post-trip.
export default function InspectionRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/m/inspections');
    }, [router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Redirection...</p>
        </div>
    );
}
