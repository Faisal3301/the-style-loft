"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "../../config/firebase"; // Relative: "../../config/firebase"
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    updateDoc,
    doc, 
    serverTimestamp 
} from "firebase/firestore";
import MediaDisplay from "../../components/MediaDisplay"; // Target Media Component

interface SubCategoryItem {
    name: string;
    driveFolderUrl?: string;
}

interface DynamicCategory {
    id: string;
    name: string;
    subCategories: SubCategoryItem[];
}

interface Product {
    id: string;
    name: string;
    price: number;
    salePrice?: number;
    description?: string;
    offerDuration?: string;
    category: string;
    subCategory?: string;
    mediaUrl: string;
    mediaType: "image" | "video";
    driveFileId?: string;
}

export default function AutoImportProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categoriesList, setCategoriesList] = useState<DynamicCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);

    // Auto-Importer Form States
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [defaultPrice, setDefaultPrice] = useState("10");

    // 🔍 Filters & Smart Search States for Inventory Table
    const [filterCategory, setFilterCategory] = useState("ALL");
    const [filterSubCategory, setFilterSubCategory] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // Edit Modal State
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Fetch Categories and Firestore Products
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Categories
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
            if (fetchedCats.length > 0 && !selectedCategory) {
                setSelectedCategory(fetchedCats[0].name);
            }

            // Fetch Products
            const snap = await getDocs(collection(db, "products"));
            const list: Product[] = [];
            snap.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() } as Product));
            setProducts(list);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Extract Active Drive Link
    const getActiveDriveLink = () => {
        const catObj = categoriesList.find(c => c.name === selectedCategory);
        if (catObj && selectedSubCategory) {
            const subObj = catObj.subCategories.find(s => s.name === selectedSubCategory);
            return subObj?.driveFolderUrl || "";
        }
        return "";
    };

    // Extract Folder ID
    const extractFolderId = (url: string) => {
        const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : url;
    };

    // ⚡ BULK AUTO-IMPORT DRIVE FILES TO FIRESTORE ⚡
   // ⚡ BULK AUTO-IMPORT DRIVE FILES TO FIRESTORE ⚡
    const handleAutoImportDriveFiles = async () => {
        const driveUrl = getActiveDriveLink();
        if (!driveUrl) {
            alert("Is Sub-Category mein Drive Link mojood nahi hai!");
            return;
        }

        const folderId = extractFolderId(driveUrl);
        setImporting(true);

        try {
            // 1. Fetch files directly from Google Drive API using Client-Side API Key
            const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
            if (!API_KEY) {
                alert("Google Drive API Key (NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY) missing hai .env file mein!");
                setImporting(false);
                return;
            }

            const driveApiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&key=${API_KEY}`;
            
            const res = await fetch(driveApiUrl);
            const data = await res.json();

            if (data.error) {
                console.error("Drive API Error:", data.error.message);
                alert(`Drive API Error: ${data.error.message}`);
                setImporting(false);
                return;
            }

            const filesList = (data.files || []).map((file: any) => {
                const isVideo = file.mimeType.includes("video") || file.name.match(/\.(mp4|mov|avi|mkv|webm)$/i);
                return {
                    id: file.id,
                    name: file.name,
                    type: isVideo ? "video" : "image",
                    url: isVideo 
                        ? `https://drive.google.com/file/d/${file.id}/preview` 
                        : `https://lh3.googleusercontent.com/d/${file.id}=s1000`
                };
            });

            if (filesList.length === 0) {
                alert("Drive folder khali hai ya access issue hai.");
                setImporting(false);
                return;
            }

            // Filter out files that are already imported to prevent duplicates
            const existingFileIds = new Set(products.map(p => p.driveFileId));
            const newFiles = filesList.filter((f: any) => !existingFileIds.has(f.id));

            if (newFiles.length === 0) {
                alert("Iss folder ki tamam images pehle se import ho chuki hain!");
                setImporting(false);
                return;
            }

            // 2. Loop through each Drive File & Save as Individual Product Document in Firestore
            let count = 0;
            const parsedPrice = parseFloat(defaultPrice) || 0;

            for (const file of newFiles) {
                const cleanName = file.name.replace(/\.[^/.]+$/, "");

                await addDoc(collection(db, "products"), {
                    name: cleanName || `${selectedSubCategory} Item`,
                    price: parsedPrice,
                    salePrice: null,
                    description: "",
                    offerDuration: "",
                    category: selectedCategory,
                    subCategory: selectedSubCategory,
                    mediaUrl: file.url,
                    mediaType: file.type,
                    driveFileId: file.id,
                    createdAt: serverTimestamp()
                });
                count++;
            }

            alert(`🎉 Success! ${count} new items automatically imported into database!`);
            fetchData(); // Refresh list

        } catch (error) {
            console.error("Import Error:", error);
            alert("Drive files import karne mein error aaya.");
        } finally {
            setImporting(false);
        }
    };

    // Update Item Details
    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        try {
            const productRef = doc(db, "products", editingProduct.id);
            await updateDoc(productRef, {
                name: editingProduct.name,
                price: parseFloat(editingProduct.price as any) || 0,
                salePrice: editingProduct.salePrice ? parseFloat(editingProduct.salePrice as any) : null,
                description: editingProduct.description || "",
                offerDuration: editingProduct.offerDuration || ""
            });

            alert("✅ Item updated!");
            setEditingProduct(null);
            fetchData();
        } catch (error) {
            console.error("Error updating product:", error);
            alert("Failed to update item.");
        }
    };

    // Single Item Delete
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this single item?")) return;
        try {
            await deleteDoc(doc(db, "products", id));
            setProducts(products.filter(p => p.id !== id));
            alert("Item deleted!");
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const currentCategoryObj = categoriesList.find(c => c.name === selectedCategory);

    // 🔍 Smart Filtered Products calculation based on Category Filter, Sub-Category Filter & Search Query
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesCategory = filterCategory === "ALL" || product.category === filterCategory;
            const matchesSubCategory = filterSubCategory === "ALL" || product.subCategory === filterSubCategory;
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSubCategory && matchesSearch;
        });
    }, [products, filterCategory, filterSubCategory, searchQuery]);

    // Available Sub-Categories for the Inventory Filter dropdown
    const availableFilterSubCategories = useMemo(() => {
        if (filterCategory === "ALL") {
            // Return all unique subcategories across all categories
            const allSubs = new Set<string>();
            categoriesList.forEach(c => c.subCategories.forEach(s => allSubs.add(s.name)));
            return Array.from(allSubs);
        }
        const cat = categoriesList.find(c => c.name === filterCategory);
        return cat ? cat.subCategories.map(s => s.name) : [];
    }, [filterCategory, categoriesList]);

    // Group Filtered Products Category & Sub-Category Wise for display
    const groupedProducts = useMemo(() => {
        return filteredProducts.reduce((acc, product) => {
            const catKey = product.category || "Uncategorized";
            const subKey = product.subCategory || "General";
            if (!acc[catKey]) acc[catKey] = {};
            if (!acc[catKey][subKey]) acc[catKey][subKey] = [];
            acc[catKey][subKey].push(product);
            return acc;
        }, {} as Record<string, Record<string, Product[]>>);
    }, [filteredProducts]);

    return (
        <div style={{ width: "100%", fontFamily: "sans-serif" }}>
            
            <div style={{ marginBottom: "20px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#0f1111" }}>
                    ⚡ Drive Auto-Importer & Item Manager
                </h1>
                <p style={{ fontSize: "13px", color: "#565959" }}>
                    Sub-category choose karke button dabayein, Drive ki har photo alag-alag item ban kar Database mein save ho jayegi.
                </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "25px" }}>
                
                {/* LEFT CONTROL PANEL */}
                <div style={cardStyle}>
                    <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px", borderBottom: "2px solid #febd69", paddingBottom: "8px" }}>
                        📥 Auto-Import Items
                    </h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div>
                            <label style={labelStyle}>Select Category *</label>
                            <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubCategory(""); }} style={inputStyle}>
                                {categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Select Sub-Category *</label>
                            <select value={selectedSubCategory} onChange={(e) => setSelectedSubCategory(e.target.value)} style={inputStyle}>
                                <option value="">-- Choose Sub Category --</option>
                                {currentCategoryObj?.subCategories.map((sub, i) => (
                                    <option key={i} value={sub.name}>{sub.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Default Initial Price ($) for Imported Items</label>
                            <input type="number" value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value)} style={inputStyle} placeholder="10" />
                        </div>

                        {getActiveDriveLink() ? (
                            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px", borderRadius: "6px", fontSize: "12px", color: "#166534" }}>
                                🔗 Drive Link Detected! Ready to fetch files.
                            </div>
                        ) : (
                            selectedSubCategory && (
                                <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", padding: "10px", borderRadius: "6px", fontSize: "12px", color: "#991b1b" }}>
                                    ⚠️ No Drive link found for this Sub-Category. Categories page par link add karein.
                                </div>
                            )
                        )}

                        <button 
                            onClick={handleAutoImportDriveFiles} 
                            disabled={importing || !selectedSubCategory || !getActiveDriveLink()}
                            style={{ 
                                backgroundColor: importing ? "#cbd5e1" : "#ffd814", 
                                border: "1px solid #fcd200", 
                                color: "#0f1111", 
                                padding: "12px", 
                                borderRadius: "6px", 
                                fontWeight: "bold", 
                                cursor: importing ? "not-allowed" : "pointer" 
                            }}
                        >
                            {importing ? "⏳ Fetching & Saving Items..." : "🚀 Auto-Import All Drive Files to DB"}
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL: Inventory Management with Filters & Smart Search */}
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                        <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>
                            📋 Inventory Items ({filteredProducts.length} of {products.length})
                        </h2>
                    </div>

                    {/* 🔎 FILTERS & SMART SEARCH TOOLBAR */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: "10px", marginBottom: "20px", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                        <div>
                            <label style={labelStyle}>Filter Category</label>
                            <select 
                                value={filterCategory} 
                                onChange={(e) => { 
                                    setFilterCategory(e.target.value); 
                                    setFilterSubCategory("ALL"); 
                                }} 
                                style={inputStyle}
                            >
                                <option value="ALL">📂 All Categories</option>
                                {categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Filter Sub-Category</label>
                            <select 
                                value={filterSubCategory} 
                                onChange={(e) => setFilterSubCategory(e.target.value)} 
                                style={inputStyle}
                            >
                                <option value="ALL">📂 All Sub-Categories</option>
                                {availableFilterSubCategories.map((subName, i) => (
                                    <option key={i} value={subName}>{subName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Smart Search Item</label>
                            <input 
                                type="text" 
                                placeholder="🔍 Search by item name..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                style={inputStyle} 
                            />
                        </div>
                    </div>

                    {loading ? (
                        <p style={{ color: "#666" }}>Loading inventory...</p>
                    ) : Object.keys(groupedProducts).length === 0 ? (
                        <p style={{ color: "#888", textAlign: "center", padding: "30px 0" }}>No items found matching your filters or search query.</p>
                    ) : (
                        Object.entries(groupedProducts).map(([catName, subCats]) => (
                            <div key={catName} style={{ marginBottom: "20px", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                                <div style={{ backgroundColor: "#f1f5f9", padding: "10px 15px", fontWeight: "bold", fontSize: "15px", borderBottom: "1px solid #e2e8f0", color: "#1e293b" }}>
                                    📂 Category: {catName}
                                </div>

                                {Object.entries(subCats).map(([subName, items]) => (
                                    <div key={subName} style={{ padding: "12px 15px", borderBottom: "1px dashed #e2e8f0" }}>
                                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#2563eb", marginBottom: "10px" }}>
                                            ↳ Sub-Category: {subName} ({items.length} Items)
                                        </div>

                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                            <thead>
                                                <tr style={{ background: "#f8fafc", textAlign: "left" }}>
                                                    <th style={thStyle}>Preview</th>
                                                    <th style={thStyle}>Title</th>
                                                    <th style={thStyle}>Price</th>
                                                    <th style={thStyle}>Offer Time</th>
                                                    <th style={thStyle}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item) => (
                                                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                        <td style={tdStyle}>
                                                            <div style={{ width: "45px", height: "45px", borderRadius: "4px", overflow: "hidden", backgroundColor: "#000" }}>
                                                                <MediaDisplay 
                                                                    url={item.mediaUrl} 
                                                                    type={item.mediaType} 
                                                                    thumbnailOnly={true} 
                                                                />
                                                            </div>
                                                        </td>
                                                        <td style={tdStyle}><strong>{item.name}</strong></td>
                                                        <td style={tdStyle}>
                                                            {item.salePrice ? (
                                                                <span><s style={{ color: "#888" }}>${item.price}</s> <strong style={{ color: "#dc2626" }}>${item.salePrice}</strong></span>
                                                            ) : (
                                                                <span>${item.price}</span>
                                                            )}
                                                        </td>
                                                        <td style={tdStyle}>{item.offerDuration || "-"}</td>
                                                        <td style={tdStyle}>
                                                            <div style={{ display: "flex", gap: "8px" }}>
                                                                <button onClick={() => setEditingProduct(item)} style={{ background: "#2563eb", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}>✏️ Edit</button>
                                                                <button onClick={() => handleDelete(item.id)} style={{ background: "#ef4444", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}>🗑️ Delete</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>

            </div>

            {/* SINGLE ITEM EDIT MODAL */}
            {editingProduct && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginTop: 0, fontSize: "16px", fontWeight: "bold" }}>✏️ Edit Single Item</h3>
                        
                        <div style={{ width: "100px", height: "100px", margin: "0 auto 15px auto", borderRadius: "6px", overflow: "hidden", backgroundColor: "#000" }}>
                            <MediaDisplay 
                                url={editingProduct.mediaUrl} 
                                type={editingProduct.mediaType} 
                                thumbnailOnly={true} 
                            />
                        </div>

                        <form onSubmit={handleUpdateProduct} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div>
                                <label style={labelStyle}>Item Title</label>
                                <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} style={inputStyle} required />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={labelStyle}>Regular Price ($)</label>
                                    <input type="number" step="0.01" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value as any })} style={inputStyle} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>Sale / Offer Price ($)</label>
                                    <input type="number" step="0.01" value={editingProduct.salePrice || ""} onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: e.target.value as any })} style={inputStyle} />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Offer Duration / Expiry</label>
                                <input type="text" value={editingProduct.offerDuration || ""} onChange={(e) => setEditingProduct({ ...editingProduct, offerDuration: e.target.value })} placeholder="e.g. Ends in 24 Hours" style={inputStyle} />
                            </div>

                            <div>
                                <label style={labelStyle}>Description</label>
                                <textarea value={editingProduct.description || ""} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} style={{ ...inputStyle, height: "60px" }} />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setEditingProduct(null)} style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc", background: "#f5f5f5", cursor: "pointer" }}>Cancel</button>
                                <button type="submit" style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

// Styling Objects
const cardStyle = { backgroundColor: "#ffffff", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0" };
const labelStyle = { fontSize: "12px", fontWeight: "bold" as const, color: "#475569" };
const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", marginTop: "3px", boxSizing: "border-box" as const };
const thStyle = { padding: "8px", fontSize: "11px", color: "#64748b", textTransform: "uppercase" as const };
const tdStyle = { padding: "8px", verticalAlign: "middle" };
const modalOverlayStyle = { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContentStyle = { backgroundColor: "#fff", padding: "20px", borderRadius: "8px", width: "420px", maxWidth: "90%" };