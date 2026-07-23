"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    const menuItems = [
        { name: "Analytics & Views", path: "/dashboard", icon: "📊" },
        { name: "Categories", path: "/dashboard/categories", icon: "🏷️" },
        { name: "Products & Drive Sync", path: "/dashboard/products", icon: "📦" },
        { name: "Sales & Offers", path: "/dashboard/promotions", icon: "🔥" },
        { name: "Client Emails & Bulk Mail", path: "/dashboard/email-marketing", icon: "✉️" },
        { name: "Live Chat", path: "/dashboard/chat", icon: "💬" },
        { name: "Sales Reports", path: "/dashboard/sales-analytics", icon: "📈" }, // Live Chat ke neeche New Sales Tab
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f6f8", fontFamily: "system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>
            
            {/* Mobile Backdrop Overlay jab sidebar khuli ho */}
            {isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        zIndex: 99,
                        backdropFilter: "blur(2px)"
                    }}
                    className="mobile-backdrop"
                />
            )}

            {/* Sidebar */}
            <aside style={{
                width: "260px",
                backgroundColor: "#131921",
                color: "#fff",
                position: "fixed",
                top: 0,
                bottom: 0,
                left: 0,
                zIndex: 100,
                transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
                display: "flex",
                flexDirection: "column",
                boxShadow: "4px 0 15px rgba(0,0,0,0.2)"
            }} className="admin-sidebar">
                
                <div style={{ padding: "20px", backgroundColor: "#0f1111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "15px", fontWeight: "bold", color: "#febd69", letterSpacing: "0.5px" }}>
                        THE STYLE LOFT <span style={{ color: "#fff", fontSize: "11px", fontWeight: "normal" }}>Admin</span>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer", padding: "4px 8px" }}
                        className="mobile-close-btn"
                    >
                        ✕
                    </button>
                </div>

                <nav style={{ flex: 1, padding: "15px 10px", display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto" }}>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link 
                                key={item.path} 
                                href={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px 15px",
                                    borderRadius: "8px",
                                    color: isActive ? "#131921" : "#d5d9d9",
                                    backgroundColor: isActive ? "#febd69" : "transparent",
                                    textDecoration: "none",
                                    fontWeight: isActive ? "bold" : "normal",
                                    fontSize: "14px",
                                    transition: "background 0.2s"
                                }}
                            >
                                <span style={{ fontSize: "16px" }}>{item.icon}</span>
                                <span style={{ whiteSpace: "nowrap" }}>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: "15px", borderTop: "1px solid #232f3e" }}>
                    <Link href="/" style={{ color: "#febd69", textDecoration: "none", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
                        🌐 Live Site View
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", minWidth: 0 }} className="admin-content">
                
                {/* Navbar */}
                <header style={{ 
                    height: "60px", 
                    backgroundColor: "#ffffff", 
                    borderBottom: "1px solid #e2e8f0", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    padding: "0 16px",
                    position: "sticky",
                    top: 0,
                    zIndex: 90,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}>
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#1e293b" }}
                    >
                        <span style={{ fontSize: "16px" }}>☰</span> Menu
                    </button>

                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                        Dashboard Control Panel
                    </span>
                </header>

                {/* Body Content */}
                <main style={{ padding: "16px", width: "100%", maxWidth: "100%", boxSizing: "border-box", flex: 1 }}>
                    {children}
                </main>
            </div>

            <style jsx global>{`
                /* Desktop view adjustments (1024px and above) */
                @media (min-width: 1024px) {
                    .admin-sidebar {
                        transform: translateX(0) !important;
                        box-shadow: none !important;
                    }
                    .admin-content {
                        margin-left: 260px;
                    }
                    .mobile-close-btn, .mobile-backdrop {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}