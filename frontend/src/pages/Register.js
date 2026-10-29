import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Key,
} from "lucide-react";
import Logo from "../components/Logo";
import ThemeSwitcher from "../components/ThemeSwitcher";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [inviteKey, setInviteKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters long");
      return;
    }
    if (role === "ADMIN" && !inviteKey.trim()) {
      setError("Admin Invite Key is required to create an Admin account");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = { username, password, role };
      if (role === "ADMIN") {
        payload.inviteKey = inviteKey.trim();
      }
      const res = await api.post("/auth/register", payload);
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setError(
        typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : typeof err.response?.data === "string"
          ? err.response.data
          : "Registration failed. Username may already exist or invite key is invalid."
      );
    } finally {
      setLoading(false);
    }
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

      {/* Subtle Ambient Overlay */}
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

      {/* Main Register Card Section */}
      <main className="relative z-10 w-full flex-grow flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[460px] bg-white/90 backdrop-blur-xl border border-white/80 rounded-[28px] shadow-2xl shadow-[#7342E2]/10 p-7 sm:p-9"
        >
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#7342E2]/10 text-[#7342E2] mb-3">
              <ShieldCheck size={24} />
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#192837] tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Create an Account
            </h1>
            <p className="text-sm text-[#192837]/70 mt-1">
              Join Enterprise Decision Hub risk governance
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
            {/* Username Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-[#192837] mb-1.5 uppercase tracking-wider"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#192837]/40">
                  <User size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex.chen"
                  className="w-full pl-10 pr-4 py-3 bg-[#F5F5F3]/80 border border-[#192837]/10 rounded-xl text-[#192837] placeholder-[#192837]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#7342E2]/30 focus:border-[#7342E2] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#192837] mb-1.5 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#192837]/40">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-11 py-3 bg-[#F5F5F3]/80 border border-[#192837]/10 rounded-xl text-[#192837] placeholder-[#192837]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#7342E2]/30 focus:border-[#7342E2] focus:bg-white transition-all"
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

            {/* Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#192837] mb-1.5 uppercase tracking-wider">
                Account Access Level
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    value: "VIEWER",
                    title: "Viewer / Analyst",
                    desc: "Monitor Risk & Audit Invoices",
                  },
                  {
                    value: "ADMIN",
                    title: "Admin (Invite Only)",
                    desc: "Full System Governance",
                  },
                ].map((r) => {
                  const isSelected = role === r.value;
                  return (
                    <div
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`cursor-pointer p-3 rounded-xl border text-left transition-all select-none ${
                        isSelected
                          ? "border-[#7342E2] bg-[#7342E2]/10 ring-2 ring-[#7342E2]/20"
                          : "border-[#192837]/10 bg-[#F5F5F3]/60 hover:bg-[#F5F5F3]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-xs text-[#192837]">
                          {r.title}
                        </span>
                        {isSelected && (
                          <CheckCircle2 size={15} className="text-[#7342E2]" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#192837]/60 leading-tight">
                        {r.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin Invite Key (Only when Admin is selected) */}
            {role === "ADMIN" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label
                  htmlFor="inviteKey"
                  className="block text-xs font-semibold text-[#192837] mb-1.5 uppercase tracking-wider"
                >
                  Admin Invite Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#192837]/40">
                    <Key size={16} />
                  </div>
                  <input
                    id="inviteKey"
                    type="password"
                    required
                    value={inviteKey}
                    onChange={(e) => setInviteKey(e.target.value)}
                    placeholder="Enter security admin invite key"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F5F5F3]/80 border border-[#7342E2]/30 rounded-xl text-[#192837] placeholder-[#192837]/40 text-sm focus:outline-none focus:ring-2 focus:ring-[#7342E2]/30 focus:border-[#7342E2] focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[10px] text-[#192837]/50 mt-1">
                  Default seed key: <code className="bg-gray-100 px-1 rounded">EDH-ADMIN-2026-KEY</code>
                </p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02, filter: "brightness(1.05)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-between py-3.5 px-6 rounded-full font-semibold text-white shadow-lg shadow-[#7342E2]/25 cursor-pointer select-none transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-3"
              style={{ backgroundColor: "#7342E2" }}
            >
              {loading ? (
                <div className="flex items-center justify-center w-full gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <span>Create Account</span>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowRight size={15} />
                  </div>
                </>
              )}
            </motion.button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 pt-5 border-t border-[#192837]/10 text-center text-sm text-[#192837]/70">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#7342E2] hover:underline"
            >
              Sign In
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs opacity-50 text-[#192837]">
        © {new Date().getFullYear()} Enterprise Decision Hub. All rights reserved.
      </footer>
    </div>
  );
}
