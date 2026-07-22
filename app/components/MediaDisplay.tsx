interface MediaDisplayProps {
    url?: string;
    type?: "image" | "video";
    alt?: string;
    controls?: boolean;
    thumbnailOnly?: boolean;
}

export default function MediaDisplay({ url, type = "image", alt = "Media", controls = true, thumbnailOnly = false }: MediaDisplayProps) {
    if (!url) return null;

    // Agar Cloudinary ki video hai, toh uska extension .jpg ya .webp karke thumbnail URL bana lete hain
    let thumbnailUrl = url;
    if (type === "video" && url.includes("cloudinary.com")) {
        // Cloudinary video URL ko image thumbnail mein badalne ka tareeqa (.jpg extension)
        thumbnailUrl = url.replace(/\.[^/.]+$/, ".jpg");
    }

    // Agar sirf thumbnail dikhana hai ya thumbnailOnly prop true hai
    if (thumbnailOnly) {
        return (
            <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative", backgroundColor: "#000" }}>
                <img 
                    src={type === "video" ? thumbnailUrl : url} 
                    alt={alt} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
                {type === "video" && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                        <span style={{ fontSize: "24px", color: "#fff", background: "rgba(0,0,0,0.6)", borderRadius: "50%", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}>▶</span>
                    </div>
                )}
            </div>
        );
    }

    // Normal view (agar full video play karni ho)
    return (
        <div style={{ width: "100%", height: "100%", overflow: "hidden", backgroundColor: "#000" }}>
            {type === "video" ? (
                <video 
                    src={url} 
                    poster={thumbnailUrl} 
                    controls={controls} 
                    preload="none"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
            ) : (
                <img src={url} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
        </div>
    );
}