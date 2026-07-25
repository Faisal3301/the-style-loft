"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../config/firebase";
import { collection, addDoc, updateDoc, doc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faChevronLeft, faChevronRight, faStar, faImage } from "@fortawesome/free-solid-svg-icons";

interface ProductReviewsProps {
    productId: string;
    comments: any[];
    setComments: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function ProductReviews({ productId, comments, setComments }: ProductReviewsProps) {
    const router = useRouter();
    const [ratingVal, setRatingVal] = useState(5);
    const [commentText, setCommentText] = useState("");
    const [reviewFiles, setReviewFiles] = useState<string[]>([]);
    const [reviewFilePreviews, setReviewFilePreviews] = useState<string[]>([]);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [replyInputs, setReplyInputs] = useState<{ [key: string]: { text: string } }>({});

    // Lightbox Modal State for Popup Image Swapping
    const [modalImages, setModalImages] = useState<string[]>([]);
    const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    // Login guard & get user name helper
    const getActiveUser = () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert("⚠️ Please login first to submit a review or reply!");
            router.push("/login");
            return null;
        }
        return currentUser;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const fileNames = files.map(file => file.name);
            const previews = files.map(file => URL.createObjectURL(file));
            setReviewFiles(fileNames);
            setReviewFilePreviews(previews);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = getActiveUser();
        if (!user) return;

        if (!commentText.trim()) {
            alert("Please write your experience or delivery feedback.");
            return;
        }

        const authorName = user.displayName || user.email?.split("@")[0] || "Valued Customer";

        setSubmittingComment(true);
        try {
            const newCommentData = {
                productId,
                author: authorName,
                rating: Number(ratingVal),
                comment: commentText,
                replies: [],
                files: reviewFilePreviews.length > 0 ? reviewFilePreviews : reviewFiles,
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "product_comments"), newCommentData);
            setComments([{ id: docRef.id, ...newCommentData }, ...comments]);
            setCommentText("");
            setReviewFiles([]);
            setReviewFilePreviews([]);
            setRatingVal(5);

            const fileInput = document.getElementById("review-file-input") as HTMLInputElement;
            if (fileInput) fileInput.value = "";

            alert("✅ Review & delivery proof submitted successfully!");
        } catch (error) {
            console.error("Error submitting review:", error);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleAddReply = async (commentId: string) => {
        const user = getActiveUser();
        if (!user) return;

        const replyData = replyInputs[commentId];
        if (!replyData || !replyData.text.trim()) {
            alert("Please enter your reply message.");
            return;
        }

        const replyAuthor = user.displayName || user.email?.split("@")[0] || "Store Support";

        try {
            const newReply = {
                author: replyAuthor,
                message: replyData.text,
                createdAt: new Date()
            };

            const commentRef = doc(db, "product_comments", commentId);
            await updateDoc(commentRef, {
                replies: arrayUnion(newReply)
            });

            setComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    return { ...c, replies: [...(c.replies || []), newReply] };
                }
                return c;
            }));

            setReplyInputs(prev => ({ ...prev, [commentId]: { text: "" } }));
            alert("✅ Reply added successfully!");
        } catch (error) {
            console.error("Error adding reply:", error);
        }
    };

    // Open image popup modal
    const openLightbox = (imagesList: string[], index: number) => {
        setModalImages(imagesList);
        setActiveImageIndex(index);
        setIsModalOpen(true);
    };

    const nextImage = () => {
        setActiveImageIndex((prev) => (prev + 1) % modalImages.length);
    };

    const prevImage = () => {
        setActiveImageIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length);
    };

    return (
        <div className="section-container">
            <h2 className="section-title">💬 Customer Reviews & Delivery Proof ({comments.length})</h2>

            {/* Review Form */}
            <form onSubmit={handleAddComment} className="review-form">
                <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#334155", marginTop: 0, marginBottom: "10px" }}>Leave a Review & Attach Delivery Proof</h3>
                
                <div style={{ marginBottom: "10px" }}>
                    <label className="form-label">Rating Score</label>
                    <select value={ratingVal} onChange={(e) => setRatingVal(Number(e.target.value))} className="form-input">
                        <option value="5">⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                        <option value="4">⭐⭐⭐⭐ (4/5 Very Good)</option>
                        <option value="3">⭐⭐⭐ (3/5 Good)</option>
                        <option value="2">⭐⭐ (2/5 Fair)</option>
                        <option value="1">⭐ (1/5 Poor)</option>
                    </select>
                </div>

                <div style={{ marginBottom: "12px" }}>
                    <label className="form-label">Your Feedback / Receiving Experience</label>
                    <textarea 
                        placeholder="Write about product quality and delivery experience..." 
                        value={commentText} 
                        onChange={(e) => setCommentText(e.target.value)} 
                        className="form-input" 
                        style={{ height: "75px", resize: "vertical" }} 
                        required 
                    />
                </div>

                <div style={{ marginBottom: "12px" }}>
                    <label className="form-label">Attach Multiple Images (Delivery Proof)</label>
                    <input id="review-file-input" type="file" accept="image/*" multiple onChange={handleFileChange} className="form-input" style={{ background: "#fff", padding: "6px" }} />
                    
                    {reviewFilePreviews.length > 0 && (
                        <div className="horizontal-proof-grid">
                            {reviewFilePreviews.map((src, idx) => (
                                <div key={idx} className="proof-img-thumb" onClick={() => openLightbox(reviewFilePreviews, idx)}>
                                    <img src={src} alt="Preview" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button type="submit" disabled={submittingComment} className="btn-submit-review">
                    {submittingComment ? "Submitting..." : "Submit Review & Proof"}
                </button>
            </form>

            {/* Comments List */}
            {comments.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "13px", fontStyle: "italic", margin: 0 }}>No reviews yet. Be the first to review this product!</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {comments.map((c) => (
                        <div key={c.id} className="comment-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                <strong style={{ fontSize: "13px", color: "#0f172a" }}>{c.author}</strong>
                                <span style={{ color: "#f59e0b", fontSize: "11px" }}>
                                    {Array.from({ length: c.rating || 5 }).map((_, i) => (
                                        <FontAwesomeIcon key={i} icon={faStar} />
                                    ))}
                                </span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#334155", margin: "4px 0", lineHeight: "1.4" }}>{c.comment}</p>
                            
                            {/* Horizontal Images Proof Grid */}
                            {c.files && c.files.length > 0 && (
                                <div style={{ marginTop: "10px" }}>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "6px" }}>Attached Delivery Proof (Click to view):</span>
                                    <div className="horizontal-proof-grid">
                                        {c.files.map((file: string, idx: number) => (
                                            <div key={idx} className="proof-img-thumb" onClick={() => openLightbox(c.files, idx)}>
                                                {file.startsWith("blob:") || file.startsWith("http") || file.startsWith("data:") ? (
                                                    <img src={file} alt="Proof" />
                                                ) : (
                                                    <div className="proof-chip"><FontAwesomeIcon icon={faImage} /> {file}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Replies */}
                            {c.replies && c.replies.length > 0 && (
                                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "12px", borderLeft: "2px solid #2563eb" }}>
                                    {c.replies.map((rep: any, rIdx: number) => (
                                        <div key={rIdx} style={{ background: "#f8fafc", padding: "8px", borderRadius: "6px", fontSize: "12px" }}>
                                            <strong style={{ color: "#2563eb" }}>{rep.author}: </strong>
                                            <span style={{ color: "#334155" }}>{rep.message}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply Input */}
                            <div className="reply-box-container">
                                <input 
                                    type="text" 
                                    placeholder="Write a reply..." 
                                    value={replyInputs[c.id]?.text || ""} 
                                    onChange={(e) => setReplyInputs({ ...replyInputs, [c.id]: { text: e.target.value } })}
                                    className="form-input"
                                    style={{ fontSize: "11px", padding: "6px 10px", flex: 1 }}
                                />
                                <button onClick={() => handleAddReply(c.id)} className="btn-reply-submit">Reply</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Popup Lightbox Modal for Image Viewing & Swapping */}
            {isModalOpen && (
                <div className="lightbox-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="lightbox-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close-btn" onClick={() => setIsModalOpen(false)}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>

                        {modalImages.length > 1 && (
                            <button className="lightbox-nav-btn prev" onClick={prevImage}>
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </button>
                        )}

                        <div className="lightbox-img-container">
                            <img src={modalImages[activeImageIndex]} alt="Enlarged Proof" />
                            <span className="lightbox-counter">{activeImageIndex + 1} / {modalImages.length}</span>
                        </div>

                        {modalImages.length > 1 && (
                            <button className="lightbox-nav-btn next" onClick={nextImage}>
                                <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .section-container {
                    background: #ffffff;
                    padding: 30px;
                    border-radius: 16px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    border: 1px solid #e2e8f0;
                    width: 100%;
                    box-sizing: border-box;
                }
                .section-title {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 16px;
                }
                .review-form {
                    background: #f8fafc;
                    padding: 16px;
                    border-radius: 10px;
                    margin-bottom: 24px;
                    border: 1px solid #e2e8f0;
                }
                .form-label {
                    font-size: 11px;
                    font-weight: 700;
                    color: #475569;
                    display: block;
                    margin-bottom: 3px;
                }
                .form-input {
                    width: 100%;
                    padding: 8px 10px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-size: 12px;
                    box-sizing: border-box;
                    outline: none;
                    background: #ffffff;
                }
                .btn-submit-review {
                    background-color: #10b981;
                    color: #fff;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 700;
                    cursor: pointer;
                    font-size: 12px;
                }
                .comment-card {
                    padding: 14px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                }
                .horizontal-proof-grid {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-top: 6px;
                }
                .proof-img-thumb {
                    width: 65px;
                    height: 65px;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid #cbd5e1;
                    cursor: pointer;
                    transition: transform 0.2s ease, border-color 0.2s ease;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .proof-img-thumb:hover {
                    transform: scale(1.05);
                    border-color: #2563eb;
                }
                .proof-img-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .proof-chip {
                    background: #eff6ff;
                    color: #1e40af;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 600;
                    text-align: center;
                }
                .reply-box-container {
                    display: flex;
                    gap: 6px;
                    margin-top: 10px;
                    align-items: center;
                }
                .btn-reply-submit {
                    background: #2563eb;
                    color: #fff;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                }

                /* Lightbox Modal Styles */
                .lightbox-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 20px;
                }
                .lightbox-modal-content {
                    position: relative;
                    max-width: 90vw;
                    max-height: 90vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .lightbox-img-container {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .lightbox-img-container img {
                    max-width: 85vw;
                    max-height: 80vh;
                    object-fit: contain;
                    border-radius: 8px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                .lightbox-close-btn {
                    position: absolute;
                    top: -45px;
                    right: 0;
                    background: #ffffff;
                    color: #0f172a;
                    border: none;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                }
                .lightbox-nav-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background: rgba(255, 255, 255, 0.8);
                    color: #0f172a;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                    z-index: 10;
                }
                .lightbox-nav-btn:hover {
                    background: #ffffff;
                }
                .lightbox-nav-btn.prev {
                    left: -60px;
                }
                .lightbox-nav-btn.next {
                    right: -60px;
                }
                .lightbox-counter {
                    color: #ffffff;
                    font-size: 13px;
                    font-weight: 600;
                    margin-top: 10px;
                    background: rgba(0, 0, 0, 0.6);
                    padding: 4px 12px;
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
}