"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MediaDisplay from "./components/MediaDisplay";
import Footer from "./components/Footer";
import { db } from "./config/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

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

export default function TheStyleLoftClientDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<"US" | "UK">("US");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState("ALL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Dynamic Limits controlled by scrolling
  const [sectionLimits, setSectionLimits] = useState<{ [key: string]: number }>({});
  
  // Ref for general page/grid infinite scrolling observation
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const catSnap = await getDocs(collection(db, "categories"));
      const fetchedCats: any[] = [];
      catSnap.forEach((docSnap) => {
        fetchedCats.push({ id: docSnap.id, ...docSnap.data() });
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
    document.title = "The Style Loft - Global Luxury Store";
  }, []);

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

  const getLimit = (key: string) => sectionLimits[key] || 8;

  // Auto increase limit on scroll end
  const increaseLimit = (key: string, max: number) => {
    setSectionLimits(prev => {
      const current = prev[key] || 8;
      if (current >= max) return prev;
      return { ...prev, [key]: Math.min(current + 8, max) };
    });
  };

  // Intersection observer for automatic infinite scroll trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (selectedCategoryFilter !== "ALL" || searchQuery) {
            increaseLimit("single_cat", filteredProducts.length);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
    }

    return () => observer.disconnect();
  }, [filteredProducts.length, selectedCategoryFilter, searchQuery]);

  return (
    <div style={{ width: "100%", backgroundColor: "#f1f5f9", minHeight: "100vh", fontFamily: "'Inter', Arial, sans-serif", display: "flex", flexDirection: "column" }}>
      
      <style jsx global>{`
        .section-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          width: 100%;
          box-sizing: border-box;
        }
        .item-card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          flex: 0 0 230px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
        }
        .item-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px -5px rgba(37,99,235,0.15);
          border-color: #2563eb !important;
        }
        .horizontal-carousel {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding-bottom: 12px;
        }
        .horizontal-carousel::-webkit-scrollbar {
          height: 8px;
        }
        .horizontal-carousel::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>

      {/* Header Component */}
      <Header
        country={country}
        setCountry={setCountry}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategoryFilter={selectedCategoryFilter}
        setSelectedCategoryFilter={setSelectedCategoryFilter}
        setSelectedSubCategoryFilter={setSelectedSubCategoryFilter}
        setVisibleCount={() => {}}
        categoriesList={categoriesList}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div style={{ display: "flex", flex: 1, width: "100%", maxWidth: "1750px", margin: "0 auto", padding: "24px", gap: "20px", boxSizing: "border-box" }}>
        
        {/* Sidebar Component */}
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          categoriesList={categoriesList}
          selectedCategoryFilter={selectedCategoryFilter}
          setSelectedCategoryFilter={setSelectedCategoryFilter}
          selectedSubCategoryFilter={selectedSubCategoryFilter}
          setSelectedSubCategoryFilter={setSelectedSubCategoryFilter}
          setVisibleCount={() => {}}
          activeCatObj={activeCatObj}
        />

        {/* Main Content Layout */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", gap: "28px", minWidth: 0 }}>
          
          {loading ? (
            <div style={{ textAlign: "center", padding: "100px", backgroundColor: "#fff", borderRadius: "16px", color: "#64748b", fontWeight: "600" }}>
              Loading store sections efficiently...
            </div>
          ) : searchQuery ? (
            /* SEARCH RESULTS */
            <div className="section-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #f59e0b", paddingBottom: "10px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", margin: 0 }}>
                  🔍 Search Results for "{searchQuery}"
                </h2>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>{filteredProducts.length} items found</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "18px" }}>
                {filteredProducts.map(p => (
                  <div key={p.id} onClick={() => { window.location.href = `/product/${p.id}`; }} className="item-card-hover" style={{ flex: "1" }}>
                    <div style={{ width: "100%", height: "180px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#0f172a", marginBottom: "10px" }}>
                      <MediaDisplay url={p.mediaUrl} type={p.mediaType || "image"} alt={p.name} />
                    </div>
                    <h4 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 4px 0", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px 0" }}>{p.subCategory || p.category}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "900", color: "#0f172a" }}>{country === "US" ? "$" : "£"}{p.salePrice || p.price}</span>
                      <span style={{ fontSize: "11px", backgroundColor: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: "6px", fontWeight: "bold" }}>View ↗</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : selectedCategoryFilter !== "ALL" ? (
            /* SINGLE CATEGORY VIEW WITH SCROLL-TRIGGERED LAZY LOADING */
            <div className="section-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #f59e0b", paddingBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "#f59e0b", fontWeight: "900", textTransform: "uppercase" }}>Active Department</span>
                  <h2 style={{ fontSize: "22px", fontWeight: "900", color: "#0f172a", margin: "2px 0 0 0" }}>
                    {selectedCategoryFilter} {selectedSubCategoryFilter !== "ALL" ? `› ${selectedSubCategoryFilter}` : ""}
                  </h2>
                </div>
                <button
                  onClick={() => { setSelectedCategoryFilter("ALL"); setSelectedSubCategoryFilter("ALL"); }}
                  style={{ backgroundColor: "#1e293b", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
                >
                  ← Back to All Sections
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "18px" }}>
                {filteredProducts.slice(0, getLimit("single_cat")).map(p => (
                  <div key={p.id} onClick={() => { window.location.href = `/product/${p.id}`; }} className="item-card-hover" style={{ flex: "1" }}>
                    <div style={{ width: "100%", height: "180px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#0f172a", marginBottom: "10px" }}>
                      <MediaDisplay url={p.mediaUrl} type={p.mediaType || "image"} alt={p.name} />
                    </div>
                    <h4 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 4px 0", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px 0" }}>{p.subCategory || p.category}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "900", color: "#0f172a" }}>{country === "US" ? "$" : "£"}{p.salePrice || p.price}</span>
                      <span style={{ fontSize: "11px", backgroundColor: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: "6px", fontWeight: "bold" }}>View ↗</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hidden trigger element that automatically loads more items on scroll */}
              <div ref={loadMoreTriggerRef} style={{ height: "40px", marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {getLimit("single_cat") < filteredProducts.length && (
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Loading more items as you scroll...</span>
                )}
              </div>
            </div>
          ) : (
            /* MULTI-SECTION CAROUSEL WITH HORIZONTAL SCROLL LAZY LOADING */
            categoriesList.map((cat) => {
              const catProducts = products.filter(p => p.category === cat.name);
              if (catProducts.length === 0) return null;

              const currentLimit = getLimit(cat.id);

              return (
                <div key={cat.id} className="section-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "2px solid #f59e0b", paddingBottom: "10px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", margin: 0 }}>
                      Best Sellers in {cat.name}
                    </h2>
                    <button
                      onClick={() => { setSelectedCategoryFilter(cat.name); setSelectedSubCategoryFilter("ALL"); }}
                      style={{ fontSize: "12px", background: "none", border: "none", color: "#2563eb", fontWeight: "bold", cursor: "pointer" }}
                    >
                      See All ({catProducts.length}) ➔
                    </button>
                  </div>

                  {/* Horizontal Scroll with Auto-Loader on Scroll End */}
                  <div 
                    className="horizontal-carousel"
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      // Jab user carousel ko right end par scroll karega, mazeed items load ho jayenge
                      if (target.scrollLeft + target.clientWidth >= target.scrollWidth - 50) {
                        increaseLimit(cat.id, catProducts.length);
                      }
                    }}
                  >
                    {catProducts.slice(0, currentLimit).map(p => (
                      <div key={p.id} onClick={() => { window.location.href = `/product/${p.id}`; }} className="item-card-hover">
                        <div style={{ width: "100%", height: "170px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#0f172a", marginBottom: "10px" }}>
                          <MediaDisplay url={p.mediaUrl} type={p.mediaType || "image"} alt={p.name} />
                        </div>
                        <h4 style={{ fontSize: "13px", fontWeight: "bold", margin: "0 0 4px 0", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</h4>
                        <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px 0" }}>{p.subCategory || cat.name}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "6px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "900", color: "#0f172a" }}>{country === "US" ? "$" : "£"}{p.salePrice || p.price}</span>
                          <span style={{ fontSize: "11px", backgroundColor: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: "6px", fontWeight: "bold" }}>View ↗</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}

        </main>
      </div>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}