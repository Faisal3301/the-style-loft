"use client";

import { useEffect, useState } from "react";
import { db } from "../../config/firebase"; // Relative: "../../config/firebase"
import { doc, getDoc } from "firebase/firestore";
import MediaDisplay from "../../components/MediaDisplay"; // Relative: "../../components/MediaDisplay"

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

export default function ProductClient({ id }: { id: string }) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id || id === "placeholder") {
                setLoading(false);
                return;
            }
            try {
                const docRef = doc(db, "products", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) {
        return <div style={{ padding: "50px", textAlign: "center" }}>Loading Product Details...</div>;
    }

    if (!product) {
        return <div style={{ padding: "50px", textAlign: "center" }}>Product Not Found</div>;
    }

    return (
        <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>
                
                {/* LEFT: Main Media Display (Plays Video or Shows Image) */}
                <div style={{ width: "100%", height: "480px", backgroundColor: "#000", borderRadius: "10px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    {product.mediaUrl ? (
                        <MediaDisplay 
                            url={product.mediaUrl} 
                            type={product.mediaType || "image"} 
                            alt={product.name} 
                        />
                    ) : (
                        <div style={{ color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                            No Media Available
                        </div>
                    )}
                </div>

                {/* RIGHT: Product Details */}
                <div>
                    <span style={{ fontSize: "12px", background: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: "12px", fontWeight: "bold" }}>
                        {product.category} {product.subCategory && `> ${product.subCategory}`}
                    </span>

                    <h1 style={{ fontSize: "26px", fontWeight: "bold", margin: "12px 0", color: "#0f172a" }}>
                        {product.name}
                    </h1>

                    {product.offerDuration && (
                        <div style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: "bold", marginBottom: "15px", display: "inline-block" }}>
                            ⏳ {product.offerDuration}
                        </div>
                    )}

                    <div style={{ display: "flex", alignItems: "baseline", gap: "12px", margin: "15px 0" }}>
                        {product.salePrice ? (
                            <>
                                <span style={{ fontSize: "30px", fontWeight: "bold", color: "#dc2626" }}>${product.salePrice}</span>
                                <span style={{ fontSize: "18px", textDecoration: "line-through", color: "#94a3b8" }}>${product.price}</span>
                            </>
                        ) : (
                            <span style={{ fontSize: "30px", fontWeight: "bold", color: "#0f172a" }}>${product.price}</span>
                        )}
                    </div>

                    {product.description && (
                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "15px", marginTop: "15px" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: "bold", color: "#475569" }}>Description</h3>
                            <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>{product.description}</p>
                        </div>
                    )}

                    <button style={{ width: "100%", marginTop: "25px", backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "14px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" }}>
                        🛒 Order Now
                    </button>
                </div>

            </div>
        </div>
    );
}