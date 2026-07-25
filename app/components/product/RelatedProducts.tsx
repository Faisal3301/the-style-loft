"use client";

import Link from "next/link";
import MediaDisplay from "../MediaDisplay";

interface RelatedProductsProps {
    products: any[];
    category: string;
    subCategory: string;
}

export default function RelatedProducts({ products, category, subCategory }: RelatedProductsProps) {
    return (
        <div className="section-container">
            <h2 className="section-title">
                🛍️ Products {category !== "ALL" ? `in ${category}` : ""} {subCategory !== "ALL" ? `> ${subCategory}` : ""} ({products.length})
            </h2>
            {products.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13px" }}>No items found matching this filter.</p>
            ) : (
                <div className="related-grid">
                    {products.map((item) => (
                        <Link key={item.id} href={`/product/${item.id}`} className="related-item-card">
                            <div className="related-media">
                                {item.mediaUrl ? (
                                    <MediaDisplay url={item.mediaUrl} type={item.mediaType || "image"} alt={item.name} controls={false} />
                                ) : (
                                    <div style={{ color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "11px" }}>No Image</div>
                                )}
                            </div>
                            <div className="related-info">
                                <span className="related-cat">{item.subCategory || item.category}</span>
                                <h4 className="related-name">{item.name}</h4>
                                <span className="related-price">${item.salePrice || item.price}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <style jsx>{`
                .section-container {
                    background: #ffffff;
                    padding: 30px;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    border: 1px solid #e2e8f0;
                    width: 100%;
                    box-sizing: border-box;
                }
                .section-title {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 16px;
                }
                .related-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 16px;
                }
                .related-item-card {
                    text-decoration: none;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .related-media {
                    height: 140px;
                    background: #0f172a;
                    overflow: hidden;
                }
                .related-info {
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .related-cat {
                    font-size: 10px;
                    color: #64748b;
                    font-weight: 600;
                }
                .related-name {
                    font-size: 13px;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .related-price {
                    font-size: 14px;
                    font-weight: 900;
                    color: #2563eb;
                }
            `}</style>
        </div>
    );
}