
"use client";

import { useEffect, useState } from "react";
import { initializeFirebase } from ".";
import { FirebaseProvider } from "./provider";
import { FirebaseApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { Firestore } from "firebase/firestore";

interface FirebaseInstances {
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
}

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
    const [firebase, setFirebase] = useState<FirebaseInstances | null>(null);

    useEffect(() => {
        // This ensures that Firebase is initialized only on the client side.
        if (typeof window !== 'undefined' && !firebase) {
            setFirebase(initializeFirebase());
        }
    }, [firebase]);

    if (!firebase) {
        // You can return a loader here if you want
        return null; 
    }

    return (
        <FirebaseProvider app={firebase.app} auth={firebase.auth} firestore={firebase.firestore}>
            {children}
        </FirebaseProvider>
    );
}
