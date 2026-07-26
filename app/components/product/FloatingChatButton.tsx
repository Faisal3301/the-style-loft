"use client";

import { useState } from "react";
import ChatModal from "./ChatModal"; // Path adjust kar lein agar zaroori ho

export default function FloatingChatButton({ productName = "The Style Loft Collection" }: { productName?: string }) {
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <>
            {/* Floating Chat Trigger Button Fixed at Bottom Right */}
            <button 
                onClick={() => setIsChatOpen(true)}
                style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "#0f172a",
                    border: "2px solid #ffffff",
                    boxShadow: "0 6px 20px rgba(245, 158, 11, 0.4)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    zIndex: 999,
                    transition: "transform 0.2s ease"
                }}
                title="Live Support"
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
                💬
            </button>

            {/* Popup Modal opens when button is clicked */}
            {isChatOpen && (
                <ChatModal 
                    productName={productName} 
                    onClose={() => setIsChatOpen(false)} 
                />
            )}
        </>
    );
}