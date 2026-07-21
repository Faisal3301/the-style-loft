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
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f6f8", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            
            {/* Sidebar */}
            <aside style={{
                width: isSidebarOpen ? "260px" : "260px",
                backgroundColor: "#131921",
                color: "#fff",
                position: "fixed",
                top: 0,
                bottom: 0,
                left: 0,
                zIndex: 100,
                transition: "transform 0.3s ease",
                transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
                display: "flex",
                flexDirection: "column",
                boxShadow: "4px 0 10px rgba(0,0,0,0.1)"
            }} className="admin-sidebar">
                
                <div style={{ padding: "20px", backgroundColor: "#0f1111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#febd69" }}>
                        THE STYLE LOFT <span style={{ color: "#fff", fontSize: "12px" }}>Admin</span>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}
                        className="mobile-close-btn"
                    >
                        ✕
                    </button>
                </div>

                <nav style={{ flex: 1, padding: "15px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
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
                                    borderRadius: "6px",
                                    color: isActive ? "#131921" : "#d5d9d9",
                                    backgroundColor: isActive ? "#febd69" : "transparent",
                                    textDecoration: "none",
                                    fontWeight: isActive ? "bold" : "normal",
                                    fontSize: "14px",
                                    transition: "0.2s"
                                }}
                            >
                                <span>{item.icon}</span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: "15px", borderTop: "1px solid #232f3e" }}>
                    <Link href="/" style={{ color: "#febd69", textDecoration: "none", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                        🌐 Live Site View
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column" }} className="admin-content">
                
                {/* Navbar */}
                <header style={{ 
                    height: "60px", 
                    backgroundColor: "#ffffff", 
                    borderBottom: "1px solid #e2e8f0", 
                    display: "flex", 
                    alignItems: "center", 
                    justify: "space-between", 
                    padding: "0 20px",
                    position: "sticky",
                    top: 0,
                    zIndex: 90
                }}>
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{ background: "#f0f2f2", border: "1px solid #d5d9d9", borderRadius: "4px", padding: "8px 12px", cursor: "pointer", fontWeight: "bold" }}
                    >
                        ☰ Menu
                    </button>

                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                        Dashboard Control Panel
                    </span>
                </header>

                {/* Body Content - Responsive Width */}
                <main style={{ padding: "20px", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                    {children}
                </main>
            </div>

            <style jsx global>{`
                @media (min-width: 1024px) {
                    .admin-sidebar {
                        transform: translateX(0) !important;
                    }
                    .admin-content {
                        margin-left: 260px;
                    }
                    .mobile-close-btn {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}