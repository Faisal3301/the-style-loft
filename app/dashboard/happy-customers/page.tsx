"use client";

import { useEffect, useState } from "react";
import { db } from "../../config/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";

interface HappyCategory {
  id: string;
  name: string;
  subCategories: string[];
}

interface HappyProof {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  mediaUrl: string;
  mediaType: string;
  createdAt?: any;
}

export default function HappyCustomersManager() {
  // Categories States
  const [categories, setCategories] = useState<HappyCategory[]>([]);
  
  // Step 1: Main Category Save / Edit States
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Step 2: Sub-Category Save States
  const [selectedMainCategory, setSelectedMainCategory] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);
  const [editingSubOldName, setEditingSubOldName] = useState("");
  const [editingSubNewName, setEditingSubNewName] = useState("");
  const [activeCatForSubEdit, setActiveCatForSubEdit] = useState<string | null>(null);

  // Proofs / Upload States
  const [proofs, setProofs] = useState<HappyProof[]>([]);
  const [cloudinaryFiles, setCloudinaryFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  // Available Subcategories based on selected category in upload section
  const [availableSubCats, setAvailableSubCats] = useState<string[]>([]);

  // Upload Progress States
  const [uploadingCloudinary, setUploadingCloudinary] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [uploadStatusText, setUploadStatusText] = useState(""); 

  // UI & Search States
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterSubCategory, setFilterSubCategory] = useState("ALL");
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: string } | null>(null);

  // Fetch Categories and Proofs from Firebase
  const fetchData = async () => {
    setLoading(true);
    try {
      const catSnap = await getDocs(query(collection(db, "happy_customer_categories"), orderBy("createdAt", "desc")));
      const catMap = new Map<string, { id: string; subCategories: Set<string> }>();

      catSnap.forEach(d => {
        const data = d.data();
        const name = data.name ? data.name.trim() : "";
        if (!name) return;

        let subCats: string[] = [];
        if (Array.isArray(data.subCategories)) {
          subCats = data.subCategories;
        } else if (typeof data.subCategory === "string") {
          subCats = data.subCategory.split(",").map((s: string) => s.trim());
        }

        if (!catMap.has(name)) {
          catMap.set(name, { id: d.id, subCategories: new Set(subCats) });
        } else {
          subCats.forEach(sub => catMap.get(name)?.subCategories.add(sub));
        }
      });

      const catList: HappyCategory[] = [];
      catMap.forEach((val, key) => {
        catList.push({
          id: val.id,
          name: key,
          subCategories: Array.from(val.subCategories).filter(Boolean)
        });
      });

      setCategories(catList);

      // Fetch Happy Proofs
      const proofSnap = await getDocs(query(collection(db, "happy_customer_proofs"), orderBy("createdAt", "desc")));
      const proofList: HappyProof[] = [];
      proofSnap.forEach(d => {
        proofList.push({ id: d.id, ...d.data() } as HappyProof);
      });
      setProofs(proofList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    document.title = "Happy Customers & Proofs Manager - Admin Dashboard";
  }, []);

  // Update available subcategories when selected category changes for upload
  useEffect(() => {
    if (!selectedCategory) {
      setAvailableSubCats([]);
      setSelectedSubCategory("");
      return;
    }
    const foundCat = categories.find(c => c.name === selectedCategory);
    if (foundCat && foundCat.subCategories) {
      setAvailableSubCats(foundCat.subCategories);
      setSelectedSubCategory(foundCat.subCategories[0] || "");
    } else {
      setAvailableSubCats([]);
      setSelectedSubCategory("");
    }
  }, [selectedCategory, categories]);

  // Reset Sub-Category filter when Main Category filter changes
  useEffect(() => {
    setFilterSubCategory("ALL");
  }, [filterCategory]);

  // Step 1: Save or Update Main Category
  const handleSaveMainCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      alert("Please enter a category name!");
      return;
    }

    try {
      if (editingCatId) {
        await updateDoc(doc(db, "happy_customer_categories", editingCatId), {
          name: trimmedName
        });
        alert("Main Category successfully update ho gayi! 🔄");
        setEditingCatId(null);
      } else {
        const existingCat = categories.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
        if (existingCat) {
          alert("Yeh Category pehle se mojood hai!");
          return;
        }
        await addDoc(collection(db, "happy_customer_categories"), {
          name: trimmedName,
          subCategories: ["General"],
          createdAt: serverTimestamp()
        });
        alert("Main Category successfully save ho gayi! 🎉");
      }
      setNewCategoryName("");
      fetchData();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Failed to save category.");
    }
  };

  // Step 2: Add Sub-Category
  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMainCategory) {
      alert("Pehle dropdown se Main Category select karein!");
      return;
    }
    const trimmedSubName = subCategoryName.trim();
    if (!trimmedSubName) {
      alert("Please enter a sub-category name!");
      return;
    }

    const foundCat = categories.find(c => c.name === selectedMainCategory);
    if (!foundCat) return;

    if (foundCat.subCategories.includes(trimmedSubName)) {
      alert("Yeh Sub-Category is category mein pehle se mojood hai!");
      return;
    }

    try {
      const updatedSubs = [...foundCat.subCategories, trimmedSubName];
      await updateDoc(doc(db, "happy_customer_categories", foundCat.id), {
        subCategories: updatedSubs
      });
      alert("Sub-Category successfully add ho gayi! ✅");
      setSubCategoryName("");
      fetchData();
    } catch (error) {
      console.error("Error adding sub-category:", error);
      alert("Failed to add sub-category.");
    }
  };

  // Edit Main Category Trigger
  const handleEditMainCat = (cat: HappyCategory) => {
    setEditingCatId(cat.id);
    setNewCategoryName(cat.name);
  };

  // Update Sub-Category
  const handleUpdateSubCategory = async (catId: string, oldSub: string) => {
    const newSubTrimmed = editingSubNewName.trim();
    if (!newSubTrimmed) {
      alert("Sub-category name cannot be empty!");
      return;
    }

    const foundCat = categories.find(c => c.id === catId);
    if (!foundCat) return;

    const updatedSubs = foundCat.subCategories.map(s => s === oldSub ? newSubTrimmed : s);

    try {
      await updateDoc(doc(db, "happy_customer_categories", catId), {
        subCategories: updatedSubs
      });
      alert("Sub-category updated successfully! 🔄");
      setEditingSubIndex(null);
      setActiveCatForSubEdit(null);
      setEditingSubNewName("");
      fetchData();
    } catch (error) {
      console.error("Error updating sub-category:", error);
      alert("Failed to update sub-category.");
    }
  };

  // Delete Sub-Category
  const handleDeleteSubCategory = async (catId: string, subToDelete: string) => {
    const foundCat = categories.find(c => c.id === catId);
    if (!foundCat) return;

    if (foundCat.subCategories.length <= 1) {
      alert("Category mein kam az kam aik sub-category honi lazmi hai!");
      return;
    }

    if (confirm(`Are you sure you want to delete sub-category "${subToDelete}"?`)) {
      try {
        const updatedSubs = foundCat.subCategories.filter(s => s !== subToDelete);
        await updateDoc(doc(db, "happy_customer_categories", catId), {
          subCategories: updatedSubs
        });
        fetchData();
      } catch (error) {
        console.error("Error deleting sub-category:", error);
      }
    }
  };

  // Delete Main Category
  const handleDeleteCategory = async (id: string) => {
    if (confirm("Are you sure you want to delete this category and all its subcategories?")) {
      try {
        await deleteDoc(doc(db, "happy_customer_categories", id));
        fetchData();
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  // Cloudinary Multiple Upload Function
  const handleCloudinaryUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cloudinaryFiles || cloudinaryFiles.length === 0) {
      alert("Pehle koi file select karein!");
      return;
    }
    if (!selectedCategory || !selectedSubCategory) {
      alert("Category aur Sub-Category select karna lazmi hai!");
      return;
    }

    setUploadingCloudinary(true);
    setUploadProgress(0);
    const totalFiles = cloudinaryFiles.length;
    let successCount = 0;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = cloudinaryFiles[i];
        setUploadStatusText(`Uploading file ${i + 1} of ${totalFiles}: ${file.name}`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default");

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const resourceType = file.type.includes("video") ? "video" : "image";

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.secure_url) {
          const cleanName = file.name.replace(/\.[^/.]+$/, "");
          await addDoc(collection(db, "happy_customer_proofs"), {
            title: customTitle.trim() || cleanName || "Happy Customer Proof",
            category: selectedCategory,
            subCategory: selectedSubCategory,
            mediaUrl: data.secure_url,
            mediaType: resourceType,
            createdAt: serverTimestamp()
          });
          successCount++;
        }

        const progressPercent = Math.round(((i + 1) / totalFiles) * 100);
        setUploadProgress(progressPercent);
      }

      setUploadStatusText(`Successfully uploaded ${successCount} of ${totalFiles} files! 🎉`);
      setTimeout(() => {
        setUploadingCloudinary(false);
        setUploadProgress(0);
        setCloudinaryFiles([]);
        setCustomTitle("");
        fetchData();
      }, 1500);

    } catch (error) {
      console.error("Cloudinary Error:", error);
      alert("Error uploading files to Cloudinary.");
      setUploadingCloudinary(false);
    }
  };

  // Handle Delete Proof Item
  const handleDeleteProof = async (id: string) => {
    if (confirm("Are you sure you want to delete this proof?")) {
      try {
        await deleteDoc(doc(db, "happy_customer_proofs", id));
        setProofs(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting proof:", error);
      }
    }
  };

  // Filtered Proofs for Search, Category & Sub-Category
  const filteredProofs = proofs.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.subCategory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "ALL" || p.category === filterCategory;
    const matchesSubCategory = filterSubCategory === "ALL" || p.subCategory === filterSubCategory;
    return matchesSearch && matchesCategory && matchesSubCategory;
  });

  // Get available sub-categories for gallery filter dropdown
  const currentFilterCatObj = categories.find(c => c.name === filterCategory);
  const filterSubList = currentFilterCatObj ? currentFilterCatObj.subCategories : [];

  return (
    <div style={{ width: "100%", padding: "24px", boxSizing: "border-box", backgroundColor: "#f1f5f9", minHeight: "100vh", fontFamily: "'Inter', Arial, sans-serif" }}>
      
      {/* Upload Progress Overlay */}
      {uploadingCloudinary && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15, 23, 42, 0.85)", zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", boxSizing: "border-box" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)", display: "flex", flexDirection: "column", gap: "20px", textAlign: "center" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "900", color: "#0f172a", margin: 0 }}>🚀 Bulk Uploading in Progress</h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Please keep this tab open while files are uploading.</p>
            </div>

            <div style={{ width: "100%", backgroundColor: "#e2e8f0", borderRadius: "9999px", height: "16px", overflow: "hidden", position: "relative" }}>
              <div style={{ width: `${uploadProgress}%`, backgroundColor: "#10b981", height: "100%", transition: "width 0.3s ease", borderRadius: "9999px" }}></div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", fontWeight: "bold" }}>
              <span style={{ color: "#334155" }}>Progress:</span>
              <span style={{ color: "#059669", fontSize: "16px" }}>{uploadProgress}%</span>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#475569", wordBreak: "break-all", minHeight: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {uploadStatusText}
            </div>

          </div>
        </div>
      )}

      <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "28px" }}>
        
        {/* Top Header Banner */}
        <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: "16px", padding: "24px", color: "#f8fafc", border: "1px solid #f59e0b" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "900", margin: "0 0 8px 0", color: "#fef3c7" }}>⭐ Happy Customers & Proofs Master Manager</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Manage categories, sub-categories with full edit options, and batch-upload proofs.</p>
        </div>

        {/* Grid Section: Forms */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          
          {/* Left Column: Category & Sub-Category Creation/Editing */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Step 1: Add/Edit Main Category */}
            <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#0f172a", marginBottom: "12px" }}>
                {editingCatId ? "✏️ Edit Main Category" : "📁 Step 1: Add New Main Category"}
              </h3>

              <form onSubmit={handleSaveMainCategory} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <input 
                    type="text" 
                    placeholder="e.g., Delivered 2025" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                    required
                  />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    type="submit" 
                    style={{ backgroundColor: editingCatId ? "#d97706" : "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px", flex: 1 }}
                  >
                    {editingCatId ? "Update Category 🔄" : "Save Main Category 💾"}
                  </button>
                  {editingCatId && (
                    <button 
                      type="button" 
                      onClick={() => { setEditingCatId(null); setNewCategoryName(""); }}
                      style={{ backgroundColor: "#64748b", color: "#fff", border: "none", padding: "10px 14px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Step 2: Add Sub-Category */}
            <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "bold", color: "#0f172a", marginBottom: "12px" }}>
                📂 Step 2: Add Sub-Category
              </h3>

              <form onSubmit={handleAddSubCategory} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", marginBottom: "4px", color: "#334155" }}>Select Category</label>
                  <select 
                    value={selectedMainCategory}
                    onChange={(e) => setSelectedMainCategory(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", fontSize: "13px", boxSizing: "border-box" }}
                    required
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "bold", marginBottom: "4px", color: "#334155" }}>Sub-Category Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., March Delivered" 
                    value={subCategoryName}
                    onChange={(e) => setSubCategoryName(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  style={{ backgroundColor: "#10b981", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                >
                  Add Sub-Category ➕
                </button>
              </form>
            </div>

            {/* Existing Categories & Sub-Categories List with Edit/Delete */}
            <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ fontSize: "14px", fontWeight: "bold", color: "#0f172a", marginBottom: "12px" }}>Manage Existing Categories ({categories.length})</h4>
              
              <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                {categories.map(cat => (
                  <div key={cat.id} style={{ background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    
                    {/* Main Category Header Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ color: "#0f172a", fontSize: "13px" }}>📁 {cat.name}</strong>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => handleEditMainCat(cat)} style={{ background: "#fef3c7", color: "#92400e", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>Edit</button>
                        <button onClick={() => handleDeleteCategory(cat.id)} style={{ background: "#fee2e2", color: "#991b1b", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>Del</button>
                      </div>
                    </div>

                    {/* Sub-Categories list with individual Edit/Delete */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingLeft: "12px", borderLeft: "2px solid #cbd5e1" }}>
                      <span style={{ fontSize: "11px", fontWeight: "bold", color: "#64748b" }}>Sub-Categories:</span>
                      {cat.subCategories.map((sub, sIdx) => (
                        <div key={sIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", background: "#ffffff", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                          
                          {activeCatForSubEdit === cat.id && editingSubIndex === sIdx ? (
                            <div style={{ display: "flex", gap: "6px", width: "100%", alignItems: "center" }}>
                              <input 
                                type="text" 
                                value={editingSubNewName} 
                                onChange={(e) => setEditingSubNewName(e.target.value)}
                                style={{ padding: "2px 6px", fontSize: "11px", borderRadius: "4px", border: "1px solid #cbd5e1", flex: 1 }}
                              />
                              <button onClick={() => handleUpdateSubCategory(cat.id, sub)} style={{ background: "#10b981", color: "#fff", border: "none", padding: "2px 6px", borderRadius: "4px", cursor: "pointer", fontSize: "10px" }}>Save</button>
                              <button onClick={() => setActiveCatForSubEdit(null)} style={{ background: "#64748b", color: "#fff", border: "none", padding: "2px 6px", borderRadius: "4px", cursor: "pointer", fontSize: "10px" }}>X</button>
                            </div>
                          ) : (
                            <>
                              <span style={{ color: "#334155" }}>• {sub}</span>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <button 
                                  onClick={() => { 
                                    setActiveCatForSubEdit(cat.id); 
                                    setEditingSubIndex(sIdx); 
                                    setEditingSubNewName(sub); 
                                  }} 
                                  style={{ background: "transparent", color: "#2563eb", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteSubCategory(cat.id, sub)} 
                                  style={{ background: "transparent", color: "#dc2626", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}
                                >
                                  Del
                                </button>
                              </div>
                            </>
                          )}

                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Step 3 - Cloudinary Upload Form */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)", height: "fit-content" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#0f172a", marginBottom: "16px" }}>☁️ Step 3: Upload Proofs via Cloudinary</h3>

            <form onSubmit={handleCloudinaryUpload} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "#334155" }}>Select Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", fontSize: "13px", boxSizing: "border-box" }}
                  required
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "#334155" }}>Select Sub-Category</label>
                <select 
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", fontSize: "13px", boxSizing: "border-box" }}
                  required
                >
                  <option value="">-- Choose Sub-Category --</option>
                  {availableSubCats.map((sub, idx) => (
                    <option key={idx} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "#334155" }}>Custom Title Prefix (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g., Item Tracking Screenshot" 
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "#334155" }}>Select Files / Multiple Items</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files && setCloudinaryFiles(Array.from(e.target.files))}
                  style={{ width: "100%", fontSize: "12px", color: "#64748b" }}
                  required
                />
                {cloudinaryFiles.length > 0 && (
                  <p style={{ fontSize: "12px", color: "#059669", fontWeight: "bold", marginTop: "4px" }}>
                    📁 {cloudinaryFiles.length} file(s) selected ready to upload.
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                disabled={uploadingCloudinary}
                style={{ backgroundColor: "#10b981", color: "#fff", border: "none", padding: "12px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px", marginTop: "6px", opacity: uploadingCloudinary ? 0.7 : 1 }}
              >
                {uploadingCloudinary ? "Uploading..." : `🚀 Upload ${cloudinaryFiles.length} File(s) Now`}
              </button>
            </form>
          </div>

        </div>

        {/* Gallery Section with Sub-Category Filter Added */}
        <div style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #e2e8f0" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#0f172a", margin: 0 }}>
              🖼️ Uploaded Proofs Gallery ({filteredProofs.length})
            </h3>

            {/* Filter & Search Controls */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              
              {/* Category Filter */}
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#f8fafc" }}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>

              {/* Sub-Category Filter (Dynamic based on selected Category) */}
              <select 
                value={filterSubCategory}
                onChange={(e) => setFilterSubCategory(e.target.value)}
                disabled={filterCategory === "ALL"}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: filterCategory === "ALL" ? "#e2e8f0" : "#f8fafc", opacity: filterCategory === "ALL" ? 0.6 : 1 }}
              >
                <option value="ALL">All Sub-Categories</option>
                {filterSubList.map((sub, idx) => (
                  <option key={idx} value={sub}>{sub}</option>
                ))}
              </select>

              {/* Search Bar */}
              <input 
                type="text" 
                placeholder="🔍 Search proofs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", width: "180px", boxSizing: "border-box" }}
              />

            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>Loading proofs...</p>
          ) : filteredProofs.length === 0 ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>No proofs found.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
              {filteredProofs.map((proof) => (
                <div key={proof.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  
                  <div 
                    onClick={() => setPreviewMedia({ url: proof.mediaUrl, type: proof.mediaType })}
                    style={{ width: "100%", height: "180px", backgroundColor: "#000", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", cursor: "pointer", position: "relative" }}
                  >
                    {proof.mediaType === "video" ? (
                      <video src={proof.mediaUrl} preload="none" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    ) : (
                      <img src={proof.mediaUrl} alt={proof.title} loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    )}
                  </div>

                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "4px", flex: 1, justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: "bold", margin: "0 0 4px 0", color: "#0f172a" }}>{proof.title}</h4>
                      <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>📁 {proof.category} › {proof.subCategory}</p>
                    </div>

                    <button 
                      onClick={() => handleDeleteProof(proof.id)}
                      style={{ marginTop: "10px", backgroundColor: "#fee2e2", color: "#991b1b", border: "none", padding: "6px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                    >
                      Delete Proof 🗑️
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Fullscreen Media Preview Modal */}
      {previewMedia && (
        <div 
          onClick={() => setPreviewMedia(null)}
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", boxSizing: "border-box" }}
        >
          <div style={{ position: "relative", maxWidth: "900px", maxHeight: "90vh", display: "flex", justifyContent: "center", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewMedia(null)}
              style={{ position: "absolute", top: "-40px", right: "0", backgroundColor: "#ef4444", color: "#fff", border: "none", width: "32px", height: "32px", borderRadius: "50%", fontWeight: "bold", cursor: "pointer", zIndex: 10 }}
            >
              ✕
            </button>
            {previewMedia.type === "video" ? (
              <video src={previewMedia.url} controls autoPlay style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "8px" }} />
            ) : (
              <img src={previewMedia.url} alt="Fullscreen View" style={{ maxWidth: "100%", maxHeight: "85vh", objectFit: "contain", borderRadius: "8px" }} />
            )}
          </div>
        </div>
      )}

    </div>
  );
}