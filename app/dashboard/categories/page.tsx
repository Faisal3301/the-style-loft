"use client";

import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    serverTimestamp,
    updateDoc,
    arrayUnion,
    arrayRemove
} from "firebase/firestore";

interface Category {
    id: string;
    name: string;
    subCategories: { name: string; driveFolderUrl?: string }[];
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [catName, setCatName] = useState("");
    const [selectedCatId, setSelectedCatId] = useState("");
    const [subCatName, setSubCatName] = useState("");
    const [driveFolderUrl, setDriveFolderUrl] = useState("");

    // Fetch Categories
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "categories"));
            const list: Category[] = [];
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                list.push({
                    id: docSnap.id,
                    name: data.name,
                    subCategories: data.subCategories || []
                });
            });
            setCategories(list);
            if (list.length > 0 && !selectedCatId) {
                setSelectedCatId(list[0].id);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Create Main Category
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catName.trim()) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, "categories"), {
                name: catName.trim(),
                subCategories: [],
                createdAt: serverTimestamp()
            });
            setCatName("");
            alert("Category Created! 🎉");
            fetchCategories();
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Failed to add category.");
        } finally {
            setSubmitting(false);
        }
    };

    // Add Sub-Category & Google Drive Link
    const handleAddSubCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCatId || !subCatName.trim()) {
            alert("Please select a category and enter sub-category name.");
            return;
        }

        setSubmitting(true);
        try {
            const catRef = doc(db, "categories", selectedCatId);
            const newSub = {
                name: subCatName.trim(),
                driveFolderUrl: driveFolderUrl.trim() || ""
            };

            await updateDoc(catRef, {
                subCategories: arrayUnion(newSub)
            });

            setSubCatName("");
            setDriveFolderUrl("");
            alert("Sub-Category added with Drive folder link! 🚀");
            fetchCategories();
        } catch (error) {
            console.error("Error adding sub-category:", error);
            alert("Failed to add sub-category.");
        } finally {
            setSubmitting(false);
        }
    };

    // Delete Main Category
    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Are you sure? This will delete the entire category.")) return;
        try {
            await deleteDoc(doc(db, "categories", id));
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    // Delete Sub Category
    const handleDeleteSubCategory = async (catId: string, subItem: { name: string; driveFolderUrl?: string }) => {
        if (!confirm(`Delete "${subItem.name}"?`)) return;
        try {
            const catRef = doc(db, "categories", catId);
            await updateDoc(catRef, {
                subCategories: arrayRemove(subItem)
            });
            fetchCategories();
        } catch (error) {
            console.error("Error deleting sub-category:", error);
        }
    };

    return (
        <div style={{ width: "100%" }}>
            
            <div style={{ marginBottom: "20px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#0f1111", margin: 0 }}>
                    🏷️ Category & Drive Folder Management
                </h1>
                <p style={{ fontSize: "13px", color: "#565959", marginTop: "4px" }}>
                    Manage main categories, sub-categories, and link Google Drive folders for bulk product loading.
                </p>
            </div>

            {/* Grid Form Area - Full Responsive */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                
                {/* 1. Add Main Category */}
                <div style={cardStyle}>
                    <h2 style={cardHeaderStyle}>1. Add Main Category</h2>
                    <form onSubmit={handleAddCategory} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                            <label style={labelStyle}>Category Name *</label>
                            <input 
                                type="text" 
                                value={catName} 
                                onChange={(e) => setCatName(e.target.value)}
                                placeholder="e.g. Women, Men, Accessories" 
                                style={inputStyle}
                                required 
                            />
                        </div>
                        <button type="submit" disabled={submitting} style={buttonStyle}>
                            {submitting ? "Saving..." : "+ Create Category"}
                        </button>
                    </form>
                </div>

                {/* 2. Add Sub-Category & Drive Folder */}
                <div style={cardStyle}>
                    <h2 style={cardHeaderStyle}>2. Add Sub-Category & Drive Link</h2>
                    <form onSubmit={handleAddSubCategory} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                            <label style={labelStyle}>Select Parent Category *</label>
                            <select 
                                value={selectedCatId} 
                                onChange={(e) => setSelectedCatId(e.target.value)}
                                style={inputStyle}
                                required
                            >
                                <option value="">-- Choose Category --</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>Sub-Category Name *</label>
                            <input 
                                type="text" 
                                value={subCatName} 
                                onChange={(e) => setSubCatName(e.target.value)}
                                placeholder="e.g. Unstitched 3-Piece, Formal Shirts" 
                                style={inputStyle}
                                required 
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Google Drive Folder Link / ID (Optional)</label>
                            <input 
                                type="url" 
                                value={driveFolderUrl} 
                                onChange={(e) => setDriveFolderUrl(e.target.value)}
                                placeholder="https://drive.google.com/drive/folders/..." 
                                style={inputStyle}
                            />
                        </div>

                        <button type="submit" disabled={submitting} style={{ ...buttonStyle, backgroundColor: "#ffa41c", borderColor: "#ff8f00" }}>
                            {submitting ? "Saving..." : "+ Attach Sub-Category"}
                        </button>
                    </form>
                </div>

            </div>

            {/* Category Listing Table */}
            <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>
                        📋 Categories Overview ({categories.length})
                    </h2>
                    <button onClick={fetchCategories} style={{ background: "#f0f2f2", border: "1px solid #d5d9d9", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}>
                        🔄 Refresh
                    </button>
                </div>

                {loading ? (
                    <p style={{ textAlign: "center", color: "#666", padding: "20px" }}>Loading categories...</p>
                ) : categories.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>No categories created yet.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #eee" }}>
                                    <th style={thStyle}>Category</th>
                                    <th style={thStyle}>Sub-Categories & Drive Links</th>
                                    <th style={thStyle}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((cat) => (
                                    <tr key={cat.id} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ ...tdStyle, fontWeight: "bold", verticalAlign: "top" }}>
                                            {cat.name}
                                        </td>
                                        <td style={tdStyle}>
                                            {cat.subCategories.length === 0 ? (
                                                <span style={{ color: "#999", fontSize: "12px" }}>No sub-categories</span>
                                            ) : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                    {cat.subCategories.map((sub, idx) => (
                                                        <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "6px 10px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                                                            <div>
                                                                <span style={{ fontWeight: "600", color: "#1e293b" }}>{sub.name}</span>
                                                                {sub.driveFolderUrl && (
                                                                    <a 
                                                                        href={sub.driveFolderUrl} 
                                                                        target="_blank" 
                                                                        rel="noreferrer"
                                                                        style={{ marginLeft: "10px", fontSize: "11px", color: "#2563eb", textDecoration: "underline" }}
                                                                    >
                                                                        📁 Drive Folder
                                                                    </a>
                                                                )}
                                                            </div>
                                                            <button 
                                                                onClick={() => handleDeleteSubCategory(cat.id, sub)}
                                                                style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ ...tdStyle, verticalAlign: "top" }}>
                                            <button 
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer", fontWeight: "bold" }}
                                            >
                                                🗑️ Delete All
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
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

const cardHeaderStyle = {
    fontSize: "15px",
    fontWeight: "bold",
    marginBottom: "15px",
    borderBottom: "2px solid #febd69",
    paddingBottom: "6px",
    color: "#0f1111"
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

const buttonStyle = {
    backgroundColor: "#ffd814",
    border: "1px solid #fcd200",
    color: "#0f1111",
    padding: "10px",
    borderRadius: "6px",
    fontWeight: "bold" as const,
    cursor: "pointer",
    fontSize: "13px",
    marginTop: "5px"
};

const thStyle = {
    padding: "12px",
    color: "#475569",
    fontWeight: "bold" as const,
    fontSize: "12px",
    textTransform: "uppercase" as const
};

const tdStyle = {
    padding: "12px",
    verticalAlign: "middle"
};