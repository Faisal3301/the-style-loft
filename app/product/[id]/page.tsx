import ProductClient from "./ProductClient";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import type { Metadata } from "next";


export async function generateMetadata(
    { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
    const { id } = await params;

    try {
        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            return {
                title: "Product | The Style Loft",
                description: "Discover stylish fashion products at The Style Loft.",
            };
        }

        const product = productSnap.data();

        const title =
            product.seoTitle ||
            product.name ||
            product.title ||
            "The Style Loft Product";

        const description =
            product.seoDescription ||
            product.description ||
            "Discover stylish fashion products at The Style Loft.";

        return {
            title,
            description,

            keywords: product.keywords
                ? product.keywords.split(",").map((keyword: string) => keyword.trim())
                : undefined,

            openGraph: {
                title,
                description,
                type: "website",
                images: product.mediaUrl
                    ? [
                        {
                            url: product.mediaUrl,
                            alt: product.imageAlt || product.name || "The Style Loft Product",
                        },
                    ]
                    : undefined,
            },

            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: product.mediaUrl ? [product.mediaUrl] : undefined,
            },
        };
    } catch (error) {
        console.error("Error generating product metadata:", error);

        return {
            title: "The Style Loft",
            description: "Discover stylish fashion products at The Style Loft.",
        };
    }
}


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