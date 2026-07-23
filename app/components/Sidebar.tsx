"use client";

interface SidebarProps {
  isSidebarOpen: boolean;
  categoriesList: any[];
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (val: string) => void;
  selectedSubCategoryFilter: string;
  setSelectedSubCategoryFilter: (val: string) => void;
  setVisibleCount: (val: number) => void;
  activeCatObj: any;
  setIsSidebarOpen?: (val: boolean) => void;
}

export default function Sidebar({
  isSidebarOpen,
  categoriesList,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  selectedSubCategoryFilter,
  setSelectedSubCategoryFilter,
  setVisibleCount,
  activeCatObj,
  setIsSidebarOpen
}: SidebarProps) {
  return (
    <>
      <style jsx global>{`
        @keyframes fadeInSlide {
          0% { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .sidebar-item-anim {
          animation: fadeInSlide 0.2s ease forwards;
        }
        .sidebar-btn {
          transition: all 0.2s ease;
        }
        .sidebar-btn:hover {
          background-color: #f1f5f9 !important;
          color: #2563eb !important;
        }
        .sub-cat-item {
          transition: all 0.15s ease;
        }
        .sub-cat-item:hover {
          background-color: #f8fafc !important;
          color: #0f172a !important;
        }
      `}</style>

      {/* Backdrop: Jab sidebar khuli ho toh background dark ho jaye */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen && setIsSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 998,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside style={{
        position: "fixed",
        top: "65px",
        left: 0,
        height: "calc(100vh - 65px)",
        width: "260px",
        backgroundColor: "#ffffff",
        zIndex: 999,
        transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: isSidebarOpen ? "4px 0 20px rgba(0,0,0,0.2)" : "none",
        overflowY: "auto",
        boxSizing: "border-box",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}>
        
        {/* Header Title & Close Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #f59e0b", paddingBottom: "8px", flexShrink: 0 }}>
          <h3 style={{ fontSize: "14px", fontWeight: "900", color: "#0f172a", margin: 0 }}>
            📂 Departments
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "10px", backgroundColor: "#fef3c7", color: "#92400e", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>
              {Array.isArray(categoriesList) ? categoriesList.length : 0}
            </span>
            {setIsSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(false)}
                style={{ background: "#f1f5f9", border: "none", borderRadius: "6px", width: "24px", height: "24px", cursor: "pointer", fontWeight: "bold", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Main Categories List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
          <button
            onClick={() => { 
              setSelectedCategoryFilter("ALL"); 
              setSelectedSubCategoryFilter("ALL"); 
              setVisibleCount(12); 
              if(setIsSidebarOpen) setIsSidebarOpen(false);
            }}
            className="sidebar-btn"
            style={{ 
              textAlign: "left", 
              padding: "9px 12px", 
              borderRadius: "8px", 
              background: selectedCategoryFilter === "ALL" ? "#eff6ff" : "transparent", 
              color: selectedCategoryFilter === "ALL" ? "#2563eb" : "#475569", 
              fontWeight: selectedCategoryFilter === "ALL" ? "800" : "600", 
              cursor: "pointer", 
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              border: "none"
            }}
          >
            <span>✨</span> All Collections
          </button>

          {Array.isArray(categoriesList) && categoriesList.map(cat => {
            const isActive = selectedCategoryFilter === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => { 
                  setSelectedCategoryFilter(cat.name); 
                  setSelectedSubCategoryFilter("ALL"); 
                  setVisibleCount(12); 
                  if(setIsSidebarOpen) setIsSidebarOpen(false);
                }}
                className="sidebar-btn"
                style={{ 
                  textAlign: "left", 
                  padding: "9px 12px", 
                  borderRadius: "8px", 
                  background: isActive ? "#eff6ff" : "transparent", 
                  color: isActive ? "#2563eb" : "#475569", 
                  fontWeight: isActive ? "800" : "600", 
                  cursor: "pointer", 
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  border: "none"
                }}
              >
                <span>📁</span> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-Categories Section */}
        {activeCatObj && activeCatObj.subCategories && activeCatObj.subCategories.length > 0 && (
          <div className="sidebar-item-anim" style={{ marginTop: "10px", borderTop: "1px dashed #cbd5e1", paddingTop: "10px", flexShrink: 0 }}>
            <h4 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "800", margin: "0 0 8px 0", color: "#64748b" }}>
              Sub-Categories ({activeCatObj.name})
            </h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span
                onClick={() => { 
                  setSelectedSubCategoryFilter("ALL"); 
                  setVisibleCount(12); 
                  if(setIsSidebarOpen) setIsSidebarOpen(false);
                }}
                className="sub-cat-item"
                style={{ 
                  fontSize: "12px", 
                  padding: "8px 10px", 
                  borderRadius: "6px", 
                  cursor: "pointer", 
                  backgroundColor: selectedSubCategoryFilter === "ALL" ? "#f1f5f9" : "transparent", 
                  color: selectedSubCategoryFilter === "ALL" ? "#0f172a" : "#64748b",
                  fontWeight: selectedSubCategoryFilter === "ALL" ? "bold" : "500",
                  borderLeft: selectedSubCategoryFilter === "ALL" ? "3px solid #f59e0b" : "3px solid transparent"
                }}
              >
                • All in {activeCatObj.name}
              </span>

              {activeCatObj.subCategories.map((sub: any, i: number) => {
                const isSubActive = selectedSubCategoryFilter === sub.name;
                return (
                  <span
                    key={i}
                    onClick={() => { 
                      setSelectedSubCategoryFilter(sub.name); 
                      setVisibleCount(12); 
                      if(setIsSidebarOpen) setIsSidebarOpen(false);
                    }}
                    className="sub-cat-item"
                    style={{ 
                      fontSize: "12px", 
                      padding: "8px 10px", 
                      borderRadius: "6px", 
                      cursor: "pointer", 
                      backgroundColor: isSubActive ? "#f1f5f9" : "transparent", 
                      color: isSubDataActive(isSubActive) ? "#0f172a" : "#64748b", // Safe fallback check
                      fontWeight: isSubActive ? "bold" : "500",
                      borderLeft: isSubActive ? "3px solid #f59e0b" : "3px solid transparent"
                    }}
                  >
                    • {sub.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

      </aside>
    </>
  );
}

// Helper inline check to safeguard color mapping
function isSubDataActive(active: boolean) {
  return active;
}