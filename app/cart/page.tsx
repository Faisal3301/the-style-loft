"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTrash, 
  faShoppingBag, 
  faArrowLeft, 
  faLock, 
  faCreditCard, 
  faTimes 
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp, faInstagram } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export default function CartPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();

  // Store & Contact Details
  const myWhatsAppNumber = "923184947722";
  const displayWhatsApp = "@thestyleloft72";
  const myInstagramUsername = "thestyleloft_official";
  const storeEmail = "thestyleloft72@gmail.com";

  // 1. Auth Guard & Fetch User Cart Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setAuthLoading(false);
        setLoadingCart(false);
        return;
      }

      setUser(currentUser);
      setAuthLoading(false);

      try {
        const userCartRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userCartRef);

        if (docSnap.exists() && docSnap.data().cart) {
          setCartItems(docSnap.data().cart);
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error("Error fetching cart from Firebase:", error);
      } finally {
        setLoadingCart(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update Firebase Cart
  const updateFirebaseCart = async (updatedCart: CartItem[]) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { cart: updatedCart });
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  };

  // Quantity Handlers
  const handleQuantityChange = (id: string, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    });
    setCartItems(updated);
    updateFirebaseCart(updated);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    updateFirebaseCart(updated);
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = subtotal > 0 ? 250 : 0;
  const total = subtotal + shippingFee;

  // Dynamic Product Links for Popup Inquiry
  const domainUrl = typeof window !== "undefined" ? window.location.origin : "https://thestyleloft.com";
  
  const productSummaryList = cartItems
    .map((item, idx) => `${idx + 1}. ${item.title} (Qty: ${item.quantity}) - Link: ${domainUrl}/product/${item.id}`)
    .join("\n");

  const whatsappMessage = encodeURIComponent(
    `Hello Style Loft! 👋\nI want to place/inquire about an order:\n\n🛒 *Cart Items:*\n${productSummaryList}\n\n💰 *Total Price:* Rs. ${total}\n\nPlease guide me to finalize!`
  );

  const emailSubject = encodeURIComponent(`Cart Order Inquiry - ${user?.displayName || user?.email}`);
  const emailBody = encodeURIComponent(
    `Hello Style Loft Team,\n\nI want to check details and order the following items from my cart:\n\n${productSummaryList}\n\nTotal Cart Value: Rs. ${total}\n\nPlease contact me for confirmation.`
  );

  const whatsappUrl = `https://wa.me/${myWhatsAppNumber}?text=${whatsappMessage}`;
  const instagramUrl = `https://instagram.com/${myInstagramUsername}`;
  const mailtoUrl = `mailto:${storeEmail}?subject=${emailSubject}&body=${emailBody}`;

  // ---------------- RENDERING ----------------

  if (authLoading) {
    return (
      <div className="flex-center min-h-screen bg-gray-50">
        <p className="text-gray-600 font-medium">Authentication Checking...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header cartCount={0} searchQuery="" setSearchQuery={() => {}} selectedCategoryFilter="ABOUT" setSelectedCategoryFilter={() => {}} setSelectedSubCategoryFilter={() => {}} isSidebarOpen={false} setIsSidebarOpen={() => {}} />
        <main className="flex-1 flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full border border-slate-200">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <FontAwesomeIcon icon={faLock} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Login Required</h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Aapko apna Cart dekhne aur items checkout karne ke liye login karna padega.
            </p>
            <button
              onClick={() => router.push("/login?redirect=/cart")}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all shadow-md"
            >
              🔐 Login to View Cart
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} searchQuery="" setSearchQuery={() => {}} selectedCategoryFilter="ABOUT" setSelectedCategoryFilter={() => {}} setSelectedSubCategoryFilter={() => {}} isSidebarOpen={false} setIsSidebarOpen={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Shopping Cart 🛍️</h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">Logged in as {user.displayName || user.email}</p>
          </div>
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-bold text-xs md:text-sm flex items-center gap-2 transition-colors">
            <FontAwesomeIcon icon={faArrowLeft} /> Continue Shopping
          </Link>
        </div>

        {loadingCart ? (
          <div className="text-center py-20 text-slate-500">Loading your cart items...</div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white p-8 md:p-16 text-center rounded-2xl border border-slate-200 max-w-lg mx-auto">
            <FontAwesomeIcon icon={faShoppingBag} className="text-5xl text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Your Cart is Empty</h3>
            <p className="text-slate-500 text-sm mb-6">Aapke cart mein koi item nahi hai.</p>
            <Link href="/" className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs md:text-sm shadow-md hover:bg-blue-700 transition-all">
              Explore Products
            </Link>
          </div>
        ) : (
          /* Responsive Layout Grid */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded-lg bg-slate-100 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/product/${item.id}`} className="font-bold text-slate-800 hover:text-blue-600 text-sm md:text-base line-clamp-1">
                        {item.title}
                      </Link>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.selectedSize && `Size: ${item.selectedSize}`} {item.selectedColor && `| Color: ${item.selectedColor}`}
                      </p>
                      <span className="text-blue-600 font-extrabold text-sm md:text-base block mt-1">Rs. {item.price.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                      <button onClick={() => handleQuantityChange(item.id, -1)} className="font-bold text-slate-700 px-1 hover:text-blue-600">-</button>
                      <span className="text-xs md:text-sm font-bold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item.id, 1)} className="font-bold text-slate-700 px-1 hover:text-blue-600">+</button>
                    </div>

                    <button onClick={() => handleRemoveItem(item.id)} className="w-9 h-9 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
                      <FontAwesomeIcon icon={faTrash} className="text-xs md:text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 h-fit sticky top-24 shadow-sm">
              <h3 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100 mb-4">Order Summary</h3>
              
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="font-bold text-slate-900">Rs. {shippingFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-dashed border-slate-200 my-2"></div>
                <div className="flex justify-between text-base font-black text-slate-900">
                  <span>Total</span>
                  <span className="text-blue-600">Rs. {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Open Popup Modal Trigger Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <FontAwesomeIcon icon={faCreditCard} /> Proceed / Inquire Order
              </button>
            </div>

          </div>
        )}
      </main>

      {/* ---------------- ORDER INQUIRY MODAL POPUP ---------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Close Modal Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">Quick Checkout / Inquiry</h3>
            <p className="text-xs text-slate-500 mb-6">Aap direct humare social platforms par contact karke order confirm kar sakte hain.</p>

            <div className="space-y-3">
              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 font-bold text-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center text-lg shadow-sm">
                    <FontAwesomeIcon icon={faWhatsapp} />
                  </div>
                  <div>
                    <div className="font-extrabold text-emerald-900">Order via WhatsApp</div>
                    <div className="text-xs text-emerald-600">{displayWhatsApp}</div>
                  </div>
                </div>
                <span className="text-xs font-black bg-emerald-200 px-2.5 py-1 rounded-full group-hover:bg-emerald-300">Chat</span>
              </a>

              {/* Instagram Button */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 bg-pink-50 hover:bg-pink-100 text-pink-800 rounded-xl border border-pink-200 font-bold text-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white rounded-full flex items-center justify-center text-lg shadow-sm">
                    <FontAwesomeIcon icon={faInstagram} />
                  </div>
                  <div>
                    <div className="font-extrabold text-pink-900">Message on Instagram</div>
                    <div className="text-xs text-pink-600">@{myInstagramUsername}</div>
                  </div>
                </div>
                <span className="text-xs font-black bg-pink-200 px-2.5 py-1 rounded-full group-hover:bg-pink-300">DM</span>
              </a>

              {/* Email Button */}
              <a
                href={mailtoUrl}
                className="flex items-center justify-between p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-200 font-bold text-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg shadow-sm">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <div>
                    <div className="font-extrabold text-blue-900">Send Email</div>
                    <div className="text-xs text-blue-600">{storeEmail}</div>
                  </div>
                </div>
                <span className="text-xs font-black bg-blue-200 px-2.5 py-1 rounded-full group-hover:bg-blue-300">Email</span>
              </a>
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}