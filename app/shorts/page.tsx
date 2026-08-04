"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../config/firebase";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    increment,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface ShortsModalProps {
    onClose: () => void;
    onAddToCart?: (product: any) => void;
}

interface MediaItem {
    id: string;
    title?: string;
    name?: string;
    mediaUrl?: string;
    url?: string;
    thumbnailUrl?: string;
    imageUrl?: string;
    mediaType?: string; // 'video' or 'image'
    type?: string;
    price?: number;
    description?: string;
    category?: string;
    likesCount?: number;
    viewsCount?: number;
    totalWatchTime?: number;
}

export default function ShortsModal({ onClose, onAddToCart }: ShortsModalProps) {
    const router = useRouter();
    const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
    const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isVideoBuffering, setIsVideoBuffering] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);

    // Category & Search State
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [categoriesList, setCategoriesList] = useState<string[]>([]);
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchModal, setShowSearchModal] = useState(false);

    // Auth & Interactions
    const [user, setUser] = useState<any>(null);
    const [isLiked, setIsLiked] = useState(false);

    // Comments State
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);

    // Watch Time & View Tracker Refs
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const touchStartY = useRef<number>(0);
    const watchStartTimeRef = useRef<number>(Date.now());
    const viewLoggedRef = useRef<boolean>(false);

    // 1. Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // 2. Fetch ALL Data (Videos AND Photos)
    useEffect(() => {
        const fetchMedia = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, "products"));
                const fetchedList: MediaItem[] = [];
                const catSet = new Set<string>();

                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data() as MediaItem;
                    const mUrl = data.mediaUrl || data.url || data.imageUrl;
                    let mType = data.mediaType || data.type;

                    // Auto Detect Media Type (Image or Video)
                    if (!mType && mUrl) {
                        if (mUrl.match(/\.(mp4|webm|mov)$/i)) {
                            mType = "video";
                        } else {
                            mType = "image";
                        }
                    }

                    if (mUrl) {
                        fetchedList.push({
                            ...data, // Pehle data spread karein
                            id: docSnap.id, // ✅ Firestore doc id explicitly assign karein
                            mediaUrl: mUrl,
                            thumbnailUrl: data.thumbnailUrl || data.imageUrl || mUrl,
                            mediaType: mType || "image",
                            title: data.name || data.title || "The Style Loft",
                            likesCount: data.likesCount || 0,
                            viewsCount: data.viewsCount || 0,
                            totalWatchTime: data.totalWatchTime || 0
                        });
                        if (data.category) catSet.add(data.category);
                    }
                });

                const shuffled = fetchedList.sort(() => 0.5 - Math.random());
                setAllMedia(shuffled);
                setFilteredMedia(shuffled);
                setCategoriesList(Array.from(catSet));
            } catch (error) {
                console.error("Firebase fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMedia();
    }, []);

    // 3. Advanced Filtering (Category + Search Query)
    useEffect(() => {
        let result = allMedia;

        if (selectedCategory !== "ALL") {
            result = result.filter(item => item.category === selectedCategory);
        }

        if (searchQuery.trim() !== "") {
            const queryLower = searchQuery.toLowerCase();
            result = result.filter(item =>
                (item.title && item.title.toLowerCase().includes(queryLower)) ||
                (item.description && item.description.toLowerCase().includes(queryLower)) ||
                (item.category && item.category.toLowerCase().includes(queryLower))
            );
        }

        setFilteredMedia(result);
        setCurrentIndex(0);
    }, [selectedCategory, searchQuery, allMedia]);

    const currentItem = filteredMedia[currentIndex];

    // 4. Track Analytics (Views & Time Spent)
    const saveWatchAnalytics = async () => {
        if (!currentItem?.id) return;
        const watchDurationSeconds = Math.floor((Date.now() - watchStartTimeRef.current) / 1000);

        if (watchDurationSeconds > 0) {
            try {
                const docRef = doc(db, "products", currentItem.id);
                await updateDoc(docRef, {
                    totalWatchTime: increment(watchDurationSeconds)
                });
            } catch (err) {
                console.error("Watch time update error:", err);
            }
        }
    };

    const recordMediaView = async () => {
        if (!currentItem?.id || viewLoggedRef.current) return;
        viewLoggedRef.current = true;

        try {
            const docRef = doc(db, "products", currentItem.id);
            await updateDoc(docRef, {
                viewsCount: increment(1)
            });
            setFilteredMedia(list =>
                list.map(item => item.id === currentItem.id ? { ...item, viewsCount: (item.viewsCount || 0) + 1 } : item)
            );
        } catch (err) {
            console.error("View increment error:", err);
        }
    };

    useEffect(() => {
        saveWatchAnalytics();
        watchStartTimeRef.current = Date.now();
        viewLoggedRef.current = false;
        setIsVideoBuffering(true);

        if (currentItem && currentItem.mediaType !== "video") {
            recordMediaView();
        }

        return () => {
            saveWatchAnalytics();
        };
    }, [currentIndex]);

    // 5. Comments Listener
    useEffect(() => {
        if (!currentItem?.id) return;

        const commentsRef = collection(db, "products", currentItem.id, "comments");
        const q = query(commentsRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list: any[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setComments(list);
        });

        return () => unsubscribe();
    }, [currentItem?.id]);

    // Navigation Gestures & Keys
    const handleNext = () => {
        if (currentIndex < filteredMedia.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setIsPlaying(true);
            setIsLiked(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setIsPlaying(true);
            setIsLiked(false);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY.current - touchEndY;
        if (diff > 50) handleNext();
        else if (diff < -50) handlePrev();
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.deltaY > 30) handleNext();
        else if (e.deltaY < -30) handlePrev();
    };

    // Firebase Likes
    const handleRealLike = async () => {
        if (!currentItem?.id) return;
        const newLikeState = !isLiked;
        setIsLiked(newLikeState);

        try {
            const docRef = doc(db, "products", currentItem.id);
            await updateDoc(docRef, {
                likesCount: increment(newLikeState ? 1 : -1)
            });
            setFilteredMedia(list => list.map(item => item.id === currentItem.id ? { ...item, likesCount: (item.likesCount || 0) + (newLikeState ? 1 : -1) } : item));
        } catch (err) {
            console.error("Like error:", err);
        }
    };

    // Firebase Comments
    const handleAddRealComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("⚠️ Please log in to post a comment!");
            onClose();
            router.push("/login");
            return;
        }

        if (!newComment.trim() || !currentItem?.id) return;
        setCommentLoading(true);

        try {
            const commentsRef = collection(db, "products", currentItem.id, "comments");
            await addDoc(commentsRef, {
                text: newComment.trim(),
                userEmail: user.email || "Customer",
                userName: user.displayName || user.email?.split("@")[0] || "Customer",
                createdAt: serverTimestamp()
            });
            setNewComment("");
        } catch (error) {
            console.error("Comment error:", error);
        } finally {
            setCommentLoading(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "#000000",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
            }}
            onWheel={handleWheel}
        >
            {/* Phone Feed Frame */}
            <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "430px",
                    height: "100vh",
                    backgroundColor: "#000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden"
                }}
            >
                {loading ? (
                    <div style={{ color: "#f59e0b", textAlign: "center" }}>
                        <div style={{ fontSize: "32px", animation: "pulse 1s infinite" }}>✨</div>
                        <p style={{ fontSize: "12px", fontWeight: "bold", marginTop: "8px" }}>Loading Reel Feed...</p>
                    </div>
                ) : filteredMedia.length === 0 ? (
                    <div style={{ color: "#fff", textAlign: "center" }}>
                        <p style={{ fontSize: "14px", fontWeight: "bold" }}>No items found</p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                style={{ backgroundColor: "#f59e0b", border: "none", padding: "6px 12px", borderRadius: "12px", color: "#000", fontSize: "11px", fontWeight: "bold", cursor: "pointer", marginTop: "8px" }}
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Render Video or Image based on mediaType */}
                        {currentItem?.mediaType === "video" ? (
                            <video
                                ref={videoRef}
                                key={currentItem?.id}
                                src={currentItem?.mediaUrl}
                                poster={currentItem?.thumbnailUrl}
                                autoPlay
                                loop
                                muted={isMuted}
                                playsInline
                                onWaiting={() => setIsVideoBuffering(true)}
                                onPlaying={() => {
                                    setIsVideoBuffering(false);
                                    recordMediaView();
                                }}
                                onClick={() => {
                                    if (videoRef.current) {
                                        if (isPlaying) videoRef.current.pause();
                                        else videoRef.current.play();
                                        setIsPlaying(!isPlaying);
                                    }
                                }}
                                style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                            />
                        ) : (
                            <img
                                key={currentItem?.id}
                                src={currentItem?.mediaUrl}
                                alt={currentItem?.title || "Product"}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        )}

                        {/* Video Buffering Spinner */}
                        {currentItem?.mediaType === "video" && isVideoBuffering && (
                            <div style={{
                                position: "absolute",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px",
                                zIndex: 12,
                                background: "rgba(0,0,0,0.5)",
                                padding: "12px 20px",
                                borderRadius: "30px",
                                backdropFilter: "blur(4px)"
                            }}>
                                <div style={{
                                    width: "28px", height: "28px",
                                    border: "3px solid rgba(255,255,255,0.3)",
                                    borderTop: "3px solid #f59e0b",
                                    borderRadius: "50%",
                                    animation: "spin 0.8s linear infinite"
                                }}></div>
                                <span style={{ color: "#fff", fontSize: "11px", fontWeight: "600" }}>Loading...</span>
                            </div>
                        )}

                        {/* Top English Order Prompts, Social Icons & Search Trigger */}
                        <div style={{
                            position: "absolute",
                            top: "15px",
                            left: "12px",
                            right: "12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            alignItems: "center",
                            zIndex: 20
                        }}>
                            {/* Top Header Row with Search Button */}
                            <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ width: "32px" }}></div> {/* Spacer */}

                                {/* English Statement for US/UK Target */}
                                <div style={{
                                    background: "rgba(0, 0, 0, 0.75)",
                                    backdropFilter: "blur(12px)",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                    padding: "6px 14px",
                                    borderRadius: "20px",
                                    color: "#ffffff",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    letterSpacing: "0.2px",
                                    boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
                                    textAlign: "center"
                                }}>
                                    📩 DM us to place your order! Worldwide Shipping ✈️
                                </div>

                                {/* Advanced Search Button (🔍) */}
                                <button
                                    onClick={() => setShowSearchModal(true)}
                                    style={{
                                        width: "34px",
                                        height: "34px",
                                        borderRadius: "50%",
                                        backgroundColor: "rgba(0,0,0,0.6)",
                                        border: "1px solid rgba(255,255,255,0.2)",
                                        color: "#ffffff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer"
                                    }}
                                    title="Search Products"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </button>
                            </div>

                            {/* Original Social Media DM Icons */}
                            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                {/* WhatsApp */}
                                <a
                                    href={`https://wa.me/923000000000?text=Hi,%20I%20want%20to%20order:%20${encodeURIComponent(currentItem?.title || "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#25D366",
                                        display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(37,211,102,0.4)"
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-0.981z" />
                                    </svg>
                                </a>

                                {/* Instagram */}
                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        width: "36px", height: "36px", borderRadius: "50%",
                                        background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%,#d6249f 60%,#285AEB 90%)",
                                        display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(214,36,159,0.4)"
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>

                                {/* Email */}
                                <a
                                    href={`mailto:info@thestyleloft.com?subject=Order%20Inquiry%20-${encodeURIComponent(currentItem?.title || "")}`}
                                    style={{
                                        width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#EA4335",
                                        display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(234,67,53,0.4)"
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* TikTok Right Action Sidebar */}
                        <div style={{
                            position: "absolute",
                            right: "12px",
                            bottom: "85px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "18px",
                            alignItems: "center",
                            zIndex: 25
                        }}>
                            {/* Like Button */}
                            <button onClick={handleRealLike} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "#ef4444" : "none"} stroke={isLiked ? "#ef4444" : "#ffffff"} strokeWidth="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                </div>
                                <span style={{ fontSize: "11px", fontWeight: "bold", marginTop: "4px" }}>{currentItem?.likesCount || 0}</span>
                            </button>

                            {/* Comment Button */}
                            <button onClick={() => setShowComments(true)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                </div>
                                <span style={{ fontSize: "11px", fontWeight: "bold", marginTop: "4px" }}>{comments.length}</span>
                            </button>

                            {/* Views Count */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </div>
                                <span style={{ fontSize: "11px", fontWeight: "bold", marginTop: "4px" }}>{currentItem?.viewsCount || 0}</span>
                            </div>

                            {/* Add to Cart */}
                            <button
                                onClick={() => {
                                    if (onAddToCart && currentItem) onAddToCart(currentItem);
                                    else alert(`🛒 "${currentItem?.title}" added to cart!`);
                                }}
                                style={{
                                    width: "42px", height: "42px", borderRadius: "50%",
                                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.5)"
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5">
                                    <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                                </svg>
                            </button>

                            {/* Audio Toggle (Only for Videos) */}
                            {currentItem?.mediaType === "video" && (
                                <button onClick={() => setIsMuted(!isMuted)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
                                    {isMuted ? "🔇" : "🔊"}
                                </button>
                            )}
                        </div>

                        {/* Title & Price Bottom Overlay */}
                        <div style={{
                            position: "absolute", bottom: "60px", left: 0, right: "70px", padding: "16px 14px",
                            background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)", color: "#ffffff", pointerEvents: "none", zIndex: 15
                        }}>
                            <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "bold" }}>{currentItem?.title}</h3>
                            {currentItem?.price && (
                                <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "900", color: "#22c55e" }}>
                                    $ / £ {currentItem.price.toLocaleString()}
                                </p>
                            )}
                            {currentItem?.description && (
                                <p style={{ margin: 0, fontSize: "11px", color: "#cbd5e1", lineHeight: "1.3" }}>
                                    {currentItem.description}
                                </p>
                            )}
                        </div>

                        {/* TikTok Bottom Navigation Bar */}
                        <div style={{
                            position: "absolute", bottom: 0, left: 0, right: 0, height: "55px", backgroundColor: "rgba(0, 0, 0, 0.95)",
                            borderTop: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 30
                        }}>
                            <button onClick={() => { saveWatchAnalytics(); onClose(); router.push("/"); }} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                                <span style={{ fontSize: "10px", fontWeight: "600" }}>Home</span>
                            </button>

                            {/* Category Trigger */}
                            <div style={{ position: "relative" }}>
                                <button onClick={() => setShowCategoryMenu(!showCategoryMenu)} style={{ background: "none", border: "none", color: "#f59e0b", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                    <span style={{ fontSize: "10px", fontWeight: "bold" }}>Category</span>
                                </button>

                                {showCategoryMenu && (
                                    <div style={{ position: "absolute", bottom: "50px", left: "-40px", backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px", padding: "8px", width: "140px", zIndex: 100 }}>
                                        <div onClick={() => { setSelectedCategory("ALL"); setShowCategoryMenu(false); }} style={{ padding: "6px", fontSize: "11px", color: selectedCategory === "ALL" ? "#f59e0b" : "#fff", cursor: "pointer" }}>✨ All</div>
                                        {categoriesList.map((cat, i) => (
                                            <div key={i} onClick={() => { setSelectedCategory(cat); setShowCategoryMenu(false); }} style={{ padding: "6px", fontSize: "11px", color: selectedCategory === cat ? "#f59e0b" : "#cbd5e1", cursor: "pointer" }}>{cat}</div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={() => { saveWatchAnalytics(); onClose(); router.push("/about"); }} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                <span style={{ fontSize: "10px", fontWeight: "600" }}>About</span>
                            </button>

                            <button onClick={() => { saveWatchAnalytics(); onClose(); router.push("/contact"); }} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                <span style={{ fontSize: "10px", fontWeight: "600" }}>Contact</span>
                            </button>

                            <button onClick={() => { saveWatchAnalytics(); onClose(); if (user) router.push("/dashboard"); else router.push("/login"); }} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                <span style={{ fontSize: "10px", fontWeight: "600" }}>{user ? "Profile" : "Login"}</span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ADVANCED SEARCH MODAL */}
            {showSearchModal && (
                <div style={{
                    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                    backgroundColor: "rgba(15, 23, 42, 0.95)", backdropFilter: "blur(10px)",
                    zIndex: 10010, display: "flex", flexDirection: "column", padding: "20px"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h3 style={{ margin: 0, color: "#f59e0b", fontSize: "16px", fontWeight: "bold" }}>🔍 Search Catalog</h3>
                        <button onClick={() => setShowSearchModal(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}>✕</button>
                    </div>

                    <input
                        type="text"
                        placeholder="Search by title, style, or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        style={{
                            width: "100%", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff",
                            padding: "12px 16px", borderRadius: "12px", fontSize: "14px", outline: "none", marginBottom: "16px"
                        }}
                    />

                    <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px" }}>
                        Found {filteredMedia.length} results matching "{searchQuery}"
                    </p>

                    <button
                        onClick={() => setShowSearchModal(false)}
                        style={{
                            backgroundColor: "#f59e0b", border: "none", color: "#0f172a", padding: "12px",
                            borderRadius: "12px", fontWeight: "bold", cursor: "pointer", marginTop: "auto"
                        }}
                    >
                        Apply Search
                    </button>
                </div>
            )}

            {/* COMMENTS DRAWER */}
            {showComments && (
                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: "55vh", backgroundColor: "#0f172a",
                    borderTopLeftRadius: "20px", borderTopRightRadius: "20px", padding: "16px", zIndex: 10005, display: "flex", flexDirection: "column", borderTop: "1px solid #334155"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h4 style={{ margin: 0, color: "#f59e0b", fontSize: "14px" }}>Comments ({comments.length})</h4>
                        <button onClick={() => setShowComments(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer" }}>✕</button>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                        {comments.length === 0 ? (
                            <p style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", marginTop: "30px" }}>No comments yet. Log in and be the first to comment!</p>
                        ) : (
                            comments.map((c) => (
                                <div key={c.id} style={{ backgroundColor: "#1e293b", padding: "8px 12px", borderRadius: "10px" }}>
                                    <div style={{ fontSize: "11px", color: "#f59e0b", fontWeight: "bold" }}>{c.userName}</div>
                                    <p style={{ margin: 0, fontSize: "12px", color: "#e2e8f0" }}>{c.text}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleAddRealComment} style={{ display: "flex", gap: "8px" }}>
                        <input
                            type="text"
                            placeholder={user ? "Write a comment..." : "Log in to comment"}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={!user || commentLoading}
                            style={{ flex: 1, backgroundColor: "#1e293b", border: "1px solid #334155", color: "#fff", padding: "10px 14px", borderRadius: "20px", fontSize: "12px" }}
                        />
                        <button type="submit" disabled={!user || commentLoading} style={{ backgroundColor: user ? "#f59e0b" : "#475569", border: "none", color: "#0f172a", padding: "8px 16px", borderRadius: "20px", fontWeight: "bold", fontSize: "12px" }}>
                            Send
                        </button>
                    </form>
                </div>
            )}

            <style jsx global>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}