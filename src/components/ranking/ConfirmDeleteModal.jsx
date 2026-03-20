import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmDeleteModal({ open, title = "Are you sure?", message = "This action cannot be undone.", onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-xs bg-[#0e0e0e] border border-white/12 rounded-2xl p-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-white font-bold text-base mb-2">{title}</p>
            <p className="text-white/45 text-sm mb-6 leading-relaxed">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl border border-white/12 text-white/60 font-semibold text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white"
                style={{
                  background: "linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399)",
                  backgroundSize: "300% 300%",
                  animation: "aurora-del 4s ease infinite",
                }}
              >
                Delete
              </button>
            </div>
          </motion.div>
          <style>{`@keyframes aurora-del{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}