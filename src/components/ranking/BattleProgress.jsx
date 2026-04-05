import React from "react";
import { motion } from "framer-motion";
import { useTintMode } from "../AlbumTintManager";

export default function BattleProgress({ current, total }) {
  const tintMode = useTintMode();
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="text-white/30 text-[10px] font-semibold uppercase tracking-[0.2em]">
          Progress
        </span>
        <span className="text-white/50 text-xs font-mono">
          {current}<span className="text-white/20">/{total}</span>
        </span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
          style={tintMode === 'tint' ? { background: 'rgb(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b))' } : undefined}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}