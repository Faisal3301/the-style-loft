import ProductClient from "./ProductClient";
import { db } from "./../../config/firebase"; // Apne path ke mutabiq firebase config check karlein
import { collection, getDocs } from "firebase/firestore";

interface PageProps {
    params: Promise<{ id: string }>;
}

// ⚡ Firebase se sari products IDs automatically fetch karke static export ke liye return karega
export async function generateStaticParams() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const paths: { id: string }[] = [];
        
        querySnapshot.forEach((doc) => {
            paths.push({ id: doc.id });
        });

        // Agar database bilkul khali ho toh placeholder lazmi return karein
        if (paths.length === 0) {
            return [{ id: "placeholder" }];
        }

        return paths;
    } catch (error) {
        console.error("Error generating static params from Firebase:", error);
        return [{ id: "placeholder" }];
    }
}

export default async function ProductPage({ params }: PageProps) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    return (
        <div style={{ padding: "30px", maxWidth: "1000px", margin: "0 auto" }}>
            <ProductClient id={id} />
        </div>
    );
}