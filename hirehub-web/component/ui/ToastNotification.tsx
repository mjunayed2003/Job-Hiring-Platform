import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Toast {
  id: string;
  title?: string;
  message: string;
  type: "success" | "error" | "info" | "notification";
  duration?: number;
}

const useToastStore = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    if (toast.duration !== 0) {
      const timeout = setTimeout(() => {
        removeToast(id);
      }, toast.duration || 4000);

      return () => clearTimeout(timeout);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
};

// Global store
let globalToastStore: ReturnType<typeof useToastStore> | null = null;

export const showNotificationToast = (
  title: string,
  message: string,
  duration?: number
) => {
  if (globalToastStore) {
    globalToastStore.addToast({
      title,
      message,
      type: "notification",
      duration,
    });
  }
};

interface ToastContainerProps {
  className?: string;
}

export function ToastContainer({ className = "" }: ToastContainerProps) {
  const store = useToastStore();

  // Initialize global store
  useEffect(() => {
    globalToastStore = store;

    return () => {
      globalToastStore = null;
    };
  }, [store]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none ${className}`}>
      {store.toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => store.removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const bgColor =
    toast.type === "notification"
      ? "bg-blue-50 border-blue-200"
      : toast.type === "success"
        ? "bg-green-50 border-green-200"
        : toast.type === "error"
          ? "bg-red-50 border-red-200"
          : "bg-gray-50 border-gray-200";

  const textColor =
    toast.type === "notification"
      ? "text-blue-800"
      : toast.type === "success"
        ? "text-green-800"
        : toast.type === "error"
          ? "text-red-800"
          : "text-gray-800";

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm p-4 rounded-lg border shadow-lg ${bgColor} ${textColor} animate-slideIn`}
    >
      <div className="flex gap-3">
        <div className="flex-1">
          {toast.title && (
            <p className="font-semibold text-sm mb-1">{toast.title}</p>
          )}
          <p className="text-sm">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100 shrink-0 p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
