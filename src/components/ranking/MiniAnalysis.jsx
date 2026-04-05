import React, { useState } from "react";
import { useTintMode } from "../AlbumTintManager";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Minus, Crown, Zap, BarChart3 } from "lucide-react";

function buildAnalysis(allRankings) {
  // allRankings: newest first. Need at least 2 to compare.
  if (allRankings.length < 2) return null;

  // Map: song title -> array of ranks (index 0 = oldest)
  const chronological = [...allRankings].reverse(); // oldest first
  const rankHistory = {};

  chronological.forEach((ranking, ri) => {
    (ranking.rankings || []).forEach((item, idx) => {
      const title = item.song?.title;
      if (!title) return;
      if (!rankHistory[title]) rankHistory[title] = [];
      rankHistory[title].push({ rank: idx + 1, ri, song: item.song });
    });
  });

  const total = chronological.length;

  // Most improved: best rank change from first to last appearance
  const changes = Object.entries(rankHistory)
    .filter(([, hist]) => hist.length >= 2)
    .map(([title, hist]) => {
      const first = hist[0];
      const last = hist[hist.length - 1];
      return { title, song: last.song, firstRank: first.rank, lastRank: last.rank, change: first.rank - last.rank };
    });

  const mostImproved = [...changes].sort((a, b) => b.change - a.change).slice(0, 3);
  const biggestDrops = [...changes].sort((a, b) => a.change - b.change).slice(0, 3);

  // Consistent champions: songs that appear at #1 most often
  const topOneCounts = {};
  chronological.forEach(r => {
    const top = r.rankings?.[0]?.song?.title;
    if (top) topOneCounts[top] = (topOneCounts[top] || 0) + 1;
  });
  const champions = Object.entries(topOneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([title, count]) => {
      const song = Object.values(rankHistory).flat().find(h => h.song?.title === title)?.song;
      return { title, count, song };
    });

  // Current #1
  const current1 = allRankings[0]?.rankings?.[0]?.song;

  // Average rank per song across all rankings
  const avgRanks = Object.entries(rankHistory)
    .filter(([, hist]) => hist.length === total)
    .map(([title, hist]) => {
      const avg = hist.reduce((s, h) => s + h.rank, 0) / hist.length;
      return { title, avg, song: hist[hist.length - 1].song };
    })
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 5);

  return { mostImproved, biggestDrops, champions, avgRanks, current1, totalRankings: total };
}

export default function MiniAnalysis({ allRankings, onClose }) {
  const tintMode = useTintMode();
  const [tab, setTab] = useState("overview");
  const analysis = buildAnalysis(allRankings);

  if (!analysis) return null;

  const { mostImproved, biggestDrops, champions, avgRanks, current1, totalRankings } = analysis;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "trends", label: "Trends" },
    { id: "consistent", label: "All-Time" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="m-auto w-full max-w-sm bg-[#0a0a0a] border border-white/12 rounded-2xl overflow-hidden max-h-[88vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          .aurora-analysis { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: an-shift 4s ease infinite; }
          @keyframes an-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        `}</style>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
          <div>
            <h2
            className="aurora-analysis font-black text-base tracking-wide"
            style={tintMode === 'tint' ? { background: 'none', WebkitBackgroundClip: 'unset', WebkitTextFillColor: 'rgb(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b))', animation: 'none' } : undefined}
          >Ranking Analysis</h2>
            <p className="text-white/30 text-xs mt-0.5">Based on {totalRankings} rankings</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pb-3 flex gap-2 shrink-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition-all ${
                tab === t.id ? "bg-violet-600 border-violet-500 text-white" : "bg-white/5 border-white/10 text-white/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          <AnimatePresence mode="wait">
            {tab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Current #1 */}
                {current1 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-950/30 border border-violet-500/20">
                    <Crown className="w-4 h-4 text-violet-400 shrink-0" />
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      <img src={current1.cover_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider">Current #1</p>
                      <p className="text-white font-bold text-sm truncate">{current1.title}</p>
                      <p className="text-white/30 text-xs truncate">{current1.album}</p>
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 text-center">
                    <p className="text-white font-black text-xl">{totalRankings}</p>
                    <p className="text-white/35 text-[10px] uppercase tracking-wider">Rankings</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 text-center">
                    <p className="text-white font-black text-xl">{champions[0]?.count || 0}</p>
                    <p className="text-white/35 text-[10px] uppercase tracking-wider">Times at #1</p>
                  </div>
                </div>

                {/* Top avg performers */}
                {avgRanks.length > 0 && (
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                      <BarChart3 className="w-3 h-3" /> Most Consistent Top Songs
                    </p>
                    <div className="space-y-1.5">
                      {avgRanks.map((item, i) => (
                        <div key={item.title} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/8">
                          <span className="text-white/30 text-xs font-mono w-4">{i + 1}</span>
                          <div className="w-7 h-7 rounded-md overflow-hidden shrink-0">
                            <img src={item.song?.cover_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/85 text-sm truncate font-medium">{item.title}</p>
                          </div>
                          <span className="text-white/40 text-xs font-mono">avg #{item.avg.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "trends" && (
              <motion.div key="trends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Most improved */}
                <div>
                  <p className="text-green-400 text-[10px] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" /> Most Improved
                  </p>
                  {mostImproved.length === 0 ? (
                    <p className="text-white/25 text-sm">Not enough data</p>
                  ) : (
                    <div className="space-y-1.5">
                      {mostImproved.map(item => (
                        <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl bg-green-950/20 border border-green-500/15">
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                            <img src={item.song?.cover_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/85 text-sm font-medium truncate">{item.title}</p>
                            <p className="text-white/35 text-[10px]">#{item.firstRank} → #{item.lastRank}</p>
                          </div>
                          <span className="text-green-400 font-black text-base">▲{item.change}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Biggest drops */}
                <div>
                  <p className="text-red-400 text-[10px] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                    <TrendingDown className="w-3 h-3" /> Biggest Drops
                  </p>
                  {biggestDrops.length === 0 ? (
                    <p className="text-white/25 text-sm">Not enough data</p>
                  ) : (
                    <div className="space-y-1.5">
                      {biggestDrops.filter(i => i.change < 0).map(item => (
                        <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl bg-red-950/20 border border-red-500/15">
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                            <img src={item.song?.cover_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/85 text-sm font-medium truncate">{item.title}</p>
                            <p className="text-white/35 text-[10px]">#{item.firstRank} → #{item.lastRank}</p>
                          </div>
                          <span className="text-red-400 font-black text-base">▼{Math.abs(item.change)}</span>
                        </div>
                      ))}
                      {biggestDrops.every(i => i.change >= 0) && (
                        <p className="text-white/25 text-sm">No significant drops yet</p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {tab === "consistent" && (
              <motion.div key="consistent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div>
                  <p className="text-violet-400 text-[10px] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                    <Crown className="w-3 h-3" /> #1 Champions
                  </p>
                  {champions.length === 0 ? (
                    <p className="text-white/25 text-sm">No data yet</p>
                  ) : (
                    <div className="space-y-2">
                      {champions.map((item, i) => (
                        <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl bg-violet-950/20 border border-violet-500/20">
                          <span className="text-violet-400/60 text-sm font-mono w-4">{i + 1}</span>
                          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                            <img src={item.song?.cover_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/90 font-bold text-sm truncate">{item.title}</p>
                            <p className="text-white/30 text-xs">{item.song?.album}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-violet-300 font-black text-base">{item.count}×</p>
                            <p className="text-white/25 text-[9px]">at #1</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Steady performers: all rankings */}
                {avgRanks.length > 0 && (
                  <div>
                    <p className="text-cyan-400 text-[10px] uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                      <Zap className="w-3 h-3" /> All-Time Avg Rankings
                    </p>
                    <p className="text-white/25 text-[10px] mb-2">Songs present in all {totalRankings} rankings</p>
                    <div className="space-y-1.5">
                      {avgRanks.map((item, i) => (
                        <div key={item.title} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/8">
                          <span className="text-white/30 text-xs font-mono w-4">{i + 1}</span>
                          <div className="w-7 h-7 rounded-md overflow-hidden shrink-0">
                            <img src={item.song?.cover_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/85 text-sm truncate">{item.title}</p>
                          </div>
                          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-400/60 rounded-full" style={{ width: `${Math.max(5, 100 - (item.avg / (allRankings[0]?.rankings?.length || 70)) * 100)}%` }} />
                          </div>
                          <span className="text-white/40 text-xs font-mono w-10 text-right">#{item.avg.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}