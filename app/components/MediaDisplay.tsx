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
    bannerId?: string; // Analytics tracking ke liye ID
}

export default function MediaDisplay({ 
    url, 
    type = "image", 
    alt = "Media", 
    controls = true, 
    thumbnailOnly = false,
    bannerId 
}: MediaDisplayProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasTracked, setHasTracked] = useState(false);

    if (!url) return null;

    // Cloudinary video thumbnail trick
    let thumbnailUrl = url;
    if (type === "video" && url.includes("cloudinary.com")) {
        thumbnailUrl = url.replace(/\.[^/.]+$/, ".jpg");
    }

    // 1. Analytics Tracking (Jab video/image play ya screen par view ho)
    const handleMediaView = async () => {
        if (!bannerId || hasTracked) return;
        try {
            setHasTracked(true);
            const bannerRef = doc(db, "promotional_banners", bannerId);
            await updateDoc(bannerRef, {
                views: increment(1),
                uniqueVisitors: increment(1)
            });
        } catch (error) {
            console.error("Error tracking view:", error);
        }
    };

    // 2. Multi-video conflict fix (Aik waqt mein sirf aik video play hogi)
    const handlePlay = () => {
        handleMediaView();

        // Website ki baaki saari videos ko select karke pause kar do
        const allVideos = document.querySelectorAll("video");
        allVideos.forEach((v) => {
            if (v !== videoRef.current) {
                v.pause();
            }
        });
    };

    // Watch time tracking jab video play ho rahi ho
    useEffect(() => {
        // Agar timer use nahi ho raha toh variable declare karne ki zaroorat nahi, 
        // lekin agar future ke liye rakhna hai toh isko properly type/initialize karein:
        let watchTimer: NodeJS.Timeout | undefined = undefined;
        const videoElement = videoRef.current;

        const handleTimeUpdate = () => {
            // Har 5 seconds playback par watch time database mein add hoga
            if (bannerId && videoElement && !videoElement.paused) {
                // Throttle ya interval ke zariye safe update
            }
        };

        // Agar aap future mein setInterval lagana chahein toh yahan laga sakte hain:
        // watchTimer = setInterval(handleTimeUpdate, 5000);

        return () => {
            if (watchTimer) {
                clearInterval(watchTimer);
            }
        };
    }, [bannerId]);

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