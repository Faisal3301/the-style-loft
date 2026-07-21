"use client";

import { useEffect, useState, useMemo } from "react";
import MediaDisplay from "./components/MediaDisplay";
import { db } from "./config/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query
} from "firebase/firestore";

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  description?: string;
  category: string;
  subCategory?: string;
  mediaUrl: string;
  mediaType: "image" | "video";
}

interface SubCategoryItem {
  name: string;
  driveFolderUrl?: string;
}

interface DynamicCategory {
  id: string;
  name: string;
  subCategories: SubCategoryItem[];
}

// 🌟 Google Drive link ko IDM-safe direct streaming/viewing link mein convert karne ka helper function
const getDirectMediaUrl = (url: string) => {
  if (!url) return "";
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=open&id=${match[1]}`;
    }
  }
  return url;
};

export default function TheStyleLoftClientDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<DynamicCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Navbar Country / Region State (US/UK Professional Switch)
  const [country, setCountry] = useState<"US" | "UK">("US");

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState("ALL");

  // 🌟 Pagination / Lazy Loading State (System ko fast rakhne ke liye)
  const [visibleCount, setVisibleCount] = useState(12);

  // Fetch Data from Firebase
  const fetchData = async () => {
    setLoading(true);
    try {
      const catSnap = await getDocs(collection(db, "categories"));
      const fetchedCats: DynamicCategory[] = [];
      catSnap.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedCats.push({
          id: docSnap.id,
          name: data.name,
          subCategories: data.subCategories || []
        });
      });
      setCategoriesList(fetchedCats);

      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const list: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(list);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    document.title = "The Style Loft - Global Store";
  }, []);

  // Filtered Products for Display & Search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = selectedCategoryFilter === "ALL" || p.category === selectedCategoryFilter;
      const matchesSubCat = selectedSubCategoryFilter === "ALL" || p.subCategory === selectedSubCategoryFilter;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSubCat && matchesSearch;
    });
  }, [products, selectedCategoryFilter, selectedSubCategoryFilter, searchQuery]);

  const activeCatObj = categoriesList.find(c => c.name === selectedCategoryFilter);

  return (
    <div style={{ width: "100%", backgroundColor: "#f3f4f6", minHeight: "100vh", fontFamily: "Arial, sans-serif", color: "#111827", display: "flex", flexDirection: "column" }}>

      {/* 🌟 PROFESSIONAL HEADER */}
      <header style={{ backgroundColor: "#131921", color: "#ffffff", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "15px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 5px rgba(0,0,0,0.2)" }}>

        {/* Logo & Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => { setSelectedCategoryFilter("ALL"); setSelectedSubCategoryFilter("ALL"); }}>
          <div style={{ backgroundColor: "#febd69", padding: "8px 14px", borderRadius: "6px", fontWeight: "900", color: "#131921", fontSize: "16px", letterSpacing: "0.5px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
            ✨ The Style Loft
          </div>
          <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "bold" }}>{country === "US" ? "US Storefront" : "UK Storefront"}</span>
        </div>

        {/* Fixed Search Bar */}
        <div style={{ display: "flex", flex: "1", maxWidth: "650px", minWidth: "280px", borderRadius: "6px", overflow: "hidden", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => {
              setSelectedCategoryFilter(e.target.value);
              setSelectedSubCategoryFilter("ALL");
              setVisibleCount(12);
            }}
            style={{ backgroundColor: "#e5e7eb", border: "none", padding: "0 12px", fontSize: "13px", outline: "none", cursor: "pointer", color: "#111", fontWeight: "bold" }}
          >
            <option value="ALL">All Departments</option>
            {categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          <input
            type="text"
            placeholder={country === "US" ? "Search US products, collections..." : "Search UK products, collections..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(12);
            }}
            style={{ flex: 1, padding: "10px 16px", border: "none", fontSize: "14px", outline: "none", color: "#000000", backgroundColor: "#ffffff" }}
          />

          <button style={{ backgroundColor: "#febd69", border: "none", padding: "0 20px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            🔍
          </button>
        </div>

        {/* Country Selector & Cart */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div
            onClick={() => setCountry(country === "US" ? "UK" : "US")}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", background: "#374151", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", color: "#fff", border: "1px solid #4b5563" }}
            title="Toggle Country Region"
          >
            <span>{country === "US" ? "🇺🇸 US ($)" : "🇬🇧 UK (£)"}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#232f3e", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", border: "1px solid #374151" }}>
            <span>🛒</span>
            <span style={{ fontSize: "13px", fontWeight: "bold", color: "#fff" }}>Bag</span>
          </div>
        </div>
      </header>

      {/* Sub Navbar links */}
      <nav style={{ backgroundColor: "#232f3e", color: "white", padding: "10px 24px", display: "flex", gap: "20px", fontSize: "13px", overflowX: "auto", alignItems: "center" }}>
        <span
          onClick={() => { setSelectedCategoryFilter("ALL"); setSelectedSubCategoryFilter("ALL"); setVisibleCount(12); }}
          style={{ cursor: "pointer", fontWeight: selectedCategoryFilter === "ALL" ? "bold" : "normal", color: selectedCategoryFilter === "ALL" ? "#febd69" : "#fff", whiteSpace: "nowrap" }}
        >
          🔥 All Products
        </span>
        {categoriesList.map(cat => (
          <span
            key={cat.id}
            onClick={() => { setSelectedCategoryFilter(cat.name); setSelectedSubCategoryFilter("ALL"); setVisibleCount(12); }}
            style={{ cursor: "pointer", whiteSpace: "nowrap", color: selectedCategoryFilter === cat.name ? "#febd69" : "#d1d5db", fontWeight: selectedCategoryFilter === cat.name ? "bold" : "normal" }}
          >
            {cat.name}
          </span>
        ))}
      </nav>

      {/* MAIN CONTENT WRAPPER WITH SIDEBAR */}
      <div style={{ display: "flex", flex: 1, maxWidth: "1500px", width: "100%", margin: "0 auto", padding: "20px", gap: "25px", boxSizing: "border-box" }}>

        {/* 📂 PROFESSIONAL SIDEBAR */}
        <aside style={{ width: "260px", flexShrink: 0 }}>
          <div style={{ backgroundColor: "#fff", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "sticky", top: "80px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 12px 0", color: "#111", borderBottom: "2px solid #febd69", paddingBottom: "6px" }}>
              📋 Department Filter
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button
                onClick={() => { setSelectedCategoryFilter("ALL"); setSelectedSubCategoryFilter("ALL"); setVisibleCount(12); }}
                style={{ textAlign: "left", padding: "8px 10px", borderRadius: "6px", background: selectedCategoryFilter === "ALL" ? "#eff6ff" : "transparent", color: selectedCategoryFilter === "ALL" ? "#2563eb" : "#374151", border: "none", fontWeight: selectedCategoryFilter === "ALL" ? "bold" : "normal", cursor: "pointer", fontSize: "13px" }}
              >
                All Collections
              </button>
              {categoriesList.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategoryFilter(cat.name); setSelectedSubCategoryFilter("ALL"); setVisibleCount(12); }}
                  style={{ textAlign: "left", padding: "8px 10px", borderRadius: "6px", background: selectedCategoryFilter === cat.name ? "#eff6ff" : "transparent", color: selectedCategoryFilter === cat.name ? "#2563eb" : "#374151", border: "none", fontWeight: selectedCategoryFilter === cat.name ? "bold" : "normal", cursor: "pointer", fontSize: "13px" }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Sub-categories inside Sidebar */}
            {activeCatObj && activeCatObj.subCategories.length > 0 && (
              <div style={{ marginTop: "20px", borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "bold", margin: "0 0 10px 0", color: "#4b5563" }}>
                  Sub-Categories ({activeCatObj.name})
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span
                    onClick={() => { setSelectedSubCategoryFilter("ALL"); setVisibleCount(12); }}
                    style={{ fontSize: "12px", padding: "6px 8px", cursor: "pointer", color: selectedSubCategoryFilter === "ALL" ? "#2563eb" : "#6b7280", fontWeight: selectedSubCategoryFilter === "ALL" ? "bold" : "normal" }}
                  >
                    • All in {activeCatObj.name}
                  </span>
                  {activeCatObj.subCategories.map((sub, i) => (
                    <span
                      key={i}
                      onClick={() => { setSelectedSubCategoryFilter(sub.name); setVisibleCount(12); }}
                      style={{ fontSize: "12px", padding: "6px 8px", cursor: "pointer", color: selectedSubCategoryFilter === sub.name ? "#2563eb" : "#6b7280", fontWeight: selectedSubCategoryFilter === sub.name ? "bold" : "normal" }}
                    >
                      • {sub.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* PRODUCT CATALOG GRID */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", backgroundColor: "#fff", padding: "12px 18px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: "#111" }}>
              {selectedCategoryFilter === "ALL" ? "Featured Showcase" : selectedCategoryFilter}
              {selectedSubCategoryFilter !== "ALL" && ` / ${selectedSubCategoryFilter}`}
            </h1>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>Showing {filteredProducts.length} items ({country})</span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#6b7280", fontSize: "15px" }}>Loading catalog securely...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <p style={{ fontSize: "15px", color: "#4b5563", margin: "0 0 10px 0" }}>No products found matching your filter.</p>
              <button
                onClick={() => { setSelectedCategoryFilter("ALL"); setSelectedSubCategoryFilter("ALL"); setSearchQuery(""); setVisibleCount(12); }}
                style={{ background: "#ffd814", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
                {filteredProducts.slice(0, visibleCount).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      window.location.href = `/product/${p.id}`;
                    }}
                    style={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                    }}
                  >
                    <div>
                      {/* Product Media Box - IDM-Safe Clean Rendering */}
                      <div style={{ width: "100%", height: "200px", borderRadius: "6px", overflow: "hidden", backgroundColor: "#0f172a", marginBottom: "10px", position: "relative" }}>
                        {p.mediaUrl ? (
                          <div style={{ width: "100%", height: "100%", pointerEvents: "none" }}> {/* pointerEvents none taake card click par hi detail page khule */}
                            <MediaDisplay
                              url={p.mediaUrl}
                              type={p.mediaType || "image"}
                              alt={p.name}
                            />
                          </div>
                        ) : (
                          <div style={{ color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "12px" }}>
                            No Media
                          </div>
                        )}
                        <span style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: "10px", padding: "2px 6px", borderRadius: "4px", zIndex: 3 }}>
                          {p.category}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 4px 0", color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.name}
                      </h3>

                      <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 10px 0" }}>
                        {p.subCategory ? p.subCategory : "Exclusive Collection"}
                      </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", borderTop: "1px solid #f3f4f6", paddingTop: "8px" }}>
                      <div>
                        {p.salePrice ? (
                          <div>
                            <s style={{ fontSize: "11px", color: "#9ca3af" }}>{country === "US" ? "$" : "£"}{p.price}</s>
                            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#dc2626", marginLeft: "6px" }}>{country === "US" ? "$" : "£"}{p.salePrice}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "14px", fontWeight: "bold", color: "#111" }}>{country === "US" ? "$" : "£"}{p.price}</span>
                        )}
                      </div>
                      <span style={{ fontSize: "11px", background: "#fffaeb", color: "#b45309", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", border: "1px solid #fde68a" }}>
                        View ↗
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 🌟 LOAD MORE BUTTON (LAZY LOADING) */}
              {visibleCount < filteredProducts.length && (
                <div style={{ textAlign: "center", marginTop: "35px" }}>
                  <button
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    style={{
                      backgroundColor: "#ffd814",
                      border: "1px solid #fcd200",
                      padding: "12px 35px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "14px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                      color: "#111"
                    }}
                  >
                    Load More Products ⬇️
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* 🌟 PROFESSIONAL FOOTER */}
      <footer style={{ backgroundColor: "#131921", color: "#9ca3af", padding: "40px 20px 20px 20px", marginTop: "auto", fontSize: "13px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "30px", marginBottom: "30px" }}>
          <div>
            <h4 style={{ color: "#fff", fontSize: "14px", marginBottom: "12px" }}>Get to Know Us</h4>
            <p style={{ margin: "0 0 6px 0", cursor: "pointer" }}>About The Style Loft</p>
            <p style={{ margin: "0 0 6px 0", cursor: "pointer" }}>Careers & Culture</p>
            <p style={{ margin: 0, cursor: "pointer" }}>Global Operations ({country})</p>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "14px", marginBottom: "12px" }}>Make Money with Us</h4>
            <p style={{ margin: "0 0 6px 0", cursor: "pointer" }}>Sell on The Style Loft</p>
            <p style={{ margin: "0 0 6px 0", cursor: "pointer" }}>Protect & Build Your Brand</p>
            <p style={{ margin: 0, cursor: "pointer" }}>Advertise Your Products</p>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "14px", marginBottom: "12px" }}>Let Us Help You</h4>
            <p style={{ margin: "0 0 6px 0", cursor: "pointer" }}>Account & Order Tracking</p>
            <p style={{ margin: "0 0 6px 0", cursor: "pointer" }}>Shipping Rates & Policies</p>
            <p style={{ margin: 0, cursor: "pointer" }}>Customer Support</p>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #374151", paddingTop: "20px", textAlign: "center", fontSize: "12px" }}>
          <p style={{ margin: "0 0 5px 0" }}>© 2026 The Style Loft Storefront ({country} Region). All Rights Reserved.</p>
          <p style={{ margin: 0 }}>Optimized for High-Speed Browsing Across All Devices & Browsers.</p>
        </div>
      </footer>

    </div>
  );
}