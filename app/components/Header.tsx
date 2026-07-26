"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { auth, db } from "./../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface HeaderProps {
    cartCount?: number;
    country?: "US" | "UK";
    setCountry?: (val: "US" | "UK") => void;
    searchQuery?: string;
    setSearchQuery?: (val: string) => void;
    selectedCategoryFilter?: string;
    setSelectedCategoryFilter?: (val: string) => void;
    setSelectedSubCategoryFilter?: (val: string) => void;
    setVisibleCount?: (val: number) => void;
    categoriesList?: any[];
    isSidebarOpen?: boolean;
    setIsSidebarOpen?: (val: boolean) => void;
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
    const [user, setUser] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setUserData(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setIsDropdownOpen(false);
            alert("✅ Signed out successfully!");
            router.push("/");
        } catch (error: any) {
            alert(`⚠️ Error signing out: ${error.message}`);
        }
    };

    return (
        <>
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
                /* Desktop links layout */
                .desktop-nav-links {
                    display: flex;
                    align-items: center;
                    gap: 28px; 
                    margin-left: 20px;
                }
                .mobile-only-links {
                    display: none;
                }
                
                /* Mobile specific layout: Forces ONLY nav links to second line */
                @media (max-width: 900px) {
                    .desktop-nav-links {
                        display: none !important;
                    }
                    .mobile-only-links {
                        display: flex !important;
                        width: 100% !important;
                        justify-content: center !important;
                        gap: 25px !important;
                        margin-top: 6px !important;
                        padding-top: 6px !important;
                        border-top: 1px solid rgba(51, 65, 85, 0.4);
                    }
                    .mobile-header-top {
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 8px;
                    }
                    .mobile-search-bar {
                        order: 2;
                        width: 100% !important;
                        margin-top: 4px;
                    }
                    .mobile-header-container {
                        padding: 10px 12px !important;
                    }
                    .hide-on-mobile {
                        display: none !important;
                    }
                }
            `}</style>

            <header className="animated-header mobile-header-container" style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", position: "sticky", top: 0, zIndex: 1000, width: "100%", boxSizing: "border-box" }}>

                {/* Top Row container for Mobile / Main row for Desktop */}
                <div className="mobile-header-top" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "10px" }}>
                    
                    {/* Left: Sidebar Menu & Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                            onClick={() => setIsSidebarOpen && setIsSidebarOpen(!isSidebarOpen)}
                            className="nav-hover"
                            style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f8fafc", padding: "7px 10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: "bold" }}
                            title="Toggle Sidebar Menu"
                        >
                            <span style={{ fontSize: "14px" }}>☰</span>
                            <span className="hide-on-mobile">Menu</span>
                        </button>

                        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(245,158,11,0.4)", backgroundColor: "#ffffff", flexShrink: 0 }}>
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
                                <div style={{ fontSize: "14px", fontWeight: "900", color: "#ffffff", letterSpacing: "0.5px", lineHeight: "1.1" }}>
                                    The Style Loft
                                </div>
                                <div style={{ fontSize: "9px", color: "#f59e0b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                                    Luxury Emporium
                                </div>
                            </div>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="desktop-nav-links">
                            <Link href="/" className="nav-hover" style={{ textDecoration: "none", fontSize: "13px", color: "#cbd5e1", fontWeight: "600" }}>Home</Link>
                            <Link href="/about" className="nav-hover" style={{ textDecoration: "none", fontSize: "13px", color: "#cbd5e1", fontWeight: "600" }}>About Us</Link>
                            <Link href="/contact" className="nav-hover" style={{ textDecoration: "none", fontSize: "13px", color: "#cbd5e1", fontWeight: "600" }}>Contact Us</Link>
                        </div>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="mobile-search-bar" style={{ display: "flex", flex: "1", maxWidth: "420px", minWidth: "220px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#ffffff", border: isSearchFocused ? "2px solid #f59e0b" : "2px solid transparent", transition: "all 0.3s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                        <select
                            value={selectedCategoryFilter || ""}
                            onChange={(e) => {
                                if (setSelectedCategoryFilter) setSelectedCategoryFilter(e.target.value);
                                if (setSelectedSubCategoryFilter) setSelectedSubCategoryFilter("ALL");
                                if (setVisibleCount) setVisibleCount(12);
                            }}
                            style={{ backgroundColor: "#f8fafc", border: "none", padding: "0 8px", fontSize: "11px", outline: "none", cursor: "pointer", color: "#0f172a", fontWeight: "bold", borderRight: "1px solid #e2e8f0", maxWidth: "100px" }}
                        >
                            <option value="ALL">All Categories</option>
                            {Array.isArray(categoriesList) && categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>

                        <input
                            type="text"
                            placeholder="Search exclusive styles..."
                            value={searchQuery}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            onChange={(e) => {
                                if (setSearchQuery) setSearchQuery(e.target.value);
                                if (setVisibleCount) setVisibleCount(12);
                            }}
                            style={{ flex: 1, padding: "8px 10px", border: "none", fontSize: "12px", outline: "none", color: "#0f172a", backgroundColor: "#ffffff" }}
                        />

                        <button style={{ backgroundColor: "#f59e0b", border: "none", padding: "0 12px", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }} title="Search">
                            🔍
                        </button>
                    </div>

                    {/* Right: Sign In & Cart Icon */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative" }} ref={dropdownRef}>
                        {user ? (
                            <div>
                                <div
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#f59e0b", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", fontSize: "14px", cursor: "pointer", boxShadow: "0 2px 8px rgba(245,158,11,0.4)", border: "2px solid #fff" }}
                                    title="User Profile Menu"
                                >
                                    {userData?.name ? userData.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : "U")}
                                </div>

                                {isDropdownOpen && (
                                    <div style={{ position: "absolute", right: "40px", top: "45px", width: "220px", backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.4)", zIndex: 1100, overflow: "hidden", padding: "10px 0" }}>
                                        <div style={{ padding: "10px 16px", borderBottom: "1px solid #334155" }}>
                                            <div style={{ fontSize: "13px", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {userData?.name || "Valued Customer"}
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {user.email}
                                            </div>
                                        </div>
                                        <div style={{ padding: "6px" }}>
                                            <button
                                                onClick={handleSignOut}
                                                style={{ width: "100%", background: "#ef4444", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "6px" }}
                                            >
                                                <span>🚪</span> Sign Out / Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" style={{ textDecoration: "none" }}>
                                <div
                                    className="nav-hover"
                                    style={{ display: "flex", alignItems: "center", gap: "5px", background: "#1e293b", padding: "7px 10px", borderRadius: "8px", cursor: "pointer", border: "1px solid #334155", color: "#e2e8f0", fontSize: "12px", fontWeight: "600" }}
                                    title="Customer Sign In"
                                >
                                    <span style={{ fontSize: "14px" }}>👤</span>
                                    <span className="hide-on-mobile">Sign In</span>
                                </div>
                            </Link>
                        )}

                        {/* Cart Icon */}
                        <Link href="/cart" style={{ textDecoration: "none" }}>
                            <div
                                className="nav-hover"
                                style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", padding: "7px 12px", borderRadius: "8px", cursor: "pointer", color: "#0f172a", fontWeight: "bold", boxShadow: "0 4px 10px rgba(245,158,11,0.3)" }}
                                title="View Shopping Bag"
                            >
                                <span style={{ fontSize: "15px" }}>🛒</span>
                                <span style={{ fontSize: "12px", fontWeight: "900" }}>{cartCount}</span>
                            </div>
                        </Link>
                    </div>

                </div>

                {/* Mobile Second Line ONLY for Navigation Links */}
                <div className="mobile-only-links">
                    <Link href="/" className="nav-hover" style={{ textDecoration: "none", fontSize: "13px", color: "#cbd5e1", fontWeight: "600" }}>Home</Link>
                    <Link href="/about" className="nav-hover" style={{ textDecoration: "none", fontSize: "13px", color: "#cbd5e1", fontWeight: "600" }}>About Us</Link>
                    <Link href="/contact" className="nav-hover" style={{ textDecoration: "none", fontSize: "13px", color: "#cbd5e1", fontWeight: "600" }}>Contact Us</Link>
                </div>
            </header>
        </>
    );
}