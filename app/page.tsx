"use client";

import { useEffect, useState, useMemo } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MediaDisplay from "./components/MediaDisplay";
import Footer from "./components/Footer";
import { db, auth } from "./config/firebase";
import { collection, getDocs, orderBy, query, deleteDoc, doc, updateDoc, increment } from "firebase/firestore";
import FloatingChatButton from "./components/product/FloatingChatButton";
import { useRouter } from "next/navigation";
import ShortsModal from "./shorts/page";

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
  const [previewMedia, setPreviewMedia] = useState<{ id?: string; url: string; type: "image" | "video"; title: string } | null>(null);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');

  // LAZY LOADING & INFINITE SCROLL STATES
  const INITIAL_LIMIT = 12;
  const BATCH_SIZE = 12;
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_LIMIT);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  //for shorts modal
  const [isShortsOpen, setIsShortsOpen] = useState(false);

  // Component function ke bilkul start mein:
  const router = useRouter();

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

  // Filter change hone par limit reset ho jaye
  useEffect(() => {
    setVisibleLimit(INITIAL_LIMIT);
  }, [selectedCategoryFilter, selectedSubCategoryFilter, searchQuery]);

  // Banner rotation interval (5 seconds)
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  // Analytics Tracking
  useEffect(() => {
    if (activeBanners.length === 0) return;
    const currentBanner = activeBanners[currentBannerIndex];

    const trackBannerView = async () => {
      try {
        const bannerRef = doc(db, "promotional_banners", currentBanner.id);
        await updateDoc(bannerRef, {
          views: increment(1),
          uniqueVisitors: increment(1)
        });
      } catch (err) {
        console.error("Error tracking banner view:", err);
      }
    };

    trackBannerView();

    const watchTimer = setInterval(async () => {
      try {
        const bannerRef = doc(db, "promotional_banners", currentBanner.id);
        await updateDoc(bannerRef, {
          totalWatchTimeSeconds: increment(5)
        });
      } catch (err) {
        console.error("Error tracking watch time:", err);
      }
    }, 5000);

    return () => clearInterval(watchTimer);
  }, [currentBannerIndex, activeBanners]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Category Filter
      const matchesCat = selectedCategoryFilter === "ALL" || p.category === selectedCategoryFilter;

      // 2. Sub-Category Filter
      const matchesSubCat = selectedSubCategoryFilter === "ALL" || p.subCategory === selectedSubCategoryFilter;

      // 3. Search Query Filter
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // 4. Media Filter (All / Photos / Videos)
      let matchesMedia = true;
      if (mediaFilter === 'image') {
        matchesMedia = p.mediaType === 'image' || !p.mediaType; // default fallback to image
      } else if (mediaFilter === 'video') {
        matchesMedia = p.mediaType === 'video';
      }

      // Return true only when ALL conditions match
      return matchesCat && matchesSubCat && matchesSearch && matchesMedia;
    });
  }, [products, selectedCategoryFilter, selectedSubCategoryFilter, searchQuery, mediaFilter]);


  // HIGH-PERFORMANCE INFINITE LAZY SCROLLING
  useEffect(() => {
    const handleScroll = () => {
      if (isFetchingMore) return;
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 400; // 400px bottom trigger

      if (scrollPosition >= threshold && visibleLimit < filteredProducts.length) {
        setIsFetchingMore(true);
        setTimeout(() => {
          setVisibleLimit(prev => Math.min(prev + BATCH_SIZE, filteredProducts.length));
          setIsFetchingMore(false);
        }, 200); // Slight delay for smooth CPU rendering
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visibleLimit, filteredProducts.length, isFetchingMore]);

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

  // Protected Action Handler (Login Check)

  const handleProtectedAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation(); // Blocks parent card click event

    const currentUser = auth.currentUser; // Firebase User check
    if (!currentUser) {
      alert("Please log in or sign up to access this feature.");
      router.push("/login"); // Redirects to login page
      return;
    }

    // Executes action if user is logged in
    action();
  };

  // Filter logic where filteredProducts is created:


  // Jab mediaFilter update ho to visible count reset karein
  useEffect(() => {
    setVisibleLimit(BATCH_SIZE); // Ya jo bhi aapka initial limit count hai (e.g., 12 ya 20)
  }, [mediaFilter]);

  return (
    <div style={{ width: "100%", backgroundColor: "#f1f5f9", minHeight: "100vh", fontFamily: "'Inter', Arial, sans-serif", display: "flex", flexDirection: "column" }}>

      <style jsx global>{`
        .section-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          box-sizing: border-box;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
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

        /* Responsive Media Filter Styles */
        .desktop-media-filter {
          display: flex;
        }
        .mobile-media-filter {
          display: none;
        }

        @media (max-width: 900px) {
          .desktop-media-filter {
            display: none !important;
          }
          .mobile-media-filter {
            display: flex !important;
          }
          .main-layout-container {
            padding: 12px !important;
            gap: 12px !important;
          }
          .section-card {
            padding: 16px !important;
          }
        }
      `}</style>


      <Header
        setIsShortsOpen={setIsShortsOpen}
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

      <div className="main-layout-container" style={{ display: "flex", flex: 1, width: "100%", maxWidth: "1750px", margin: "0 auto", padding: "24px", gap: "20px", boxSizing: "border-box" }}>

        {/* Main Category Sidebar */}
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

        {/* DESKTOP MEDIA FILTER SIDEBAR */}
        {/* DESKTOP MEDIA FILTER SIDEBAR */}
        <aside
          className="desktop-media-filter"
          style={{
            width: "180px",
            minWidth: "160px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px",
            height: "fit-content",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",

            /* STICKY / FIXED ON SCROLL SETTINGS */
            position: "sticky",
            top: "90px", // Header ki height ke hisab se offset (agar header fixed hai to 90px-100px ideal hai)
            zIndex: 10,

            flexDirection: "column"
          }}
        >
          <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Filter Media
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#475569" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: mediaFilter === 'all' ? '600' : 'normal' }}>
              <input
                type="radio"
                name="mediaTypeDesktop"
                checked={mediaFilter === 'all'}
                onChange={() => setMediaFilter('all')}
                style={{ accentColor: "#2563eb", cursor: "pointer" }}
              />
              <span>All Content</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: mediaFilter === 'image' ? '600' : 'normal' }}>
              <input
                type="radio"
                name="mediaTypeDesktop"
                checked={mediaFilter === 'image'}
                onChange={() => setMediaFilter('image')}
                style={{ accentColor: "#2563eb", cursor: "pointer" }}
              />
              <span>Photos Only</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: mediaFilter === 'video' ? '600' : 'normal' }}>
              <input
                type="radio"
                name="mediaTypeDesktop"
                checked={mediaFilter === 'video'}
                onChange={() => setMediaFilter('video')}
                style={{ accentColor: "#2563eb", cursor: "pointer" }}
              />
              <span>Videos Only</span>
            </label>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main
          onClick={() => { if (isSidebarOpen) setIsSidebarOpen(false); }}
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px", minWidth: 0 }}
        >

          {/* MOBILE ONLY ICON FILTER BAR (STICKY) */}
          <div
            className="mobile-media-filter"
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#ffffff",
              padding: "8px 10px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              gap: "6px",

              /* FIX/STICKY LOGIC FOR MOBILE */
              position: "sticky",
              top: "150px", // Agar Navbar fixed hai toh isko navbar ki height ke mutabiq adjust karein (e.g. "70px")
              zIndex: 99,   // Taake content iske neechay se hi guzray
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)"
            }}
          >
            {/* ALL FILTER */}
            <button
              onClick={() => setMediaFilter('all')}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: mediaFilter === 'all' ? "#2563eb" : "#f1f5f9",
                color: mediaFilter === 'all' ? "#ffffff" : "#64748b",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
              <span>All</span>
            </button>

            {/* PHOTOS FILTER */}
            <button
              onClick={() => setMediaFilter('image')}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: mediaFilter === 'image' ? "#2563eb" : "#f1f5f9",
                color: mediaFilter === 'image' ? "#ffffff" : "#64748b",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              <span>Photos</span>
            </button>

            {/* VIDEOS FILTER */}
            <button
              onClick={() => setMediaFilter('video')}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: mediaFilter === 'video' ? "#2563eb" : "#f1f5f9",
                color: mediaFilter === 'video' ? "#ffffff" : "#64748b",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
              <span>Videos</span>
            </button>
          </div>

          {/* Banner Section */}
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
                    onClick={() => setPreviewMedia({ id: currentBanner.id, url: currentBanner.mediaUrl, type: currentBanner.mediaType, title: currentBanner.title })}
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

          {/* Product Listing Card */}
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

              {/* PRODUCT GRID */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "18px" }}>
                {filteredProducts.slice(0, visibleLimit).map(p => (
                  <div key={p.id} onClick={() => { window.location.href = `/product/${p.id}`; }} className="item-card-hover">
                    <div style={{ width: "100%", height: "180px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#1e293b", marginBottom: "10px", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
                      <MediaDisplay url={p.mediaUrl} type={p.mediaType || "image"} alt={p.name} />
                    </div>
                    <h4 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 4px 0", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</h4>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 8px 0" }}>{p.subCategory || p.category}</p>

                    {/* PRICE & DIRECT ACTION ROW */}
                    <div
                      style={{
                        borderTop: "1px solid #e2e8f0",
                        paddingTop: "8px",
                        marginTop: "auto",
                        width: "100%",
                      }}
                    >
                      {/* PRICE - FULL WIDTH */}
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          marginBottom: "8px",
                          minHeight: "22px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "900",
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {(p.salePrice || p.price || 0) > 0
                            ? `${country === "US" ? "$" : "£"}${p.salePrice || p.price}`
                            : "DM for Price"}
                        </span>
                      </div>

                      {/* ACTIONS - SECOND LINE */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: "6px",
                          width: "100%",
                          flexWrap: "nowrap",
                        }}
                      >
                        {/* WhatsApp */}
                        <span
                          onClick={(e) =>
                            handleProtectedAction(e, () => {
                              window.open(
                                `https://wa.me/923184947722?text=${encodeURIComponent(
                                  `Inquiry: ${p.name || ""}`
                                )}`,
                                "_blank"
                              );
                            })
                          }
                          style={{
                            cursor: "pointer",
                            color: "#25D366",
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px",
                          }}
                          title="WhatsApp"
                        >
                          <svg width="15" height="15" viewBox="0 0 448 512" fill="currentColor">
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                          </svg>
                        </span>

                        {/* Instagram */}
                        <span
                          onClick={(e) =>
                            handleProtectedAction(e, () => {
                              window.open(
                                "https://instagram.com/thestyleloft72",
                                "_blank"
                              );
                            })
                          }
                          style={{
                            cursor: "pointer",
                            color: "#E4405F",
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px",
                          }}
                          title="Instagram"
                        >
                          <svg width="15" height="15" viewBox="0 0 448 512" fill="currentColor">
                            <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.6 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c-14.9 0-27 12.1-27 27s12.1 27 27 27 27-12.1 27-27-12.1-27-27-27zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.4 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                          </svg>
                        </span>

                        {/* Email */}
                        <span
                          onClick={(e) =>
                            handleProtectedAction(e, () => {
                              window.location.href = `mailto:thestyleloft72@gmail.com?subject=${encodeURIComponent(
                                `Inquiry: ${p.name || ""}`
                              )}`;
                            })
                          }
                          style={{
                            cursor: "pointer",
                            color: "#3b82f6",
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px",
                          }}
                          title="Email"
                        >
                          <svg width="15" height="15" viewBox="0 0 512 512" fill="currentColor">
                            <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4l217.6 163.2c11.8 8.9 28 8.9 39.8 0l217.6-163.2C506.9 141.3 512 127.1 512 112c0-26.5-21.5-48-48-48H48zM0 176v224c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V176L294.4 313.6c-22.5 16.9-54.3 16.9-76.8 0L0 176z" />
                          </svg>
                        </span>

                        {/* Cart */}
                        <button
                          onClick={(e) =>
                            handleProtectedAction(e, () => {
                              alert(`${p.name} cart mein add ho gaya hai!`);
                            })
                          }
                          style={{
                            fontSize: "11px",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            whiteSpace: "nowrap",
                          }}
                          title="Add to Cart"
                        >
                          <svg width="12" height="12" viewBox="0 0 576 512" fill="currentColor">
                            <path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-3-16-17-26.5-33.1-26.5H24C10.7 28 0 17.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1-96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
                          </svg>
                          Cart
                        </button>

                        {/* View */}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/product/${p.id}`;
                          }}
                          style={{
                            fontSize: "11px",
                            backgroundColor: "#fef3c7",
                            color: "#92400e",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            whiteSpace: "nowrap",
                          }}
                        >
                          View ↗
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* LOAD MORE BUTTON */}
              {visibleLimit < filteredProducts.length && (
                <div style={{ textAlign: "center", marginTop: "30px" }}>
                  <button
                    onClick={() => setVisibleLimit(prev => Math.min(prev + BATCH_SIZE, filteredProducts.length))}
                    style={{ backgroundColor: "#1e293b", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                  >
                    {isFetchingMore ? "Loading more luxury items..." : "Load More Products ↓"}
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* MEDIA PREVIEW MODAL */}
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
              <MediaDisplay url={previewMedia.url} type={previewMedia.type} alt={previewMedia.title} bannerId={previewMedia.id} controls={true} />
            </div>
          </div>
        </div>
      )}

      {/* Shorts Modal Component */}
      {isShortsOpen && (
        <ShortsModal onClose={() => setIsShortsOpen(false)} />
      )}

      <Footer />

      <FloatingChatButton productName="The Style Loft Exclusive Collection" />
    </div>
  );
}