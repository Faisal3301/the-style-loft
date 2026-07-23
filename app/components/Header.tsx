"use client";

import { useState } from "react";
import Image from "next/image";

interface HeaderProps {
    cartCount?: number;
    country: "US" | "UK";
    setCountry: (val: "US" | "UK") => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    selectedCategoryFilter: string;
    setSelectedCategoryFilter: (val: string) => void;
    setSelectedSubCategoryFilter: (val: string) => void;
    setVisibleCount: (val: number) => void;
    categoriesList: any[];
    isSidebarOpen: boolean;
    setIsSidebarOpen: (val: boolean) => void;
    [key: string]: any;
}

export default function Header({
    cartCount = 0,
    country,
    setCountry,
    searchQuery,
    setSearchQuery,
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    setSelectedSubCategoryFilter,
    setVisibleCount,
    categoriesList,
    isSidebarOpen,
    setIsSidebarOpen
}: HeaderProps) {
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    return (
        <>
            {/* 🌟 HEADER RESPONSIVE STYLES */}
            <style jsx global>{`
                @keyframes headerGlow {
                    0% { box-shadow: 0 4px 20px rgba(15, 23, 42, 0.4); }
                    50% { box-shadow: 0 4px 25px rgba(245, 158, 11, 0.25); }
                    100% { box-shadow: 0 4px 20px rgba(15, 23, 42, 0.4); }
                }
                .animated-header {
                    animation: headerGlow 4s infinite ease-in-out;
                }
                .nav-hover {
                    transition: all 0.2s ease;
                }
                .nav-hover:hover {
                    color: #f59e0b !important;
                    transform: translateY(-1px);
                }
                /* Mobile Specific Adjustments */
                @media (max-width: 768px) {
                    .mobile-header-container {
                        padding: 8px 12px !important;
                        gap: 10px !important;
                    }
                    .hide-on-mobile {
                        display: none !important;
                    }
                    .mobile-search-bar {
                        order: 3;
                        width: 100% !important;
                        margin-top: 4px;
                    }
                    .mobile-actions {
                        gap: 6px !important;
                    }
                    .mobile-btn {
                        padding: 6px 10px !important;
                        font-size: 11px !important;
                    }
                }
            `}</style>

            <header className="animated-header mobile-header-container" style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "15px", position: "sticky", top: 0, zIndex: 1000 }}>

                {/* Left: Sidebar Toggle & Store Name */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="nav-hover mobile-btn"
                        style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f8fafc", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "bold" }}
                        title="Toggle Sidebar Menu"
                    >
                        <span style={{ fontSize: "15px" }}>☰</span>
                        <span className="hide-on-mobile">Menu</span>
                    </button>

                    <div
                        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                        onClick={() => { setSelectedCategoryFilter("ALL"); setSelectedSubCategoryFilter("ALL"); }}
                    >
                        <div style={{ width: "34px", height: "34px", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(245,158,11,0.4)", backgroundColor: "#ffffff", flexShrink: 0 }}>
                            <img
                                src="/logo.png"
                                alt="The Style Loft Logo"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => {
                                    e.currentTarget.src = "https://via.placeholder.com/150?text=SL";
                                }}
                            />
                        </div>

                        <div>
                            <div style={{ fontSize: "15px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.5px", lineHeight: "1.1" }}>
                                The Style Loft
                            </div>
                            <div style={{ fontSize: "10px", color: "#f59e0b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                                Luxury Emporium
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Advanced Search Bar */}
                <div className="mobile-search-bar" style={{ display: "flex", flex: "1", maxWidth: "550px", minWidth: "260px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#ffffff", border: isSearchFocused ? "2px solid #f59e0b" : "2px solid transparent", transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                    <select
                        value={selectedCategoryFilter}
                        onChange={(e) => {
                            setSelectedCategoryFilter(e.target.value);
                            setSelectedSubCategoryFilter("ALL");
                            setVisibleCount(12);
                        }}
                        style={{ backgroundColor: "#f8fafc", border: "none", padding: "0 10px", fontSize: "12px", outline: "none", cursor: "pointer", color: "#0f172a", fontWeight: "bold", borderRight: "1px solid #e2e8f0", maxWidth: "110px" }}
                    >
                        <option value="ALL">All Categories</option>
                        {Array.isArray(categoriesList) && categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>

                    <input
                        type="text"
                        placeholder={country === "US" ? "Search US items..." : "Search UK styles..."}
                        value={searchQuery}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setVisibleCount(12);
                        }}
                        style={{ flex: 1, padding: "9px 12px", border: "none", fontSize: "13px", outline: "none", color: "#0f172a", backgroundColor: "#ffffff" }}
                    />

                    <button style={{ backgroundColor: "#f59e0b", border: "none", padding: "0 16px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }} title="Search">
                        🔍
                    </button>
                </div>

                {/* Right Section: Country Switcher, Sign In & Cart */}
                <div className="mobile-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>

                    {/* Country Switcher */}
                    <div
                        onClick={() => setCountry(country === "US" ? "UK" : "US")}
                        className="nav-hover mobile-btn"
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", background: "#1e293b", padding: "7px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", color: "#fff", border: "1px solid #334155" }}
                        title="Switch Country"
                    >
                        <span style={{ fontSize: "14px" }}>{country === "US" ? "🇺🇸" : "🇬🇧"}</span>
                        <span>{country === "US" ? "USD" : "GBP"}</span>
                    </div>

                    {/* Sign In Option */}
                    <div
                        className="nav-hover mobile-btn hide-on-mobile"
                        style={{ display: "flex", alignItems: "center", gap: "5px", background: "transparent", padding: "7px 10px", borderRadius: "8px", cursor: "pointer", border: "1px solid #334155", color: "#e2e8f0", fontSize: "12px", fontWeight: "600" }}
                        title="Customer Sign In"
                        onClick={() => alert("Sign In portal coming up next!")}
                    >
                        <span>👤</span>
                        <span>Sign In</span>
                    </div>

                    {/* Cart Option */}
                    <div
                        className="nav-hover mobile-btn"
                        style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", padding: "7px 12px", borderRadius: "8px", cursor: "pointer", color: "#0f172a", fontWeight: "bold", boxShadow: "0 4px 10px rgba(245,158,11,0.3)" }}
                        title="View Shopping Bag"
                        onClick={() => alert("Shopping Bag is empty.")}
                    >
                        <span style={{ fontSize: "15px" }}>🛒</span>
                        <div style={{ display: "flex", flexDirection: "column", lineHeight: "1" }}>
                            <span style={{ fontSize: "9px", textTransform: "uppercase", fontWeight: "800", color: "#78350f" }} className="hide-on-mobile">My Cart</span>
                            <span style={{ fontSize: "12px", fontWeight: "900" }}>{cartCount} Items</span>
                        </div>
                    </div>

                </div>
            </header>
        </>
    );
}