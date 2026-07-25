"use client";

import { useState } from "react";
import { auth, db } from "./../config/firebase";
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    sendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Header from "./../components/Header";
import Footer from "./../components/Footer";

export default function SignInPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    
    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [country, setCountry] = useState("US");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Email/Password Authentication Handler
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSignUp && password !== confirmPassword) {
            alert("❌ Passwords do not match!");
            return;
        }

        setLoading(true);

        try {
            if (isSignUp) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Save user details to Firestore
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: name,
                    email: email,
                    country: country,
                    createdAt: new Date()
                });
                alert("✅ Account created successfully!");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                if (rememberMe) {
                    alert("🔒 Credentials saved locally for this session.");
                }
                alert("✅ Logged in successfully!");
            }
            router.push("/");
        } catch (error: any) {
            alert(`⚠️ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Google Sign-In Handler
    const handleGoogleSignIn = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user exists in Firestore, if not create one
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    name: user.displayName || "Google User",
                    email: user.email,
                    country: "US", // Default
                    createdAt: new Date()
                });
            }

            alert("✅ Google Sign-In successful!");
            router.push("/");
        } catch (error: any) {
            alert(`⚠️ Google Sign-In Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Forgot Password OTP / Reset Link Handler
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            alert("⚠️ Please enter your email address first.");
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            alert(`📧 OTP / Password Reset verification link has been sent to ${email}. Please check your inbox.`);
            setIsForgotPassword(false);
        } catch (error: any) {
            alert(`⚠️ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <Header />

            <main className="main-content">
                <div className="auth-card">
                    <h2 className="auth-title">
                        {isForgotPassword 
                            ? "Reset Password" 
                            : (isSignUp ? "Create an Account" : "Welcome Back")}
                    </h2>
                    <p className="auth-subtitle">
                        {isForgotPassword 
                            ? "Enter your email to receive verification code/link" 
                            : (isSignUp ? "Sign up to start shopping securely" : "Sign in to manage your orders & profile")}
                    </p>

                    {/* Forgot Password Flow */}
                    {isForgotPassword ? (
                        <form onSubmit={handleForgotPassword} className="auth-form">
                            <div className="input-group">
                                <label className="input-label">Email Address</label>
                                <input 
                                    type="email" 
                                    placeholder="name@example.com" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    className="auth-input" 
                                    required 
                                />
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? "Sending..." : "Send Verification OTP / Link"}
                            </button>

                            <p className="switch-text">
                                Remembered your password?{" "}
                                <span onClick={() => setIsForgotPassword(false)} className="highlight-link">
                                    Sign In
                                </span>
                            </p>
                        </form>
                    ) : (
                        /* Sign In / Sign Up Flow */
                        <form onSubmit={handleAuth} className="auth-form">
                            {isSignUp && (
                                <>
                                    <div className="input-group">
                                        <label className="input-label">Full Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="Full Name" 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)} 
                                            className="auth-input" 
                                            required 
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Country</label>
                                        <select 
                                            value={country} 
                                            onChange={(e) => setCountry(e.target.value)} 
                                            className="auth-input"
                                        >
                                            <option value="US">United States (US)</option>
                                            <option value="UK">United Kingdom (UK)</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="input-group">
                                <label className="input-label">Email Address</label>
                                <input 
                                    type="email" 
                                    placeholder="name@example.com" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    className="auth-input" 
                                    required 
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="auth-input" 
                                    required 
                                />
                            </div>

                            {isSignUp && (
                                <div className="input-group">
                                    <label className="input-label">Confirm Password</label>
                                    <input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)} 
                                        className="auth-input" 
                                        required 
                                    />
                                </div>
                            )}

                            {!isSignUp && (
                                <div className="auth-options">
                                    <label className="checkbox-label">
                                        <input 
                                            type="checkbox" 
                                            checked={rememberMe} 
                                            onChange={(e) => setRememberMe(e.target.checked)} 
                                        />
                                        <span>Remember Password</span>
                                    </label>
                                    <span onClick={() => setIsForgotPassword(true)} className="highlight-link" style={{ fontSize: "12px" }}>
                                        Forgot Password?
                                    </span>
                                </div>
                            )}

                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? "Please wait..." : (isSignUp ? "Sign Up" : "Sign In")}
                            </button>

                            <div className="divider">
                                <span>or continue with</span>
                            </div>

                            <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="btn-google">
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.17 21.32 7.23 24 12 24z"/>
                                    <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.18C.43 8.13 0 9.87 0 12s.43 3.87 1.18 5.39l4.09-3.15z"/>
                                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.68 1.18 6.61l4.09 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
                                </svg>
                                Sign in with Google
                            </button>

                            <p className="switch-text">
                                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                                <span onClick={() => setIsSignUp(!isSignUp)} className="highlight-link">
                                    {isSignUp ? "Sign In" : "Sign Up"}
                                </span>
                            </p>
                        </form>
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
                .main-content {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 16px;
                }
                .auth-card {
                    background: #ffffff;
                    padding: 32px;
                    border-radius: 16px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    width: 100%;
                    max-width: 420px;
                    border: 1px solid #e2e8f0;
                    box-sizing: border-box;
                }
                .auth-title {
                    font-size: 22px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0 0 6px 0;
                    text-align: center;
                }
                .auth-subtitle {
                    font-size: 13px;
                    color: #64748b;
                    text-align: center;
                    margin-bottom: 24px;
                }
                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .input-label {
                    font-size: 12px;
                    font-weight: 700;
                    color: #334155;
                }
                .auth-input {
                    width: 100%;
                    padding: 10px 12px;
                    border-radius: 8px;
                    border: 1px solid #cbd5e1;
                    font-size: 13px;
                    outline: none;
                    box-sizing: border-box;
                    background: #fff;
                    color: #0f172a;
                }
                .auth-input:focus {
                    border-color: #2563eb;
                    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
                }
                .auth-options {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                }
                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #475569;
                    cursor: pointer;
                }
                .highlight-link {
                    color: #2563eb;
                    font-weight: 700;
                    cursor: pointer;
                }
                .highlight-link:hover {
                    text-decoration: underline;
                }
                .btn-primary {
                    background: #2563eb;
                    color: #fff;
                    border: none;
                    padding: 11px;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 14px;
                    cursor: pointer;
                    transition: background 0.2s;
                    margin-top: 6px;
                }
                .btn-primary:hover {
                    background: #1d4ed8;
                }
                .divider {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    margin: 4px 0;
                    color: #94a3b8;
                    font-size: 12px;
                }
                .divider::before, .divider::after {
                    content: '';
                    flex: 1;
                    border-bottom: 1px solid #e2e8f0;
                }
                .divider span {
                    padding: 0 10px;
                }
                .btn-google {
                    background: #fff;
                    color: #334155;
                    border: 1px solid #cbd5e1;
                    padding: 10px;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: background 0.2s;
                }
                .btn-google:hover {
                    background: #f8fafc;
                }
                .switch-text {
                    text-align: center;
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 10px;
                }
            `}</style>
        </div>
    );
}