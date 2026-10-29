import Logo from "../components/Logo";
import ThemeSwitcher from "../components/ThemeSwitcher";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ArrowRightCircle,
  Menu,
  X,
  Cpu,
  Shield,
  Layers,
  FileCheck,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

// Decision Hub Neural Web Logo

const navItems = [
  {
    id: "overview",
    label: "Overview",
    icon: Layers,
    badge: "Platform",
    title: "Unified Financial Intelligence & Operations",
    description:
      "Enterprise Decision Hub combines automated invoice parsing, real-time ML risk scoring, budget enforcement, and immutable audit logs into a single glassmorphic command center.",
    highlights: [
      "Real-time synchronized KPIs for Invoices, Vendors, and Alerts",
      "Interactive Budget Utilisation tracking with 80% & 100% threshold monitors",
      "Unified Vendor Risk directory with historical performance trends",
      "Instant resolution workflows for security and risk notifications",
    ],
    stats: [
      { label: "Processing Speed", value: "< 250ms" },
      { label: "Risk Precision", value: "98.4%" },
      { label: "Data Integrity", value: "100%" },
    ],
  },
  {
    id: "risk-ai",
    label: "Risk AI",
    icon: Cpu,
    badge: "Machine Learning",
    title: "Dual ML Engine: Random Forest + Isolation Forest",
    description:
      "Every incoming transaction is evaluated across high-dimensional feature vectors including amount anomalies, vendor variance, historical duplicate patterns, and category risk thresholds.",
    highlights: [
      "FastAPI microservice running scikit-learn ensemble models",
      "Automatic High / Medium / Low classification based on ML confidence",
      "Instant duplicate detection fingerprinting across vendor & invoice numbers",
      "Real-time anomaly score streaming straight into backend Spring Boot APIs",
    ],
    stats: [
      { label: "ML Accuracy", value: "96.8%" },
      { label: "Anomaly Detection", value: "Real-time" },
      { label: "False Positives", value: "< 1.2%" },
    ],
  },
  {
    id: "automations",
    label: "Automations",
    icon: Sparkles,
    badge: "Workflow Engine",
    title: "Zero-Touch Invoicing & Smart Approvals",
    description:
      "Eliminate manual data entry and human error. Automatically trigger budget hold alerts, vendor risk recalculations, and automated approval pipelines.",
    highlights: [
      "Instant automated notification creation upon high-risk detection",
      "Automated overspend prevention triggered before invoice clearance",
      "One-click resolution system with optimistic UI updates across all tabs",
      "Automatic vendor score adjustments when invoice status updates",
    ],
    stats: [
      { label: "Time Saved", value: "85%" },
      { label: "Manual Effort", value: "-90%" },
      { label: "Auto-Triage", value: "Instant" },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    badge: "Enterprise Grade",
    title: "Hardened Zero-Trust Architecture",
    description:
      "Built with strict security foundations to protect mission-critical corporate financial data and comply with enterprise data sovereignty standards.",
    highlights: [
      "Stateless JWT Token authentication with BCrypt password hashing",
      "Role-Based Access Control (RBAC) separating ADMIN and USER capabilities",
      "RFC-standardized Global Exception Handling preventing stack trace leaks",
      "Comprehensive server-side validation rejecting invalid or malicious payloads",
    ],
    stats: [
      { label: "Auth Standard", value: "JWT + BCrypt" },
      { label: "Encryption", value: "AES-256" },
      { label: "Uptime SLA", value: "99.99%" },
    ],
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: FileCheck,
    badge: "Governance",
    title: "Audit-Ready Financial Governance",
    description:
      "Full transparency for finance directors, compliance officers, and external auditors with immutable event logs and budget tracking.",
    highlights: [
      "Granular audit trails for every invoice creation, status change, and alert resolution",
      "Strict department-level budget allocation enforcement",
      "Exportable reporting data formatted for financial audits",
      "Pre-configured governance standards aligned with GAAP / SOX compliance",
    ],
    stats: [
      { label: "Audit Trails", value: "100% Logged" },
      { label: "Governance Score", value: "A+" },
      { label: "SOX Readiness", value: "Built-in" },
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function Landing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState(null);
  const navigate = useNavigate();

  // Prevent background scroll when modal or mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen || activeModalTab) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen, activeModalTab]);

  const activeFeature = navItems.find((item) => item.id === activeModalTab);

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

      {/* Top Navigation */}
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

          {/* Center Navigation Links (Clean plain-text links with interactive feature showcase on click) */}
          <div className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <span
                key={item.label}
                onClick={() => setActiveModalTab(item.id)}
                className="text-sm font-medium text-[#192837] hover:opacity-60 transition-opacity duration-200 cursor-pointer select-none"
              >
                {item.label}
              </span>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeSwitcher />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/login")}
              className="text-sm font-semibold px-5 py-2.5 rounded-full cursor-pointer transition-all shadow-sm bg-[#7342E2] text-white hover:brightness-105"
            >
              Sign In
            </motion.button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open mobile menu"
            className="md:hidden p-2 rounded-lg text-[#192837] hover:bg-black/5 active:bg-black/10 transition-colors focus:outline-none"
          >
            <Menu size={26} color="#192837" />
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 w-full flex-grow flex items-center">
        <div
          className="max-w-[1280px] w-full mx-auto px-5 sm:px-8"
          style={{
            paddingTop: "clamp(40px, 8vw, 72px)",
            paddingBottom: "clamp(48px, 8vw, 96px)",
          }}
        >
          <div className="max-w-[580px] flex flex-col items-start text-left">
            {/* Hero Heading */}
            <motion.h1
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-heading text-[#192837]"
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.65rem, 5vw, 3rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
                marginBottom: "24px",
              }}
            >
              <Sparkles
                size={26}
                color="#192837"
                className="inline-block mr-1.5"
                style={{ verticalAlign: "middle", position: "relative", top: "-2px" }}
              />
              <span>Automate Financial Decisions </span>
              <ShieldCheck
                size={26}
                color="#192837"
                className="inline-block mx-1.5"
                style={{ verticalAlign: "middle", position: "relative", top: "-2px" }}
              />
              <span>with AI Risk Intelligence </span>
              <TrendingUp
                size={26}
                color="#192837"
                className="inline-block ml-1.5"
                style={{ verticalAlign: "middle", position: "relative", top: "-2px" }}
              />
            </motion.h1>

            {/* Hero Subtext */}
            <motion.p
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-body text-[#192837] mb-8"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
                lineHeight: 1.65,
                opacity: 0.85,
                maxWidth: "560px",
              }}
            >
              Zero financial blind spots, total operational control. Enterprise Decision Hub
              unifies ML-powered risk scoring, automated invoice duplicate detection, and proactive
              budget governance for modern finance teams.
            </motion.p>

            {/* CTA Button - Direct to Signup */}
            <motion.button
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.04, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/register")}
              className="flex items-center justify-between font-semibold text-white cursor-pointer select-none transition-all"
              style={{
                backgroundColor: "#7342E2",
                borderRadius: "50px",
                padding: "17px 24px",
                fontFamily: "var(--font-body)",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                boxShadow: "0 4px 24px rgba(115, 66, 226, 0.28)",
                minWidth: "220px",
                gap: "28px",
              }}
            >
              <span>Get Started</span>
              <ArrowRightCircle size={20} className="flex-shrink-0" />
            </motion.button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs opacity-50 text-[#192837]">
        © {new Date().getFullYear()} Enterprise Decision Hub. All rights reserved.
      </footer>

      {/* Interactive Feature Showcase Modal */}
      <AnimatePresence>
        {activeFeature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalTab(null)}
              className="fixed inset-0 bg-[#192837]/50 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/60 to-indigo-50/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#7342E2]/10 flex items-center justify-center text-[#7342E2]">
                    <activeFeature.icon size={22} />
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-wider text-[#7342E2] uppercase bg-[#7342E2]/10 px-2.5 py-0.5 rounded-full">
                      {activeFeature.badge}
                    </span>
                    <h2 className="text-xl font-bold text-[#192837] mt-1">
                      {activeFeature.label}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModalTab(null)}
                  className="p-2 rounded-full hover:bg-black/5 text-[#192837]/60 hover:text-[#192837] transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Tabs Quick Bar */}
              <div className="flex items-center gap-2 px-6 py-2.5 bg-gray-50/80 border-b border-gray-100 overflow-x-auto">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveModalTab(item.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all cursor-pointer ${
                      item.id === activeModalTab
                        ? "bg-[#7342E2] text-white shadow-sm"
                        : "text-[#192837]/70 hover:bg-gray-200/60"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#192837] mb-2">
                    {activeFeature.title}
                  </h3>
                  <p className="text-sm text-[#192837]/80 leading-relaxed">
                    {activeFeature.description}
                  </p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {activeFeature.stats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-2xl text-center"
                    >
                      <div className="text-lg font-extrabold text-[#7342E2]">
                        {stat.value}
                      </div>
                      <div className="text-[11px] font-medium text-[#192837]/60 mt-0.5">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Highlights */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/60 mb-3">
                    Core Capabilities
                  </h4>
                  <div className="space-y-2.5">
                    {activeFeature.highlights.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-xs"
                      >
                        <CheckCircle2
                          size={18}
                          className="text-emerald-500 flex-shrink-0 mt-0.5"
                        />
                        <span className="text-sm font-medium text-[#192837]">
                          {h}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3">
                <button
                  onClick={() => setActiveModalTab(null)}
                  className="px-4 py-2.5 text-sm font-medium text-[#192837] hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setActiveModalTab(null);
                    navigate("/register");
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#7342E2] hover:bg-[#5f33be] rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Sheet */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40"
              style={{
                backgroundColor: "rgba(25, 40, 55, 0.35)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            />

            {/* Sheet */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="fixed right-0 top-0 z-50 flex flex-col justify-between p-6 overflow-y-auto"
              style={{
                width: "min(88vw, 360px)",
                height: "100dvh",
                backgroundColor: "#CFC8C5",
                boxShadow: "-12px 0 48px rgba(25, 40, 55, 0.18)",
              }}
            >
              {/* Header inside Sheet */}
              <div>
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center gap-3">
                    <Logo />
                    <div>
                      <div
                        className="text-base font-bold tracking-tight text-[#192837]"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        Enterprise Decision Hub
                      </div>
                      <div className="text-[10px] font-semibold text-[#192837]/70 uppercase">
                        AI Risk & Governance
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label="Close menu"
                    className="p-1.5 rounded-lg text-[#192837] hover:bg-black/5 active:bg-black/10 transition-colors focus:outline-none"
                  >
                    <X size={24} color="#192837" />
                  </button>
                </div>

                {/* 1px Divider */}
                <div
                  className="w-full h-px my-2"
                  style={{ backgroundColor: "rgba(25, 40, 55, 0.15)" }}
                />

                {/* Staggered Nav Links */}
                <nav className="flex flex-col gap-1 py-4">
                  {navItems.map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.18 + i * 0.07,
                          duration: 0.4,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <div
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setActiveModalTab(item.id);
                          }}
                          className="flex items-center justify-between py-3 px-3 text-base font-medium text-[#192837] hover:bg-black/5 rounded-lg transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <IconComponent size={18} className="text-[#192837]/70" />
                            <span>{item.label}</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7342E2] bg-[#7342E2]/10 px-2 py-0.5 rounded-md">
                            {item.badge}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom CTA Button - strictly Sign In */}
              <div className="flex flex-col gap-3 pt-6 border-t border-[#192837]/15">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate("/login");
                  }}
                  className="w-full text-sm font-semibold text-white py-3 rounded-full cursor-pointer transition-all shadow-sm text-center bg-[#7342E2] hover:brightness-105"
                >
                  Sign In
                </motion.button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
