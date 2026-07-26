"use client";

import { useState } from "react";
import Header from "./../components/Header";
import Footer from "./../components/Footer";
import Sidebar from "./../components/Sidebar";

export default function ContactPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
    const [selectedSubCategory, setSelectedSubCategory] = useState("ALL");

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc", color: "#0f172a" }}>
            <Header
                cartCount={cartCount}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategoryFilter={selectedCategoryFilter}
                setSelectedCategoryFilter={setSelectedCategoryFilter}
                setSelectedSubCategoryFilter={setSelectedSubCategory}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            <div style={{ display: "flex", flex: 1, maxWidth: "1400px", margin: "0 auto", width: "100%", padding: "20px", gap: "20px", boxSizing: "border-box" }} className="main-layout-container">
                <aside style={{ width: "260px", flexShrink: 0 }} className="desktop-sidebar-wrapper">
                    <Sidebar 
    isSidebarOpen={isSidebarOpen}
    categoriesList={[]}
    selectedCategoryFilter={selectedCategoryFilter || "ALL"}
    setSelectedCategoryFilter={setSelectedCategoryFilter || (() => {})}
    setIsSidebarOpen={setIsSidebarOpen}
    setVisibleCount={() => {}}
/>
                </aside>

                <main style={{ flex: 1, background: "#ffffff", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }}>
                    <div style={{ textAlign: "center", marginBottom: "35px" }}>
                        <span style={{ backgroundColor: "#fef3c7", color: "#d97706", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                            Get in Touch
                        </span>
                        <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: "900", color: "#0f172a", marginTop: "15px", marginBottom: "10px" }}>
                            We’re Here to Help You 24/7
                        </h1>
                        <p style={{ fontSize: "15px", color: "#64748b", maxWidth: "600px", margin: "0 auto", lineHeight: "1.6" }}>
                            Have questions about your order, global shipping, or custom pieces? Reach out to our support team across our official platforms below.
                        </p>
                    </div>

                    {/* Platform Links Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "35px" }}>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", background: "#f8fafc", padding: "22px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", color: "#0f172a", display: "block", transition: "all 0.2s" }}>
                            <div style={{ fontSize: "28px", marginBottom: "10px" }}>📸</div>
                            <h3 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "5px" }}>Instagram DM</h3>
                            <p style={{ fontSize: "13px", color: "#64748b" }}>Chat with us directly for instant styling advice and quick order updates.</p>
                        </a>

                        <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", background: "#f8fafc", padding: "22px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", color: "#0f172a", display: "block", transition: "all 0.2s" }}>
                            <div style={{ fontSize: "28px", marginBottom: "10px" }}>💬</div>
                            <h3 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "5px" }}>WhatsApp Support</h3>
                            <p style={{ fontSize: "13px", color: "#64748b" }}>Fast and secure customer care on WhatsApp for immediate inquiries.</p>
                        </a>

                        <a href="mailto:support@thestyleloft.com" style={{ textDecoration: "none", background: "#f8fafc", padding: "22px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", color: "#0f172a", display: "block", transition: "all 0.2s" }}>
                            <div style={{ fontSize: "28px", marginBottom: "10px" }}>✉️</div>
                            <h3 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "5px" }}>Email Us</h3>
                            <p style={{ fontSize: "13px", color: "#64748b" }}>support@thestyleloft.com — Professional inquiries & global shipments.</p>
                        </a>
                    </div>

                    {/* Direct Contact Notice */}
                    <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", padding: "18px", borderRadius: "10px", textAlign: "center", color: "#92400e", fontSize: "13px", fontWeight: "600", lineHeight: "1.5" }}>
                        ⚡ Looking for custom orders or wholesale global shipping details? Send us a Direct Message (DM) on our social channels for VIP assistance!
                    </div>
                </main>
            </div>

            <Footer />

            <style jsx global>{`
                @media (max-width: 900px) {
                    .desktop-sidebar-wrapper {
                        display: none !important;
                    }
                    .main-layout-container {
                        padding: 10px !important;
                    }
                }
            `}</style>
        </div>
    );
}