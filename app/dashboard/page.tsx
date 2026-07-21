"use client";

import { useEffect, useState } from "react";
import { db } from "../config/firebase"; // Par shayad root ke bajaye app directory count ho rahi ho
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    serverTimestamp,
    orderBy,
    query 
} from "firebase/firestore";
import Link from "next/link";

interface Product {
    id: string;
    name: string;
    price: number;
    salePrice?: number;
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

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categoriesList, setCategoriesList] = useState<DynamicCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [salePrice, setSalePrice] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [activeDriveLink, setActiveDriveLink] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [mediaType, setMediaType] = useState<"image" | "video">("image");

    // Fetch Categories & Products
    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Dynamic Categories
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
            if (fetchedCats.length > 0) {
                setSelectedCategory(fetchedCats[0].name);
            }

            // 2. Fetch Products
            try {
                const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const list: Product[] = [];
                querySnapshot.forEach((docSnap) => {
                    list.push({ id: docSnap.id, ...docSnap.data() } as Product);
                });
                setProducts(list);
            } catch {
                const snap = await getDocs(collection(db, "products"));
                const list: Product[] = [];
                snap.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() } as Product));
                setProducts(list);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle Category Change
    const handleCategoryChange = (catName: string) => {
        setSelectedCategory(catName);
        setSelectedSubCategory("");
        setActiveDriveLink("");
    };

    // Handle Sub-Category Change & Drive Sync Link Preview
    const handleSubCategoryChange = (subName: string) => {
        setSelectedSubCategory(subName);
        const currentCatObj = categoriesList.find(c => c.name === selectedCategory);
        if (currentCatObj) {
            const foundSub = currentCatObj.subCategories.find(s => s.name === subName);
            setActiveDriveLink(foundSub?.driveFolderUrl || "");
        } else {
            setActiveDriveLink("");
        }
    };

    // Add Product
    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price || !mediaUrl || !selectedCategory) {
            alert("Please fill all required fields!");
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, "products"), {
                name,
                price: parseFloat(price),
                salePrice: salePrice ? parseFloat(salePrice) : null,
                category: selectedCategory,
                subCategory: selectedSubCategory || "",
                mediaUrl,
                mediaType,
                createdAt: serverTimestamp()
            });

            // Reset Form
            setName("");
            setPrice("");
            setSalePrice("");
            setMediaUrl("");
            alert("Product added successfully! 🎉");
            fetchData();
        } catch (error) {
            console.error("Error adding product:", error);
            alert("Failed to add product.");
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Product
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteDoc(doc(db, "products", id));
            setProducts(products.filter(p => p.id !== id));
            alert("Product deleted!");
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    const currentCategoryObj = categoriesList.find(c => c.name === selectedCategory);

    return (
        <div style={{ width: "100%" }}>
            
            {/* Header / Intro */}
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#0f1111", margin: 0 }}>
                        📦 Products & Drive Media Management
                    </h1>
                    <p style={{ fontSize: "13px", color: "#565959", marginTop: "4px" }}>
                        Add products manually or use attached Google Drive links for fast uploads.
                    </p>
                </div>
                <button onClick={fetchData} style={{ fontSize: "12px", background: "#f0f2f2", border: "1px solid #d5d9d9", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                    🔄 Refresh Data
                </button>
            </div>

            {/* Content Body Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "25px" }}>
                
                {/* LEFT: ADD PRODUCT FORM */}
                <div style={cardStyle}>
                    <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px", borderBottom: "2px solid #febd69", paddingBottom: "8px" }}>
                        ➕ Publish New Product
                    </h2>

                    <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div>
                            <label style={labelStyle}>Product Title *</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder="e.g. Designer Embroidered Suit"
                                style={inputStyle} 
                                required 
                            />
                        </div>

                        {/* Dynamic Category Selector */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div>
                                <label style={labelStyle}>Category *</label>
                                <select 
                                    value={selectedCategory} 
                                    onChange={(e) => handleCategoryChange(e.target.value)} 
                                    style={inputStyle}
                                    required
                                >
                                    {categoriesList.length === 0 ? (
                                        <option value="">No Categories Found</option>
                                    ) : (
                                        categoriesList.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Sub-Category</label>
                                <select 
                                    value={selectedSubCategory} 
                                    onChange={(e) => handleSubCategoryChange(e.target.value)} 
                                    style={inputStyle}
                                >
                                    <option value="">-- Optional --</option>
                                    {currentCategoryObj?.subCategories.map((sub, i) => (
                                        <option key={i} value={sub.name}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Google Drive Folder Shortcut Notification */}
                        {activeDriveLink && (
                            <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px", borderRadius: "6px" }}>
                                <span style={{ fontSize: "12px", color: "#1e40af", display: "block", fontWeight: "600" }}>
                                    📁 Folder Drive Link Available!
                                </span>
                                <a 
                                    href={activeDriveLink} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    style={{ fontSize: "12px", color: "#2563eb", textDecoration: "underline", wordBreak: "break-all" }}
                                >
                                    Open Drive Folder To Copy Image Links ↗
                                </a>
                            </div>
                        )}

                        {/* Price & Sale Price */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <div>
                                <label style={labelStyle}>Regular Price ($) *</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    value={price} 
                                    onChange={(e) => setPrice(e.target.value)} 
                                    placeholder="49.99"
                                    style={inputStyle} 
                                    required 
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Offer / Sale Price ($)</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    value={salePrice} 
                                    onChange={(e) => setSalePrice(e.target.value)} 
                                    placeholder="39.99"
                                    style={inputStyle} 
                                />
                            </div>
                        </div>

                        {/* Media Type & URL */}
                        <div>
                            <label style={labelStyle}>Media Type</label>
                            <select value={mediaType} onChange={(e) => setMediaType(e.target.value as "image" | "video")} style={inputStyle}>
                                <option value="image">Image URL</option>
                                <option value="video">Video Preview URL</option>
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Media Direct Link / Drive Image URL *</label>
                            <input 
                                type="url" 
                                value={mediaUrl} 
                                onChange={(e) => setMediaUrl(e.target.value)} 
                                placeholder="https://..."
                                style={inputStyle} 
                                required 
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting}
                            style={{ 
                                backgroundColor: "#ffd814", 
                                border: "1px solid #fcd200", 
                                color: "#0f1111", 
                                padding: "12px", 
                                borderRadius: "6px", 
                                fontWeight: "bold", 
                                cursor: submitting ? "not-allowed" : "pointer",
                                marginTop: "5px"
                            }}
                        >
                            {submitting ? "Publishing..." : "🚀 Publish Product"}
                        </button>
                    </form>
                </div>

                {/* RIGHT: PRODUCTS INVENTORY TABLE */}
                <div style={cardStyle}>
                    <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px" }}>
                        📋 Inventory Records ({products.length})
                    </h2>

                    {loading ? (
                        <p style={{ textAlign: "center", color: "#666", padding: "30px 0" }}>Loading items...</p>
                    ) : products.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#999", padding: "30px 0" }}>No products added yet.</p>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #eee" }}>
                                        <th style={thStyle}>Preview</th>
                                        <th style={thStyle}>Title</th>
                                        <th style={thStyle}>Category</th>
                                        <th style={thStyle}>Price</th>
                                        <th style={thStyle}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((p) => (
                                        <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                                            <td style={tdStyle}>
                                                <div style={{ width: "44px", height: "44px", borderRadius: "4px", overflow: "hidden", backgroundColor: "#f0f0f0" }}>
                                                    {p.mediaType === "video" ? (
                                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", background: "#333", color: "white" }}>
                                                            🎥 Video
                                                        </div>
                                                    ) : (
                                                        <img src={p.mediaUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, fontWeight: "bold" }}>{p.name}</td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#334155", padding: "3px 8px", borderRadius: "4px", fontWeight: "600" }}>
                                                    {p.category} {p.subCategory && `> ${p.subCategory}`}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                {p.salePrice ? (
                                                    <div>
                                                        <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "11px", marginRight: "4px" }}>${p.price}</span>
                                                        <span style={{ color: "#dc2626", fontWeight: "bold" }}>${p.salePrice}</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontWeight: "bold" }}>${p.price}</span>
                                                )}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: "flex", gap: "10px" }}>
                                                    <Link href={`/product/${p.id}`} target="_blank" style={{ color: "#2563eb", textDecoration: "none" }}>
                                                        👁️ View
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleDelete(p.id)}
                                                        style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}

const cardStyle = {
    backgroundColor: "#ffffff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0"
};

const labelStyle = {
    fontSize: "12px",
    fontWeight: "bold" as const,
    color: "#475569"
};

const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    marginTop: "4px",
    outline: "none",
    boxSizing: "border-box" as const
};

const thStyle = {
    padding: "10px",
    color: "#475569",
    fontWeight: "bold" as const,
    fontSize: "11px",
    textTransform: "uppercase" as const
};

const tdStyle = {
    padding: "10px",
    verticalAlign: "middle"
};