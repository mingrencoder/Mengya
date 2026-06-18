import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  type?: 'danger' | 'warning' | 'info';
  isAlert?: boolean;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = '确认', type = 'danger', isAlert = false }: ConfirmModalProps) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      bgIcon: 'bg-red-500/10',
      iconUrl: 'text-red-400',
      btnBg: 'bg-red-500 hover:bg-red-600',
      btnShadow: 'shadow-red-500/20'
    },
    warning: {
      bgIcon: 'bg-orange-500/10',
      iconUrl: 'text-orange-400',
      btnBg: 'bg-orange-500 hover:bg-orange-600',
      btnShadow: 'shadow-orange-500/20'
    },
    info: {
      bgIcon: 'bg-blue-500/10',
      iconUrl: 'text-blue-400',
      btnBg: 'bg-blue-500 hover:bg-blue-600',
      btnShadow: 'shadow-blue-500/20'
    }
  };

  const config = typeConfig[type];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-sm glass-panel p-6 rounded-3xl m-4 border border-white/10 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${config.bgIcon} flex items-center justify-center flex-shrink-0`}>
                  <AlertCircle className={`w-5 h-5 ${config.iconUrl}`} />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">{title}</h3>
              </div>
              <button
                onClick={onCancel}
                className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="pl-13 text-sm text-slate-600 dark:text-slate-300">
              {message}
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6 pt-2">
              {!isAlert && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  取消
                </button>
              )}
              <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-lg ${config.btnBg} ${config.btnShadow}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
