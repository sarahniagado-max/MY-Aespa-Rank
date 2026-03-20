import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

const COMPLETE_KEY = "aespa_ranking_complete";
const ALL_RANKINGS_KEY = "aespa_all_rankings";

const AURORA = `
  .aurora-a { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: aurora-a 4s ease infinite; }
  @keyframes aurora-a { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
`;

export default function Analytics() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem(COMPLETE_KEY) || "null"); } catch { return null; } })();
  const allRankings = (() => { try { return JSON.parse(localStorage.getItem(ALL_RANKINGS_KEY) || "[]"); } catch { return []; } })();

  const analytics = useMemo(() => {
    if (!saved?.rankings) return null;
    const rankings = saved.rankings;

    // Album averages
    const albumMap = {};
    rankings.forEach((item, i) => {
      const album = item.song?.album;
      if (!album) return;
      if (!albumMap[album]) albumMap[album] = { total: 0, count: 0 };
      albumMap[album].total += (i + 1);
      albumMap[album].count += 1;
    });
    const albumAvgs = Object.entries(albumMap)
      .map(([album, { total, count }]) => ({ album, avg: total / count }))
      .sort((a, b) => a.avg - b.avg);

    const highest = albumAvgs[0];
    const lowest = albumAvgs[albumAvgs.length - 1];

    // Era breakdown for top 10
    const top10 = rankings.slice(0, 10);
    const eraCount = {};
    top10.forEach(item => {
      const era = item.song?.era || "Other";
      eraCount[era] = (eraCount[era] || 0) + 1;
    });
    const eraPct = Object.entries(eraCount).map(([era, count]) => ({ era, pct: Math.round((count / 10) * 100) })).sort((a, b) => b.pct - a.pct);

    // Consistency score
    let consistency = null;
    if (allRankings.length >= 2) {
      const prev = allRankings[allRankings.length - 2];
      if (prev?.rankings) {
        let matches = 0;
        const total = Math.min(rankings.length, prev.rankings.length);
        rankings.slice(0, total).forEach((item, i) => {
          const prevIdx = prev.rankings.findIndex(r => r.song?.title === item.song?.title);
          if (prevIdx !== -1 && Math.abs(prevIdx - i) <= 3) matches++;
        });
        consistency = Math.round((matches / total) * 100);
      }
    }

    return { highest, lowest, eraPct, consistency };
  }, [saved, allRankings]);

  if (!saved) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/40 text-sm">No ranking data yet. <Link to={createPageUrl("Battle")} className="text-violet-400 underline">Start ranking</Link></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6">
      <style>{AURORA}</style>

      <div className="flex items-center justify-between mb-6">
        <Link to={createPageUrl("Results")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="aurora-a font-bold text-sm tracking-wider">Analytics</h1>
        <div className="w-9" />
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        {/* Album Bias */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <h2 className="text-white/70 text-xs font-bold uppercase tracking-wider">Album Bias</h2>
          </div>
          {analytics?.highest && (
            <div className="flex items-center gap-2 mb-2 p-2.5 rounded-xl bg-green-900/20 border border-green-500/15">
              <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Highest Average Album</p>
                <p className="text-white/80 text-sm font-semibold">{analytics.highest.album}</p>
                <p className="text-green-400/60 text-[10px]">Avg rank #{Math.round(analytics.highest.avg)}</p>
              </div>
            </div>
          )}
          {analytics?.lowest && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-900/20 border border-red-500/15">
              <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Lowest Average Album</p>
                <p className="text-white/80 text-sm font-semibold">{analytics.lowest.album}</p>
                <p className="text-red-400/60 text-[10px]">Avg rank #{Math.round(analytics.lowest.avg)}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Era breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
          <h2 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-3">Top 10 Era Breakdown</h2>
          <div className="space-y-2">
            {analytics?.eraPct?.map(({ era, pct }) => (
              <div key={era}>
                <div className="flex justify-between mb-1">
                  <span className="text-white/60 text-[11px]">{era}</span>
                  <span className="text-white/40 text-[11px]">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Consistency */}
        {analytics?.consistency !== null && analytics?.consistency !== undefined && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
            <h2 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-3">Consistency Score</h2>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r="26" fill="none"
                    stroke="url(#g)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${(analytics.consistency / 100) * 163} 163`}
                  />
                  <defs>
                    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#67e8f9" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="aurora-a text-sm font-black">{analytics.consistency}%</span>
                </div>
              </div>
              <div>
                <p className="text-white/70 text-sm font-semibold mb-1">
                  {analytics.consistency >= 75 ? "Very consistent!" : analytics.consistency >= 50 ? "Somewhat consistent" : "Your taste is evolving!"}
                </p>
                <p className="text-white/30 text-[11px] leading-snug">
                  {analytics.consistency}% of your top songs stayed within 3 positions compared to your previous ranking.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex gap-3">
          <Link to={createPageUrl("Results")} className="flex-1 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white text-sm font-semibold text-center transition-colors">
            ← Back to Results
          </Link>
          <Link to={createPageUrl("ShareCard")} className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold text-center transition-colors">
            Share Card ✨
          </Link>
        </div>
      </div>
    </div>
  );
}