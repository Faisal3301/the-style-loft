"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "../../config/firebase";
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";

interface ChatThread {
    id: string;
    userName: string;
    userEmail: string;
    lastMessage: string;
    unreadByAdmin: boolean;
    updatedAt: any;
}

interface Message {
    id: string;
    sender: "admin" | "user";
    text: string;
    createdAt: any;
}

export default function AdminChatsPage() {
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [replyText, setReplyText] = useState("");
    const [loadingThreads, setLoadingThreads] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);

    // Auto scroll to bottom of messages
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 1. Fetch chat threads
    useEffect(() => {
        const fetchThreads = async () => {
            try {
                const q = query(collection(db, "chats"), orderBy("updatedAt", "desc"));
                const snapshot = await getDocs(q);
                const fetchedThreads: ChatThread[] = [];
                snapshot.forEach((docSnap) => {
                    fetchedThreads.push({ id: docSnap.id, ...docSnap.data() } as ChatThread);
                });
                setThreads(fetchedThreads);
            } catch (error) {
                console.error("Error fetching chat threads:", error);
            } finally {
                setLoadingThreads(false);
            }
        };

        fetchThreads();
    }, []);

    // 2. Fetch messages for selected thread
    const handleSelectThread = async (thread: ChatThread) => {
        setSelectedThread(thread);
        setShowMobileChat(true);
        setLoadingMessages(true);

        try {
            if (thread.unreadByAdmin) {
                const threadRef = doc(db, "chats", thread.id);
                await updateDoc(threadRef, { unreadByAdmin: false });
                setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, unreadByAdmin: false } : t));
            }

            const messagesRef = collection(db, "chats", thread.id, "messages");
            const q = query(messagesRef, orderBy("createdAt", "asc"));
            const snapshot = await getDocs(q);

            const fetchedMessages: Message[] = [];
            snapshot.forEach((docSnap) => {
                fetchedMessages.push({ id: docSnap.id, ...docSnap.data() } as Message);
            });
            setMessages(fetchedMessages);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoadingMessages(false);
        }
    };

    // 3. Send text reply
    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedThread) return;

        const messageContent = replyText;
        setReplyText("");

        try {
            const messagesRef = collection(db, "chats", selectedThread.id, "messages");

            await addDoc(messagesRef, {
                sender: "admin",
                text: messageContent,
                createdAt: serverTimestamp()
            });

            const threadRef = doc(db, "chats", selectedThread.id);
            await updateDoc(threadRef, {
                lastMessage: `Admin: ${messageContent}`,
                updatedAt: serverTimestamp()
            });

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: "admin",
                text: messageContent,
                createdAt: new Date()
            }]);

        } catch (error) {
            console.error("Error sending reply:", error);
        }
    };

    // Safe handlers for media options (No errors)
    const handleFileUpload = (type: string) => {
        alert(`${type} upload integration can be connected with Firebase Storage or Cloudinary here.`);
    };

    const handleVoiceRecord = () => {
        alert("Voice recording feature is ready to be linked with MediaRecorder API.");
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        // Initial check
        handleResize();

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div style={{
            display: "flex",
            height: "100vh",
            maxHeight: "100vh",
            backgroundColor: "#efeae2", // WhatsApp style chat background tint
            fontFamily: "Segoe UI, Helvetica, Arial, sans-serif",
            overflow: "hidden",
            position: "relative"
        }}>

            {/* Left Sidebar: Client List */}
            <div style={{
                width: "100%",
                maxWidth: "380px",
                borderRight: "1px solid #d1d7db",
                backgroundColor: "#fff",
                display: showMobileChat ? "none" : "flex",
                flexDirection: "column",
                flexShrink: 0,
                height: "100%"
            }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f2f5", backgroundColor: "#f0f2f5" }}>
                    <h2 style={{ margin: 0, fontSize: "18px", color: "#111b21" }}>Customer Chats</h2>
                </div>

                <div style={{ overflowY: "auto", flex: 1 }}>
                    {loadingThreads ? (
                        <p style={{ padding: "20px", textAlign: "center", color: "#667781" }}>Loading chats...</p>
                    ) : threads.length === 0 ? (
                        <p style={{ padding: "20px", textAlign: "center", color: "#667781" }}>No messages found.</p>
                    ) : (
                        threads.map((thread) => (
                            <div
                                key={thread.id}
                                onClick={() => handleSelectThread(thread)}
                                style={{
                                    padding: "15px 20px",
                                    borderBottom: "1px solid #f0f2f5",
                                    cursor: "pointer",
                                    backgroundColor: selectedThread?.id === thread.id ? "#f0f2f5" : "#fff",
                                    transition: "background-color 0.2s",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px"
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <strong style={{ fontSize: "15px", color: "#111b21" }}>{thread.userName || thread.userEmail}</strong>
                                    {thread.unreadByAdmin && (
                                        <span style={{ backgroundColor: "#25d366", color: "#fff", fontSize: "11px", padding: "2px 6px", borderRadius: "50%", fontWeight: "bold" }}>
                                            •
                                        </span>
                                    )}
                                </div>
                                <p style={{ margin: 0, fontSize: "13px", color: "#667781", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {thread.lastMessage}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Side: Chat Conversation Box */}
            <div style={{
                flex: 1,
                display: (!showMobileChat && isMobile) ? "none" : "flex",
                flexDirection: "column",
                backgroundColor: "#efeae2",
                height: "100%",
                width: "100%",
                overflow: "hidden"
            }}>
                {selectedThread ? (
                    <>
                        {/* 1. Fixed Header */}
                        <div style={{ padding: "10px 16px", borderBottom: "1px solid #d1d7db", backgroundColor: "#f0f2f5", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, zIndex: 10 }}>
                            <button
                                onClick={() => setShowMobileChat(false)}
                                style={{
                                    display: "none",
                                    background: "none",
                                    border: "none",
                                    fontSize: "20px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    color: "#54656f"
                                }}
                                className="mobile-back-btn"
                            >
                                ←
                            </button>
                            <div style={{ overflow: "hidden" }}>
                                <h3 style={{ margin: 0, fontSize: "16px", color: "#111b21", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedThread.userName || selectedThread.userEmail}</h3>
                                <span style={{ fontSize: "12px", color: "#667781" }}>{selectedThread.userEmail}</span>
                            </div>
                        </div>

                        {/* 2. Scrollable Messages Body Area */}
                        <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                            {loadingMessages ? (
                                <p style={{ textAlign: "center", color: "#667781" }}>Loading messages...</p>
                            ) : messages.length === 0 ? (
                                <p style={{ textAlign: "center", color: "#667781" }}>No conversation history yet.</p>
                            ) : (
                                messages.map((msg) => {
                                    const isAdmin = msg.sender === "admin";
                                    return (
                                        <div
                                            key={msg.id}
                                            style={{
                                                alignSelf: isAdmin ? "flex-end" : "flex-start",
                                                backgroundColor: isAdmin ? "#d9fdd3" : "#fff", // WhatsApp green tint for admin, white for user
                                                color: "#111b21",
                                                padding: "8px 12px",
                                                borderRadius: "8px",
                                                maxWidth: "65%",
                                                wordBreak: "break-word",
                                                boxShadow: "0 1px 0.5px rgba(11, 20, 26, 0.13)",
                                                position: "relative"
                                            }}
                                        >
                                            <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.4" }}>{msg.text}</p>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* 3. WhatsApp Style Fixed Input Footer */}
                        <form onSubmit={handleSendReply} style={{ padding: "10px 16px", backgroundColor: "#f0f2f5", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, borderTop: "1px solid #d1d7db" }}>

                            {/* Attachment Buttons (Image, Video) */}
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => handleFileUpload("Image")}
                                    title="Send Image"
                                    style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#54656f" }}
                                >
                                    🖼️
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleFileUpload("Video")}
                                    title="Send Video"
                                    style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#54656f" }}
                                >
                                    📹
                                </button>
                            </div>

                            {/* Message Text Input */}
                            <input
                                type="text"
                                placeholder="Type a message"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: "10px 14px",
                                    border: "none",
                                    borderRadius: "8px",
                                    outline: "none",
                                    fontSize: "15px",
                                    backgroundColor: "#fff",
                                    color: "#111b21"
                                }}
                            />

                            {/* Voice Message / Record Button */}
                            <button
                                type="button"
                                onClick={handleVoiceRecord}
                                title="Send Voice Note"
                                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#54656f" }}
                            >
                                🎤
                            </button>

                            {/* Send Button */}
                            <button
                                type="submit"
                                style={{
                                    backgroundColor: "#00a884", // WhatsApp green send button
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "40px",
                                    height: "40px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    fontSize: "16px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                                }}
                                title="Send"
                            >
                                ➤
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#667781", padding: "20px", textAlign: "center" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "normal" }}>Select a chat from the left panel to start messaging</h3>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media (max-width: 768px) {
                    .mobile-back-btn {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
}