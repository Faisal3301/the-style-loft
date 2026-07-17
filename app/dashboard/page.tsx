"use client";

import { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    subCategory?: string;
    mediaUrl: string;
    mediaType: "image" | "video";
}

export default function Dashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showForm, setShowForm] = useState(false); // Form show/hide karne ke liye

    // Search, Category aur Sorting States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("default");

    // --- FORM STATES ---
    const [newName, setNewName] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [newCategory, setNewCategory] = useState("Accessories");
    const [newSubCategory, setNewSubCategory] = useState("");
    const [newMediaUrl, setNewMediaUrl] = useState("");
    const [newMediaType, setNewMediaType] = useState("image");

    // Aapki main categories
    const categories = [
        "All", "Accessories", "Bags", "Belts", "Best Matching",
        "Clothing", "Jewellery", "Shoes", "Sunglasses", "Wallets", "Watches"
    ];

    // 🌟 AUTOMATIC LINK CONVERTER (ID Extractor)
    // 🌟 NEW FULLY AUTOMATIC LINK CONVERTER (Aap ke manual format ke mutabik)
const convertDriveLink = (url: string, type: string) => {
    if (!url || !url.includes("drive.google.com")) return url;

    let fileId = "";

    // 1. Agar share link ho: drive.google.com/file/d/FILE_ID/view
    if (url.includes("/d/")) {
        const parts = url.split("/d/");
        if (parts[1]) {
            fileId = parts[1].split("/")[0].split("?")[0];
        }
    } 
    // 2. Agar uc download link ho: id=FILE_ID
    else if (url.includes("id=")) {
        const parts = url.split("id=");
        if (parts[1]) {
            fileId = parts[1].split("&")[0];
        }
    }

    if (fileId) {
        if (type === "video") {
            // Video ke liye wahi download url jo aap chahte hain
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        } else {
            // 🎯 Image ke liye wahi exact 100% working link jo aap manually use karte the!
            return `https://lh3.googleusercontent.com/u/0/d/${fileId}`;
        }
    }

    return url; 
};

    // Database se products fetch karne ka function
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            const productsList: Product[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                productsList.push({
                    id: doc.id,
                    name: data.name || "Premium Item",
                    price: data.price || 0,
                    category: data.category || "General",
                    subCategory: data.subCategory || "",
                    mediaUrl: data.mediaUrl || "https://via.placeholder.com/250",
                    mediaType: data.mediaType || "image",
                });
            });
            setProducts(productsList);
        } catch (error) {
            console.error("Error fetching products: ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // --- SUBMIT / DATA SAVE HANDLE ---
    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newPrice || !newMediaUrl) {
            alert("Please fill Name, Price and Media URL fields!");
            return;
        }

        setUploading(true);
        try {
            // 🚀 Uploading se pehle link ko auto-convert kar rhe hain
            const finalMediaUrl = convertDriveLink(newMediaUrl, newMediaType);

            // Direct Firestore ke 'products' collection mein save kar rahe hain
            await addDoc(collection(db, "products"), {
                name: newName,
                price: parseFloat(newPrice),
                category: newCategory,
                subCategory: newSubCategory,
                mediaUrl: finalMediaUrl, // Converted URL save hoga
                mediaType: newMediaType,
                createdAt: new Date(),
            });

            alert("🎉 Product successfully added to US/UK store!");

            // Form fields clear karne ke liye
            setNewName("");
            setNewPrice("");
            setNewSubCategory("");
            setNewMediaUrl("");
            setShowForm(false);

            // Data refresh karne ke liye
            fetchProducts();
        } catch (error) {
            console.error("Error adding product: ", error);
            alert("Error saving data!");
        } finally {
            setUploading(false);
        }
    };

    // Filter Logic
    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.subCategory && product.subCategory.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Sorting Logic
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        return 0;
    });

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>

            {/* 🌟 PREMIUM NAVBAR */}
            <nav style={{ backgroundColor: "#0f172a", color: "white", padding: "15px 30px", position: "sticky", top: 0, zIndex: 100 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1400px", margin: "0 auto", gap: "20px" }}>
                    <div style={{ fontSize: "22px", fontWeight: "bold", letterSpacing: "1px" }}>
                        THE STYLE LOFT <span style={{ fontSize: "12px", color: "#38bdf8", border: "1px solid #38bdf8", padding: "2px 5px", borderRadius: "4px", marginLeft: "5px" }}>UK / US</span>
                    </div>

                    <div style={{ flex: 1, maxWidth: "600px" }}>
                        <input
                            type="text"
                            placeholder="Search products, sub-items or styles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: "100%", padding: "10px 15px", borderRadius: "6px", border: "none", outline: "none", color: "#0f172a", fontSize: "15px" }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "20px", alignItems: "center", fontSize: "14px" }}>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            style={{ backgroundColor: "#2563eb", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                        >
                            {showForm ? "✕ Close Form" : "➕ Add New Item"}
                        </button>
                    </div>
                </div>
            </nav>

            {/* 📊 SUB-HEADER: CATEGORIES & SORTING */}
            <div style={{ backgroundColor: "white", borderBottom: "1px solid #e2e8f0", padding: "10px 30px" }}>
                <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
                    <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "5px", width: "75%" }}>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    padding: "8px 16px", borderRadius: "20px", border: "none",
                                    backgroundColor: selectedCategory === cat ? "#0070f3" : "#f1f5f9",
                                    color: selectedCategory === cat ? "white" : "#475569",
                                    fontWeight: "500", cursor: "pointer", whiteSpace: "nowrap"
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white" }}>
                            <option value="default">Featured</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 📥 DYNAMIC ITEM UPLOADER FORM */}
            {showForm && (
                <div style={{ backgroundColor: "white", borderBottom: "2px solid #e2e8f0", padding: "30px" }}>
                    <form onSubmit={handleAddProduct} style={{ maxWidth: "800px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div style={{ gridColumn: "span 2" }}><h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>Upload Premium Product</h3></div>

                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "5px" }}>Product Name *</label>
                            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Luxury Leather Bag" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} required />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "5px" }}>Price (USD $) *</label>
                            <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="e.g. 150" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} required />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "5px" }}>Main Category</label>
                            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white" }}>
                                {categories.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "5px" }}>Sub Category (Optional)</label>
                            <input type="text" value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} placeholder="e.g. Handbags, Sneakers" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "5px" }}>Media Type</label>
                            <select value={newMediaType} onChange={(e) => setNewMediaType(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white" }}>
                                <option value="image">Image (Photo)</option>
                                <option value="video">Video (MP4)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "5px" }}>Media URL (Image/Video Link) *</label>
                            <input type="text" value={newMediaUrl} onChange={(e) => setNewMediaUrl(e.target.value)} placeholder="Paste link here" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} required />
                        </div>

                        <div style={{ gridColumn: "span 2", textAlign: "right", marginTop: "10px" }}>
                            <button type="submit" disabled={uploading} style={{ backgroundColor: "#10b981", color: "white", border: "none", padding: "12px 30px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                                {uploading ? "Saving to Cloud..." : "🚀 Publish Live"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 👗 MAIN PRODUCTS DASHBOARD */}
            <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "30px" }}>
                <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", marginBottom: "25px" }}>
                    {selectedCategory} Items
                    <span style={{ fontSize: "15px", color: "#64748b", fontWeight: "400", marginLeft: "10px" }}>
                        ({sortedProducts.length} items found)
                    </span>
                </h2>

                {loading ? (
                    <p style={{ textAlign: "center", color: "#64748b" }}>Loading store items...</p>
                ) : sortedProducts.length === 0 ? (
                    <div style={{ backgroundColor: "white", padding: "60px 20px", borderRadius: "12px", textAlign: "center", color: "#64748b" }}>
                        <p style={{ fontSize: "18px", fontWeight: "500" }}>No items in this category yet.</p>
                        <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "5px" }}>Upar "Add New Item" par click karke pehli item upload karein!</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "25px" }}>
                        {sortedProducts.map((product) => (
                            <div key={product.id} style={{ backgroundColor: "white", borderRadius: "12px", overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                                <div style={{ height: "280px", width: "100%", backgroundColor: "#f8fafc" }}>
                                    {product.mediaType === "video" ? (
                                        <iframe
                                            src={product.mediaUrl.replace("uc?export=download&id=", "file/d/") + "/preview"}
                                            style={{ width: "100%", height: "100%", border: "none" }}
                                            allow="autoplay"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <img src={product.mediaUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    )}
                                </div>

                                <div style={{ padding: "20px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "11px", backgroundColor: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "12px", fontWeight: "600" }}>{product.category}</span>
                                        {product.subCategory && <span style={{ fontSize: "12px", color: "#64748b" }}>{product.subCategory}</span>}
                                    </div>
                                    <h4 style={{ fontWeight: "600", fontSize: "16px", marginTop: "10px", color: "#0f172a" }}>{product.name}</h4>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #f1f5f9" }}>
                                        <div>
                                            <span style={{ color: "#0f172a", fontWeight: "700", fontSize: "18px" }}>${product.price}</span>
                                            <span style={{ color: "#64748b", fontSize: "12px", marginLeft: "5px" }}>(£{(product.price * 0.78).toFixed(2)})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}