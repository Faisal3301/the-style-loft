"use client";

import { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, addDoc, updateDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";

interface BannerPromotion {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  expiresAt?: number;
  createdAt?: any;
}

export default function PromotionsAdminPage() {
  const [banners, setBanners] = useState<BannerPromotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form States & Editing ID
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [durationHours, setDurationHours] = useState("72");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState("");

  const fetchBannersData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "promotional_banners"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list: BannerPromotion[] = [];
      const currentTime = Date.now();

      snap.forEach(d => {
        const data = d.data() as any;
        if (data.expiresAt && currentTime > data.expiresAt) {
          deleteDoc(doc(db, "promotional_banners", d.id));
        } else {
          list.push({ 
            id: d.id, 
            title: data.title,
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType,
            expiresAt: data.expiresAt,
            createdAt: data.createdAt 
          });
        }
      });
      setBanners(list);
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannersData();
  }, []);

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary environment variables are missing.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset); 

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!data.secure_url) {
      throw new Error("Cloudinary upload failed. Check your environment configuration.");
    }
    return data.secure_url;
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert("Please enter a banner title.");
      return;
    }

    setUploading(true);
    try {
      let mediaUrl = existingMediaUrl;

      // Upload new file if selected
      if (mediaFile) {
        mediaUrl = await uploadToCloudinary(mediaFile);
      }

      if (!mediaUrl) {
        alert("Please select a banner image or video.");
        setUploading(false);
        return;
      }

      const hours = Number(durationHours) || 72;
      const expiresAt = Date.now() + hours * 60 * 60 * 1000;

      if (editingId) {
        // Update existing banner
        await updateDoc(doc(db, "promotional_banners", editingId), {
          title,
          mediaUrl,
          mediaType: mediaFile && mediaFile.type.includes("video") ? "video" : "image",
          expiresAt,
        });
        alert("Banner updated successfully!");
      } else {
        // Create new banner
        await addDoc(collection(db, "promotional_banners"), {
          title,
          mediaUrl,
          mediaType: mediaFile && mediaFile.type.includes("video") ? "video" : "image",
          expiresAt,
          createdAt: serverTimestamp(),
        });
        alert(`Banner published successfully for ${hours} hours!`);
      }

      resetForm();
      fetchBannersData();
    } catch (error: any) {
      console.error("Error saving banner:", error);
      alert(error.message || "Failed to save banner. Check Cloudinary settings.");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (banner: BannerPromotion) => {
    setEditingId(banner.id);
    setTitle(banner.title);
    setExistingMediaUrl(banner.mediaUrl);
    setMediaFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDurationHours("72");
    setMediaFile(null);
    setExistingMediaUrl("");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this banner?")) {
      await deleteDoc(doc(db, "promotional_banners", id));
      fetchBannersData();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      
      <div style={{ backgroundColor: "#1e293b", color: "#fff", padding: "24px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "900", margin: "0 0 4px 0", color: "#febd69" }}>📢 Live Promotional Banners & Countdown</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Manage banners, edit active campaigns, and track live countdown timers.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        
        {/* Upload / Edit Form */}
        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", height: "fit-content" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: 0, color: "#0f172a" }}>
              {editingId ? "Edit Banner Campaign" : "Create New Banner"}
            </h3>
            {editingId && (
              <button onClick={resetForm} style={{ background: "none", border: "none", color: "#ef4444", fontSize: "12px", cursor: "pointer", fontWeight: "bold" }}>
                Cancel Edit
              </button>
            )}
          </div>
          
          <form onSubmit={handleSaveBanner} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Banner Title / Message</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Mega Eid Luxury Sale Live!"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px", boxSizing: "border-box" }}
                required 
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Extend / Set Duration (Hours)</label>
              <input 
                type="number" 
                value={durationHours} 
                onChange={e => setDurationHours(e.target.value)} 
                placeholder="72"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px", boxSizing: "border-box" }}
                required 
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Banner Media (Cloudinary)</label>
              {existingMediaUrl && !mediaFile && (
                <div style={{ margin: "6px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <img src={existingMediaUrl} alt="Current" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Using current media. Choose file below to replace.</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*,video/*"
                onChange={e => setMediaFile(e.target.files ? e.target.files[0] : null)}
                style={{ width: "100%", marginTop: "4px", fontSize: "12px" }}
              />
            </div>

            <button 
              type="submit" 
              disabled={uploading}
              style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginTop: "8px" }}
            >
              {uploading ? "Saving to Cloudinary..." : editingId ? "Update Banner 🔄" : "Publish Banner 🚀"}
            </button>
          </form>
        </div>

        {/* Active Banners List with Live Countdowns */}
        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: "#0f172a" }}>Active Banners & Live Countdowns ({banners.length})</h3>
          
          {loading ? (
            <p style={{ color: "#64748b", fontSize: "13px" }}>Loading banners...</p>
          ) : banners.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "13px" }}>No active banners running right now.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px", maxHeight: "600px", overflowY: "auto" }}>
              {banners.map(b => {
                const timeLeftMs = b.expiresAt ? Math.max(0, b.expiresAt - Date.now()) : 0;
                const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
                const minutesLeft = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));

                return (
                  <div key={b.id} style={{ border: editingId === b.id ? "2px solid #2563eb" : "1px solid #e2e8f0", borderRadius: "8px", padding: "10px", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <img src={b.mediaUrl} alt={b.title} style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "6px", backgroundColor: "#000" }} />
                    <h4 style={{ fontSize: "13px", fontWeight: "bold", margin: 0, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</h4>
                    
                    {/* Live Countdown Badge */}
                    <span style={{ fontSize: "11px", backgroundColor: "#fef3c7", color: "#92400e", padding: "3px 8px", borderRadius: "4px", width: "fit-content", fontWeight: "bold" }}>
                      ⏳ {hoursLeft}h {minutesLeft}m remaining
                    </span>

                    <div style={{ display: "flex", gap: "6px", marginTop: "auto" }}>
                      <button 
                        onClick={() => handleEdit(b)}
                        style={{ flex: 1, backgroundColor: "#e0e7ff", color: "#3730a3", border: "none", padding: "6px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                      >
                        Edit / Reuse
                      </button>
                      <button 
                        onClick={() => handleDelete(b.id)}
                        style={{ backgroundColor: "#fee2e2", color: "#991b1b", border: "none", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}