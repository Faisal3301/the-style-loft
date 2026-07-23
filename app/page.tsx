"use client";

import { useEffect, useState, useMemo } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MediaDisplay from "./components/MediaDisplay";
import Footer from "./components/Footer";
import { db } from "./config/firebase";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";

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
  createdAt?: any;
}

interface BannerPromotion {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  expiresAt?: number;
}

export default function TheStyleLoftClientDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState<"US" | "UK">("US");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState("ALL");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [activeBanners, setActiveBanners] = useState<BannerPromotion[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: "image" | "video"; title: string } | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(12);

  const fetchData = async () => {
    setLoading(true);
    try {
      const catSnap = await getDocs(collection(db, "categories"));
      const fetchedCats: any[] = [];
      catSnap.forEach((docSnap) => {
        fetchedCats.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCategoriesList(fetchedCats);

      const qProd = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(qProd);
      let list: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      list = list.sort(() => Math.random() - 0.5);
      setProducts(list);

      const qBanner = query(collection(db, "promotional_banners"), orderBy("createdAt", "desc"));
      const bannerSnap = await getDocs(qBanner);
      const currentTime = Date.now();
      const validBanners: BannerPromotion[] = [];

      bannerSnap.forEach(d => {
        const data = d.data() as any;
        if (data.expiresAt && currentTime > data.expiresAt) {
          deleteDoc(doc(db, "promotional_banners", d.id));
        } else if (data.expiresAt && currentTime <= data.expiresAt) {
          validBanners.push({
            id: d.id,
            title: data.title,
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType,
            expiresAt: data.expiresAt
          });
        }
      });

      setActiveBanners(validBanners);
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

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300) {
        setVisibleLimit(prev => Math.min(prev + 8, products.length));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [products.length]);

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
  const currentBanner = activeBanners[currentBannerIndex];

  const [timeLeftStr, setTimeLeftStr] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!currentBanner?.expiresAt) return;
    const timer = setInterval(() => {
      const timeLeftMs = Math.max(0, (currentBanner.expiresAt || 0) - Date.now());
      if (timeLeftMs <= 0) {
        fetchData();
      } else {
        const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);
        setTimeLeftStr({ hours, minutes, seconds });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentBanner]);

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
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .item-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px -5px rgba(37,99,235,0.15);
          border-color: #2563eb !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-content {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>

      <Header
        country={country}
        setCountry={setCountry}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategoryFilter={selectedCategoryFilter}
        setSelectedCategoryFilter={setSelectedCategoryFilter}
        setSelectedSubCategoryFilter={setSelectedSubCategoryFilter}
        setVisibleCount={() => { }}
        categoriesList={categoriesList}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div style={{ display: "flex", flex: 1, width: "100%", maxWidth: "1750px", margin: "0 auto", padding: "24px", gap: "20px", boxSizing: "border-box" }}>

        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          categoriesList={categoriesList}
          selectedCategoryFilter={selectedCategoryFilter}
          setSelectedCategoryFilter={setSelectedCategoryFilter}
          selectedSubCategoryFilter={selectedSubCategoryFilter}
          setSelectedSubCategoryFilter={setSelectedSubCategoryFilter}
          setVisibleCount={() => { }}
          activeCatObj={activeCatObj}
        />

        <main 
          onClick={() => { if (isSidebarOpen) setIsSidebarOpen(false); }}
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: "28px", minWidth: 0 }}
        >

          {currentBanner && (
            <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "16px", padding: "20px 24px", color: "#f8fafc", border: "1px solid #f59e0b", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ backgroundColor: "#ef4444", color: "#fff", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "900" }}>
                    LIVE EVENT {activeBanners.length > 1 ? `(${currentBannerIndex + 1}/${activeBanners.length})` : ""}
                  </span>
                  <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: "#fef3c7" }}>{currentBanner.title}</h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", gap: "6px", fontSize: "13px", fontWeight: "bold", background: "#334155", padding: "6px 12px", borderRadius: "8px", border: "1px solid #475569" }}>
                    <span>⏳ {String(timeLeftStr.hours).padStart(2, '0')}h</span>:
                    <span>{String(timeLeftStr.minutes).padStart(2, '0')}m</span>:
                    <span>{String(timeLeftStr.seconds).padStart(2, '0')}s</span>
                  </div>
                  <button 
                    onClick={() => setPreviewMedia({ url: currentBanner.mediaUrl, type: currentBanner.mediaType, title: currentBanner.title })}
                    style={{ backgroundColor: "#f59e0b", color: "#0f172a", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "900", cursor: "pointer" }}
                  >
                    View Full 🔍
                  </button>
                </div>
              </div>

              <div 
                onClick={() => setPreviewMedia({ url: currentBanner.mediaUrl, type: currentBanner.mediaType, title: currentBanner.title })}
                style={{ width: "100%", height: "280px", borderRadius: "12px", overflow: "hidden", position: "relative", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a", border: "1px solid #334155" }}
              >
                <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${currentBanner.mediaUrl})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(15px)", opacity: 0.4 }} />
                <img 
                  src={currentBanner.mediaUrl} 
                  alt={currentBanner.title} 
                  style={{ position: "relative", maxWidth: "100%", maxHeight: "100%", objectFit: "contain", zIndex: 2 }} 
                />
              </div>

              {activeBanners.length > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "4px" }}>
                  {activeBanners.map((_, idx) => (
                    <span 
                      key={idx} 
                      onClick={() => setCurrentBannerIndex(idx)}
                      style={{ 
                        width: currentBannerIndex === idx ? "24px" : "8px", 
                        height: "8px", 
                        borderRadius: "4px", 
                        backgroundColor: currentBannerIndex === idx ? "#f59e0b" : "#475569", 
                        cursor: "pointer", 
                        transition: "all 0.3s" 
                      }} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "100px", backgroundColor: "#fff", borderRadius: "16px", color: "#64748b", fontWeight: "600" }}>
              Loading luxury collections...
            </div>
          ) : (
            <div className="section-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #f59e0b", paddingBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", margin: 0 }}>
                  {searchQuery ? `🔍 Search Results for "${searchQuery}"` : selectedCategoryFilter !== "ALL" ? `${selectedCategoryFilter} ${selectedSubCategoryFilter !== "ALL" ? `› ${selectedSubCategoryFilter}` : ""}` : "✨ Explore All Products"}
                </h2>
                <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>{filteredProducts.length} items available</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "18px" }}>
                {filteredProducts.slice(0, visibleLimit).map(p => (
                  <div key={p.id} onClick={() => { window.location.href = `/product/${p.id}`; }} className="item-card-hover">
                    <div style={{ width: "100%", height: "180px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#1e293b", marginBottom: "10px", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
                      <MediaDisplay url={p.mediaUrl} type={p.mediaType || "image"} alt={p.name} />
                    </div>
                    <h4 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 4px 0", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px 0" }}>{p.subCategory || p.category}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "6px", marginTop: "auto" }}>
                      <span style={{ fontSize: "14px", fontWeight: "900", color: "#0f172a" }}>{country === "US" ? "$" : "£"}{p.salePrice || p.price || 0}</span>
                      <span style={{ fontSize: "11px", backgroundColor: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: "6px", fontWeight: "bold" }}>View ↗</span>
                    </div>
                  </div>
                ))}
              </div>

              {visibleLimit < filteredProducts.length && (
                <div style={{ textAlign: "center", marginTop: "30px" }}>
                  <button 
                    onClick={() => setVisibleLimit(prev => prev + 12)}
                    style={{ backgroundColor: "#1e293b", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                  >
                    Load More Products ↓
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {previewMedia && (
        <div 
          onClick={() => setPreviewMedia(null)}
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0, 0, 0, 0.85)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", boxSizing: "border-box" }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()} 
            style={{ backgroundColor: "#1e293b", borderRadius: "16px", padding: "20px", maxWidth: "900px", width: "100%", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid #475569", position: "relative" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: "#fef3c7", fontSize: "16px", fontWeight: "bold", margin: 0 }}>{previewMedia.title}</h3>
              <button 
                onClick={() => setPreviewMedia(null)}
                style={{ backgroundColor: "#ef4444", color: "#fff", border: "none", width: "30px", height: "30px", borderRadius: "50%", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}
              >
                ✕
              </button>
            </div>
            <div style={{ width: "100%", maxHeight: "75vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#000", borderRadius: "10px", overflow: "hidden" }}>
              <img src={previewMedia.url} alt={previewMedia.title} style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain" }} />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}