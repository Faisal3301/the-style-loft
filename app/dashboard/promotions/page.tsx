"use client";

import { useState } from "react";

export default function PromotionsPage() {
    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "#0f1111" }}>
                🎯 Promotions & Banners
            </h1>
            <p style={{ fontSize: "13px", color: "#565959", marginTop: "5px" }}>
                Manage store promotions, discount banners, and special offers here.
            </p>

            <div style={{ marginTop: "20px", padding: "30px", border: "2px dashed #cbd5e1", borderRadius: "8px", textAlign: "center", color: "#64748b" }}>
                <h3>Promotions Module Active</h3>
                <p style={{ fontSize: "13px" }}>Aap yahan apne store ke promotional banners aur seasonal discounts manage kar sakte hain.</p>
            </div>
        </div>
    );
}