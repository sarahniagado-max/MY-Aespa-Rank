import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy } from "lucide-react";
import CoverImg from "./ranking/CoverImg";

function buildRankedList(eloRatings, eliminatedIds, songs) {
  const eliminatedSet = new Set(eliminatedIds || []);
  const entries = Object.entries(eloRatings || {})
    .filter(([id]) => !eliminatedSet.has(id))
    .sort(([, a], [, b]) => b - a);

  return entries.map(([id, score], i) => ({
    rank: i + 1,
    song: songs.find(s => s.id === id),
    score,
  })).filter(r => r.song);
}

export default function MoodReveal({ mood, eloRatings, eliminatedIds, songs, onBack, skipIntro }) {
  const ranked = buildRankedList(eloRatings, eliminatedIds, songs);
  const [phase, setPhase] = useState(skipIntro ? "reveal" : "intro");
  const [revealedCount, setRevealedCount] = useState(skipIntro ? ranked.length : 0);
  const containerRef = useRef(null);

  const moodColor = mood?.color || "#a78bfa";

  useEffect(() => {
    if (phase === "intro") {
      const t = setTimeout(() => setPhase("reveal"), 2000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "reveal" && revealedCount < ranked.length) {
      const t = setTimeout(() => {
        setRevealedCount(c => c + 1);
      }, revealedCount === 0 ? 400 : 300);
      return () => clearTimeout(t);
    }
  }, [phase, revealedCount, ranked.length]);

  const visibleItems = ranked.slice(0, revealedCount);
  const topSong = ranked[0]?.song;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <style>{`
        @keyframes aurora-mood {
          0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
        }
        .mood-reveal-aurora {
          background: linear-gradient(135deg, ${moodColor}, #67e8f9, ${moodColor}99, #f0abfc);
          background-size: 300% 300%;
          animation: aurora-mood 4s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .mood-reveal-glow {
          box-shadow: 0 0 60px ${moodColor}22, 0 0 120px ${moodColor}11;
        }
      `}</style>

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full blur-[120px] opacity-20"
          style={{ backgroundColor: moodColor }} />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: moodColor }} />
          <span className="mood-reveal-aurora font-black text-sm tracking-wider uppercase">{mood?.name} Ranking</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Intro phase */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mood-reveal-glow"
                style={{ backgroundColor: `${moodColor}20`, border: `2px solid ${moodColor}60` }}>
                <Trophy className="w-8 h-8" style={{ color: moodColor }} />
              </div>
              <p className="mood-reveal-aurora font-black text-2xl tracking-tight">{mood?.name}</p>
              <p className="text-white/40 text-sm">Your Ranking Revealed</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal list */}
      {phase === "reveal" && (
        <div ref={containerRef} className="relative z-10 px-4 pb-24 space-y-2 mt-2">
          {ranked.length === 0 && (
            <div className="text-center py-20 text-white/40 text-sm">No songs ranked yet.</div>
          )}

          {/* #1 hero */}
          {visibleItems[0] && (
            <motion.div
              key={`rank-1`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="rounded-2xl overflow-hidden mb-4 mood-reveal-glow"
              style={{ border: `1.5px solid ${moodColor}50`, backgroundColor: `${moodColor}10` }}
            >
              <div className="flex items-center gap-4 p-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden">
                    <CoverImg
                      src={visibleItems[0].song.cover_url}
                      alt={visibleItems[0].song.title}
                      className="w-full h-full object-cover"
                      fallbackClass="w-full h-full bg-white/5 flex items-center justify-center text-2xl"
                      fallbackContent="♪"
                    />
                  </div>
                  <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-black"
                    style={{ backgroundColor: moodColor }}>
                    1
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: moodColor }}>#1 — Top Pick</p>
                  <p className="text-white font-black text-base leading-tight truncate">{visibleItems[0].song.title}</p>
                  <p className="text-white/40 text-xs truncate">{visibleItems[0].song.album}</p>
                </div>
                <Trophy className="w-5 h-5 shrink-0" style={{ color: moodColor }} />
              </div>
            </motion.div>
          )}

          {/* Rest of rankings */}
          {visibleItems.slice(1).map((item, i) => (
            <motion.div
              key={`rank-${item.rank}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: `${moodColor}06`, border: `1px solid ${moodColor}18` }}
            >
              <span className="text-white/25 text-xs font-mono w-5 text-right shrink-0">#{item.rank}</span>
              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white/5">
                <CoverImg
                  src={item.song.cover_url}
                  alt={item.song.title}
                  className="w-full h-full object-cover"
                  fallbackClass="w-full h-full bg-white/5 flex items-center justify-center text-sm"
                  fallbackContent="♪"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/85 text-sm font-semibold truncate">{item.song.title}</p>
                <p className="text-white/30 text-[10px] truncate">{item.song.album}</p>
              </div>
            </motion.div>
          ))}

          {/* Show count */}
          {revealedCount < ranked.length && (
            <div className="flex justify-center pt-2">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: moodColor, borderTopColor: 'transparent' }} />
            </div>
          )}

          {revealedCount === ranked.length && ranked.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center pt-4 pb-2 text-white/25 text-xs"
            >
              {ranked.length} songs ranked
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}