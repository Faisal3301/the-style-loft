"use client";

import { useRouter } from "next/navigation";
import { auth, db } from "../../config/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp, faInstagram } from "@fortawesome/free-brands-svg-icons";
import { 
  faEnvelope, 
  faShoppingCart, 
  faComments, 
  faStar, 
  faClock, 
  faTag, 
  faCircleInfo 
} from "@fortawesome/free-solid-svg-icons";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface ProductInfoProps {
  product: any;
  averageRating: string;
  totalReviews: number;
  cartCount: number;
  onAddToCart?: () => void;
  onOpenChat: () => void;
}

export default function ProductInfo({ 
  product, 
  averageRating, 
  totalReviews, 
  cartCount, 
  onOpenChat 
}: ProductInfoProps) {
  const router = useRouter();
  const currentProductUrl = typeof window !== "undefined" ? window.location.href : "";

  // Store Configurations
  const myWhatsAppNumber = "923184947722";
  const displayWhatsApp = "@thestyleloft72";
  const myInstagramUsername = "thestyleloft72";
  const storeEmail = "thestyleloft72@gmail.com";

  // Pre-formatted messages
  const whatsappMessage = encodeURIComponent(
    `Hello! I want to inquire about this product:\n📌 Product: ${product?.name}\n Price: $${product?.salePrice || product?.price}\n🔗 Link: ${currentProductUrl}`
  );
  const emailSubject = encodeURIComponent(`Order/Inquiry: ${product?.name}`);
  const emailBody = encodeURIComponent(
    `Hello Style Loft Team,\n\nI want to check the details and price for this product:\n\nProduct Name: ${product?.name}\nPrice: $${product?.salePrice || product?.price}\nProduct Link: ${currentProductUrl}\n\nPlease guide me.`
  );

  // Firestore Add to Cart Handler
  const handleAddToCart = async (selectedProduct: any) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("Cart mein item add karne ke liye pehle Login karein!");
      router.push("/login");
      return;
    }

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let currentCart: any[] = [];

      if (userDocSnap.exists() && userDocSnap.data().cart) {
        currentCart = userDocSnap.data().cart;
      }

      const existingIndex = currentCart.findIndex((item) => item.id === selectedProduct.id);

      if (existingIndex > -1) {
        currentCart[existingIndex].quantity = (currentCart[existingIndex].quantity || 1) + 1;
      } else {
        currentCart.push({
          id: selectedProduct.id,
          title: selectedProduct.title || selectedProduct.name || "Product",
          price: selectedProduct.salePrice || selectedProduct.price || 0,
          image: selectedProduct.mediaUrl || selectedProduct.image || "",
          quantity: 1,
          selectedSize: selectedProduct.selectedSize || "M",
          selectedColor: selectedProduct.selectedColor || "Default",
          addedAt: new Date().toISOString()
        });
      }

      await setDoc(userDocRef, { cart: currentCart }, { merge: true });
      alert("Product successfully Cart mein add ho gaya hai!");
    } catch (error) {
      console.error("Cart save karne mein error aaya:", error);
      alert("Cart update nahi ho saka. Dobara koshish karein.");
    }
  };

  // Login Guard Handler
  const handleProtectedAction = (actionCallback: () => void) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("⚠️ Please login first to perform this action!");
      router.push("/login");
      return;
    }
    actionCallback();
  };

  return (
    <div className="product-info-wrapper">
      {/* Category Badge */}
      <div className="category-badge">
        <FontAwesomeIcon icon={faTag} style={{ fontSize: "11px" }} />
        <span>{product?.category} {product?.subCategory && `> ${product.subCategory}`}</span>
      </div>

      {/* Title */}
      <h1 className="product-main-title">{product?.name}</h1>

      {/* Rating */}
      <div className="rating-box">
        <div className="stars">
          {Array.from({ length: 5 }).map((_, i) => (
            <FontAwesomeIcon
              key={i}
              icon={faStar}
              style={{ color: i < Math.round(Number(averageRating)) ? "#f59e0b" : "#cbd5e1", fontSize: "13px" }}
            />
          ))}
        </div>
        <span className="rating-num">{averageRating} / 5.0</span>
        <span className="review-count">({totalReviews} verified reviews)</span>
      </div>

      {/* Limited Offer */}
      {product?.offerDuration && (
        <div className="offer-time-badge">
          <FontAwesomeIcon icon={faClock} />
          <span>Limited Time Offer: {product.offerDuration}</span>
        </div>
      )}

      {/* Price */}
      <div className="price-display-row">
        {product?.salePrice !== undefined && product?.salePrice > 0 ? (
          <div className="price-flex">
            <span className="current-sale-price">${product.salePrice}</span>
            <span className="original-strike-price">${product.price}</span>
            <span className="discount-tag">Save Now</span>
          </div>
        ) : (
          <span className="current-sale-price plain">
  {product?.price > 0 ? `$${product.price}` : "DM for Price"}
</span>
        )}
      </div>

      {/* DM Banner */}
      <div className="dm-inquiry-banner">
        <FontAwesomeIcon icon={faCircleInfo} className="banner-icon" />
        <div className="banner-text">
          <span className="banner-title">Exclusive Collection Details</span>
          <p className="banner-desc">For custom sizes, fabric details, and exact price inquiries, please feel free to DM us directly on any platform below!</p>
        </div>
      </div>

      {/* Description */}
      {product?.description && (
        <div className="description-container">
          <h4 className="desc-title">Product Description</h4>
          <p className="desc-paragraph">{product.description}</p>
        </div>
      )}

      {/* Main Buttons */}
      <div className="action-stack">
        <button onClick={() => handleProtectedAction(onOpenChat)} className="btn-chat-support">
          <FontAwesomeIcon icon={faComments} style={{ fontSize: "16px" }} />
          Order Now (Live Chat Support)
        </button>
        <button
          onClick={() => handleProtectedAction(() => handleAddToCart(product))}
          className="btn-add-cart"
        >
          <FontAwesomeIcon icon={faShoppingCart} style={{ fontSize: "15px" }} />
          Add to Cart {cartCount > 0 && <span className="cart-badge-count">{cartCount}</span>}
        </button>
      </div>

      {/* DIRECT SOCIAL MEDIA BUTTONS WITH VIBRANT COLORS */}
      <div className="social-order-section">
        <p className="social-section-title">Quick Direct Inquiry & Order via Socials</p>
        <div className="social-grid">
          
          {/* WhatsApp */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleProtectedAction(() => {
                window.open(`https://wa.me/${myWhatsAppNumber}?text=${whatsappMessage}`, "_blank");
              });
            }}
            className="social-card whatsapp"
          >
            <div className="icon-wrapper whatsapp-bg">
              <FontAwesomeIcon icon={faWhatsapp} className="social-icon" />
            </div>
            <div className="social-info">
              <span className="platform-name">WhatsApp DM</span>
              <span className="platform-id">{displayWhatsApp}</span>
            </div>
          </a>

          {/* Instagram */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleProtectedAction(() => {
                window.open(`https://instagram.com/${myInstagramUsername}`, "_blank");
              });
            }}
            className="social-card instagram"
          >
            <div className="icon-wrapper instagram-bg">
              <FontAwesomeIcon icon={faInstagram} className="social-icon" />
            </div>
            <div className="social-info">
              <span className="platform-name">Instagram DM</span>
              <span className="platform-id">@{myInstagramUsername}</span>
            </div>
          </a>

          {/* Email */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleProtectedAction(() => {
                window.location.href = `mailto:${storeEmail}?subject=${emailSubject}&body=${emailBody}`;
              });
            }}
            className="social-card email"
          >
            <div className="icon-wrapper email-bg">
              <FontAwesomeIcon icon={faEnvelope} className="social-icon" />
            </div>
            <div className="social-info">
              <span className="platform-name">Email Support</span>
              <span className="platform-id">{storeEmail}</span>
            </div>
          </a>

        </div>
      </div>

      {/* SCOPED STYLES WITH EXPLICIT ICON & BUTTON COLORS */}
      <style jsx>{`
        .product-info-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .category-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          color: #475569;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          width: fit-content;
        }
        .product-main-title {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          line-height: 1.3;
        }
        .rating-box {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .stars {
          display: flex;
          gap: 3px;
        }
        .rating-num {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
        }
        .review-count {
          font-size: 12px;
          color: #94a3b8;
        }
        .offer-time-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #b45309;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          width: fit-content;
        }
        .price-display-row {
          margin: 2px 0;
        }
        .price-flex {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .current-sale-price {
          font-size: 28px;
          font-weight: 900;
          color: #e11d48;
        }
        .current-sale-price.plain {
          color: #0f172a;
        }
        .original-strike-price {
          font-size: 16px;
          color: #94a3b8;
          text-decoration: line-through;
          font-weight: 600;
        }
        .discount-tag {
          background: #ffe4e6;
          color: #be123c;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .dm-inquiry-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #f8fafc;
          border-left: 4px solid #2563eb;
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          border-left-width: 4px;
        }
        :global(.banner-icon) {
          color: #2563eb !important;
          font-size: 18px;
          margin-top: 2px;
        }
        .banner-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .banner-title {
          font-size: 13px;
          font-weight: 800;
          color: #1e293b;
        }
        .banner-desc {
          font-size: 12px;
          color: #475569;
          line-height: 1.4;
          margin: 0;
        }
        .description-container {
          background: #f8fafc;
          padding: 14px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }
        .desc-title {
          font-size: 13px;
          font-weight: 800;
          color: #334155;
          margin: 0 0 6px 0;
          text-transform: uppercase;
        }
        .desc-paragraph {
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }
        .action-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }
        .btn-chat-support {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-chat-support:hover {
          background: #1d4ed8;
        }
        .btn-add-cart {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #ffffff;
          color: #0f172a;
          border: 2px solid #cbd5e1;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-add-cart:hover {
          border-color: #0f172a;
          background: #f8fafc;
        }
        .cart-badge-count {
          background: #0f172a;
          color: #ffffff;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 50%;
        }

        /* --- VIBRANT SOCIAL BUTTON STYLES --- */
        .social-order-section {
          margin-top: 10px;
          border-top: 1px dashed #cbd5e1;
          padding-top: 14px;
        }
        .social-section-title {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          margin: 0 0 10px 0;
          text-transform: uppercase;
        }
        .social-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .social-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          text-decoration: none;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          background: #ffffff;
        }
        .social-card.whatsapp {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }
        .social-card.whatsapp:hover {
          background: #dcfce7;
          border-color: #22c55e;
        }
        .social-card.instagram {
          background: #fdf2f8;
          border-color: #fbcfe8;
        }
        .social-card.instagram:hover {
          background: #fce7f3;
          border-color: #ec4899;
        }
        .social-card.email {
          background: #eff6ff;
          border-color: #bfdbfe;
        }
        .social-card.email:hover {
          background: #dbeafe;
          border-color: #3b82f6;
        }

        .icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .whatsapp-bg {
          background: #22c55e;
          color: #ffffff !important;
        }
        .instagram-bg {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
          color: #ffffff !important;
        }
        .email-bg {
          background: #2563eb;
          color: #ffffff !important;
        }

        :global(.social-icon) {
          font-size: 18px !important;
          color: #ffffff !important;
        }

        .social-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .platform-name {
          font-size: 12px;
          font-weight: 800;
          color: #1e293b;
        }
        .platform-id {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 640px) {
          .social-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}