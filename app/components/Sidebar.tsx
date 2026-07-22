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
}

export default function Sidebar({
  isSidebarOpen,
  categoriesList,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  selectedSubCategoryFilter,
  setSelectedSubCategoryFilter,
  setVisibleCount,
  activeCatObj
}: SidebarProps) {
  return (
    <>
      {/* 🌟 SIDEBAR ANIMATIONS & STYLING */}
      <style jsx global>{`
        @keyframes fadeInSlide {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .sidebar-item-anim {
          animation: fadeInSlide 0.3s ease forwards;
        }
        .sidebar-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar-btn:hover {
          background-color: #f1f5f9 !important;
          color: #2563eb !important;
          transform: translateX(4px);
        }
        .sub-cat-item {
          transition: all 0.2s ease;
        }
        .sub-cat-item:hover {
          background-color: #f8fafc !important;
          color: #0f172a !important;
          padding-left: 14px !important;
        }
      `}</style>

      <aside style={{
        width: isSidebarOpen ? "280px" : "0px",
        overflow: "hidden",
        transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        flexShrink: 0
      }}>
        <div style={{ 
          width: "280px", 
          backgroundColor: "#ffffff", 
          padding: "22px", 
          borderRadius: "14px", 
          border: "1px solid #e2e8f0", 
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)", 
          position: "sticky", 
          top: "90px",
          boxSizing: "border-box"
        }}>
          
          {/* Sidebar Header Title */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 16px 0", borderBottom: "2px solid #f59e0b", paddingBottom: "10px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "900", color: "#0f172a", margin: 0, letterSpacing: "0.3px" }}>
              📂 Department Filters
            </h3>
            <span style={{ fontSize: "11px", backgroundColor: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "6px", fontWeight: "bold" }}>
              {Array.isArray(categoriesList) ? categoriesList.length : 0} Depts
            </span>
          </div>

          {/* Main Categories List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              onClick={() => { setSelectedCategoryFilter("ALL"); setSelectedSubCategoryFilter("ALL"); setVisibleCount(12); }}
              className="sidebar-btn"
              style={{ 
                textAlign: "left", 
                padding: "11px 14px", 
                borderRadius: "10px", 
                background: selectedCategoryFilter === "ALL" ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" : "transparent", 
                color: selectedCategoryFilter === "ALL" ? "#2563eb" : "#475569", 
                border: selectedCategoryFilter === "ALL" ? "1px solid #bfdbfe" : "1px solid transparent",
                fontWeight: selectedCategoryFilter === "ALL" ? "800" : "600", 
                cursor: "pointer", 
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: selectedCategoryFilter === "ALL" ? "0 2px 5px rgba(37,99,235,0.1)" : "none"
              }}
            >
              <span>✨</span> All Collections
            </button>

            {Array.isArray(categoriesList) && categoriesList.map(cat => {
              const isActive = selectedCategoryFilter === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategoryFilter(cat.name); setSelectedSubCategoryFilter("ALL"); setVisibleCount(12); }}
                  className="sidebar-btn"
                  style={{ 
                    textAlign: "left", 
                    padding: "11px 14px", 
                    borderRadius: "10px", 
                    background: isActive ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" : "transparent", 
                    color: isActive ? "#2563eb" : "#475569", 
                    border: isActive ? "1px solid #bfdbfe" : "1px solid transparent",
                    fontWeight: isActive ? "800" : "600", 
                    cursor: "pointer", 
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: isActive ? "0 2px 5px rgba(37,99,235,0.1)" : "none"
                  }}
                >
                  <span>📁</span> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Categories Section (Animated Appear) */}
          {activeCatObj && activeCatObj.subCategories && activeCatObj.subCategories.length > 0 && (
            <div className="sidebar-item-anim" style={{ marginTop: "22px", borderTop: "1px dashed #cbd5e1", paddingTop: "18px" }}>
              <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: "800", margin: "0 0 12px 0", color: "#64748b" }}>
                Sub-Categories ({activeCatObj.name})
              </h4>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span
                  onClick={() => { setSelectedSubCategoryFilter("ALL"); setVisibleCount(12); }}
                  className="sub-cat-item"
                  style={{ 
                    fontSize: "13px", 
                    padding: "9px 12px", 
                    borderRadius: "8px", 
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
                      onClick={() => { setSelectedSubCategoryFilter(sub.name); setVisibleCount(12); }}
                      className="sub-cat-item"
                      style={{ 
                        fontSize: "13px", 
                        padding: "9px 12px", 
                        borderRadius: "8px", 
                        cursor: "pointer", 
                        backgroundColor: isSubActive ? "#f1f5f9" : "transparent", 
                        color: isSubActive ? "#0f172a" : "#64748b",
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

        </div>
      </aside>
    </>
  );
}