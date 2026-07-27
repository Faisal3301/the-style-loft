"use client";

import { useState, useEffect } from "react";
import { db } from "./../config/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

interface AnalyticsRecord {
    id: string;
    title: string;
    mediaUrl: string;
    mediaType: "image" | "video";
    views: number;
    totalWatchTimeSeconds: number;
    uniqueVisitors: number;
    createdAt?: any;
}

export default function PromotionsAdminPage() {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // Total Summary Stats
    const [totalViews, setTotalViews] = useState(0);
    const [totalWatchTime, setTotalWatchTime] = useState(0);
    const [totalVisitors, setTotalVisitors] = useState(0);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "promotional_banners"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const list: AnalyticsRecord[] = [];
            
            let vSum = 0;
            let wSum = 0;
            let userSum = 0;

            snap.forEach(d => {
                const data = d.data() as any;
                
                // Real data fetching without any mock / random fallback
                const views = Number(data.views) || 0;
                const watchTime = Number(data.totalWatchTimeSeconds) || 0;
                const visitors = Number(data.uniqueVisitors) || 0;

                vSum += views;
                wSum += watchTime;
                userSum += visitors;

                list.push({
                    id: d.id,
                    title: data.title || "Untitled Campaign",
                    mediaUrl: data.mediaUrl || "",
                    mediaType: data.mediaType || "image",
                    views,
                    totalWatchTimeSeconds: watchTime,
                    uniqueVisitors: visitors,
                    createdAt: data.createdAt
                });
            });

            setAnalyticsData(list);
            setTotalViews(vSum);
            setTotalWatchTime(wSum);
            setTotalVisitors(userSum);
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // Format seconds into readable Hours/Minutes
    const formatWatchTime = (totalSeconds: number) => {
        if (!totalSeconds || totalSeconds === 0) return "0 mins";
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        if (hrs > 0) return `${hrs} hrs ${mins} mins`;
        return `${mins} mins`;
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1400px", margin: "0 auto", padding: "10px", width: "100%", boxSizing: "border-box" }}>
            
            {/* Top Header Banner */}
            <div style={{ backgroundColor: "#1e293b", color: "#fff", padding: "24px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "900", margin: 0, color: "#febd69" }}>📊 Creator Studio & Real Visitor Analytics</h1>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Real-time database tracking metrics for audience traffic, session durations, and campaign engagement.</p>
            </div>

            {/* Analytics Overview Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                
                <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Total Unique Visitors</span>
                    <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{loading ? "..." : totalVisitors.toLocaleString()}</h2>
                    <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "bold" }}>👥 Real database count</span>
                </div>

                <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Total Content Views</span>
                    <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{loading ? "..." : totalViews.toLocaleString()}</h2>
                    <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: "bold" }}>👁️ Across all campaigns</span>
                </div>

                <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Total Watch Time</span>
                    <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{loading ? "..." : formatWatchTime(totalWatchTime)}</h2>
                    <span style={{ fontSize: "11px", color: "#9333ea", fontWeight: "bold" }}>⏳ Actual accumulated duration</span>
                </div>

            </div>

            {/* Detailed Performance Table */}
            <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: "#0f172a" }}>Campaign Performance Records</h3>
                    <button 
                        onClick={fetchAnalytics}
                        style={{ backgroundColor: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                    >
                        🔄 Refresh Stats
                    </button>
                </div>

                {loading ? (
                    <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>Loading real metrics...</p>
                ) : analyticsData.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>No tracking records found in promotional_banners collection.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#475569", backgroundColor: "#f8fafc" }}>
                                    <th style={{ padding: "12px" }}>Media & Title</th>
                                    <th style={{ padding: "12px" }}>Type</th>
                                    <th style={{ padding: "12px" }}>Unique Visitors</th>
                                    <th style={{ padding: "12px" }}>Views</th>
                                    <th style={{ padding: "12px" }}>Watch Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyticsData.map(item => (
                                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                                            {item.mediaType === "video" ? (
                                                <video src={item.mediaUrl} style={{ width: "50px", height: "40px", objectFit: "cover", borderRadius: "6px", backgroundColor: "#000" }} />
                                            ) : (
                                                <img src={item.mediaUrl} alt={item.title} style={{ width: "50px", height: "40px", objectFit: "cover", borderRadius: "6px", backgroundColor: "#000" }} />
                                            )}
                                            <div>
                                                <div style={{ fontWeight: "bold", color: "#0f172a" }}>{item.title}</div>
                                                <div style={{ fontSize: "11px", color: "#64748b" }}>ID: {item.id}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px", textTransform: "capitalize", fontWeight: "600", color: item.mediaType === "video" ? "#9333ea" : "#2563eb" }}>
                                            {item.mediaType === "video" ? "📹 Video" : "🖼️ Image"}
                                        </td>
                                        <td style={{ padding: "12px", fontWeight: "700", color: "#0f172a" }}>
                                            👥 {item.uniqueVisitors}
                                        </td>
                                        <td style={{ padding: "12px", fontWeight: "700", color: "#0f172a" }}>
                                            👁️ {item.views}
                                        </td>
                                        <td style={{ padding: "12px", fontWeight: "700", color: "#16a34a" }}>
                                            ⏳ {formatWatchTime(item.totalWatchTimeSeconds)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}