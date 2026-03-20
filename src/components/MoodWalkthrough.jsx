import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Trophy, Star } from "lucide-react";

const STEPS = [
  {
    icon: <Zap className="w-5 h-5" />,
    label: "Phase 1 — Discovery",
    color: "#a78bfa",
    description: 'Battle all songs in pairs. Pick which fits the mood better. Use "None of these" to eliminate both songs. Use "Tie" if both fit equally.',
  },
  {
    icon: <Star className="w-5 h-5" />,
    label: "Phase 2 — Finals",
    color: "#67e8f9",
    description: "Only your Phase 1 picks battle each other. Keep choosing until your top song emerges from the competition.",
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    label: "Reveal — Your Ranking",
    color: "#f0abfc",
    description: "Get a dramatic reveal of your final mood ranking. Rankings are saved so you can redo them anytime and compare.",
  },
];

export default function MoodWalkthrough({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="w-full max-w-sm bg-[#0a0a0a] border border-white/12 rounded-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="text-white font-black text-base tracking-tight">How Mood Ranking Works</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 pb-5 space-y-3">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="flex gap-3 p-3.5 rounded-2xl border"
                style={{ borderColor: `${step.color}30`, backgroundColor: `${step.color}08` }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${step.color}20`, color: step.color }}
                >
                  {step.icon}
                </div>
                <div>
                  <p className="text-white font-bold text-sm mb-0.5" style={{ color: step.color }}>{step.label}</p>
                  <p className="text-white/50 text-xs leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/10 transition-colors mt-1"
            >
              Got it!
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}