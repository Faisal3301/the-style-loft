import ProductClient from "./ProductClient";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";

export async function generateStaticParams() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
        }));
    } catch (error) {
        console.error("Error generating static params:", error);
        return [];
    }
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return <ProductClient params={resolvedParams} />;
}