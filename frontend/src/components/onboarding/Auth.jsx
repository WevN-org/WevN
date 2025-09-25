import { useState, useEffect, useMemo } from "react";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom'

export default function Auth({ onLogin }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        setIsLoaded(true);

        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 100,
                y: (e.clientY / window.innerHeight) * 100,
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // ✅ Stable particles (don’t change on rerenders)
    const particles = useMemo(
        () =>
            [...Array(20)].map((_, i) => ({
                id: i,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                duration: 3 + Math.random() * 4,
                delay: Math.random() * 2,
                direction: Math.random() > 0.5 ? "normal" : "reverse",
            })),
        []
    );

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950">
            {/* Animated background gradient */}
            <div
                className="absolute inset-0 opacity-50 transition-all duration-300"
                style={{
                    background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(59, 130, 246, 0.3) 0%, 
            rgba(147, 51, 234, 0.2) 25%, 
            rgba(236, 72, 153, 0.2) 50%, 
            rgba(15, 23, 42, 0.8) 100%)`,
                }}
            />

            {/* Floating particles */}
            <div className="absolute inset-0">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute w-1 h-1 bg-white rounded-full opacity-30"
                        style={{
                            left: p.left,
                            top: p.top,
                            animationName: "float",
                            animationDuration: `${p.duration}s`,
                            animationTimingFunction: "ease-in-out",
                            animationIterationCount: "infinite",
                            animationDelay: `${p.delay}s`,
                            animationDirection: p.direction,
                        }}
                    />
                ))}
            </div>

            {/* Geometric shapes */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-blue-500/20 rounded-full animate-spin-slow" />
            <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border-2 border-purple-500/30 rotate-45 animate-pulse" />
            <div
                className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-r from-pink-500/20 to-violet-500/20 rounded-lg animate-bounce"
                style={{ animationDuration: "3s" }}
            />

            {/* Main content */}
            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <div
                    className={`w-full max-w-md transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                        }`}
                >
                    {/* Glassmorphism card */}
                    <div
                        className={`relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 ${isHovering ? "scale-105 shadow-3xl border-white/20" : ""
                            }`}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >
                        {/* Animated border gradient */}
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-gradient-x" />
                        <div className="relative m-[1px] rounded-3xl bg-slate-900/50 backdrop-blur-xl p-8">
                            {/* Header */}
                            <div className="text-center mb-8">
                                {/* Logo with pulse animation */}
                                <div className="relative mx-auto w-20 h-20 mb-6">
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" />
                                    <div className="relative flex items-center justify-center w-full h-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform transition-transform duration-300 hover:scale-110 hover:rotate-6">
                                        <svg
                                            className="w-10 h-10"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                {/* Animated text */}
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-2">
                                    Welcome to WevN
                                </h1>
                                <p
                                    className="text-slate-400 animate-fade-in-up"
                                    style={{ animationDelay: "0.5s" }}
                                >
                                    Your gateway to seamless collaboration
                                </p>
                            </div>

                            {/* Feature highlights */}
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {[
                                    { icon: "⚡", label: "Fast", delay: "0.2s" },
                                    { icon: "🔒", label: "Secure", delay: "0.4s" },
                                    { icon: "🚀", label: "Modern", delay: "0.6s" },
                                ].map((item, index) => (
                                    <div
                                        key={index}
                                        className="text-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 animate-fade-in-up"
                                        style={{ animationDelay: item.delay }}
                                    >
                                        <div className="text-2xl mb-1">{item.icon}</div>
                                        <div className="text-xs text-slate-400">{item.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Custom Google Login Button */}
                            <div className="space-y-4">
                                <MyGoogleButton onLogin={onLogin} />

                                <p
                                    className="text-xs text-slate-500 text-center animate-fade-in"
                                    style={{ animationDelay: "1s" }}
                                >
                                    By continuing, you agree to our{" "}
                                    <a
                                        href="#"
                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Terms
                                    </a>{" "}
                                    and{" "}
                                    <a
                                        href="#"
                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Privacy Policy
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const MyGoogleButton = ({ onLogin }) => {
    const navigate = useNavigate();
    const login = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            //console.log(jwtDecode(tokenResponse.access_token));
            //console.log(tokenResponse);
            onLogin(tokenResponse.access_token);
            navigate("/");
            toast.success("Login success!")

        },
        onError: () => {
            toast.error("Unable to login. Please try again!");
        },
    });

    return (
        <button
            className="group relative w-full overflow-hidden rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium py-4 px-6 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            onClick={() => login()}
        >
            <div className="relative flex items-center justify-center space-x-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
                <span>Continue with Google</span>
            </div>
        </button>
    );
};