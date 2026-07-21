import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;

    if (!folderId) {
        return NextResponse.json({ error: "Folder ID is required" }, { status: 400 });
    }

    if (!API_KEY) {
        return NextResponse.json({ error: "API Key is missing in .env.local" }, { status: 500 });
    }

    try {
        const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&key=${API_KEY}`;
        
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
            return NextResponse.json({ error: data.error.message }, { status: 400 });
        }

        const mediaFiles = (data.files || []).map((file: any) => {
            const isVideo = file.mimeType.includes("video") || file.name.match(/\.(mp4|mov|avi|mkv|webm)$/i);
            return {
                id: file.id,
                name: file.name,
                type: isVideo ? "video" : "image",
                // Direct high-res image vs Google Drive embeddable player for video
                url: isVideo 
                    ? `https://drive.google.com/file/d/${file.id}/preview` 
                    : `https://lh3.googleusercontent.com/d/${file.id}=s1000`
            };
        });

        return NextResponse.json({ success: true, files: mediaFiles });

    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch drive files" }, { status: 500 });
    }
}