"use client";

import { useEffect, useRef, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { collection, query, orderBy, onSnapshot, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, messaging } from "../../config/firebase";

export default function ClientNotifications() {
    const isInitialLoad = useRef(true);
    const sessionStartTime = useRef(Date.now());

    // In-App Popup Toast ke liye state
    const [toastMessage, setToastMessage] = useState<{ title: string; body: string; url: string } | null>(null);

    useEffect(() => {
        // 1. Request Permission & Token
        async function requestPermissionAndToken(currentUser: any) {
            try {
                if (typeof window !== "undefined" && "Notification" in window && messaging) {
                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                        // Is tarah apni asli key daal dein:
                        const vapidKey = "BMqrmDYZ2zFVsUkNy5h5oyJ04m528Dp9PjjSXTyLunqUYmrqNfLZ1G6qT7sqamiX3qbp1ISqRbuhKdYY3Ox99v0";

                        const token = await getToken(messaging, { vapidKey });
                        if (token && currentUser) {
                            const userTokenRef = doc(db, "fcmTokens", currentUser.uid);
                            await setDoc(userTokenRef, {
                                token,
                                uid: currentUser.uid,
                                email: currentUser.email,
                                updatedAt: new Date()
                            }, { merge: true });
                        }
                    }
                }
            } catch (error) {
                console.error("Error getting notification permission or token:", error);
            }
        }

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) requestPermissionAndToken(user);
        });

        // 2. Foreground FCM Listener
        let unsubscribeFCM: (() => void) | undefined;
        if (messaging) {
            unsubscribeFCM = onMessage(messaging, (payload) => {
                const title = payload.notification?.title || "The Style Loft";
                const body = payload.notification?.body || "";
                const url = payload.data?.url || "/";

                if (document.hidden) {
                    // Agar website band/hidden ho toh System Notification bhejo
                    if (Notification.permission === "granted") {
                        const notification = new Notification(title, { body, icon: "/logo.png" });
                        notification.onclick = () => {
                            window.focus();
                            window.location.href = url;
                        };
                    }
                } else {
                    // Agar website open ho toh In-App Toast show karo
                    setToastMessage({ title, body, url });
                    setTimeout(() => setToastMessage(null), 5000); // 5 seconds baad gayab ho jaye ga
                }
            });
        }

        const timer = setTimeout(() => {
            isInitialLoad.current = false;
        }, 3000);

        return () => {
            unsubscribeAuth();
            if (unsubscribeFCM) unsubscribeFCM();
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) return;

            // Helper function to handle notifications (Open ho toh Toast, Band ho toh System Notification)
            const triggerAlert = (title: string, body: string, url: string) => {
                if (document.hidden && Notification.permission === "granted") {
                    const notification = new Notification(title, { body, icon: "/logo.png" });
                    notification.onclick = () => {
                        window.focus();
                        window.location.href = url;
                    };
                } else {
                    setToastMessage({ title, body, url });
                    setTimeout(() => setToastMessage(null), 5000);
                }
            };

            // 3. Chat Replies Listener
            const messagesRef = collection(db, "chats", user.uid, "messages");
            const qChat = query(messagesRef, orderBy("createdAt", "desc"));
            const unsubscribeChat = onSnapshot(qChat, (snapshot) => {
                if (isInitialLoad.current) return;

                if (!snapshot.empty) {
                    const latestMsg: any = snapshot.docs[0].data();
                    const msgTime = latestMsg.createdAt?.toMillis ? latestMsg.createdAt.toMillis() : Date.now();

                    if (latestMsg.sender === "admin" && msgTime > sessionStartTime.current) {
                        triggerAlert("💬 New Reply from Support", latestMsg.text, "/chat");
                    }
                }
            });

            // 4. New Products Listener
            const productsRef = collection(db, "products");
            const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
                if (isInitialLoad.current) return;

                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const newProduct: any = change.doc.data();
                        const productId = change.doc.id;
                        triggerAlert("🔥 New Product Arrival!", `Check out our new item: ${newProduct.name || "Exclusive Collection"}`, `/products/${productId}`);
                    }
                });
            });

            // 5. New Offers Listener
            const offersRef = collection(db, "offers");
            const unsubscribeOffers = onSnapshot(offersRef, (snapshot) => {
                if (isInitialLoad.current) return;

                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const newOffer: any = change.doc.data();
                        triggerAlert("🎉 Special Offer / Discount!", newOffer.title || "Check out the latest discount on The Style Loft!", "/offers");
                    }
                });
            });

            return () => {
                unsubscribeChat();
                unsubscribeProducts();
                unsubscribeOffers();
            };
        });

        return () => unsubscribeAuth();
    }, []);

    // UI Toast render karega jab website open ho aur koi naya update aaye
    return (
        <>
            {toastMessage && (
                <div
                    onClick={() => {
                        window.location.href = toastMessage.url;
                    }}
                    className="fixed bottom-5 right-5 z-50 max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl p-4 cursor-pointer transition-all duration-300 animate-bounce"
                >
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-black text-white dark:bg-white dark:text-black rounded-lg text-sm font-bold">
                            🔔
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{toastMessage.title}</h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2">{toastMessage.body}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}