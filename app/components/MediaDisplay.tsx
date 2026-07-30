"use client";

import { useState, useRef, useEffect } from "react";
import { db } from "../config/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

interface MediaDisplayProps {
    url?: string;
    type?: "image" | "video";
    alt?: string;
    controls?: boolean;
    thumbnailOnly?: boolean;
    bannerId?: string; // Analytics tracking ke liye ID (ye promotional_banners ya products doc id ho sakti hai)
    collectionName?: "promotional_banners" | "products"; // Kis collection mein update krna hai
}

export default function MediaDisplay({ 
    url, 
    type = "image", 
    alt = "Media", 
    controls = true, 
    thumbnailOnly = false,
    bannerId,
    collectionName = "promotional_banners"
}: MediaDisplayProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasTrackedView, setHasTrackedView] = useState(false);

    if (!url) return null;

    // Cloudinary video thumbnail trick
    let thumbnailUrl = url;
    if (type === "video" && url.includes("cloudinary.com")) {
        thumbnailUrl = url.replace(/\.[^/.]+$/, ".jpg");
    }

    // 1. View & Unique Visitor Tracking (Sirf ek bar count hoga per session/component mount)
    const handleMediaView = async () => {
        if (!bannerId || hasTrackedView) return;
        
        const sessionKey = `viewed_${bannerId}`;
        const hasSessionView = sessionStorage.getItem(sessionKey);

        try {
            setHasTrackedView(true);
            const targetCollection = collectionName || "promotional_banners";
            const bannerRef = doc(db, targetCollection, bannerId);
            
            const updates: any = {
                views: increment(1)
            };

            if (!hasSessionView) {
                updates.uniqueVisitors = increment(1);
                sessionStorage.setItem(sessionKey, "true");
            }

            await updateDoc(bannerRef, updates);
        } catch (error) {
            console.error("Error tracking view:", error);
        }
    };

    // 2. Play Handler & Multi-video conflict fix
    const handlePlay = () => {
        handleMediaView();

        // Website ki baaki saari videos ko pause kar do taaki ek waqt mein aik hi chale
        const allVideos = document.querySelectorAll("video");
        allVideos.forEach((v) => {
            if (v !== videoRef.current) {
                v.pause();
            }
        });
    };

    // 3. Real Active Watch Time Tracker ( Jab tak video play rahegi, watch time count hoga )
    useEffect(() => {
        if (type !== "video" || !bannerId) return;

        let watchTimer: NodeJS.Timeout | null = null;
        const videoElement = videoRef.current;

        const startWatchTimer = () => {
            if (watchTimer) return;
            // Har 5 second continuous playback par database mein watch time barhta jayega
            watchTimer = setInterval(async () => {
                if (videoElement && !videoElement.paused) {
                    try {
                        const targetCollection = collectionName || "promotional_banners";
                        const docRef = doc(db, targetCollection, bannerId);
                        await updateDoc(docRef, {
                            totalWatchTimeSeconds: increment(5)
                        });
                    } catch (err) {
                        console.error("Error updating watch time:", err);
                    }
                }
            }, 5000);
        };

        const stopWatchTimer = () => {
            if (watchTimer) {
                clearInterval(watchTimer);
                watchTimer = null;
            }
        };

        const currentVideo = videoElement;
        if (currentVideo) {
            currentVideo.addEventListener("play", startWatchTimer);
            currentVideo.addEventListener("pause", stopWatchTimer);
            currentVideo.addEventListener("ended", stopWatchTimer);
        }

        return () => {
            stopWatchTimer();
            if (currentVideo) {
                currentVideo.removeEventListener("play", startWatchTimer);
                currentVideo.removeEventListener("pause", stopWatchTimer);
                currentVideo.removeEventListener("ended", stopWatchTimer);
            }
        };
    }, [bannerId, type, collectionName]);

    // Agar sirf thumbnail dikhana hai
    if (thumbnailOnly) {
        return (
            <div 
                onClick={handleMediaView}
                style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative", backgroundColor: "#000", cursor: "pointer" }}
            >
                <img 
                    src={type === "video" ? thumbnailUrl : url} 
                    alt={alt} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
                {type === "video" && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                        <span style={{ fontSize: "24px", color: "#fff", background: "rgba(0,0,0,0.6)", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>▶</span>
                    </div>
                )}
            </div>
        );
    }

    // Normal view (Full Video or Image)
    return (
        <div style={{ width: "100%", height: "100%", overflow: "hidden", backgroundColor: "#000" }}>
            {type === "video" ? (
                <video 
                    ref={videoRef}
                    src={url} 
                    poster={thumbnailUrl} 
                    controls={controls} 
                    preload="metadata"
                    onPlay={handlePlay}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
            ) : (
                <img 
                    src={url} 
                    alt={alt} 
                    onLoad={handleMediaView}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
            )}
        </div>
    );
}