interface MediaDisplayProps {
    url?: string;
    type?: "image" | "video";
    alt?: string;
    controls?: boolean;
    thumbnailOnly?: boolean; // Yeh prop add kar dein
}

export default function MediaDisplay({ url, type = "image", alt = "Media", controls = true, thumbnailOnly = false }: MediaDisplayProps) {
    if (!url) return null;

    // Agar thumbnailOnly true hai toh sirf choti image/video preview dikhayein
    if (thumbnailOnly) {
        return (
            <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
                {type === "video" ? (
                    <video src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                ) : (
                    <img src={url} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
            </div>
        );
    }

    // Normal full display view
    return (
        <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
            {type === "video" ? (
                <video src={url} controls={controls} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
                <img src={url} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
        </div>
    );
}