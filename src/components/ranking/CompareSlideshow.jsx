import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Minus, PlusCircle, MinusCircle, ChevronLeft, ChevronRight, Link2 } from "lucide-react";
import { getAlbumColor } from "./albumColors";
import SongPreviewPlayer, { stopAllPreviews } from "./SongPreviewPlayer";

function buildComparison(currentRankings, prevRankings) {
  const prevMap = {};
  prevRankings.forEach((item, i) => {
    if (item.song?.title) prevMap[item.song.title] = i + 1;
  });

  const rises = [];
  const drops = [];
  const unchanged = [];
  const newSongs = [];

  currentRankings.forEach((item, i) => {
    const currentRank = i + 1;
    const title = item.song?.title;
    if (!title) return;
    if (!(title in prevMap)) {
      newSongs.push({ ...item, currentRank });
      return;
    }
    const prevRank = prevMap[title];
    const diff = prevRank - currentRank;
    if (diff > 0) rises.push({ ...item, currentRank, prevRank, diff });
    else if (diff < 0) drops.push({ ...item, currentRank, prevRank, diff });
    else unchanged.push({ ...item, currentRank, prevRank, diff });
  });

  // Excluded: in prev but not in current
  const currentTitles = new Set(currentRankings.map(r => r.song?.title));
  const excluded = prevRankings.filter(item => item.song?.title && !currentTitles.has(item.song.title));

  rises.sort((a, b) => b.diff - a.diff);
  drops.sort((a, b) => a.diff - b.diff);

  // Ties: songs that share the same rating in the current ranking
  const ratingCounts = {};
  currentRankings.forEach(item => {
    if (item.rating !== undefined) ratingCounts[item.rating] = (ratingCounts[item.rating] || 0) + 1;
  });
  const ties = currentRankings.filter(item => ratingCounts[item.rating] > 1);

  return { rises, drops, unchanged, newSongs, excluded, ties };
}

function SongRow({ song, label, labelColor = "text-white/40", leftBadge, rightBadge, showPreview = false }) {
  const albumColor = getAlbumColor(song?.album);
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8"
      style={{ borderLeft: `3px solid rgba(${albumColor.rgb}, 0.6)` }}
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
        {song?.cover_url
          ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-white/10" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/90 text-sm font-semibold truncate">{song?.title}</p>
        <p className="text-white/35 text-xs truncate">{song?.album}</p>
        {label && <p className={`text-[10px] font-semibold mt-0.5 ${labelColor}`}>{label}</p>}
      </div>
      {showPreview && song?.title && (
        <div className="shrink-0">
          <SongPreviewPlayer songTitle={song.title} compact />
        </div>
      )}
      {leftBadge && <div className="shrink-0">{leftBadge}</div>}
      {rightBadge && <div className="shrink-0">{rightBadge}</div>}
    </div>
  );
}

const SECTIONS = [
  { key: "rises",     icon: TrendingUp,    label: "Biggest Rises",       color: "text-green-400",  border: "border-green-500/20" },
  { key: "drops",     icon: TrendingDown,  label: "Biggest Drops",       color: "text-red-400",    border: "border-red-500/20" },
  { key: "ties",      icon: Link2,         label: "Tied Songs",          color: "text-violet-400", border: "border-violet-500/20" },
  { key: "unchanged", icon: Minus,         label: "Unchanged Positions", color: "text-white/50",   border: "border-white/10" },
  { key: "newSongs",  icon: PlusCircle,    label: "Newly Added Songs",   color: "text-cyan-400",   border: "border-cyan-500/20" },
  { key: "excluded",  icon: MinusCircle,   label: "Excluded Songs",      color: "text-white/30",   border: "border-white/8" },
];

export default function CompareSlideshow({ currentRankings, prevRanking, onClose }) {
  const [slide, setSlide] = useState(0);

  const changeSlide = (n) => {
    stopAllPreviews();
    setSlide(n);
  };

  const data = buildComparison(currentRankings, prevRanking.rankings || []);

  const sections = SECTIONS.map(s => ({ ...s, items: data[s.key] }));
  const current = sections[slide];
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col"
    >
      <style>{`
        .aurora-compare { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: cmp-shift 4s ease infinite; }
        @keyframes cmp-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="aurora-compare font-black text-sm tracking-wider">RANKING COMPARISON</p>
          <p className="text-white/30 text-[10px] mt-0.5">vs {new Date(prevRanking.completedAt).toLocaleDateString()}</p>
        </div>
        <div className="w-9" />
      </div>

      {/* Slide indicator dots */}
      <div className="flex justify-center gap-1.5 pb-3 shrink-0">
        {sections.map((s, i) => (
          <button
            key={s.key}
            onClick={() => changeSlide(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === slide ? "bg-violet-400 w-4" : "bg-white/20"}`}
          />
        ))}
      </div>

      {/* Section header */}
      <div className={`mx-4 mb-3 px-4 py-3 rounded-xl border ${current.border} bg-white/[0.02] flex items-center gap-3 shrink-0`}>
        <Icon className={`w-5 h-5 ${current.color} shrink-0`} />
        <div>
          <p className={`font-bold text-sm ${current.color}`}>{current.label}</p>
          <p className="text-white/30 text-xs">{current.items.length} songs</p>
        </div>
        <div className="ml-auto text-white/25 text-xs font-mono">{slide + 1} / {sections.length}</div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            {current.items.length === 0 ? (
              <div className="text-center py-10 text-white/25 text-sm">No songs in this category</div>
            ) : current.key === "rises" ? (
              current.items.map((item, i) => (
                <SongRow key={item.song?.title + i} song={item.song} showPreview
                  label={`#${item.prevRank} → #${item.currentRank}`} labelColor="text-white/40"
                  rightBadge={<span className="text-green-400 font-black text-base">▲{item.diff}</span>}
                />
              ))
            ) : current.key === "drops" ? (
              current.items.map((item, i) => (
                <SongRow key={item.song?.title + i} song={item.song} showPreview
                  label={`#${item.prevRank} → #${item.currentRank}`} labelColor="text-white/40"
                  rightBadge={<span className="text-red-400 font-black text-base">▼{Math.abs(item.diff)}</span>}
                />
              ))
            ) : current.key === "ties" ? (() => {
              // Group by rating value
              const groups = {};
              current.items.forEach(item => {
                const key = item.rating;
                if (!groups[key]) groups[key] = [];
                groups[key].push(item);
              });
              return Object.values(groups).map((group, gi) => (
                <div key={gi} className="rounded-xl border border-violet-500/30 bg-violet-950/20 overflow-hidden mb-2">
                  <div className="px-3 pt-2 pb-1 flex items-center gap-1.5">
                    <Link2 className="w-3 h-3 text-violet-400/70" />
                    <span className="text-violet-400/70 text-[10px] font-bold uppercase tracking-widest">Tied — {group.length} songs</span>
                  </div>
                  <div className="space-y-1 px-2 pb-2">
                    {group.map((item, i) => (
                      <SongRow key={item.song?.title + i} song={item.song} showPreview
                        label={`Rank #${item.currentRank}`} labelColor="text-violet-300/60"
                      />
                    ))}
                  </div>
                </div>
              ));
            })() : current.key === "unchanged" ? (
              current.items.map((item, i) => (
                <SongRow key={item.song?.title + i} song={item.song} showPreview
                  label={`Stayed at #${item.currentRank}`} labelColor="text-white/35"
                  rightBadge={<span className="text-white/40 font-black text-sm">=</span>}
                />
              ))
            ) : current.key === "newSongs" ? (
              current.items.map((item, i) => (
                <SongRow key={item.song?.title + i} song={item.song} showPreview
                  label="Not included in previous ranking" labelColor="text-cyan-400/70"
                  rightBadge={<span className="text-cyan-400 font-bold text-xs px-2 py-0.5 rounded-full bg-cyan-900/30 border border-cyan-500/20">NEW</span>}
                />
              ))
            ) : (
              current.items.map((item, i) => (
                <SongRow key={item.song?.title + i} song={item.song}
                  label="Excluded from comparison" labelColor="text-white/25"
                  rightBadge={<span className="text-white/25 text-xs">—</span>}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav arrows */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent flex gap-3">
        <button
          disabled={slide === 0}
          onClick={() => changeSlide(slide - 1)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-all ${
            slide === 0 ? "border-white/5 text-white/15 cursor-not-allowed" : "border-white/15 text-white/60 hover:text-white hover:border-white/30"
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        {slide < sections.length - 1 ? (
          <button
            onClick={() => changeSlide(slide + 1)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => { stopAllPreviews(); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </motion.div>
  );
}