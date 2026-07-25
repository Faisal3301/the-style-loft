"use client";

import { useState } from "react";

interface ChatModalProps {
    productName: string;
    onClose: () => void;
}

export default function ChatModal({ productName, onClose }: ChatModalProps) {
    const [chatMessage, setChatMessage] = useState("");

    return (
        <div className="chat-popup-modal">
            <div className="chat-header">
                <span style={{ fontSize: "13px", fontWeight: "700" }}>💬 Live Support</span>
                <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "14px", cursor: "pointer" }}>✕</button>
            </div>
            <div className="chat-body">
                <div className="chat-bubble-system">
                    Hello! How can we help you order <strong>{productName}</strong>?
                </div>
                {chatMessage && (
                    <div className="chat-bubble-user">
                        {chatMessage}
                    </div>
                )}
            </div>
            <div className="chat-footer">
                <input type="text" placeholder="Type query..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} className="chat-input" />
                <button onClick={() => { alert("Message sent!"); setChatMessage(""); onClose(); }} className="chat-send-btn">Send</button>
            </div>

            <style jsx>{`
                .chat-popup-modal {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 300px;
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                    border: 1px solid #e2e8f0;
                    z-index: 1000;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .chat-header {
                    background: #2563eb;
                    color: #fff;
                    padding: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .chat-body {
                    padding: 12px;
                    height: 160px;
                    background: #f8fafc;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .chat-bubble-system {
                    background: #e2e8f0;
                    padding: 8px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    color: #334155;
                    max-width: 85%;
                }
                .chat-bubble-user {
                    background: #2563eb;
                    color: #fff;
                    padding: 8px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    max-width: 85%;
                    align-self: flex-end;
                }
                .chat-footer {
                    padding: 8px;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    gap: 6px;
                    background: #fff;
                }
                .chat-input {
                    flex: 1;
                    padding: 6px 8px;
                    border-radius: 4px;
                    border: 1px solid #cbd5e1;
                    font-size: 11px;
                    outline: none;
                }
                .chat-send-btn {
                    background: #2563eb;
                    color: #fff;
                    border: none;
                    padding: 6px 10px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}