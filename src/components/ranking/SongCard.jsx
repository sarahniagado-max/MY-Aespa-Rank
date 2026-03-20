import React from "react";
import { motion } from "framer-motion";
import CoverImg from "./CoverImg";
import { getBattleResults } from "../battleStats";
import { hexToRgb } from "./colorUtils";

export default function SongCard({ song, onClick, side, tied = false, winRateOverride }) {
  const isLeft = side === "left";
  const c = song.song_color || song.lightstick_color || "#a78bfa";

  // Win rate — use override (snapshot) if provided, else live
  const winRate = (() => {
    if (winRateOverride !== undefined) return winRateOverride;
    const results = getBattleResults();
    const songRes = results[song.title] || {};
    const wins = songRes.wins || 0;
    const total = (songRes.wins || 0) + (songRes.losses || 0) + (songRes.ties || 0);
    return total > 0 ? Math.round((wins / total) * 100) : null;
  })();

  const rbgVals = Object.values(hexToRgb(c)).join(',');

  // Directional border: bright on the outer side only (left card = bright left border, right card = bright right border)
  // On hover: full bright border all around
  const outerBorderColor = tied ? "rgba(167,139,250,0.6)" : `rgba(${rbgVals},0.75)`;
  const dimBorderColor = tied ? "rgba(167,139,250,0.15)" : `rgba(${rbgVals},0.18)`;
  const sideGlow = tied
    ? { boxShadow: "0 0 20px rgba(167,139,250,0.2)" }
    : isLeft
      ? { boxShadow: `-8px 0 24px rgba(${rbgVals},0.45), 0 0 10px rgba(${rbgVals},0.15)` }
      : { boxShadow: `8px 0 24px rgba(${rbgVals},0.45), 0 0 10px rgba(${rbgVals},0.15)` };

  const cardStyle = tied
    ? { borderColor: "rgba(167,139,250,0.6)", ...sideGlow }
    : isLeft
      ? {
          borderTopColor: dimBorderColor,
          borderBottomColor: dimBorderColor,
          borderLeftColor: outerBorderColor,
          borderRightColor: dimBorderColor,
          ...sideGlow
        }
      : {
          borderTopColor: dimBorderColor,
          borderBottomColor: dimBorderColor,
          borderLeftColor: dimBorderColor,
          borderRightColor: outerBorderColor,
          ...sideGlow
        };

  const hoverAnim = isLeft
    ? { scale: 1.02, boxShadow: `-12px 0 32px rgba(${rbgVals},0.6), 0 0 16px rgba(${rbgVals},0.3)`, borderColor: outerBorderColor }
    : { scale: 1.02, boxShadow: `12px 0 32px rgba(${rbgVals},0.6), 0 0 16px rgba(${rbgVals},0.3)`, borderColor: outerBorderColor };

  return (
    <motion.div
      className="relative w-full rounded-2xl border"
      style={cardStyle}
      whileTap={{ scale: 0.96 }}
      whileHover={hoverAnim}
      initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
    <div
      onClick={onClick}
      className={`relative w-full group rounded-2xl bg-gradient-to-b from-white/5 to-transparent backdrop-blur-sm ${onClick ? 'cursor-pointer' : 'pointer-events-none'}`}
    >
      <div className="relative p-4 flex flex-col items-center gap-3">
        {/* Album art */}
        <div className="relative w-full aspect-square max-w-[200px] rounded-xl overflow-hidden shadow-2xl shadow-black/50">
          <CoverImg
            src={song.cover_url}
            alt={song.album}
            className="w-full h-full object-cover"
            fallbackClass="w-full h-full bg-gradient-to-br from-violet-900/60 to-black/80 flex items-center justify-center text-white/20 text-4xl"
            fallbackContent="♪"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        </div>

        {/* Song info */}
        <div className="text-center space-y-1 w-full">
          <h3 className="text-white font-bold text-base leading-tight line-clamp-2 tracking-tight">
            {song.title}
          </h3>
          <p className="text-white/40 text-xs font-medium uppercase tracking-widest line-clamp-1">
            {song.album}
          </p>
          {song.collab_info && (
            <p className="text-pink-400/70 text-[10px] line-clamp-1">{song.collab_info}</p>
          )}
          {song.label && (
            <p className="text-amber-400/80 text-[10px] font-bold">{song.label}</p>
          )}
          {/* Win rate — plain white 11px, no badge */}
          {winRate !== null && (
            <p className="text-white text-[11px]">{winRate}% win rate</p>
          )}
        </div>

        {/* Select indicator */}
        <div
          className={`mt-1 px-5 py-2 rounded-full border transition-all duration-300 ${
            tied ? "bg-violet-500/20 border-violet-400/50" : "border-white/10 bg-white/5"
          }`}
          style={!tied ? { borderColor: `${c}40` } : {}}
        >
          <span
            className={`text-xs font-semibold uppercase tracking-widest transition-colors ${
              tied ? "text-violet-300" : "text-white/60 group-hover:text-white"
            }`}
            style={!tied ? { '--hover-color': c } : {}}
          >
            {tied ? "Tied" : "Select"}
          </span>
        </div>
      </div>
    </div>
  </motion.div>
  );
}