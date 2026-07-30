"use client";

import { useEffect, useRef } from "react";
import { db } from "../config/firebase";
import { doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";

export function useActivityTracker(mediaId: string, mediaType: "video" | "image") {
    const watchTimeRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!mediaId) return;

        // 1. Unique Visitor Session Check
        const sessionKey = `viewed_${mediaId}`;
        const hasViewedSession = sessionStorage.getItem(sessionKey);

        const recordView = async () => {
            const docRef = doc(db, "products", mediaId); // Ya promotional_banners
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const updates: any = {
                    views: increment(1)
                };
                if (!hasViewedSession) {
                    updates.uniqueVisitors = increment(1);
                    sessionStorage.setItem(sessionKey, "true");
                }
                await updateDoc(docRef, updates);
            }
        };

        recordView();

        // 2. Active Watch Time / Engagement Timer (Har 5 second baad watch time update karega agar user active hai)
        intervalRef.current = setInterval(() => {
            watchTimeRef.current += 5;
        }, 5000);

        // Jab user page chore ya video band kare toh total watch time database mein save ho jaye
        const handleBeforeUnload = async () => {
            if (watchTimeRef.current > 0) {
                const docRef = doc(db, "products", mediaId);
                try {
                    await updateDoc(docRef, {
                        totalWatchTimeSeconds: increment(watchTimeRef.current)
                    });
                } catch (e) {
                    console.error("Error saving watch time", e);
                }
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            handleBeforeUnload();
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [mediaId]);
}