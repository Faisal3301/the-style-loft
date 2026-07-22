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
            {/* 🌟 HEADER ANIMATIONS & STYLES */}
            <style jsx global>{`
        @keyframes headerGlow {
          0% { box-shadow: 0 4px 20px rgba(15, 23, 42, 0.4); }
          50% { box-shadow: 0 4px 25px rgba(245, 158, 11, 0.25); }
          100% { box-shadow: 0 4px 20px rgba(15, 23, 42, 0.4); }
        }
        @keyframes logoPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        .animated-header {
          animation: headerGlow 4s infinite ease-in-out;
        }
        .logo-badge {
          animation: logoPulse 3s infinite ease-in-out;
        }
        .nav-hover {
          transition: all 0.2s ease;
        }
        .nav-hover:hover {
          color: #f59e0b !important;
          transform: translateY(-1px);
        }
      `}</style>

            <header className="animated-header" style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "15px", position: "sticky", top: 0, zIndex: 1000 }}>

                {/* Left: Sidebar Toggle, Logo & Store Name */}
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="nav-hover"
                        style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f8fafc", padding: "9px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "bold" }}
                        title="Toggle Sidebar Menu"
                    >
                        <span style={{ fontSize: "16px" }}>☰</span>
                        <span>Menu</span>
                    </button>

                    <div
                        className="logo-badge"
                        style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
                        onClick={() => { setSelectedCategoryFilter("ALL"); setSelectedSubCategoryFilter("ALL"); }}
                    >
                        {/* Store Logo Image */}
                        <div style={{ width: "38px", height: "38px", borderRadius: "10px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(245,158,11,0.4)", backgroundColor: "#ffffff" }}>
                            <img
                                src="/logo.png"
                                alt="The Style Loft Logo"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => {
                                    // Agar image na mile toh error bachane ke liye safe fallback icon
                                    e.currentTarget.src = "https://via.placeholder.com/150?text=SL";
                                }}
                            />
                        </div>

                        {/* Store Name & Region Tag */}
                        <div>
                            <div style={{ fontSize: "17px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.5px", lineHeight: "1.2" }}>
                                The Style Loft
                            </div>
                            <div style={{ fontSize: "11px", color: "#f59e0b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>
                                Luxury Emporium
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Advanced Search Bar */}
                <div style={{ display: "flex", flex: "1", maxWidth: "600px", minWidth: "280px", borderRadius: "10px", overflow: "hidden", backgroundColor: "#ffffff", border: isSearchFocused ? "2px solid #f59e0b" : "2px solid transparent", transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                    <select
                        value={selectedCategoryFilter}
                        onChange={(e) => {
                            setSelectedCategoryFilter(e.target.value);
                            setSelectedSubCategoryFilter("ALL");
                            setVisibleCount(12);
                        }}
                        style={{ backgroundColor: "#f8fafc", border: "none", padding: "0 14px", fontSize: "13px", outline: "none", cursor: "pointer", color: "#0f172a", fontWeight: "bold", borderRight: "1px solid #e2e8f0" }}
                    >
                        <option value="ALL">All Categories</option>
                        {Array.isArray(categoriesList) && categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>

                    <input
                        type="text"
                        placeholder={country === "US" ? "Search US luxury collections, items..." : "Search UK designer styles..."}
                        value={searchQuery}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setVisibleCount(12);
                        }}
                        style={{ flex: 1, padding: "11px 16px", border: "none", fontSize: "14px", outline: "none", color: "#0f172a", backgroundColor: "#ffffff" }}
                    />

                    <button style={{ backgroundColor: "#f59e0b", border: "none", padding: "0 22px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} title="Search">
                        🔍
                    </button>
                </div>

                {/* Right Section: Country Switcher, Sign In & Cart */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>

                    {/* Country Switcher (US / UK) */}
                    <div
                        onClick={() => setCountry(country === "US" ? "UK" : "US")}
                        className="nav-hover"
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", background: "#1e293b", padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", color: "#fff", border: "1px solid #334155" }}
                        title="Switch Country Region & Currency"
                    >
                        <span style={{ fontSize: "15px" }}>{country === "US" ? "🇺🇸" : "🇬🇧"}</span>
                        <span>{country === "US" ? "USD ($)" : "GBP (£)"}</span>
                    </div>

                    {/* Sign In Option */}
                    <div
                        className="nav-hover"
                        style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", border: "1px solid #334155", color: "#e2e8f0", fontSize: "13px", fontWeight: "600" }}
                        title="Customer Sign In"
                        onClick={() => alert("Sign In portal coming up next!")}
                    >
                        <span>👤</span>
                        <span style={{ display: "inline" }}>Sign In</span>
                    </div>

                    {/* Cart Option with Icon */}
                    <div
                        className="nav-hover"
                        style={{ display: "flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", padding: "9px 16px", borderRadius: "8px", cursor: "pointer", color: "#0f172a", fontWeight: "bold", boxShadow: "0 4px 12px rgba(245,158,11,0.3)" }}
                        title="View Shopping Bag"
                        onClick={() => alert("Shopping Bag is empty.")}
                    >
                        <span style={{ fontSize: "16px" }}>🛒</span>
                        <div style={{ display: "flex", flexDirection: "column", lineHeight: "1" }}>
                            <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "800", color: "#78350f" }}>My Cart</span>
                            <span style={{ fontSize: "13px", fontWeight: "900" }}>0 Items</span>
                        </div>
                    </div>

                </div>
            </header>
        </>
    );
}