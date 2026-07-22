"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "../../config/firebase";
import { doc, getDoc, collection, getDocs, addDoc, query, where, serverTimestamp } from "firebase/firestore";
import MediaDisplay from "../../components/MediaDisplay";

// Aapke banaye hue existing components
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Sidebar from "../../components/Sidebar";

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
    reply?: string;
    createdAt?: any;
}

export default function ProductClient({ id }: { id: string }) {
    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Cart & Interactive Animation States
    const [cartCount, setCartCount] = useState(0);
    const [animatingCart, setAnimatingCart] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState("");

    // New Comment Form States
    const [authorName, setAuthorName] = useState("");
    const [ratingVal, setRatingVal] = useState(5);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);

    // Fetch Product details and related items
    useEffect(() => {
        const fetchProductData = async () => {
            if (!id || id === "placeholder") {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const docRef = doc(db, "products", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const prodData = { id: docSnap.id, ...docSnap.data() } as Product;
                    setProduct(prodData);

                    // Fetch Related Products from same category
                    const prodSnap = await getDocs(collection(db, "products"));
                    const allItems: Product[] = [];
                    prodSnap.forEach((d) => {
                        if (d.id !== id) {
                            allItems.push({ id: d.id, ...d.data() } as Product);
                        }
                    });

                    const filtered = allItems.filter(p => p.category === prodData.category);
                    setRelatedProducts(filtered);
                }

                // Fetch Comments for this product
                const commQuery = query(collection(db, "product_comments"), where("productId", "==", id));
                const commSnap = await getDocs(commQuery);
                const commList: CommentItem[] = [];
                commSnap.forEach((c) => {
                    commList.push({ id: c.id, ...c.data() } as CommentItem);
                });
                setComments(commList);

            } catch (error) {
                console.error("Error fetching product details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductData();
    }, [id]);

    // Handle Add to Cart with Animation
    const handleAddToCart = () => {
        setCartCount(prev => prev + 1);
        setAnimatingCart(true);
        setTimeout(() => setAnimatingCart(false), 600);
    };

    // Handle Submitting Review / Comment
    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authorName.trim() || !commentText.trim()) {
            alert("Please fill in your name and comment.");
            return;
        }

        setSubmittingComment(true);
        try {
            const newCommentData = {
                productId: id,
                author: authorName,
                rating: Number(ratingVal),
                comment: commentText,
                reply: "",
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "product_comments"), newCommentData);
            setComments([{ id: docRef.id, ...newCommentData }, ...comments]);
            setAuthorName("");
            setCommentText("");
            setRatingVal(5);
            alert("✅ Review submitted successfully!");
        } catch (error) {
            console.error("Error adding review:", error);
            alert("Failed to submit review.");
        } finally {
            setSubmittingComment(false);
        }
    };

    // Calculate Average Rating
    const averageRating = useMemo(() => {
        if (comments.length === 0) return 5.0;
        const sum = comments.reduce((acc, curr) => acc + (curr.rating || 5), 0);
        return (sum / comments.length).toFixed(1);
    }, [comments]);

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
                <Header
                    cartCount={cartCount}
                    country="UK"
                    setCountry={() => { }}
                    searchQuery=""
                    setSearchQuery={() => { }}
                    selectedCategoryFilter="ALL"
                    setSelectedCategoryFilter={() => { }}
                    setSelectedSubCategoryFilter={() => { }}
                    setVisibleCount={() => { }}
                    categoriesList={[]}
                    isSidebarOpen={false}
                    setIsSidebarOpen={() => { }}
                />
                <div style={{ padding: "120px", textAlign: "center", fontSize: "16px", color: "#64748b", flex: 1 }}>Loading Product Details...</div>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
                <Header
                    cartCount={cartCount}
                    country="UK"
                    setCountry={() => { }}
                    searchQuery=""
                    setSearchQuery={() => { }}
                    selectedCategoryFilter="ALL"
                    setSelectedCategoryFilter={() => { }}
                    setSelectedSubCategoryFilter={() => { }}
                    setVisibleCount={() => { }}
                    categoriesList={[]}
                    isSidebarOpen={false}
                    setIsSidebarOpen={() => { }}
                />
                <div style={{ padding: "120px", textAlign: "center", fontSize: "16px", color: "#ef4444", flex: 1 }}>Product Not Found</div>
                <Footer />
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc", fontFamily: "Inter, sans-serif" }}>

            {/* HEADER COMPONENT */}
            <Header
                cartCount={cartCount}
                country="UK"
                setCountry={() => { }}
                searchQuery=""
                setSearchQuery={() => { }}
                selectedCategoryFilter="ALL"
                setSelectedCategoryFilter={() => { }}
                setSelectedSubCategoryFilter={() => { }}
                setVisibleCount={() => { }}
                categoriesList={[]}
                isSidebarOpen={false}
                setIsSidebarOpen={() => { }}
            />

            {/* PROPER MAIN LAYOUT WITH SIDEBAR & CONTENT GRID */}
            <div style={{ maxWidth: "1400px", width: "100%", margin: "0 auto", padding: "30px 20px", display: "grid", gridTemplateColumns: "280px 1fr", gap: "30px", alignItems: "start", flex: 1 }}>

                {/* SIDEBAR CONTAINER */}
                <div style={{ position: "sticky", top: "20px" }}>
                   <Sidebar 
    isSidebarOpen={false}
    categoriesList={[]}
    selectedCategoryFilter="ALL"
    setSelectedCategoryFilter={() => {}}
    selectedSubCategoryFilter=""
    setSelectedSubCategoryFilter={() => {}}
    setVisibleCount={() => {}}
    activeCatObj={null}
/>
                </div>

                {/* MAIN CONTENT AREA */}
                <main style={{ display: "flex", flexDirection: "column", gap: "30px", minWidth: 0 }}>

                    {/* MAIN PRODUCT SHOWCASE CARD */}
                    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "35px", alignItems: "start", background: "#ffffff", padding: "35px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)", border: "1px solid #e2e8f0" }}>

                        {/* LEFT: Media Display Box */}
                        <div style={{ width: "100%", height: "450px", backgroundColor: "#0f172a", borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>
                            {product.mediaUrl ? (
                                <MediaDisplay url={product.mediaUrl} type={product.mediaType || "image"} alt={product.name} controls={true} />
                            ) : (
                                <div style={{ color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "14px" }}>
                                    No Media Available
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Product Meta & Actions */}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "12px", background: "#f1f5f9", color: "#475569", padding: "6px 12px", borderRadius: "20px", fontWeight: "700", width: "fit-content", letterSpacing: "0.3px" }}>
                                {product.category} {product.subCategory && `> ${product.subCategory}`}
                            </span>

                            <h1 style={{ fontSize: "28px", fontWeight: "900", margin: "14px 0 10px 0", color: "#0f172a", letterSpacing: "-0.5px", lineHeight: "1.2" }}>
                                {product.name}
                            </h1>

                            {/* Star Rating Summary */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                                <span style={{ color: "#f59e0b", fontSize: "14px" }}>{"⭐".repeat(Math.round(Number(averageRating)))}</span>
                                <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>{averageRating} / 5.0</span>
                                <span style={{ fontSize: "12px", color: "#94a3b8" }}>({comments.length} reviews)</span>
                            </div>

                            {product.offerDuration && (
                                <div style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", marginBottom: "16px", display: "inline-block", width: "fit-content" }}>
                                    ⏳ {product.offerDuration}
                                </div>
                            )}

                            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", margin: "10px 0 20px 0" }}>
                                {product.salePrice !== undefined && product.salePrice > 0 ? (
                                    <>
                                        <span style={{ fontSize: "32px", fontWeight: "900", color: "#dc2626" }}>${product.salePrice}</span>
                                        <span style={{ fontSize: "16px", textDecoration: "line-through", color: "#94a3b8" }}>${product.price}</span>
                                    </>
                                ) : (
                                    <span style={{ fontSize: "32px", fontWeight: "900", color: "#0f172a" }}>${product.price}</span>
                                )}
                            </div>

                            {product.description && (
                                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px", marginBottom: "20px" }}>
                                    <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Description</h3>
                                    <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6", margin: 0 }}>{product.description}</p>
                                </div>
                            )}

                            {/* ACTION BUTTONS (Order Now + Add To Cart) */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "auto" }}>
                                <button
                                    onClick={() => setChatOpen(true)}
                                    style={{ width: "100%", backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "14px", borderRadius: "10px", fontWeight: "700", fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)", transition: "all 0.2s ease" }}
                                >
                                    💬 Order Now (Live Chat Support)
                                </button>

                                <button
                                    onClick={handleAddToCart}
                                    style={{ width: "100%", backgroundColor: "#ffffff", color: "#2563eb", border: "2px solid #2563eb", padding: "12px", borderRadius: "10px", fontWeight: "700", fontSize: "14px", cursor: "pointer", transition: "all 0.2s ease" }}
                                >
                                    🛒 Add to Cart {cartCount > 0 && `(${cartCount})`}
                                </button>
                            </div>

                            {/* EMAIL & INSTAGRAM CONTACT ROW */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", fontSize: "12px", color: "#64748b", border: "1px solid #e2e8f0" }}>
                                <a href="mailto:support@thestyleloft.com" style={{ color: "#475569", textDecoration: "none", fontWeight: "600" }}>📧 support@thestyleloft.com</a>
                                <a href="https://instagram.com/thestyleloft.official" target="_blank" rel="noopener noreferrer" style={{ color: "#475569", textDecoration: "none", fontWeight: "600" }}>📸 @thestyleloft.official</a>
                            </div>
                        </div>
                    </div>

                    {/* CUSTOMER REVIEWS & COMMENTS SECTION */}
                    <div id="reviews" style={{ background: "#ffffff", padding: "35px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)", border: "1px solid #e2e8f0" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginBottom: "20px" }}>
                            💬 Customer Reviews & Feedback ({comments.length})
                        </h2>

                        {/* Add Review Form */}
                        <form onSubmit={handleAddComment} style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", marginBottom: "30px", border: "1px solid #e2e8f0" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#334155", marginTop: 0, marginBottom: "12px" }}>Leave a Review</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "12px" }}>
                                <div>
                                    <label style={labelStyle}>Your Name</label>
                                    <input type="text" placeholder="e.g. Ali Khan" value={authorName} onChange={(e) => setAuthorName(e.target.value)} style={inputStyle} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>Rating</label>
                                    <select value={ratingVal} onChange={(e) => setRatingVal(Number(e.target.value))} style={inputStyle}>
                                        <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                                        <option value="4">⭐⭐⭐⭐ (4/5)</option>
                                        <option value="3">⭐⭐⭐ (3/5)</option>
                                        <option value="2">⭐⭐ (2/5)</option>
                                        <option value="1">⭐ (1/5)</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: "15px" }}>
                                <label style={labelStyle}>Your Comment / Feedback</label>
                                <textarea placeholder="Write your experience..." value={commentText} onChange={(e) => setCommentText(e.target.value)} style={{ ...inputStyle, height: "80px", resize: "vertical" }} required />
                            </div>
                            <button type="submit" disabled={submittingComment} style={{ backgroundColor: "#10b981", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px", boxShadow: "0 2px 6px rgba(16, 185, 129, 0.2)" }}>
                                {submittingComment ? "Submitting..." : "Submit Review"}
                            </button>
                        </form>

                        {/* Comments List */}
                        {comments.length === 0 ? (
                            <p style={{ color: "#64748b", fontSize: "13px", fontStyle: "italic", margin: 0 }}>No reviews yet. Be the first to review this product!</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {comments.map((c) => (
                                    <div key={c.id} style={{ padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#ffffff" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                            <strong style={{ fontSize: "14px", color: "#0f172a" }}>{c.author}</strong>
                                            <span style={{ color: "#f59e0b", fontSize: "12px" }}>{"⭐".repeat(c.rating || 5)}</span>
                                        </div>
                                        <p style={{ fontSize: "13px", color: "#334155", margin: "4px 0", lineHeight: "1.5" }}>{c.comment}</p>
                                        {c.reply && (
                                            <div style={{ marginTop: "10px", background: "#f8fafc", padding: "10px 12px", borderRadius: "6px", borderLeft: "3px solid #2563eb" }}>
                                                <div style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", marginBottom: "2px" }}>Store Response:</div>
                                                <p style={{ fontSize: "12px", color: "#475569", margin: 0, lineHeight: "1.4" }}>{c.reply}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* LIVE CHAT POPUP MODAL */}
            {chatOpen && (
                <div style={{ position: "fixed", bottom: "20px", right: "20px", width: "320px", background: "#fff", borderRadius: "16px", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0", zIndex: 1000, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ background: "#2563eb", color: "#fff", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700" }}>💬 Live Support - The Style Loft</span>
                        <button onClick={() => setChatOpen(false)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer" }}>✕</button>
                    </div>
                    <div style={{ padding: "15px", height: "200px", background: "#f8fafc", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ background: "#e2e8f0", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", color: "#334155", maxWidth: "85%" }}>
                            Hello! How can we help you order <strong>{product.name}</strong>?
                        </div>
                    </div>
                    <div style={{ padding: "10px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "8px", background: "#fff" }}>
                        <input
                            type="text"
                            placeholder="Type your query..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", outline: "none" }}
                        />
                        <button onClick={() => { alert("Message sent to store support!"); setChatMessage(""); setChatOpen(false); }} style={{ background: "#2563eb", color: "#fff", border: "none", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Send</button>
                    </div>
                </div>
            )}

            {/* FOOTER COMPONENT */}
            <Footer />
        </div>
    );
}

// Styling Constants
const labelStyle = { fontSize: "12px", fontWeight: "700" as const, color: "#475569", display: "block", marginBottom: "4px" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" as const, outline: "none", background: "#ffffff" };