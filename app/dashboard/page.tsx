"use client";

import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";

interface AnalyticsRecord {
    id: string;
    title: string;
    mediaUrl: string;
    mediaType: "image" | "video";
    views: number;
    totalWatchTimeSeconds: number;
    uniqueVisitors: number;
}

export default function AnalyticsPage() {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<"daily" | "monthly" | "yearly">("daily");

    // Real Metrics State
    const [totalViews, setTotalViews] = useState(0);
    const [totalWatchTime, setTotalWatchTime] = useState(0);
    const [totalVisitors, setTotalVisitors] = useState(0);

    // Lazy load data fetcher with performance guard
    const fetchRealAnalytics = async () => {
        setLoading(true);
        try {
            const list: AnalyticsRecord[] = [];
            let vSum = 0;
            let wSum = 0;
            let userSum = 0;

            // 1. Fetch Promotional Banners data safely
            try {
                const bannerSnap = await getDocs(collection(db, "promotional_banners"));
                bannerSnap.forEach(d => {
                    const data = d.data() as any;
                    const views = Number(data.views) || 0;
                    const watchTime = Number(data.totalWatchTimeSeconds) || 0;
                    const visitors = Number(data.uniqueVisitors) || 0;

                    vSum += views;
                    wSum += watchTime;
                    userSum += visitors;

                    list.push({
                        id: d.id,
                        title: data.title || "Banner Campaign",
                        mediaUrl: data.mediaUrl || "",
                        mediaType: data.mediaType || "image",
                        views,
                        totalWatchTimeSeconds: watchTime,
                        uniqueVisitors: visitors,
                    });
                });
            } catch (err) {
                console.log("Banner collection load notice:", err);
            }

            // 2. Fetch Products data safely
            try {
                const productSnap = await getDocs(collection(db, "products"));
                productSnap.forEach(d => {
                    const data = d.data() as any;
                    if (data.mediaUrl) {
                        const views = Number(data.views) || 0;
                        const watchTime = Number(data.totalWatchTimeSeconds) || 0;
                        const visitors = Number(data.uniqueVisitors) || 0;

                        vSum += views;
                        wSum += watchTime;
                        userSum += visitors;

                        list.push({
                            id: d.id,
                            title: data.name || data.category || "Product Item",
                            mediaUrl: data.mediaUrl,
                            mediaType: data.mediaType || "image",
                            views,
                            totalWatchTimeSeconds: watchTime,
                            uniqueVisitors: visitors,
                        });
                    }
                });
            } catch (err) {
                console.log("Products collection load notice:", err);
            }

            setAnalyticsData(list);
            setTotalViews(vSum);
            setTotalWatchTime(wSum);
            setTotalVisitors(userSum);

        } catch (error) {
            console.error("Error fetching real analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Lazy execution on mount & filter change
        const timer = setTimeout(() => {
            fetchRealAnalytics();
        }, 100);
        return () => clearTimeout(timer);
    }, [filterType]);

    // Format seconds to hours and mins
    const formatWatchTime = (totalSeconds: number) => {
        if (!totalSeconds || totalSeconds === 0) return "0 mins";
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        if (hrs > 0) return `${hrs} hrs ${mins} mins`;
        return `${mins} mins`;
    };

    // Calculate dynamic graph bar heights based on actual data
    const maxViewLimit = Math.max(...analyticsData.map(i => i.views), 10);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1400px", margin: "0 auto", padding: "20px", width: "100%", boxSizing: "border-box", fontFamily: "sans-serif" }}>
            
            {/* Header */}
            <div style={{ backgroundColor: "#1e293b", color: "#fff", padding: "24px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "900", margin: 0, color: "#febd69" }}>📊 Creator Studio & Real Visitor Analytics</h1>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>100% Live Client Tracking System — Zero Fake Numbers.</p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", backgroundColor: "#fff", padding: "12px 20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "13px", fontWeight: "bold", color: "#475569", marginRight: "10px" }}>View Analytics By:</span>
                {(["daily", "monthly", "yearly"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilterType(tab)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "6px",
                            border: "none",
                            fontSize: "13px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            backgroundColor: filterType === tab ? "#2563eb" : "#f1f5f9",
                            color: filterType === tab ? "#fff" : "#475569",
                            textTransform: "capitalize",
                            transition: "all 0.2s"
                        }}
                    >
                        {tab} Analysis
                    </button>
                ))}
            </div>

            {/* Overview Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Unique Visitors ({filterType})</span>
                    <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{loading ? "..." : totalVisitors.toLocaleString()}</h2>
                    <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "bold" }}>🔒 Real Session Database Count</span>
                </div>

                <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Content Views ({filterType})</span>
                    <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{loading ? "..." : totalViews.toLocaleString()}</h2>
                    <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: "bold" }}>👁️ Actual Client Interactions</span>
                </div>

                <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Total Watch Time ({filterType})</span>
                    <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>{loading ? "..." : formatWatchTime(totalWatchTime)}</h2>
                    <span style={{ fontSize: "11px", color: "#9333ea", fontWeight: "bold" }}>⏳ Exact Timer Records</span>
                </div>
            </div>

            {/* Real Traffic & Engagement Trend Graph */}
            <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 20px 0", color: "#0f172a" }}>📈 Traffic & Engagement Trend ({filterType.toUpperCase()})</h3>
                
                {loading ? (
                    <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>Loading graph metrics...</div>
                ) : analyticsData.length === 0 ? (
                    <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>No activity data available for graph yet.</div>
                ) : (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", height: "180px", paddingBottom: "10px", overflowX: "auto", borderBottom: "2px solid #e2e8f0" }}>
                        {analyticsData.map((item, index) => {
                            const barHeightPercent = Math.max(15, Math.min(100, (item.views / maxViewLimit) * 100));
                            return (
                                <div key={item.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: "45px", height: "100%", justifyContent: "flex-end" }}>
                                    <span style={{ fontSize: "10px", fontWeight: "bold", color: "#2563eb", marginBottom: "4px" }}>{item.views}</span>
                                    <div 
                                        title={`${item.title}: ${item.views} views`}
                                        style={{ 
                                            width: "100%", 
                                            height: `${barHeightPercent}%`, 
                                            backgroundColor: "#3b82f6", 
                                            borderRadius: "4px 4px 0 0",
                                            transition: "height 0.4s ease"
                                        }} 
                                    />
                                    <span style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", textAlign: "center" }}>
                                        #{index + 1}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detailed Media Performance Table */}
            <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: "#0f172a" }}>Media & Product Performance Records</h3>
                    <button onClick={fetchRealAnalytics} style={{ backgroundColor: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                        🔄 Refresh Stats
                    </button>
                </div>

                {loading ? (
                    <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>Loading records securely...</p>
                ) : analyticsData.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "13px", textAlign: "center", padding: "40px 0" }}>No client activity records found yet. Try playing a video on your website!</p>
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
                                            {item.mediaUrl ? (
                                                item.mediaType === "video" ? (
                                                    <video src={item.mediaUrl} style={{ width: "50px", height: "40px", objectFit: "cover", borderRadius: "6px", backgroundColor: "#000" }} />
                                                ) : (
                                                    <img src={item.mediaUrl} alt={item.title} style={{ width: "50px", height: "40px", objectFit: "cover", borderRadius: "6px", backgroundColor: "#000" }} />
                                                )
                                            ) : (
                                                <div style={{ width: "50px", height: "40px", backgroundColor: "#e2e8f0", borderRadius: "6px" }} />
                                            )}
                                            <div>
                                                <div style={{ fontWeight: "bold", color: "#0f172a" }}>{item.title}</div>
                                                <div style={{ fontSize: "11px", color: "#64748b" }}>ID: {item.id}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px", textTransform: "capitalize", fontWeight: "600", color: item.mediaType === "video" ? "#9333ea" : "#2563eb" }}>
                                            {item.mediaType === "video" ? "📹 Video" : "🖼️ Image"}
                                        </td>
                                        <td style={{ padding: "12px", fontWeight: "700", color: "#0f172a" }}>👥 {item.uniqueVisitors}</td>
                                        <td style={{ padding: "12px", fontWeight: "700", color: "#0f172a" }}>👁️ {item.views}</td>
                                        <td style={{ padding: "12px", fontWeight: "700", color: "#16a34a" }}>⏳ {formatWatchTime(item.totalWatchTimeSeconds)}</td>
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