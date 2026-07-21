"use client";

interface MediaProps {
    url: string;
    type: "image" | "video";
    alt?: string;
    className?: string;
    style?: React.CSSProperties;
    thumbnailOnly?: boolean;
}

export default function MediaDisplay({ url, type, alt = "media", style, thumbnailOnly = false }: MediaProps) {
    if (type === "video") {
        // Direct video files vs Google Drive preview links
        const isDrivePreview = url.includes("drive.google.com");

        if (thumbnailOnly) {
            return (
                <div style={{ ...style, position: "relative", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}>
                    <span style={{ fontSize: "14px" }}>▶️</span>
                    <span style={{ position: "absolute", bottom: "2px", fontSize: "9px", background: "rgba(0,0,0,0.7)", padding: "1px 4px", borderRadius: "2px" }}>VIDEO</span>
                </div>
            );
        }

        return isDrivePreview ? (
            <iframe 
                src={url} 
                style={{ width: "100%", height: "100%", border: "none", borderRadius: "6px", ...style }} 
                allow="autoplay; encrypted-media"
                allowFullScreen
            />
        ) : (
            <video 
                src={url} 
                controls 
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px", ...style }} 
            />
        );
    }

    return (
        <img 
            src={url} 
            alt={alt} 
            style={{ width: "100%", height: "100%", objectFit: "cover", ...style }} 
        />
    );
}