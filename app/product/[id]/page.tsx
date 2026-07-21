import ProductClient from "././ProductClient";

export async function generateStaticParams() {
    return [
        { id: "LTfHLJill9EeBUUUPnB5" },
        { id: "placeholder" }
    ];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return <ProductClient id={resolvedParams.id} />;
}