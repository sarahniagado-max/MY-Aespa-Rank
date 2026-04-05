import React from "react";
import { motion } from "framer-motion";
import { Crown, Star, Award } from "lucide-react";
import { getAlbumColor } from "./albumColors";
import { hexToRgb } from "./colorUtils";
import { useTintMode } from '../AlbumTintManager';

export default function RankingItem({ song, rank, eloRating, index }) {
  const isFirst = rank === 1;
  const isTop5 = rank <= 5;
  const isTop10 = rank <= 10;
  const tintMode = useTintMode();
  const albumColor = getAlbumColor(song?.album);
  const songColor = song?.song_color || null;
  const rawBorderRgb = (songColor && typeof songColor === 'string' && songColor.startsWith('#'))
    ? Object.values(hexToRgb(songColor)).join(',')
    : albumColor.rgb;
  const borderRgb = tintMode === 'tint' ? 'var(--album-bg-r),var(--album-bg-g),var(--album-bg-b)' : rawBorderRgb;

  const getBadge = () => {
    if (isFirst) return <Crown className="w-5 h-5 text-violet-400" />;
    if (isTop5) return <Star className="w-4 h-4 text-violet-400" />;
    if (isTop10) return <Award className="w-4 h-4 text-cyan-400" />;
    return null;
  };

  const getRankStyle = () => {
    if (isFirst) return "aurora-rank-1 text-2xl font-black";
    if (isTop5) return "text-violet-400 text-xl font-bold";
    if (isTop10) return "text-cyan-400 text-lg font-bold";
    return "text-white/40 text-lg font-medium";
  };

  const getCardStyle = () => {
    if (isFirst) return "border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-transparent";
    if (isTop5) return "border-violet-500/20 bg-gradient-to-r from-violet-500/5 to-transparent";
    if (isTop10) return "border-cyan-500/15 bg-gradient-to-r from-cyan-500/5 to-transparent";
    return "border-white/5 bg-white/[0.02]";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={`flex items-center gap-3 p-3 rounded-xl ${getCardStyle()} transition-all overflow-hidden`}
      style={{ borderLeft: `3px solid rgba(${borderRgb}, 0.65)` }}
    >
      <style>{`
        .aurora-date-r,.aurora-rank-1 { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: aurora-shift-r 4s ease infinite; }
        @keyframes aurora-shift-r { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes aurora-ring-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(167,139,250,0.6),0 0 0 4px rgba(103,232,249,0.25),0 0 20px rgba(167,139,250,0.3)} 50%{box-shadow:0 0 0 2px rgba(103,232,249,0.7),0 0 0 5px rgba(240,171,252,0.25),0 0 28px rgba(103,232,249,0.35)} }
        .aurora-ring-item { animation: aurora-ring-pulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* Rank number */}
      <div className="w-10 text-center shrink-0">
        <span
          className={getRankStyle()}
          style={isFirst && tintMode === 'tint' ? { background: 'none', WebkitBackgroundClip: 'unset', WebkitTextFillColor: 'rgb(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b))', animation: 'none' } : undefined}
        >{rank}</span>
      </div>

      {/* Album cover */}
      <div
        className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 shadow-lg ${isFirst ? "aurora-ring-item" : ""}`}
        style={isFirst && tintMode === 'tint' ? { boxShadow: '0 0 0 2px rgb(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b)), 0 0 20px rgba(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b),0.3)' } : undefined}
      >
        <img src={song?.cover_url} alt={song?.album} className="w-full h-full object-cover" />
      </div>

      {/* Song info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className={`font-semibold truncate ${isFirst ? "text-white text-base" : "text-white/90 text-sm"}`}>
            {song?.title}
          </h4>
          {getBadge()}
          {song?.label && <span className="text-[9px] text-amber-400/80 font-bold shrink-0">{song.label}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <p className="text-white/50 text-xs truncate font-medium">{song?.album}</p>
        </div>
        {song?.collab_info && <p className="text-pink-400/60 text-[9px] truncate">{song.collab_info}</p>}
      </div>

      {/* Elo */}
      <div className="text-right shrink-0">
        <span className="text-white/25 text-xs font-mono">{Math.round(eloRating)}</span>
      </div>
    </motion.div>
  );
}