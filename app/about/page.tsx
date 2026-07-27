"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "./../components/Header";
import Footer from "./../components/Footer";
import { db } from "./../config/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

interface HappyCategory {
  id: string;
  name: string;
  subCategory: string;
}

interface HappyProof {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  mediaUrl: string;
  mediaType: string;
}

export default function ClientAboutAndProofsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [categoriesList, setCategoriesList] = useState<HappyCategory[]>([]);
  const [happyProofs, setHappyProofs] = useState<HappyProof[]>([]);
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [proofsFetched, setProofsFetched] = useState(false);

  // Active View Tab: 'ABOUT' or Category Name
  const [activeTab, setActiveTab] = useState<string>("ABOUT");

  // Filters
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("ALL");

  // Modal / Preview & Index for Next/Prev Swapping
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  // Fetch Categories on mount (Lazy load proofs later)
 useEffect(() => {
    const q = query(collection(db, "happy_customer_categories"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (catSnap) => {
      const fetchedCats: HappyCategory[] = [];
      catSnap.forEach(d => {
        fetchedCats.push({ id: d.id, ...d.data() } as HappyCategory);
      });
      setCategoriesList(fetchedCats);
    }, (err) => {
      console.error("Error fetching categories:", err);
    });

    document.title = "About Us & Customer Proofs - The Style Loft";
    
    return () => unsubscribe();
  }, []);

  // Lazy Load Proofs only when user clicks a category tab for the first time
  // Lazy Load Proofs with real-time sync once triggered
  const loadProofsIfNeeded = () => {
    if (!proofsFetched) {
      setLoadingProofs(true);
      
      const q = query(collection(db, "happy_customer_proofs"), orderBy("createdAt", "desc"));
      
      // onSnapshot use karne se real-time updates milte rahenge
      const unsubscribe = onSnapshot(q, (proofSnap) => {
        const fetchedProofs: HappyProof[] = [];
        proofSnap.forEach(d => {
          fetchedProofs.push({ id: d.id, ...d.data() } as HappyProof);
        });
        setHappyProofs(fetchedProofs);
        setLoadingProofs(false);
        setProofsFetched(true);
      }, (err) => {
        console.error("Error fetching proofs:", err);
        setLoadingProofs(false);
      });

      // Optional: Agar aap component unmount hone par unsubscribe karna chahein toh cleanup handle kar sakte hain
    }
  };

  const handleCategoryClick = (catName: string, subCatName?: string) => {
    setActiveTab(catName);
    setSelectedSubCategory(subCatName || "ALL");
    loadProofsIfNeeded();
    setIsSidebarOpen(false); // Close mobile sidebar on select
  };

  // Group categories into a tree structure: { [categoryName]: subCategories[] }
  const categoryTree = categoriesList.reduce((acc: { [key: string]: string[] }, cat) => {
    if (!acc[cat.name]) {
      acc[cat.name] = [];
    }
    if (cat.subCategory && !acc[cat.name].includes(cat.subCategory)) {
      acc[cat.name].push(cat.subCategory);
    }
    return acc;
  }, {});

  // Filter proofs based on active category & search
  const filteredProofs = happyProofs.filter(p => {
    const matchesCat = activeTab === "ABOUT" || p.category === activeTab;
    const matchesSubCat = selectedSubCategory === "ALL" || p.subCategory === selectedSubCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSubCat && matchesSearch;
  });

  // Next / Prev handlers for modal image swapping
  const handleNext = useCallback(() => {
    if (activeImageIndex !== null && activeImageIndex < filteredProofs.length - 1) {
      setActiveImageIndex(activeImageIndex + 1);
    } else {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, filteredProofs.length]);

  const handlePrev = useCallback(() => {
    if (activeImageIndex !== null && activeImageIndex > 0) {
      setActiveImageIndex(activeImageIndex - 1);
    } else {
      setActiveImageIndex(filteredProofs.length - 1);
    }
  }, [activeImageIndex, filteredProofs.length]);

  // Keyboard Arrow Keys & Escape listener for Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeImageIndex === null) return;
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        setActiveImageIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, handleNext, handlePrev]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc", color: "#0f172a", fontFamily: "'Inter', Arial, sans-serif" }}>
      <Header 
        cartCount={cartCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategoryFilter={activeTab}
        setSelectedCategoryFilter={setActiveTab}
        setSelectedSubCategoryFilter={setSelectedSubCategory}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Mobile Menu Toggle Bar */}
      <div className="mobile-toggle-bar" style={{ display: "none", padding: "12px 16px", background: "#ffffff", borderBottom: "1px solid #e2e8f0", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>
          📂 Current: {activeTab === "ABOUT" ? "About Us & PayPal Security" : `${activeTab} ${selectedSubCategory !== "ALL" ? `> ${selectedSubCategory}` : ""}`}
        </span>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
        >
          {isSidebarOpen ? "✕ Close Menu" : "📱 Open Menu & About"}
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, maxWidth: "1500px", margin: "0 auto", width: "100%", padding: "24px", gap: "24px", boxSizing: "border-box", position: "relative" }} className="main-layout-container">
        
        {/* Sidebar Navigation (Desktop & Mobile Slide-over) */}
        <aside className={`sidebar-container ${isSidebarOpen ? "open" : ""}`} style={{ width: "280px", flexShrink: 0, background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", height: "fit-content", position: "sticky", top: "90px", zIndex: 50 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "900", color: "#0f172a", margin: 0 }}>
              🧭 Navigation Menu
            </h3>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="mobile-close-btn"
              style={{ display: "none", background: "none", border: "none", fontSize: "18px", fontWeight: "bold", cursor: "pointer", color: "#64748b" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* About Us Tab */}
            <button
              onClick={() => { setActiveTab("ABOUT"); setIsSidebarOpen(false); }}
              style={{
                textAlign: "left",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeTab === "ABOUT" ? "#2563eb" : "transparent",
                color: activeTab === "ABOUT" ? "#ffffff" : "#334155",
                fontWeight: activeTab === "ABOUT" ? "bold" : "600",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              ✨ About Us & PayPal Security
            </button>

            <div style={{ margin: "8px 0", borderTop: "1px solid #f1f5f9" }}></div>
            <span style={{ fontSize: "11px", fontWeight: "bold", color: "#94a3b8", paddingLeft: "6px", textTransform: "uppercase" }}>Customer Proof Categories</span>

            {/* Tree Structure Iteration */}
            {Object.entries(categoryTree).map(([catName, subCats]) => {
              const isCatActive = activeTab === catName;
              return (
                <div key={catName} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <button
                    onClick={() => handleCategoryClick(catName, "ALL")}
                    style={{
                      textAlign: "left",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: isCatActive ? "#2563eb" : "transparent",
                      color: isCatActive ? "#ffffff" : "#334155",
                      fontWeight: isCatActive ? "bold" : "600",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span>📁 {catName}</span>
                    <span style={{ fontSize: "10px", opacity: 0.8 }}>{subCats.length > 0 ? "▼" : ""}</span>
                  </button>

                  {/* Sub-categories tree branch */}
                  {subCats.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", paddingLeft: "20px", borderLeft: "2px solid #e2e8f0", marginLeft: "14px", marginBottom: "4px" }}>
                      <button
                        onClick={() => handleCategoryClick(catName, "ALL")}
                        style={{
                          textAlign: "left",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "none",
                          backgroundColor: isCatActive && selectedSubCategory === "ALL" ? "#eff6ff" : "transparent",
                          color: isCatActive && selectedSubCategory === "ALL" ? "#2563eb" : "#64748b",
                          fontWeight: isCatActive && selectedSubCategory === "ALL" ? "bold" : "500",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        ↳ All {catName}
                      </button>
                      {subCats.map(sub => {
                        const isSubActive = isCatActive && selectedSubCategory === sub;
                        return (
                          <button
                            key={sub}
                            onClick={() => handleCategoryClick(catName, sub)}
                            style={{
                              textAlign: "left",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "none",
                              backgroundColor: isSubActive ? "#eff6ff" : "transparent",
                              color: isSubActive ? "#2563eb" : "#64748b",
                              fontWeight: isSubActive ? "bold" : "500",
                              fontSize: "12px",
                              cursor: "pointer"
                            }}
                          >
                            ↳ {sub}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, background: "#ffffff", padding: "30px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* TAB 1: ABOUT US & DETAILED STATEMENTS */}
          {activeTab === "ABOUT" ? (
            <div>
              <div style={{ textAlign: "center", marginBottom: "35px" }}>
                <span style={{ backgroundColor: "#fef3c7", color: "#d97706", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                  The Style Loft
                </span>
                <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: "900", color: "#0f172a", marginTop: "15px", marginBottom: "10px" }}>
                  Your Trusted Fashion Destination ✨
                </h1>
                <p style={{ fontSize: "15px", color: "#64748b", maxWidth: "700px", margin: "0 auto", lineHeight: "1.6" }}>
                  Premium Fashion for Every Style. Ya agar aap thoda premium look chahte hain, toh aap bilkul sahi jagah par hain!
                </p>
              </div>

              {/* Exact Statements Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "35px" }}>
                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>✨</span>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "800", margin: "0 0 2px 0" }}>Customer Satisfaction First</h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Your happiness is our ultimate priority.</p>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>🔒</span>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "800", margin: "0 0 2px 0" }}>Secure PayPal Payments</h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Paypal accept through secure checkout.</p>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>🛡️</span>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "800", margin: "0 0 2px 0" }}>Buyer Protection Included</h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Shop with complete safety & security.</p>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>📦</span>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "800", margin: "0 0 2px 0" }}>FedEx Shipping Available</h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Fast and reliable worldwide courier delivery.</p>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>🎥</span>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "800", margin: "0 0 2px 0" }}>Product Video Before Ordering</h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Available on request for complete transparency.</p>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>⭐</span>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "800", margin: "0 0 2px 0" }}>Genuine Customer Reviews</h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Real feedback from happy buyers globally.</p>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>💬</span>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "800", margin: "0 0 2px 0" }}>Friendly Customer Support</h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Support every step of your buying journey.</p>
                  </div>
                </div>
              </div>

              {/* Action Banner */}
              <div style={{ background: "linear-gradient(135deg, #0f172a 100%, #1e293b 0%)", color: "#ffffff", padding: "35px 20px", borderRadius: "16px", textAlign: "center" }}>
                <h2 style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: "900", marginBottom: "12px", color: "#f59e0b" }}>
                  Shop with Confidence & Real Proofs
                </h2>
                <p style={{ fontSize: "14px", color: "#cbd5e1", maxWidth: "600px", margin: "0 auto 20px auto", lineHeight: "1.6" }}>
                  Explore our category screenshots and delivery proofs from the menu.
                </p>
                <button 
                  onClick={() => categoriesList.length > 0 && handleCategoryClick(categoriesList[0].name, "ALL")}
                  style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#0f172a", padding: "12px 28px", borderRadius: "8px", fontWeight: "900", border: "none", cursor: "pointer", boxShadow: "0 4px 15px rgba(245,158,11,0.4)" }}
                >
                  📁 Explore Customer Proofs Now
                </button>
              </div>
            </div>
          ) : (
            /* TAB 2+: DYNAMIC CATEGORY PROOFS GALLERY */
            <div>
              <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "12px", padding: "20px 24px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "900", margin: "0 0 4px 0", color: "#fef3c7" }}>
                    📂 {activeTab} {selectedSubCategory !== "ALL" ? `› ${selectedSubCategory}` : ""}
                  </h2>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Verified customer proofs & screenshots</p>
                </div>
                <button 
                  onClick={() => setActiveTab("ABOUT")}
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: "bold" }}
                >
                  Back to About Us ✕
                </button>
              </div>

              {loadingProofs ? (
                <div style={{ textAlign: "center", padding: "60px", color: "#64748b", fontWeight: "600" }}>Loading proofs securely...</div>
              ) : filteredProofs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <p style={{ fontSize: "16px", fontWeight: "bold", color: "#334155", margin: "0 0 6px 0" }}>No proofs found in this sub-category!</p>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Check back later or choose another category.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
                  {filteredProofs.map((proof, index) => (
                    <div 
                      key={proof.id}
                      onClick={() => setActiveImageIndex(index)}
                      style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", transition: "transform 0.2s, box-shadow 0.2s", display: "flex", flexDirection: "column" }}
                    >
                      <div style={{ width: "100%", height: "220px", backgroundColor: "#000", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                        {proof.mediaType === "video" ? (
                          <video src={proof.mediaUrl} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                        ) : (
                          <img src={proof.mediaUrl} alt={proof.title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                        )}
                      </div>
                      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <h4 style={{ fontSize: "13px", fontWeight: "bold", color: "#0f172a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{proof.title}</h4>
                        <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>📁 {proof.category} › {proof.subCategory}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Fullscreen Modal with Keyboard Arrow Keys Support & Image Swap */}
      {activeImageIndex !== null && filteredProofs[activeImageIndex] && (
        <div 
          onClick={() => setActiveImageIndex(null)}
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", boxSizing: "border-box" }}
        >
          <div style={{ position: "relative", maxWidth: "900px", width: "100%", maxHeight: "90vh", display: "flex", justifyContent: "center", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
            
            {/* Close Button */}
            <button 
              onClick={() => setActiveImageIndex(null)}
              style={{ position: "absolute", top: "-45px", right: "0", backgroundColor: "#ef4444", color: "#fff", border: "none", width: "36px", height: "36px", borderRadius: "50%", fontWeight: "bold", fontSize: "16px", cursor: "pointer", zIndex: 100 }}
            >
              ✕
            </button>

            {/* Previous Button (Left Arrow Key also works) */}
            <button 
              onClick={handlePrev}
              style={{ position: "absolute", left: "-20px", top: "50%", transform: "translateY(-50%)", backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", border: "none", width: "44px", height: "44px", borderRadius: "50%", fontSize: "20px", fontWeight: "bold", cursor: "pointer", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}
            >
              ❮
            </button>

            {/* Main Media Viewer */}
            <div style={{ textAlign: "center", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {filteredProofs[activeImageIndex].mediaType === "video" ? (
                <video src={filteredProofs[activeImageIndex].mediaUrl} controls autoPlay style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "8px" }} />
              ) : (
                <img src={filteredProofs[activeImageIndex].mediaUrl} alt="Zoomed Proof" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: "8px" }} />
              )}
              <p style={{ color: "#fff", fontSize: "14px", marginTop: "12px", fontWeight: "600" }}>
                {filteredProofs[activeImageIndex].title} ({activeImageIndex + 1} of {filteredProofs.length}) — Use Keyboard ◀ ▶ keys to swap
              </p>
            </div>

            {/* Next Button (Right Arrow Key also works) */}
            <button 
              onClick={handleNext}
              style={{ position: "absolute", right: "-20px", top: "50%", transform: "translateY(-50%)", backgroundColor: "rgba(255,255,255,0.2)", color: "#fff", border: "none", width: "44px", height: "44px", borderRadius: "50%", fontSize: "20px", fontWeight: "bold", cursor: "pointer", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}
            >
              ❯
            </button>

          </div>
        </div>
      )}

      <Footer />

      <style jsx global>{`
        @media (max-width: 900px) {
          .mobile-toggle-bar {
            display: flex !important;
          }
          .mobile-close-btn {
            display: block !important;
          }
          .sidebar-container {
            position: fixed !important;
            top: 0 !important;
            left: -100% !important;
            height: 100vh !important;
            width: 280px !important;
            z-index: 1000 !important;
            box-shadow: 5px 0 25px rgba(0,0,0,0.2) !important;
            transition: left 0.3s ease-in-out !important;
            background: #ffffff !important;
            overflow-y: auto !important;
          }
          .sidebar-container.open {
            left: 0 !important;
          }
          .main-layout-container {
            padding: 12px !important;
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
}