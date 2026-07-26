"use client";

import { useState } from "react";
import Header from "./../components/Header";
import Footer from "./../components/Footer";
import Sidebar from "./../components/Sidebar";

export default function AboutPage() {
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
                        selectedCategoryFilter={selectedCategoryFilter}
                        setSelectedCategoryFilter={setSelectedCategoryFilter}
                        selectedSubCategoryFilter={selectedSubCategory}
                        setSelectedSubCategoryFilter={setSelectedSubCategory}
                        setIsSidebarOpen={setIsSidebarOpen}
                    />
                </aside>

                <main style={{ flex: 1, background: "#ffffff", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }}>
                    <div style={{ textAlign: "center", marginBottom: "35px" }}>
                        <span style={{ backgroundColor: "#fef3c7", color: "#d97706", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                            Welcome to The Style Loft
                        </span>
                        <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: "900", color: "#0f172a", marginTop: "15px", marginBottom: "10px" }}>
                            Redefining Luxury & Elegance Worldwide
                        </h1>
                        <p style={{ fontSize: "15px", color: "#64748b", maxWidth: "700px", margin: "0 auto", lineHeight: "1.6" }}>
                            We curate timeless fashion and exclusive lifestyle products designed for those who appreciate premium quality and unmatched sophistication.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                        <div style={{ background: "#f8fafc", padding: "22px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                            <div style={{ fontSize: "28px", marginBottom: "10px" }}>✨</div>
                            <h3 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>100% Happy Customers</h3>
                            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>Our commitment to excellence ensures every single client receives exceptional care.</p>
                        </div>
                        <div style={{ background: "#f8fafc", padding: "22px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                            <div style={{ fontSize: "28px", marginBottom: "10px" }}>🔒</div>
                            <h3 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>Secure PayPal Payments</h3>
                            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>Shop with total peace of mind using trusted and encrypted global gateways.</p>
                        </div>
                        <div style={{ background: "#f8fafc", padding: "22px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                            <div style={{ fontSize: "28px", marginBottom: "10px" }}>🌍</div>
                            <h3 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "8px" }}>Global Shipping</h3>
                            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>Fast and reliable doorstep delivery anywhere in the world.</p>
                        </div>
                    </div>

                    {/* Call to Action Box */}
                    <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", padding: "35px 20px", borderRadius: "16px", textAlign: "center" }}>
                        <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: "900", marginBottom: "12px", color: "#f59e0b" }}>
                            Ready to Elevate Your Style?
                        </h2>
                        <p style={{ fontSize: "14px", color: "#cbd5e1", maxWidth: "600px", margin: "0 auto 20px auto", lineHeight: "1.6" }}>
                            Don't wait! Exclusive collections sell out fast. Grab your favorite pieces today and experience luxury delivered right to your door.
                        </p>
                        <a href="/" style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#0f172a", padding: "12px 28px", borderRadius: "8px", fontWeight: "900", textDecoration: "none", display: "inline-block", boxShadow: "0 4px 15px rgba(245,158,11,0.4)" }}>
                            🛍️ Explore Collection Now
                        </a>
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