"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "../../config/firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Sidebar from "../../components/Sidebar";
import ChatModal from "../../components/product/ChatModal";

import ProductGallery from "../../components/product/ProductGallery";
import ProductInfo from "../../components/product/ProductInfo";
import ProductReviews from "../../components/product/ProductReviews";
import RelatedProducts from "../../components/product/RelatedProducts";

interface Product {
    id: string;
    name: string;
    price: number;
    salePrice?: number;
    description?: string;
    offerDuration?: string;
    category: string;
    subCategory?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
}

interface CommentItem {
    id: string;
    productId: string;
    author: string;
    rating: number;
    comment: string;
    replies?: { author: string; message: string; createdAt?: any }[];
    files?: string[];
    createdAt?: any;
}

export default function ProductClient({ params }: { params: { id: string } }) {
    const [productId, setProductId] = useState<string>("");
    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [cartCount, setCartCount] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        if (params && params.id) setProductId(params.id);
    }, [params]);

    useEffect(() => {
        const fetchProductData = async () => {
            if (!productId) return;
            try {
                setLoading(true);

                const catSnap = await getDocs(collection(db, "categories"));
                const catList: any[] = [];
                catSnap.forEach(c => catList.push({ id: c.id, ...c.data() }));
                setCategoriesList(catList);

                const docRef = doc(db, "products", productId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const prodData = {
                        id: docSnap.id,
                        ...data,
                        name: data.name || data.title || "The Style Loft Product",
                        mediaUrl: data.mediaUrl || data.imageUrl || data.image || ""
                    } as Product;
                    setProduct(prodData);
                    setSelectedCategoryFilter(prodData.category || "ALL");

                    const prodSnap = await getDocs(collection(db, "products"));
                    const allItems: Product[] = [];
                    prodSnap.forEach((d) => {
                        if (d.id !== productId) {
                            const dData = d.data();
                            allItems.push({
                                id: d.id,
                                ...dData,
                                name: dData.name || dData.title || "Product",
                                mediaUrl: dData.mediaUrl || dData.imageUrl || dData.image || ""
                            } as Product);
                        }
                    });
                    setRelatedProducts(allItems);
                }

                const commQuery = query(collection(db, "product_comments"), where("productId", "==", productId));
                const commSnap = await getDocs(commQuery);
                const commList: CommentItem[] = [];
                commSnap.forEach((c) => {
                    commList.push({ id: c.id, ...c.data() } as CommentItem);
                });
                setComments(commList);

            } catch (error) {
                console.error("Error fetching product data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [productId]);

    const activeCatObj = useMemo(() => {
        if (!categoriesList || categoriesList.length === 0) return null;
        return categoriesList.find(c => c.name === selectedCategoryFilter) || null;
    }, [categoriesList, selectedCategoryFilter]);

    const handleAddToCart = () => {
        setCartCount(prev => prev + 1);
        alert(`🛒 "${product?.name}" added to cart successfully!`);
    };

    const averageRating = useMemo(() => {
        if (comments.length === 0) return 5.0;
        const sum = comments.reduce((acc, curr) => acc + (curr.rating || 5), 0);
        return (sum / comments.length).toFixed(1);
    }, [comments]);

    const displayedRelatedProducts = useMemo(() => {
        let items = relatedProducts;
        if (selectedCategoryFilter && selectedCategoryFilter !== "ALL") {
            items = items.filter(p => p.category === selectedCategoryFilter);
        }
        if (selectedSubCategory && selectedSubCategory !== "ALL") {
            items = items.filter(p => p.subCategory === selectedSubCategory);
        }
        if (searchQuery.trim()) {
            items = items.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return items;
    }, [relatedProducts, selectedCategoryFilter, selectedSubCategory, searchQuery]);

    if (loading) return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading Product...</p>
            <style jsx>{`
                .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: #fff; font-family: sans-serif; }
                .spinner { width: 40px; height: 40px; border: 4px solid #334155; border-top: 4px solid #f59e0b; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );

    if (!product) return <div className="loading-container" style={{ color: "#ef4444", textAlign: "center", padding: "50px", fontSize: "18px" }}>Product Not Found</div>;

    return (
        <div className="page-root">
            {/* 🎯 FIXED STICKY HEADER WRAPPER */}
            <div className="sticky-header-wrapper">
                <Header
                    cartCount={cartCount}
                    country="UK"
                    setCountry={() => { }}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCategoryFilter={selectedCategoryFilter}
                    setSelectedCategoryFilter={setSelectedCategoryFilter}
                    setSelectedSubCategoryFilter={setSelectedSubCategory}
                    setVisibleCount={() => { }}
                    categoriesList={categoriesList}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />
            </div>

            <div className="dashboard-container">
                <aside className="desktop-sidebar">
                    <Sidebar
                        isSidebarOpen={isSidebarOpen}
                        categoriesList={categoriesList}
                        selectedCategoryFilter={selectedCategoryFilter}
                        setSelectedCategoryFilter={setSelectedCategoryFilter}
                        selectedSubCategoryFilter={selectedSubCategory}
                        setSelectedSubCategoryFilter={setSelectedSubCategory}
                        setVisibleCount={() => { }}
                        activeCatObj={activeCatObj}
                        setIsSidebarOpen={setIsSidebarOpen}
                    />
                </aside>

                <div className="mobile-sidebar-container">
                    <Sidebar
                        isSidebarOpen={isSidebarOpen}
                        categoriesList={categoriesList}
                        selectedCategoryFilter={selectedCategoryFilter}
                        setSelectedCategoryFilter={setSelectedCategoryFilter}
                        selectedSubCategoryFilter={selectedSubCategory}
                        setSelectedSubCategoryFilter={setSelectedSubCategory}
                        setVisibleCount={() => { }}
                        activeCatObj={activeCatObj}
                        setIsSidebarOpen={setIsSidebarOpen}
                    />
                </div>

                <main className="main-content-area">
                    <div className="product-showcase-card">
                        <div className="gallery-wrapper">
                            <ProductGallery mediaUrl={product.mediaUrl} mediaType={product.mediaType} name={product.name} />
                        </div>
                        <div className="info-wrapper">
                            <ProductInfo
                                product={product}
                                averageRating={averageRating.toString()}
                                totalReviews={comments.length}
                                cartCount={cartCount}
                                onAddToCart={handleAddToCart}
                                onOpenChat={() => setChatOpen(true)}
                            />
                        </div>
                    </div>

                    <RelatedProducts
                        products={displayedRelatedProducts}
                        category={selectedCategoryFilter}
                        subCategory={selectedSubCategory}
                    />

                    <ProductReviews productId={productId} comments={comments} setComments={setComments} />
                </main>
            </div>

            {chatOpen && <ChatModal productName={product.name} onClose={() => setChatOpen(false)} />}
            <Footer />

            <style jsx>{`
    .page-root {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
        /* 🎯 overflow-x: hidden aur max-width yahan se hata di taake Sticky Sticky ki tarah chale */
        width: 100%;
    }
    
    /* 🎯 HEADER KO STICKY BANA DENE WALI CLASS */
    .sticky-header-wrapper {
        position: sticky;
        top: 0;
        z-index: 1000;
        background: #ffffff;
        width: 100%;
    }

    .dashboard-container {
        display: flex;
        gap: 24px;
        max-width: 1400px;
        margin: 0 auto;
        padding: 24px;
        box-sizing: border-box;
        width: 100%;
    }
    .desktop-sidebar {
        width: 260px;
        flex-shrink: 0;
    }
    .main-content-area {
        flex: 1;
        min-width: 0;
    }
    .product-showcase-card {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        background: #ffffff;
        padding: 30px;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        border: 1px solid #e2e8f0;
        margin-bottom: 30px;
        align-items: start;
        overflow-wrap: break-word;
        word-break: break-word;
    }
    .gallery-wrapper {
        width: 100%;
        min-width: 0;
    }
    .info-wrapper {
        width: 100%;
        min-width: 0;
        overflow-wrap: break-word;
        word-break: break-word;
    }
    @media (max-width: 1024px) {
        .desktop-sidebar {
            display: none;
        }
    }
    @media (max-width: 968px) {
        .product-showcase-card {
            grid-template-columns: 1fr !important;
            padding: 16px;
            gap: 20px;
        }
        .dashboard-container {
            padding: 12px;
        }
    }
`}</style>
        </div>
    );
}