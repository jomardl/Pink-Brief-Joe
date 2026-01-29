import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<Props> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel
}) => {
  const variantStyles = {
    danger: {
      icon: 'bg-[#fff1f1] text-[#da1e28]',
      button: 'bg-[#da1e28] hover:bg-[#ba1b23]'
    },
    warning: {
      icon: 'bg-[#fff8e1] text-[#f57f17]',
      button: 'bg-[#f57f17] hover:bg-[#e65100]'
    },
    info: {
      icon: 'bg-[#edf5ff] text-[#0f62fe]',
      button: 'bg-[#0f62fe] hover:bg-[#0353e9]'
    }
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-white shadow-xl mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#e0e0e0]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 flex items-center justify-center ${styles.icon}`}>
                  <AlertTriangle size={20} />
                </div>
                <h2 className="text-lg font-medium text-[#161616]">{title}</h2>
              </div>
              <button
                onClick={onCancel}
                className="p-2 text-[#6f6f6f] hover:text-[#161616] hover:bg-[#f4f4f4] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-[#525252] leading-relaxed">{message}</p>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-[#e0e0e0] bg-[#f4f4f4]">
              <button
                onClick={onCancel}
                className="h-10 px-4 text-sm font-medium text-[#161616] hover:bg-[#e0e0e0] transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`h-10 px-4 text-sm font-medium text-white transition-colors ${styles.button}`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
