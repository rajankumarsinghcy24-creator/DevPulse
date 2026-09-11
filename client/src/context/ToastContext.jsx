import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-dropdown border bg-white transition-all duration-300 transform translate-y-0 ${
              toast.type === "success"
                ? "border-[#E7E7E0] text-[#1F2933]"
                : toast.type === "error"
                ? "border-[#E7E7E0] text-[#1F2933]"
                : toast.type === "warning"
                ? "border-[#E7E7E0] text-[#1F2933]"
                : "border-[#E7E7E0] text-[#1F2933]"
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-[#0F8B6D]" />}
              {toast.type === "error" && <XCircle className="w-5 h-5 text-[#C94C4C]" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-[#D97706]" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-[#2A9D8F]" />}
            </div>
            <div className="flex-1 text-sm font-medium text-[#1F2933]">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#98A2B3] hover:text-[#1F2933] p-0.5 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
