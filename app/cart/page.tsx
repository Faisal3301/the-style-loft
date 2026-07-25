"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CartPage() {
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [country, setCountry] = useState<"US" | "UK">("US");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
    const [selectedSubCategoryFilter, setSelectedSubCategoryFilter] = useState("ALL");
    const [visibleCount, setVisibleCount] = useState(12);
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Dummy cart loader or localStorage sync can be added here
    useEffect(() => {
        // Sample cart data for initial preview if empty
        const savedCart = localStorage.getItem("style_loft_cart");
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (e) {
                setCartItems([]);
            }
        } else {
            // Initial sample items for demonstration
            setCartItems([
                {
                    id: "1",
                    name: "Luxury Silk Evening Gown",
                    priceUS: 299,
                    priceUK: 249,
                    size: "M",
                    color: "Emerald",
                    quantity: 1,
                    image: "https://via.placeholder.com/150?text=Gown"
                },
                {
                    id: "2",
                    name: "Designer Wool Tailored Blazer",
                    priceUS: 450,
                    priceUK: 380,
                    size: "L",
                    color: "Charcoal",
                    quantity: 1,
                    image: "https://via.placeholder.com/150?text=Blazer"
                }
            ]);
        }
    }, []);

    // Update quantity function
    const updateQuantity = (id: string, delta: number) => {
        const updated = cartItems.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean);
        
        setCartItems(updated);
        localStorage.setItem("style_loft_cart", JSON.stringify(updated));
    };

    // Remove item function
    const removeItem = (id: string) => {
        const updated = cartItems.filter(item => item.id !== id);
        setCartItems(updated);
        localStorage.setItem("style_loft_cart", JSON.stringify(updated));
    };

    // Calculate Subtotal
    const subtotal = cartItems.reduce((acc, item) => {
        const price = country === "US" ? item.priceUS : item.priceUK;
        return acc + (price * item.quantity);
    }, 0);

    const shipping = subtotal > 0 ? (country === "US" ? 15 : 12) : 0;
    const total = subtotal + (subtotal > 0 ? shipping : 0);
    const currencySymbol = country === "US" ? "$" : "£";

    return (
        <div className="page-wrapper">
            <Header 
                cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                country={country}
                setCountry={setCountry}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategoryFilter={selectedCategoryFilter}
                setSelectedCategoryFilter={setSelectedCategoryFilter}
                setSelectedSubCategoryFilter={setSelectedSubCategoryFilter}
                setVisibleCount={setVisibleCount}
                categoriesList={categoriesList}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            <main className="cart-main">
                <div className="cart-container">
                    <h1 className="cart-heading">Your Shopping Bag</h1>
                    <p className="cart-subheading">Review your selected luxury items before checkout</p>

                    {cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <div className="empty-icon">🛒</div>
                            <h2>Your bag is currently empty</h2>
                            <p>Explore our latest collections and add your favorite luxury styles.</p>
                            <Link href="/" className="btn-explore">
                                Continue Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="cart-grid">
                            {/* Items List */}
                            <div className="cart-items-list">
                                {cartItems.map((item) => {
                                    const itemPrice = country === "US" ? item.priceUS : item.priceUK;
                                    return (
                                        <div key={item.id} className="cart-item-card">
                                            <div className="item-image-box">
                                                <img src={item.image} alt={item.name} className="item-img" />
                                            </div>
                                            <div className="item-details">
                                                <h3 className="item-name">{item.name}</h3>
                                                <div className="item-meta">
                                                    <span>Size: <b>{item.size || "Standard"}</b></span>
                                                    <span>Color: <b>{item.color || "Default"}</b></span>
                                                </div>
                                                <div className="item-price">
                                                    {currencySymbol}{itemPrice.toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="item-actions-box">
                                                <div className="qty-controller">
                                                    <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                                                    <span>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                                                </div>
                                                <button onClick={() => removeItem(item.id)} className="btn-remove" title="Remove item">
                                                    🗑️ Remove
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Order Summary */}
                            <div className="cart-summary-card">
                                <h3>Order Summary</h3>
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>{currencySymbol}{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Estimated Shipping ({country})</span>
                                    <span>{currencySymbol}{shipping}</span>
                                </div>
                                <div className="summary-divider"></div>
                                <div className="summary-row total-row">
                                    <span>Total</span>
                                    <span>{currencySymbol}{total.toLocaleString()}</span>
                                </div>

                                <button onClick={() => alert("Proceeding to secure checkout gateway...")} className="btn-checkout">
                                    Proceed to Checkout
                                </button>
                                <Link href="/" className="continue-link">
                                    ← Continue Shopping
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            <style jsx>{`
                .page-wrapper {
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: #f8fafc;
                }
                .cart-main {
                    flex: 1;
                    padding: 40px 20px;
                    max-width: 1200px;
                    width: 100%;
                    margin: 0 auto;
                    box-sizing: border-box;
                }
                .cart-heading {
                    font-size: 26px;
                    font-weight: 900;
                    color: #0f172a;
                    margin: 0 0 5px 0;
                }
                .cart-subheading {
                    font-size: 14px;
                    color: #64748b;
                    margin-bottom: 30px;
                }
                .empty-cart {
                    background: #fff;
                    padding: 60px 20px;
                    border-radius: 16px;
                    text-align: center;
                    border: 1px solid #e2e8f0;
                }
                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }
                .empty-cart h2 {
                    font-size: 20px;
                    color: #0f172a;
                    margin-bottom: 8px;
                }
                .empty-cart p {
                    font-size: 13px;
                    color: #64748b;
                    margin-bottom: 20px;
                }
                .btn-explore {
                    background: #2563eb;
                    color: #fff;
                    padding: 10px 20px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: bold;
                    font-size: 13px;
                }
                .cart-grid {
                    display: grid;
                    grid-template-columns: 1fr 360px;
                    gap: 30px;
                }
                @media (max-width: 900px) {
                    .cart-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .cart-items-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .cart-item-card {
                    background: #fff;
                    padding: 16px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                @media (max-width: 600px) {
                    .cart-item-card {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }
                .item-image-box {
                    width: 80px;
                    height: 80px;
                    border-radius: 8px;
                    overflow: hidden;
                    background: #f1f5f9;
                    flex-shrink: 0;
                }
                .item-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .item-details {
                    flex: 1;
                }
                .item-name {
                    font-size: 15px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 4px 0;
                }
                .item-meta {
                    font-size: 12px;
                    color: #64748b;
                    display: flex;
                    gap: 15px;
                    margin-bottom: 6px;
                }
                .item-price {
                    font-size: 14px;
                    font-weight: 900;
                    color: #d97706;
                }
                .item-actions-box {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 10px;
                }
                .qty-controller {
                    display: flex;
                    align-items: center;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .qty-controller button {
                    background: #f8fafc;
                    border: none;
                    padding: 4px 10px;
                    cursor: pointer;
                    font-weight: bold;
                    color: #0f172a;
                }
                .qty-controller button:hover {
                    background: #e2e8f0;
                }
                .qty-controller span {
                    padding: 0 10px;
                    font-size: 13px;
                    font-weight: bold;
                }
                .btn-remove {
                    background: none;
                    border: none;
                    color: #ef4444;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-remove:hover {
                    text-decoration: underline;
                }
                .cart-summary-card {
                    background: #fff;
                    padding: 24px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    height: fit-content;
                }
                .cart-summary-card h3 {
                    font-size: 18px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 16px 0;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    color: #475569;
                    margin-bottom: 12px;
                }
                .summary-divider {
                    border-bottom: 1px solid #e2e8f0;
                    margin: 16px 0;
                }
                .total-row {
                    font-size: 16px;
                    font-weight: 900;
                    color: #0f172a;
                }
                .btn-checkout {
                    width: 100%;
                    background: #2563eb;
                    color: #fff;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    font-weight: 800;
                    font-size: 14px;
                    cursor: pointer;
                    margin-top: 16px;
                    transition: background 0.2s;
                }
                .btn-checkout:hover {
                    background: #1d4ed8;
                }
                .continue-link {
                    display: block;
                    text-align: center;
                    font-size: 12px;
                    color: #64748b;
                    text-decoration: none;
                    margin-top: 12px;
                    font-weight: 600;
                }
                .continue-link:hover {
                    color: #2563eb;
                }
            `}</style>
        </div>
    );
}