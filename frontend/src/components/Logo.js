import React from "react";
import logoImg from "../assets/logo.jpg";

export default function Logo({ size = 36, className = "" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-md border border-[#7342E2]/30 flex-shrink-0 flex items-center justify-center bg-[#7342E2] ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        boxShadow: "0 2px 8px rgba(115, 66, 226, 0.25)",
      }}
      title="Enterprise Decision Hub"
    >
      <img
        src={logoImg}
        alt="Enterprise Decision Hub Logo"
        className="w-full h-full object-cover object-center scale-110"
      />
      <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-inset ring-white/20" />
    </div>
  );
}
