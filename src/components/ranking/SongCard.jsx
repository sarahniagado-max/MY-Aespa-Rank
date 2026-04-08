import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import CoverImg from "./CoverImg";
import { getBattleResults } from "../battleStats";
import { hexToRgb } from "./colorUtils";
import { useTintMode } from '../AlbumTintManager';

export default function SongCard({ song, onClick, side, tied = false, winRateOverride, onHoldConfirm }) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdRafRef = useRef(null);
  const holdStartRef = useRef(null);

  const startHold = (e) => {
    e.preventDefault();
    holdStartRef.current = Date.now();
    const tick = () => {
      const p = Math.min(100, ((Date.now() - holdStartRef.current) / 2000) * 100);
      setHoldProgress(p);
      if (p < 100) holdRafRef.current = requestAnimationFrame(tick);
      else { setHoldProgress(0); onHoldConfirm(); }
    };
    holdRafRef.current = requestAnimationFrame(tick);
  };

  const cancelHold = () => {
    if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
    setHoldProgress(0);
  };

  const isLeft = side === "left";

  const songTypeBadge = (() => {
    const specials = {
      "Black Mamba":         { text: "Debut",           color: "violet" },
      "Hot Mess":            { text: "Japanese Debut",  color: "violet" },
      "Die Trying":          { text: "Collab OST",      color: "orange" },
      "Beautiful Christmas": { text: "Collab Single",   color: "orange" },
      "Dark Arts":           { text: "Collab OST",      color: "orange" },
      "Keychain":            { text: "Collab OST",      color: "orange" },
      "We Go":               { text: "Japanese OST",    color: "yellow" },
      "ZOOM ZOOM":           { text: "Japanese OST",    color: "yellow" },
      "Attitude":            { text: "Japanese OST",    color: "yellow" },
    };
    if (specials[song.title]) return specials[song.title];
    switch (song.song_type) {
      case "title_track":   return { text: "Title Track", color: "violet" };
      case "b_side":        return { text: "B-Side",      color: "blue"   };
      case "single":        return { text: "Single",      color: "green"  };
      case "solo":          return { text: song.featured_member ? `Solo · ${song.featured_member}` : "Solo", color: "pink" };
      case "collaboration": return { text: "Collab",      color: "orange" };
      case "ost":           return { text: "OST",         color: "yellow" };
      case "pre_release":   return { text: "Pre-release", color: "purple" };
      default:              return null;
    }
  })();

  const badgeClass = {
    violet: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    blue:   "bg-blue-500/20 text-blue-300 border-blue-500/30",
    green:  "bg-green-500/20 text-green-300 border-green-500/30",
    pink:   "bg-pink-500/20 text-pink-300 border-pink-500/30",
    orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };

  const tintMode = useTintMode();
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
  const tintRgb = 'var(--album-bg-r),var(--album-bg-g),var(--album-bg-b)';
  const effectiveRgb = tintMode === 'tint' ? tintRgb : rbgVals;

  // Gradient border: single thick line, bright at active side, fading toward corners
  // Implemented via outer gradient background + 3px padding (preserves border-radius)
  const borderGradient = tied
    ? `rgba(167,139,250,0.6)`
    : isLeft
      ? `linear-gradient(to right, rgba(${effectiveRgb},0.9), rgba(${effectiveRgb},0.15))`
      : `linear-gradient(to left,  rgba(${effectiveRgb},0.9), rgba(${effectiveRgb},0.15))`;

  const staticGlow = tied
    ? `0 0 20px rgba(167,139,250,0.2)`
    : isLeft
      ? `-8px 0 24px rgba(${effectiveRgb},0.45), 0 0 10px rgba(${effectiveRgb},0.15)`
      : `8px 0 24px rgba(${effectiveRgb},0.45), 0 0 10px rgba(${effectiveRgb},0.15)`;

  const cardStyle = {
    padding: '3px',
    borderRadius: '1rem',
    background: borderGradient,
    boxShadow: staticGlow,
  };

  // On hover: omnidirectional glow simulates full bright border all around
  const hoverAnim = {
    scale: 1.02,
    boxShadow: tied
      ? `0 0 28px rgba(167,139,250,0.45), 0 0 12px rgba(167,139,250,0.25)`
      : `0 0 28px rgba(${effectiveRgb},0.55), 0 0 12px rgba(${effectiveRgb},0.3), ${staticGlow}`,
  };

  return (
    <motion.div
      className="relative w-full rounded-2xl"
      style={cardStyle}
      whileTap={{ scale: 0.96 }}
      whileHover={hoverAnim}
      initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
    <div
      onClick={onClick}
      className={`relative w-full group rounded-[13px] bg-black/90 bg-gradient-to-b from-white/5 to-transparent ${(onClick || onHoldConfirm) ? 'cursor-pointer' : 'pointer-events-none'}`}
      style={{ height: '100%' }}
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
          {songTypeBadge && (
            <div className="flex justify-center mt-0.5">
              <span className={`inline-block px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${badgeClass[songTypeBadge.color]}`}>
                {songTypeBadge.text}
              </span>
            </div>
          )}
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
          className={`relative mt-1 px-5 py-2 rounded-full border overflow-hidden transition-all duration-300 ${
            onHoldConfirm && !tied ? 'cursor-pointer select-none' : ''
          } ${tied ? "bg-violet-500/20 border-violet-400/50" : "border-white/10 bg-white/5"}`}
          style={!tied ? { borderColor: tintMode === 'tint' ? `rgba(${tintRgb},0.25)` : `${c}40` } : {}}
          onMouseDown={onHoldConfirm && !tied ? startHold : undefined}
          onMouseUp={onHoldConfirm ? cancelHold : undefined}
          onMouseLeave={onHoldConfirm ? cancelHold : undefined}
          onTouchStart={onHoldConfirm && !tied ? startHold : undefined}
          onTouchEnd={onHoldConfirm ? cancelHold : undefined}
        >
          {holdProgress > 0 && (
            <div className="absolute inset-0 origin-left bg-white/20" style={{ width: `${holdProgress}%`, transition: 'none' }} />
          )}
          <span
            className={`relative z-10 text-xs font-semibold uppercase tracking-widest transition-colors ${
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