import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#192837]/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        className="bg-white rounded-3xl border border-[#192837]/10 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isDestructive ? "bg-red-50 text-red-600" : "bg-[#7342E2]/10 text-[#7342E2]"
            }`}>
              <AlertTriangle size={24} />
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-[#192837]/5 hover:bg-[#192837]/10 text-[#192837]/70 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-bold text-[#192837]" id="confirm-modal-title" style={{ fontFamily: "var(--font-heading)" }}>
              {title}
            </h3>
            <p className="text-xs text-[#192837]/70 mt-1.5 leading-relaxed" id="confirm-modal-desc">
              {message}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#F5F5F3]/80 border-t border-[#192837]/8 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#192837]/10 text-[#192837] hover:bg-[#192837]/5 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-all cursor-pointer ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                : "bg-[#7342E2] hover:brightness-105 shadow-[#7342E2]/25"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
