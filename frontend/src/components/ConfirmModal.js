import React from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

/**
 * Destructive-action confirmation. Built on the shared Modal so focus, scroll
 * locking and the Escape key behave exactly like every other dialog.
 */
export default function ConfirmModal({
  isOpen,
  title = "Confirm action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      icon={AlertTriangle}
      iconTone={isDestructive ? "danger" : "accent"}
      size="sm"
      footer={
        <>
          <span className="text-2xs font-medium text-ink-subtle">
            {isDestructive ? "This action is recorded in the audit trail." : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button
              variant={isDestructive ? "danger" : "primary"}
              size="sm"
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-muted">{message}</p>
    </Modal>
  );
}
