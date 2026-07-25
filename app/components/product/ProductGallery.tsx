"use client";

import MediaDisplay from "../MediaDisplay";

interface ProductGalleryProps {
    mediaUrl?: string;
    mediaType?: "image" | "video";
    name: string;
}

export default function ProductGallery({ mediaUrl, mediaType, name }: ProductGalleryProps) {
    return (
        <div className="product-media-box">
            {mediaUrl ? (
                <div className="media-wrapper">
                    <MediaDisplay url={mediaUrl} type={mediaType || "image"} alt={name} controls={true} />
                </div>
            ) : (
                <div className="no-media">
                    No Media Available
                </div>
            )}

            <style jsx>{`
                .product-media-box {
                    width: 100%;
                    background: #f8fafc;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .media-wrapper {
                    width: 100%;
                    height: 420px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0f172a;
                    overflow: hidden;
                }
                .no-media {
                    color: #94a3b8;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 300px;
                    width: 100%;
                    background: #f1f5f9;
                    font-weight: 500;
                }
                @media (max-width: 768px) {
                    .media-wrapper {
                        height: 320px;
                    }
                }
            `}</style>
        </div>
    );
}