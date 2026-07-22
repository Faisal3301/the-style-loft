import React from "react";

interface Product {
    id: string;
    name: string;
    price: number;
    salePrice?: number;
    category: string;
    subCategory?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
}

interface ProductGridProps {
    products: Product[];
    loading?: boolean;
    country?: string;
    visibleCount?: number;
    setVisibleCount?: React.Dispatch<React.SetStateAction<number>>;
    [key: string]: any; // Kisi bhi extra prop ke liye safe fallback
}

export default function ProductGrid({ products, loading, country, visibleCount, setVisibleCount, ...rest }: ProductGridProps) {
    return (
        <section style={{ flex: 1 }} {...rest}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
                {/* Product rendering logic yahan aayegi */}
            </div>
        </section>
    );
}