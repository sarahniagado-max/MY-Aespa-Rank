import React, { useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

export default function RankingNameModal({ topSong, onSave }) {
  const [name, setName] = useState("");

  const handleSave = () => {
    onSave(name.trim() || `Ranking ${new Date().toLocaleDateString()}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-[#0d0d0d] border border-white/10 rounded-2xl p-6"
      >
        <div className="text-center mb-5">
          <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h2 className="text-white font-black text-lg tracking-tight">Ranking Complete!</h2>
          {topSong && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-amber-400/30">
                <img src={topSong.cover_url} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="text-white/50 text-xs">Your #1 song</p>
              <p className="text-white font-bold text-sm">{topSong.title}</p>
            </div>
          )}
        </div>

        <label className="block text-white/40 text-[11px] uppercase tracking-wider mb-1.5">Name this ranking</label>
        <input
          autoFocus
          type="text"
          placeholder={`e.g. My Faves 2026`}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 mb-4"
        />

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-sm uppercase tracking-wider"
        >
          Save Ranking →
        </button>
      </motion.div>
    </div>
  );
}