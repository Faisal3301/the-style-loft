"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "../../config/firebase"; 
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    updateDoc,
    doc, 
    serverTimestamp 
} from "firebase/firestore";
import MediaDisplay from "../../components/MediaDisplay";

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
    const [uploadingCloudinary, setUploadingCloudinary] = useState(false);

    // Auto-Importer / Manual Creator Form States
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [defaultPrice, setDefaultPrice] = useState("0");

    // Cloudinary Manual Upload State
    const [cloudinaryFile, setCloudinaryFile] = useState<File | null>(null);

    // Filters & Smart Search States
    const [filterCategory, setFilterCategory] = useState("ALL");
    const [filterSubCategory, setFilterSubCategory] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    // Edit Modal State
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Fetch Categories and Firestore Products
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
            if (fetchedCats.length > 0 && !selectedCategory) {
                setSelectedCategory(fetchedCats[0].name);
            }

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

    const getActiveDriveLink = () => {
        const catObj = categoriesList.find(c => c.name === selectedCategory);
        if (catObj && selectedSubCategory) {
            const subObj = catObj.subCategories.find(s => s.name === selectedSubCategory);
            return subObj?.driveFolderUrl || "";
        }
        return "";
    };

    const extractFolderId = (url: string) => {
        const match = url.match(/folders\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : url;
    };

    // ⚡ BULK AUTO-IMPORT DRIVE FILES ⚡
    const handleAutoImportDriveFiles = async () => {
        const driveUrl = getActiveDriveLink();
        if (!driveUrl) {
            alert("Is Sub-Category mein Drive Link mojood nahi hai!");
            return;
        }

        const folderId = extractFolderId(driveUrl);
        setImporting(true);

        try {
            const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
            if (!API_KEY) {
                alert("Google Drive API Key missing hai .env file mein!");
                setImporting(false);
                return;
            }

            const driveApiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&key=${API_KEY}`;
            const res = await fetch(driveApiUrl);
            const data = await res.json();

            if (data.error) {
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

            const existingFileIds = new Set(products.map(p => p.driveFileId));
            const newFiles = filesList.filter((f: any) => !existingFileIds.has(f.id));

            if (newFiles.length === 0) {
                alert("Iss folder ki tamam files pehle se import ho chuki hain!");
                setImporting(false);
                return;
            }

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

            alert(`🎉 Success! ${count} new items imported!`);
            fetchData();
        } catch (error) {
            console.error("Import Error:", error);
            alert("Drive files import karne mein error aaya.");
        } finally {
            setImporting(false);
        }
    };

    // ☁️ CLOUDINARY UPLOAD HANDLER ☁️
    const handleCloudinaryUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cloudinaryFile) {
            alert("Pehle koi file select karein!");
            return;
        }
        if (!selectedCategory || !selectedSubCategory) {
            alert("Category aur Sub-Category select karna lazmi hai!");
            return;
        }

        setUploadingCloudinary(true);
        try {
            const formData = new FormData();
            formData.append("file", cloudinaryFile);
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default");

            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const resourceType = cloudinaryFile.type.includes("video") ? "video" : "image";

            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.secure_url) {
                const cleanName = cloudinaryFile.name.replace(/\.[^/.]+$/, "");
                await addDoc(collection(db, "products"), {
                    name: cleanName || "Cloudinary Item",
                    price: parseFloat(defaultPrice) || 0,
                    salePrice: null,
                    description: "",
                    offerDuration: "",
                    category: selectedCategory,
                    subCategory: selectedSubCategory,
                    mediaUrl: data.secure_url,
                    mediaType: resourceType,
                    createdAt: serverTimestamp()
                });
                alert("🚀 File successfully uploaded & saved to Database!");
                setCloudinaryFile(null);
                fetchData();
            } else {
                alert("Cloudinary upload failed.");
            }
        } catch (error) {
            console.error("Cloudinary Error:", error);
            alert("Error uploading to Cloudinary.");
        } finally {
            setUploadingCloudinary(false);
        }
    };

    // ✏️ UPDATE PRODUCT HANDLER
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

            alert("✅ Item updated successfully!");
            setEditingProduct(null);
            fetchData();
        } catch (error) {
            console.error("Error updating product:", error);
            alert("Failed to update item.");
        }
    };

    // 🗑️ DELETE SINGLE PRODUCT
    const handleDelete = async (id: string) => {
        if (!confirm("Kya aap waqai is item ko delete karna chahte hain?")) return;
        try {
            await deleteDoc(doc(db, "products", id));
            setProducts(products.filter(p => p.id !== id));
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    // 🗑️ BULK DELETE ALL PRODUCTS
    const handleDeleteAllProducts = async () => {
        if (!confirm("⚠️ KHATRA: Kya aap tamam products ko delete karna chahte hain? Yeh amal wapas nahi ho sakta!")) return;
        
        try {
            const snap = await getDocs(collection(db, "products"));
            const deletePromises = snap.docs.map((docSnap) => deleteDoc(doc(db, "products", docSnap.id)));
            await Promise.all(deletePromises);
            alert("✅ Tamam products kamyabi se delete ho gaye!");
            fetchData();
        } catch (error) {
            console.error("Error bulk deleting:", error);
            alert("Bulk delete karne mein error aaya.");
        }
    };

    const currentCategoryObj = categoriesList.find(c => c.name === selectedCategory);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesCategory = filterCategory === "ALL" || product.category === filterCategory;
            const matchesSubCategory = filterSubCategory === "ALL" || product.subCategory === filterSubCategory;
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSubCategory && matchesSearch;
        });
    }, [products, filterCategory, filterSubCategory, searchQuery]);

    const availableFilterSubCategories = useMemo(() => {
        if (filterCategory === "ALL") {
            const allSubs = new Set<string>();
            categoriesList.forEach(c => c.subCategories.forEach(s => allSubs.add(s.name)));
            return Array.from(allSubs);
        }
        const cat = categoriesList.find(c => c.name === filterCategory);
        return cat ? cat.subCategories.map(s => s.name) : [];
    }, [filterCategory, categoriesList]);

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
        <div style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
            
            {/* Header */}
            <div style={{ marginBottom: "30px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding: "25px", borderRadius: "12px", color: "#fff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "26px", fontWeight: "800", margin: "0 0 8px 0" }}>
                        ⚡ Advanced Media Importer & Inventory Dashboard
                    </h1>
                    <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
                        Manage categories, sub-categories, Google Drive auto-imports, Cloudinary uploads, and product pricing.
                    </p>
                </div>
                {products.length > 0 && (
                    <button 
                        onClick={handleDeleteAllProducts}
                        style={{ backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
                    >
                        🗑️ Delete All Products (Bulk)
                    </button>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "25px" }}>
                
                {/* LEFT CONTROL PANEL */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Common Settings Card (Category & Sub-Category selection) */}
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", color: "#1e293b", borderBottom: "2px solid #3b82f6", paddingBottom: "8px" }}>
                            🎯 Target Destination
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={labelStyle}>Select Category</label>
                                <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubCategory(""); }} style={inputStyle}>
                                    {categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Select Sub-Category</label>
                                <select value={selectedSubCategory} onChange={(e) => setSelectedSubCategory(e.target.value)} style={inputStyle}>
                                    <option value="">-- Choose Sub Category --</option>
                                    {currentCategoryObj?.subCategories.map((sub, i) => (
                                        <option key={i} value={sub.name}>{sub.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={labelStyle}>Default Price ($) [Optional]</label>
                                <input type="number" value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value)} style={inputStyle} />
                            </div>
                        </div>
                    </div>

                    {/* Google Drive Importer Card */}
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", color: "#1e293b", borderBottom: "2px solid #3b82f6", paddingBottom: "8px" }}>
                            📁 Google Drive Auto-Importer
                        </h2>
                        <button 
                            onClick={handleAutoImportDriveFiles} 
                            disabled={importing || !selectedSubCategory || !getActiveDriveLink()}
                            style={{ 
                                width: "100%",
                                backgroundColor: importing ? "#94a3b8" : "#2563eb", 
                                color: "#fff", 
                                padding: "12px", 
                                borderRadius: "8px", 
                                fontWeight: "700", 
                                border: "none",
                                cursor: importing ? "not-allowed" : "pointer"
                            }}
                        >
                            {importing ? "⏳ Importing from Drive..." : "🚀 Import All Drive Files"}
                        </button>
                    </div>

                    {/* Cloudinary Manual Upload Card */}
                    <div style={cardStyle}>
                        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", color: "#1e293b", borderBottom: "2px solid #10b981", paddingBottom: "8px" }}>
                            ☁️ Direct Cloudinary Upload
                        </h2>
                        <form onSubmit={handleCloudinaryUpload} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={labelStyle}>Select File (Image / Video)</label>
                                <input 
                                    type="file" 
                                    accept="image/*,video/*"
                                    onChange={(e) => setCloudinaryFile(e.target.files?.[0] || null)} 
                                    style={{ ...inputStyle, padding: "6px" }} 
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={uploadingCloudinary || !cloudinaryFile}
                                style={{ 
                                    backgroundColor: uploadingCloudinary ? "#94a3b8" : "#10b981", 
                                    color: "#fff", 
                                    padding: "12px", 
                                    borderRadius: "8px", 
                                    fontWeight: "700", 
                                    border: "none",
                                    cursor: uploadingCloudinary ? "not-allowed" : "pointer"
                                }}
                            >
                                {uploadingCloudinary ? "📤 Uploading..." : "☁️ Upload & Save"}
                            </button>
                        </form>
                    </div>

                </div>

                {/* RIGHT PANEL: Inventory Stock Table & Search */}
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                            📦 Inventory Stock ({filteredProducts.length})
                        </h2>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", gap: "12px", marginBottom: "20px", backgroundColor: "#f1f5f9", padding: "15px", borderRadius: "10px" }}>
                        <div>
                            <label style={labelStyle}>Filter Category</label>
                            <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setFilterSubCategory("ALL"); }} style={inputStyle}>
                                <option value="ALL">📂 All Categories</option>
                                {categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Filter Sub-Category</label>
                            <select value={filterSubCategory} onChange={(e) => setFilterSubCategory(e.target.value)} style={inputStyle}>
                                <option value="ALL">📂 All Sub-Categories</option>
                                {availableFilterSubCategories.map((sub, i) => <option key={i} value={sub}>{sub}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Search Inventory</label>
                            <input type="text" placeholder="🔍 Search product title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={inputStyle} />
                        </div>
                    </div>

                    {loading ? (
                        <p style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>Loading inventory items...</p>
                    ) : Object.keys(groupedProducts).length === 0 ? (
                        <p style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>No items found matching your filters.</p>
                    ) : (
                        Object.entries(groupedProducts).map(([catName, subCats]) => (
                            <div key={catName} style={{ marginBottom: "20px", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                                <div style={{ backgroundColor: "#e2e8f0", padding: "12px 18px", fontWeight: "700", color: "#334155", fontSize: "14px" }}>
                                    📂 {catName}
                                </div>
                                {Object.entries(subCats).map(([subName, items]) => (
                                    <div key={subName} style={{ padding: "15px", borderTop: "1px solid #f1f5f9" }}>
                                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#2563eb", marginBottom: "10px" }}>
                                            ↳ Sub-Category: {subName} ({items.length} items)
                                        </div>
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr style={{ background: "#f8fafc", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
                                                    <th style={thStyle}>Preview</th>
                                                    <th style={thStyle}>Title & Details</th>
                                                    <th style={thStyle}>Pricing</th>
                                                    <th style={thStyle}>Offer / Duration</th>
                                                    <th style={thStyle}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item) => (
                                                    <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                                                        <td style={tdStyle}>
                                                            <div style={{ width: "45px", height: "45px", borderRadius: "6px", overflow: "hidden", background: "#000" }}>
                                                                <MediaDisplay url={item.mediaUrl} type={item.mediaType} thumbnailOnly={true} />
                                                            </div>
                                                        </td>
                                                        <td style={tdStyle}>
                                                            <strong>{item.name}</strong>
                                                            {item.description && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{item.description}</div>}
                                                        </td>
                                                        <td style={tdStyle}>
                                                            {item.salePrice ? (
                                                                <div>
                                                                    <span style={{ textDecoration: "line-through", color: "#94a3b8", marginRight: "6px", fontSize: "12px" }}>
                                                                        ${item.price}
                                                                    </span>
                                                                    <span style={{ color: "#ef4444", fontWeight: "700" }}>
                                                                        ${item.salePrice}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontWeight: "600" }}>${item.price}</span>
                                                            )}
                                                        </td>
                                                        <td style={tdStyle}>
                                                            {item.offerDuration ? (
                                                                <span style={{ background: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>
                                                                    ⏳ {item.offerDuration}
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: "#cbd5e1" }}>-</span>
                                                            )}
                                                        </td>
                                                        <td style={tdStyle}>
                                                            <div style={{ display: "flex", gap: "8px" }}>
                                                                <button onClick={() => setEditingProduct(item)} style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "11px" }}>✏️ Edit</button>
                                                                <button onClick={() => handleDelete(item.id)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "11px" }}>🗑️ Delete</button>
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

            {/* Edit Modal (Optional Title, Price, Sale Price, Description, Offer Duration) */}
            {editingProduct && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginTop: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>✏️ Edit Product Details</h3>
                        <form onSubmit={handleUpdateProduct} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={labelStyle}>Product Title</label>
                                <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} style={inputStyle} required />
                            </div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={labelStyle}>Original Price ($)</label>
                                    <input type="number" step="0.01" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value as any })} style={inputStyle} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>Sale Price ($) [Optional]</label>
                                    <input type="number" step="0.01" placeholder="e.g. 8.99" value={editingProduct.salePrice || ""} onChange={(e) => setEditingProduct({ ...editingProduct, salePrice: e.target.value as any })} style={inputStyle} />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Offer Duration / Badge [Optional]</label>
                                <input type="text" placeholder="e.g. Ends in 2 Days" value={editingProduct.offerDuration || ""} onChange={(e) => setEditingProduct({ ...editingProduct, offerDuration: e.target.value })} style={inputStyle} />
                            </div>

                            <div>
                                <label style={labelStyle}>Description [Optional]</label>
                                <textarea placeholder="Enter product description..." value={editingProduct.description || ""} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} style={{ ...inputStyle, height: "70px", resize: "vertical" }} />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setEditingProduct(null)} style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f1f5f9", cursor: "pointer", fontWeight: "600" }}>Cancel</button>
                                <button type="submit" style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Styling Constants
const cardStyle = { backgroundColor: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)" };
const labelStyle = { fontSize: "12px", fontWeight: "700" as const, color: "#475569", display: "block", marginBottom: "4px" };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" as const, outline: "none" };
const thStyle = { padding: "10px", fontSize: "11px", textTransform: "uppercase" as const, fontWeight: "700" };
const tdStyle = { padding: "10px", verticalAlign: "middle" };
const modalOverlayStyle = { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContentStyle = { backgroundColor: "#fff", padding: "25px", borderRadius: "12px", width: "450px", maxWidth: "90%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" };