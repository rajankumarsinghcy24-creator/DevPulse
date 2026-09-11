import React from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

const ConfirmModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Delete",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-[#E7E7E0] rounded-2xl shadow-modal p-5 sm:p-6 overflow-hidden my-auto">
        {/* Close icon */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-[#98A2B3] hover:text-[#1F2933] p-1.5 rounded-lg hover:bg-[#F7F7F2] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Content */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className={`p-3 rounded-xl flex-shrink-0 ${
              confirmVariant === "danger"
                ? "bg-[#FDF2F2] text-[#C94C4C] border border-[#FDE2E2]"
                : "bg-[#FEF9F0] text-[#D97706] border border-[#FDF0D5]"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1F2933]">{title}</h3>
            <p className="text-sm text-[#667085] mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7E7E0]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-[#667085] hover:text-[#1F2933] bg-[#F7F7F2] hover:bg-[#EFEFE9] rounded-xl border border-[#E7E7E0] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-subtle transition disabled:opacity-50 ${
              confirmVariant === "danger"
                ? "bg-[#C94C4C] hover:bg-[#B33E3E]"
                : "bg-[#0F8B6D] hover:bg-[#0B7057]"
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
