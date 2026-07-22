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

interface SubCategory {
    name: string;
}

interface Category {
    id: string;
    name: string;
    subCategories: SubCategory[];
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [catName, setCatName] = useState("");
    const [selectedCatId, setSelectedCatId] = useState("");
    const [subCatName, setSubCatName] = useState("");
    const [bulkSubNames, setBulkSubNames] = useState("");

    // Search & Edit States
    const [searchTerm, setSearchTerm] = useState("");
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editedCatName, setEditedCatName] = useState("");

    const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);
    const [editedSubName, setEditedSubName] = useState("");

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
            alert("Category Created Successfully! 🎉");
            fetchCategories();
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Failed to add category.");
        } finally {
            setSubmitting(false);
        }
    };

    // Add Single or Bulk Sub-Categories
    const handleAddSubCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCatId || (!subCatName.trim() && !bulkSubNames.trim())) {
            alert("Please select a category and enter sub-category name(s).");
            return;
        }

        setSubmitting(true);
        try {
            const catRef = doc(db, "categories", selectedCatId);
            let newSubs: SubCategory[] = [];

            if (subCatName.trim()) {
                newSubs.push({ name: subCatName.trim() });
            }

            if (bulkSubNames.trim()) {
                const splitNames = bulkSubNames
                    .split(",")
                    .map((n) => n.trim())
                    .filter((n) => n.length > 0)
                    .map((name) => ({ name }));
                newSubs = [...newSubs, ...splitNames];
            }

            await updateDoc(catRef, {
                subCategories: arrayUnion(...newSubs)
            });

            setSubCatName("");
            setBulkSubNames("");
            alert("Sub-Category / Categories added successfully! 🚀");
            fetchCategories();
        } catch (error) {
            console.error("Error adding sub-category:", error);
            alert("Failed to add sub-category.");
        } finally {
            setSubmitting(false);
        }
    };

    // Edit Main Category Name
    const handleUpdateCategory = async (catId: string) => {
        if (!editedCatName.trim()) return;
        try {
            const catRef = doc(db, "categories", catId);
            await updateDoc(catRef, { name: editedCatName.trim() });
            setEditingCatId(null);
            setEditedCatName("");
            fetchCategories();
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    // Edit Sub Category Name
    const handleUpdateSubCategory = async (catId: string, currentSubs: SubCategory[], targetIndex: number) => {
        if (!editedSubName.trim()) return;
        try {
            const updatedSubs = [...currentSubs];
            updatedSubs[targetIndex] = { name: editedSubName.trim() };

            const catRef = doc(db, "categories", catId);
            await updateDoc(catRef, { subCategories: updatedSubs });
            setEditingSubIndex(null);
            setEditedSubName("");
            fetchCategories();
        } catch (error) {
            console.error("Error updating sub-category:", error);
        }
    };

    // Delete Main Category
    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Are you sure? This will delete the entire category and its sub-categories.")) return;
        try {
            await deleteDoc(doc(db, "categories", id));
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    // Delete Sub Category
    const handleDeleteSubCategory = async (catId: string, subItem: SubCategory) => {
        if (!confirm(`Delete sub-category "${subItem.name}"?`)) return;
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

    // Filtered categories for search
    const filteredCategories = categories.filter((cat) => {
        const matchesCat = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSub = cat.subCategories.some((sub) => sub.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCat || matchesSub;
    });

    return (
        <div style={{ width: "100%", animation: "fadeIn 0.4s ease-in-out" }}>
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .hover-scale:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.08)!important;
                }
                .transition-all {
                    transition: all 0.25s ease-in-out;
                }
            `}</style>

            <div style={{ marginBottom: "20px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#0f1111", margin: 0 }}>
                    🏷️ Advanced Category & Sub-Category Management
                </h1>
                <p style={{ fontSize: "13px", color: "#565959", marginTop: "4px" }}>
                    Organize store items with fluid categories, instant search, and bulk entries.
                </p>
            </div>

            {/* Grid Form Area */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                
                {/* 1. Add Main Category */}
                <div style={{ ...cardStyle }} className="transition-all hover-scale">
                    <h2 style={cardHeaderStyle}>1. Create Main Category</h2>
                    <form onSubmit={handleAddCategory} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div>
                            <label style={labelStyle}>Category Name *</label>
                            <input 
                                type="text" 
                                value={catName} 
                                onChange={(e) => setCatName(e.target.value)}
                                placeholder="e.g. Electronics, Clothing" 
                                style={inputStyle}
                                required 
                            />
                        </div>
                        <button type="submit" disabled={submitting} style={buttonStyle}>
                            {submitting ? "Saving..." : "+ Create Category"}
                        </button>
                    </form>
                </div>

                {/* 2. Add Sub-Category (Single or Bulk) */}
                <div style={{ ...cardStyle }} className="transition-all hover-scale">
                    <h2 style={cardHeaderStyle}>2. Add Sub-Category (Single / Bulk)</h2>
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
                            <label style={labelStyle}>Single Sub-Category Name</label>
                            <input 
                                type="text" 
                                value={subCatName} 
                                onChange={(e) => setSubCatName(e.target.value)}
                                placeholder="e.g. Smart Watches" 
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Or Bulk Add (Comma Separated)</label>
                            <input 
                                type="text" 
                                value={bulkSubNames} 
                                onChange={(e) => setBulkSubNames(e.target.value)}
                                placeholder="Shirt, Pant, Jacket, Shoes" 
                                style={inputStyle}
                            />
                        </div>

                        <button type="submit" disabled={submitting} style={{ ...buttonStyle, backgroundColor: "#ffa41c", borderColor: "#ff8f00" }}>
                            {submitting ? "Saving..." : "+ Add Sub-Category"}
                        </button>
                    </form>
                </div>

            </div>

            {/* Category Listing & Search Card */}
            <div style={cardStyle}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "10px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>
                        📋 Categories Overview ({filteredCategories.length})
                    </h2>
                    
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input 
                            type="text" 
                            placeholder="🔍 Search category or sub..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ ...inputStyle, width: "220px", marginTop: "0", padding: "7px 10px" }}
                        />
                        <button onClick={fetchCategories} style={{ background: "#f0f2f2", border: "1px solid #d5d9d9", padding: "7px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p style={{ textAlign: "center", color: "#666", padding: "30px" }}>Loading categories...</p>
                ) : filteredCategories.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#999", padding: "30px" }}>No categories found matching your search.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #eee" }}>
                                    <th style={thStyle}>Main Category</th>
                                    <th style={thStyle}>Sub-Categories</th>
                                    <th style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCategories.map((cat) => (
                                    <tr key={cat.id} style={{ borderBottom: "1px solid #eee", transition: "background 0.2s" }} className="transition-all">
                                        
                                        {/* Main Category Column with Inline Edit */}
                                        <td style={{ ...tdStyle, fontWeight: "bold", verticalAlign: "top", width: "25%" }}>
                                            {editingCatId === cat.id ? (
                                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                    <input 
                                                        type="text" 
                                                        value={editedCatName} 
                                                        onChange={(e) => setEditedCatName(e.target.value)}
                                                        style={{ ...inputStyle, marginTop: 0, padding: "5px 8px" }}
                                                    />
                                                    <button onClick={() => handleUpdateCategory(cat.id)} style={saveBtnStyle}>✔</button>
                                                    <button onClick={() => setEditingCatId(null)} style={cancelBtnStyle}>✕</button>
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ color: "#0f1111" }}>{cat.name}</span>
                                                    <button 
                                                        onClick={() => { setEditingCatId(cat.id); setEditedCatName(cat.name); }} 
                                                        style={editLinkStyle}
                                                        title="Edit Category"
                                                    >
                                                        ✏️
                                                    </button>
                                                </div>
                                            )}
                                        </td>

                                        {/* Sub-Categories List Column */}
                                        <td style={{  padding: "12px", verticalAlign: "top" }}>
                                            {cat.subCategories.length === 0 ? (
                                                <span style={{ color: "#999", fontSize: "12px" }}>No sub-categories added yet</span>
                                            ) : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                    {cat.subCategories.map((sub, idx) => (
                                                        <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "6px 10px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                                                            
                                                            {editingSubIndex === idx && editingCatId === cat.id ? (
                                                                <div style={{ display: "flex", gap: "6px", alignItems: "center", width: "100%" }}>
                                                                    <input 
                                                                        type="text" 
                                                                        value={editedSubName} 
                                                                        onChange={(e) => setEditedSubName(e.target.value)}
                                                                        style={{ ...inputStyle, marginTop: 0, padding: "4px 8px" }}
                                                                    />
                                                                    <button onClick={() => handleUpdateSubCategory(cat.id, cat.subCategories, idx)} style={saveBtnStyle}>✔</button>
                                                                    <button onClick={() => setEditingSubIndex(null)} style={cancelBtnStyle}>✕</button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <span style={{ fontWeight: "500", color: "#334155", fontSize: "13px" }}>{sub.name}</span>
                                                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                                        <button 
                                                                            onClick={() => { setEditingCatId(cat.id); setEditingSubIndex(idx); setEditedSubName(sub.name); }}
                                                                            style={{ border: "none", background: "none", cursor: "pointer", fontSize: "11px" }}
                                                                            title="Edit Sub-Category"
                                                                        >
                                                                            ✏️
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => handleDeleteSubCategory(cat.id, sub)}
                                                                            style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}
                                                                            title="Delete Sub-Category"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}

                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>

                                        {/* Actions Column */}
                                        <td style={{ ...tdStyle, verticalAlign: "top", width: "15%" }}>
                                            <button 
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                style={{ border: "none", background: "none", color: "#dc2626", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}
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

const saveBtnStyle = {
    background: "#22c55e",
    color: "#fff",
    border: "none",
    padding: "5px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px"
};

const cancelBtnStyle = {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "5px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px"
};

const editLinkStyle = {
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "12px"
};

const thStyle = {
    padding: "12px",
    color: "#475569",
    fontWeight: "bold" as const,
    fontSize: "12px",
    textTransform: "uppercase" as const
};

const tdStyle = {
    padding: "12px"
};