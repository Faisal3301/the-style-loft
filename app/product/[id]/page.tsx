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

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = await params;

    const productRef = doc(db, "products", resolvedParams.id);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
        return <ProductClient params={resolvedParams} />;
    }

    const product = productSnap.data();

    const productName =
        product.name ||
        product.title ||
        "The Style Loft Product";

    const productDescription =
        product.description ||
        product.seoDescription ||
        "";

    const productImage =
        product.mediaUrl ||
        product.imageUrl ||
        product.image ||
        "";

    const productSchema: any = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: productName,
        description: productDescription,
        url: `https://thestyleloftstore.com/product/${resolvedParams.id}`,
        brand: {
            "@type": "Brand",
            name: "The Style Loft",
        },
    };

    if (productImage) {
        productSchema.image = [productImage];
    }

    // Only add price when a real price exists.
    const salePrice = Number(product.salePrice || 0);
    const originalPrice = Number(product.price || 0);
    const finalPrice = salePrice > 0 ? salePrice : originalPrice;

    if (finalPrice > 0) {
        productSchema.offers = {
            "@type": "Offer",
            url: `https://thestyleloftstore.com/product/${resolvedParams.id}`,
            priceCurrency: "USD",
            price: finalPrice.toFixed(2),
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
        };
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(productSchema),
                }}
            />

            <ProductClient params={resolvedParams} />
        </>
    );
}