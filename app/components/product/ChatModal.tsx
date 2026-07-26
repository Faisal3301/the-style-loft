"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../config/firebase"; // Path apne config ke mutabiq check kar lein
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface ChatModalProps {
    productName: string;
    onClose: () => void;
}

interface Message {
    id: string;
    sender: "user" | "admin";
    text: string;
    createdAt: any;
}

export default function ChatModal({ productName, onClose }: ChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const router = useRouter();
    const currentUser = auth.currentUser;

    // 1. Check Login on Load / Open
    useEffect(() => {
        if (!currentUser) {
            alert("⚠️ Please sign in first to access live support chat!");
            router.push("/login");
        }
    }, [currentUser, router]);

    // 2. Fetch Live Messages from Firestore for this user
    useEffect(() => {
        if (!currentUser) return;

        const chatRoomId = currentUser.uid;
        const messagesRef = collection(db, "chats", chatRoomId, "messages");
        const q = query(messagesRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach((docSnap) => {
                msgs.push({ id: docSnap.id, ...docSnap.data() } as Message);
            });
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // 3. Send Message Handler
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            router.push("/login");
            return;
        }

        if (!inputMessage.trim()) return;

        const textToSend = inputMessage;
        setInputMessage(""); // Input ko foran clear kar dein taake type karte waqt screen par repeat na ho

        try {
            const chatRoomId = currentUser.uid;

            // Save main chat session info
            await setDoc(doc(db, "chats", chatRoomId), {
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email || "Valued Client",
                userEmail: currentUser.email,
                lastMessage: textToSend,
                updatedAt: serverTimestamp(),
                unreadByAdmin: true
            }, { merge: true });

            // Save individual message inside sub-collection
            const messagesRef = collection(db, "chats", chatRoomId, "messages");
            await addDoc(messagesRef, {
                sender: "user",
                text: `Inquiry about ${productName}: ${textToSend}`,
                createdAt: serverTimestamp()
            });

        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message. Please try again.");
        }
    };

    if (!currentUser) return null;

    return (
        <div className="chat-popup-modal">
            {/* Header */}
            <div className="chat-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px" }}>💬</span>
                    <div>
                        <div style={{ fontSize: "13px", fontWeight: "800" }}>Live VIP Support</div>
                        <div style={{ fontSize: "9px", color: "#fef3c7" }}>We reply shortly</div>
                    </div>
                </div>
                <button onClick={onClose} className="chat-close-btn">✕</button>
            </div>

            {/* Body (Messages Container) */}
            <div className="chat-body">
                <div className="chat-bubble-system">
                    Hello! How can we help you order <strong>{productName}</strong>?
                </div>

                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={msg.sender === "user" ? "chat-bubble-user" : "chat-bubble-admin"}
                    >
                        {msg.text}
                    </div>
                ))}
            </div>

            {/* Footer Form */}
            <form onSubmit={handleSendMessage} className="chat-footer">
                <input 
                    type="text" 
                    placeholder="Type your query..."
                    value={inputMessage} 
                    onChange={(e) => setInputMessage(e.target.value)} 
                    className="chat-input" 
                />
                <button type="submit" className="chat-send-btn">
                    Send ➔
                </button>
            </form>

            <style jsx>{`
                .chat-popup-modal {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 330px;
                    max-width: calc(100vw - 40px);
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 15px 35px rgba(15, 23, 42, 0.2);
                    border: 1px solid #e2e8f0;
                    z-index: 10000;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .chat-header {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    color: #fff;
                    padding: 12px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #f59e0b;
                }
                .chat-close-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: #fff;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                }
                .chat-body {
                    padding: 12px;
                    height: 220px;
                    background: #f8fafc;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .chat-bubble-system {
                    background: #e2e8f0;
                    padding: 8px 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    color: #1e293b;
                    max-width: 85%;
                }
                .chat-bubble-user {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: #0f172a;
                    padding: 8px 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    font-weight: 600;
                    max-width: 85%;
                    align-self: flex-end;
                }
                .chat-bubble-admin {
                    background: #0f172a;
                    color: #fff;
                    padding: 8px 10px;
                    border-radius: 8px;
                    font-size: 11px;
                    max-width: 85%;
                    align-self: flex-start;
                }
                .chat-footer {
                    padding: 10px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    gap: 6px;
                    background: #fff;
                }
                .chat-input {
                    flex: 1;
                    padding: 8px;
                    border-radius: 6px;
                    border: 1px solid #cbd5e1;
                    font-size: 11px;
                    outline: none;
                }
                .chat-send-btn {
                    background: #0f172a;
                    color: #f59e0b;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 900;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}