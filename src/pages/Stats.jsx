import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, BarChart3, Play, Zap, Clock, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getAllPlayCounts } from "../components/ranking/SongPreviewPlayer";
import { getDecisionTimes } from "../components/battleStats";

const COMPLETE_KEY = "aespa_ranking_complete";
const ALL_RANKINGS_KEY = "aespa_all_rankings";

export default function Stats() {
  const rankingData = (() => { try { return JSON.parse(localStorage.getItem(COMPLETE_KEY) || "null"); } catch { return null; } })();
  const allRankings = (() => { try { return JSON.parse(localStorage.getItem(ALL_RANKINGS_KEY) || "[]"); } catch { return []; } })();
  const playCounts = getAllPlayCounts();
  const decisionTimes = getDecisionTimes();

  const topPlayed = Object.entries(playCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([title, count]) => ({ title, count }));

  const totalPlays = Object.values(playCounts).reduce((a, b) => a + b, 0);

  const eloData = rankingData ? (() => {
    const buckets = {};
    rankingData.rankings.forEach(r => {
      const bucket = Math.round(r.rating / 100) * 100;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([elo, count]) => ({ elo: Number(elo), count }));
  })() : [];

  const validTimes = decisionTimes.filter(t => t.time > 0 && t.time <= 60).map(t => t.time);
  const avgTime = validTimes.length > 0
    ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(1)
    : null;

  const rankingHistory = [...allRankings].slice(-8).map((r, i) => ({
    label: `#${i + 1}`,
    topSong: r.rankings?.[0]?.song?.title || "?",
    date: r.completedAt ? new Date(r.completedAt).toLocaleDateString() : "?",
    count: r.rankings?.length || 0,
  }));

  // Most indecisive songs: top 5 by avg decision time per song
  const songDecisionMap = {};
  decisionTimes.filter(t => t.time > 0 && t.time <= 60).forEach(t => {
    [t.winner, t.loser].filter(Boolean).forEach(title => {
      if (!songDecisionMap[title]) songDecisionMap[title] = [];
      songDecisionMap[title].push(t.time);
    });
  });
  const mostIndecisive = Object.entries(songDecisionMap)
    .map(([title, times]) => ({ title, avg: times.reduce((a, b) => a + b, 0) / times.length, count: times.length }))
    .filter(x => x.count >= 2)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  const isEmpty = totalPlays === 0 && decisionTimes.length === 0 && !rankingData;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <style>{`
        .aurora-stat { background: linear-gradient(135deg, #a78bfa, #67e8f9); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: stat-shift 4s ease infinite; }
        @keyframes stat-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="aurora-stat font-bold text-sm tracking-wider">STATS</h1>
        <div className="w-9" />
      </div>

      <div className="relative z-10 px-4 pb-24 space-y-6 mt-2">
        {isEmpty ? (
          <div className="text-center py-16">
            <BarChart3 className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">No stats yet</p>
            <p className="text-white/20 text-xs mt-1">Complete some rankings to see your stats here</p>
            <Link to={createPageUrl("Battle")} className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold">
              Start Ranking
            </Link>
          </div>
        ) : (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Song Plays", value: totalPlays, icon: Play, color: "text-violet-400" },
                { label: "Battles", value: decisionTimes.length, icon: Zap, color: "text-cyan-400" },
                { label: "Avg Decision", value: avgTime ? `${avgTime}s` : "—", icon: Clock, color: "text-green-400" },
              ].map(s => (
                <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1.5`} />
                  <div className="text-white font-black text-xl leading-none">{s.value}</div>
                  <div className="text-white/30 text-[9px] uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Most previewed */}
            {topPlayed.length > 0 && (
              <div>
                <h2 className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                  <Play className="w-3 h-3" /> Most Previewed
                </h2>
                <div className="space-y-1.5">
                  {topPlayed.map((song, i) => (
                    <div key={song.title} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-white/20 text-xs font-mono w-4 shrink-0 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm truncate font-medium">{song.title}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-violet-300 font-bold text-sm">{song.count}×</span>
                      </div>
                      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                          style={{ width: `${(song.count / topPlayed[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ELO Distribution */}
            {eloData.length > 0 && (
              <div>
                <h2 className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> ELO Distribution
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={eloData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <XAxis dataKey="elo" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontSize: 11 }}
                        formatter={(v) => [v, 'Songs']}
                        labelFormatter={(l) => `ELO ~${l}`}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {eloData.map((_, i) => (
                          <Cell key={i} fill={`rgba(139,92,246,${0.35 + (i / eloData.length) * 0.65})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Ranking History */}
            {rankingHistory.length > 0 && (
              <div>
                <h2 className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                  <Trophy className="w-3 h-3" /> Ranking History
                </h2>
                <div className="space-y-1.5">
                  {rankingHistory.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-white/20 text-xs font-mono w-5 shrink-0 text-center">{r.label}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-xs truncate">
                          <span className="text-yellow-400/70 font-semibold">#1: </span>{r.topSong}
                        </p>
                        <p className="text-white/25 text-[10px]">{r.date} · {r.count} songs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Indecisive Songs */}
            {mostIndecisive.length > 0 && (
              <div>
                <h2 className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Most Indecisive
                </h2>
                <div className="space-y-2">
                  {mostIndecisive.map((item, i) => (
                    <div key={item.title} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                      <span className="text-white/30 text-xs font-mono w-5 shrink-0 text-center">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm truncate font-medium">{item.title}</p>
                        <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden w-full">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                            style={{ width: `${(item.avg / (mostIndecisive[0]?.avg || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-amber-300 font-bold text-sm shrink-0">{item.avg.toFixed(1)}s</span>
                    </div>
                  ))}
                </div>
                <p className="text-white/20 text-[10px] mt-2">Songs with the most average hesitation time (min 2 battles)</p>
              </div>
            )}

            {/* Average decision time per battle session */}
            {validTimes.length > 0 && (
              <div>
                <h2 className="text-white/50 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Decision Time Breakdown
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Fastest", value: `${Math.min(...validTimes).toFixed(1)}s` },
                      { label: "Average", value: `${avgTime}s` },
                      { label: "Slowest", value: `${Math.min(60, Math.max(...validTimes)).toFixed(1)}s` },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="text-white font-black text-lg">{s.value}</div>
                        <div className="text-white/30 text-[10px] uppercase tracking-wider mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-white/20 text-[10px] text-center mt-3">Based on {validTimes.length} battles (outliers >60s excluded)</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}