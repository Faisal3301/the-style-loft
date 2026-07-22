"use client";

export default function Footer() {
  return (
    <>
      {/* 🌟 FOOTER STYLING & ANIMATIONS */}
      <style jsx global>{`
        .footer-link {
          transition: all 0.2s ease;
          color: #94a3b8;
          text-decoration: none;
        }
        .footer-link:hover {
          color: #f59e0b !important;
          transform: translateX(4px);
        }
        .social-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .social-btn:hover {
          background-color: #f59e0b !important;
          color: #0f172a !important;
          transform: translateY(-3px);
          box-shadow: 0 6px 15px rgba(245, 158, 11, 0.35);
        }
      `}</style>

      <footer style={{ backgroundColor: "#0f172a", color: "#ffffff", paddingTop: "60px", paddingBottom: "30px", borderTop: "1px solid #1e293b", marginTop: "60px" }}>
        <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "0 28px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "40px" }}>
          
          {/* Column 1: Big Logo & About */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {/* Big Logo Image */}
              <div style={{ width: "55px", height: "55px", borderRadius: "14px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 15px rgba(245,158,11,0.3)", backgroundColor: "#ffffff" }}>
                <img 
                  src="/logo.png" 
                  alt="The Style Loft Logo" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/150?text=SL";
                  }}
                />
              </div>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "900", margin: 0, letterSpacing: "0.5px", color: "#ffffff" }}>
                  The Style Loft
                </h2>
                <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1.2px" }}>
                  Global Luxury Emporium
                </span>
              </div>
            </div>

            <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: "1.6", margin: 0 }}>
              Discover curated designer collections, premium fashion wear, and exclusive luxury items tailored for global standards across US and UK markets.
            </p>

            {/* Social Media Links */}
            <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
              {/* Email Icon */}
              <a 
                href="#email-link-here" 
                className="social-btn"
                style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#1e293b", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#f8fafc" }}
                title="Email Us"
              >
                ✉️
              </a>
              {/* Instagram Icon */}
              <a 
                href="#instagram-link-here" 
                className="social-btn"
                style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#1e293b", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#f8fafc" }}
                title="Instagram Profile"
              >
                📷
              </a>
              {/* Facebook Icon */}
              <a 
                href="#facebook-link-here" 
                className="social-btn"
                style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#1e293b", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#f8fafc" }}
                title="Facebook Page"
              >
                🌐
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff", borderBottom: "2px solid #f59e0b", paddingBottom: "8px", margin: "0 0 8px 0", display: "inline-block" }}>
              Quick Navigation
            </h3>
            <a href="/" className="footer-link" style={{ fontSize: "14px" }}>✨ Home Dashboard</a>
            <a href="#collections" className="footer-link" style={{ fontSize: "14px" }}>📂 All Departments</a>
            <a href="#us-store" className="footer-link" style={{ fontSize: "14px" }}>🇺🇸 US Collections</a>
            <a href="#uk-store" className="footer-link" style={{ fontSize: "14px" }}>🇬🇧 UK Designer Styles</a>
            <a href="#cart" className="footer-link" style={{ fontSize: "14px" }}>🛒 Shopping Bag</a>
          </div>

          {/* Column 3: Customer Support */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff", borderBottom: "2px solid #f59e0b", paddingBottom: "8px", margin: "0 0 8px 0", display: "inline-block" }}>
              Customer Care
            </h3>
            <a href="#help" className="footer-link" style={{ fontSize: "14px" }}>help Center & FAQs</a>
            <a href="#shipping" className="footer-link" style={{ fontSize: "14px" }}>Shipping & Delivery</a>
            <a href="#returns" className="footer-link" style={{ fontSize: "14px" }}>Returns & Exchanges</a>
            <a href="#privacy" className="footer-link" style={{ fontSize: "14px" }}>Privacy Policy</a>
            <a href="#terms" className="footer-link" style={{ fontSize: "14px" }}>Terms & Conditions</a>
          </div>

          {/* Column 4: Newsletter Subscription */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#ffffff", borderBottom: "2px solid #f59e0b", paddingBottom: "8px", margin: "0 0 8px 0", display: "inline-block" }}>
              Stay Updated
            </h3>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, lineHeight: "1.5" }}>
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <input 
                type="email" 
                placeholder="Enter your email..." 
                style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#1e293b", color: "#fff", fontSize: "13px", outline: "none" }}
              />
              <button 
                onClick={() => alert("Subscribed successfully!")}
                style={{ backgroundColor: "#f59e0b", color: "#0f172a", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
              >
                Join
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div style={{ maxWidth: "1600px", margin: "40px auto 0 auto", padding: "20px 28px 0 28px", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            © {new Date().getFullYear()} The Style Loft. All rights reserved. Built with advanced web architecture.
          </p>
          <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "#64748b" }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </footer>
    </>
  );
}