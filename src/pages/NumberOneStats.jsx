import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Crown } from "lucide-react";

const ALL_RANKINGS_KEY = "aespa_all_rankings";

const MODES = [
  { key: "all", label: "Overall" },
  { key: "title_track", label: "Title Tracks" },
  { key: "album", label: "Album Mode" },
  { key: "solo", label: "Solo Mode" },
];

export default function NumberOneStats() {
  const [stats, setStats] = useState({});
  const [activeMode, setActiveMode] = useState("all");

  useEffect(() => {
    const allRankings = (() => {
      try { return JSON.parse(localStorage.getItem(ALL_RANKINGS_KEY) || "[]"); } catch { return []; }
    })();

    const counts = { all: {}, title_track: {}, album: {}, solo: {} };

    allRankings.forEach(ranking => {
      const top1 = ranking.rankings?.[0]?.song;
      if (!top1?.title) return;
      const title = top1.title;

      // overall
      counts.all[title] = (counts.all[title] || 0) + 1;

      // by mode
      if (ranking.songTypeFilter === "title_track") {
        counts.title_track[title] = (counts.title_track[title] || 0) + 1;
      } else if (ranking.albumFilter && ranking.albumFilter !== "all") {
        counts.album[title] = (counts.album[title] || 0) + 1;
      } else if (ranking.songTypeFilter === "solo") {
        counts.solo[title] = (counts.solo[title] || 0) + 1;
      }
    });

    setStats(counts);
  }, []);

  const currentStats = stats[activeMode] || {};
  const sorted = Object.entries(currentStats).sort(([, a], [, b]) => b - a);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <style>{`
        .aurora-stat { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: stat-shift 4s ease infinite; }
        @keyframes stat-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .aurora-border-btn { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399) border-box; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="aurora-stat font-bold text-sm tracking-wider">#1 STATS</h1>
        <div className="w-9" />
      </div>

      {/* Mode tabs */}
      <div className="relative z-10 px-4 pt-2 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {MODES.map(mode => (
          <button
            key={mode.key}
            onClick={() => setActiveMode(mode.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all ${
              activeMode === mode.key
                ? "bg-violet-600 border-violet-500 text-white"
                : "bg-white/5 border-white/10 text-white/40"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="relative z-10 px-4 pb-24">
        {sorted.length === 0 ? (
          <div className="text-center py-12">
            <Crown className="w-8 h-8 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No data yet</p>
            <p className="text-white/20 text-xs mt-1">Complete rankings to see #1 stats</p>
            <Link
              to={createPageUrl("Battle")}
              className="inline-block mt-4 px-4 py-2 rounded-full bg-violet-600 text-white text-xs font-semibold"
            >
              Start Ranking
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map(([title, count], i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? "bg-violet-500/20" : "bg-white/5"}`}>
                  {i === 0 ? <Crown className="w-3.5 h-3.5 text-violet-400" /> : <span className="text-white/30 text-xs font-mono">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/85 font-semibold text-sm truncate">{title}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  <span className={`font-black text-lg ${i === 0 ? "aurora-stat" : "text-white/60"}`}>{count}</span>
                  <span className="text-white/25 text-[10px]">×</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}