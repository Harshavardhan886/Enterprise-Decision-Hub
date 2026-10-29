import Logo from "../components/Logo";
import ThemeSwitcher from "../components/ThemeSwitcher";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Zap,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// Decision Hub Neural Web Logo

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      login(res.data);
      const redirectUrl = sessionStorage.getItem("redirectAfterLogin");
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(redirectUrl || "/dashboard");
    } catch (err) {
      let errMsg = "Invalid credentials. Please verify and try again.";
      if (!err.response) {
        errMsg = "Cannot reach backend. Make sure Spring Boot is running on port 8080.";
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      } else if (typeof err.response?.data === "string") {
        errMsg = err.response.data;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError("");
  };

  return (
    <div
      className="relative w-full min-h-screen overflow-x-hidden flex flex-col justify-between"
      style={{
        fontFamily: "var(--font-body)",
        color: "var(--color-text)",
      }}
    >
      {/* Background Fullscreen Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4"
      />

      {/* Subtle Ambient Overlay for optimal contrast */}
      <div className="absolute inset-0 bg-[#F2F2EE]/40 backdrop-blur-[2px] pointer-events-none z-0" />

      {/* Top Header Navigation */}
      <header className="relative z-20 w-full">
        <nav className="max-w-[1280px] mx-auto px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80 focus:outline-none"
          >
            <Logo />
            <div className="flex flex-col">
              <span
                className="text-lg font-bold tracking-tight text-[#192837] leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Enterprise Decision Hub
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-[#192837]/70 uppercase">
                AI Risk & Governance
              </span>
            </div>
          </div>

          {/* Right Action: Theme Switcher & Back to Home */}
          <div className="flex items-center gap-2.5">
            <ThemeSwitcher />
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-medium text-[#192837] px-4 py-2 rounded-full border border-[#192837]/10 bg-white/70 backdrop-blur-md hover:bg-white transition-all shadow-sm"
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Login Card Section */}
      <main className="relative z-10 w-full flex-grow flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px] bg-white/90 backdrop-blur-xl border border-white/80 rounded-[28px] shadow-2xl shadow-[#7342E2]/10 p-7 sm:p-9"
        >
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#7342E2]/10 text-[#7342E2] mb-3">
              <Sparkles size={22} />
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#192837] tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Welcome back
            </h1>
            <p className="text-sm text-[#192837]/70 mt-1">
              Sign in to access AI risk intelligence & governance
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-600 text-xs font-medium flex items-start gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#192837] uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#192837]/40">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-3 bg-[#F5F5F3]/80 hover:bg-[#F5F5F3] focus:bg-white rounded-xl border border-[#192837]/10 focus:border-[#7342E2] focus:ring-4 focus:ring-[#7342E2]/15 text-[#192837] text-sm outline-none transition-all placeholder:text-[#192837]/40"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#192837] uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#192837]/40">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-[#F5F5F3]/80 hover:bg-[#F5F5F3] focus:bg-white rounded-xl border border-[#192837]/10 focus:border-[#7342E2] focus:ring-4 focus:ring-[#7342E2]/15 text-[#192837] text-sm outline-none transition-all placeholder:text-[#192837]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#192837]/40 hover:text-[#192837] transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02, filter: "brightness(1.05)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full font-semibold text-white shadow-lg shadow-[#7342E2]/25 cursor-pointer select-none transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: "#7342E2" }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>


          </form>

          {/* Quick Demo Credentials Badge */}
          <div className="mt-5 p-3 rounded-2xl bg-[#7342E2]/5 border border-[#7342E2]/15 flex flex-col gap-2 text-xs text-[#192837]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-[#7342E2]" />
                <span className="font-semibold">Demo Accounts</span>
              </div>
              <span className="text-[10px] text-[#192837]/50">Click to fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("Harsha", "123456")}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#7342E2]/20 hover:border-[#7342E2] hover:bg-[#7342E2]/5 transition-all text-left cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-[#192837]">Harsha</div>
                  <div className="font-mono text-[10px] text-[#192837]/60">123456</div>
                </div>
                <span className="text-[10px] font-semibold text-[#7342E2]">Use</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("admin", "admin123")}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#7342E2]/20 hover:border-[#7342E2] hover:bg-[#7342E2]/5 transition-all text-left cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-[#192837]">admin</div>
                  <div className="font-mono text-[10px] text-[#192837]/60">admin123</div>
                </div>
                <span className="text-[10px] font-semibold text-[#7342E2]">Use</span>
              </button>
            </div>
          </div>

          {/* Switch to Register */}
          <div className="mt-6 pt-5 border-t border-[#192837]/10 text-center text-sm text-[#192837]/70">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#7342E2] hover:underline"
            >
              Start for free
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-[#192837]/50">
        © 2026 Enterprise Decision Hub. All rights reserved.
      </footer>
    </div>
  );
}
