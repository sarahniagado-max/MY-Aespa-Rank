import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Swords, Crown, Star, Medal, Music, ListMusic, BarChart3, Share2, Users, Trophy, GitCompare, Sparkles, RefreshCw } from "lucide-react";
import RankingItem from "../components/ranking/RankingItem";
import AlbumFilter from "../components/ranking/AlbumFilter";
import SongPreviewPlayer from "../components/ranking/SongPreviewPlayer";
import CompareSlideshow from "../components/ranking/CompareSlideshow";
import MiniAnalysis from "../components/ranking/MiniAnalysis";
import { useTintMode } from "../components/AlbumTintManager";

const COMPLETE_KEY = "aespa_ranking_complete";
const ALL_RANKINGS_KEY = "aespa_all_rankings";

export default function Results() {
  const tintMode = useTintMode();
  const [rankingData, setRankingData] = useState(null);
  const [filterAlbum, setFilterAlbum] = useState("all");
  const [allRankings, setAllRankings] = useState([]);
  const [compareIndex, setCompareIndex] = useState(null);
  const [showComparePicker, setShowComparePicker] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState("ranking"); // "ranking" | "playlist"
  const [topFilter, setTopFilter] = useState("all"); // "all" | "top5" | "top10"

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COMPLETE_KEY);
      if (saved) setRankingData(JSON.parse(saved));
    } catch {}

    const all = (() => {
      try { return JSON.parse(localStorage.getItem(ALL_RANKINGS_KEY) || "[]"); } catch { return []; }
    })();
    setAllRankings(all.reverse()); // newest first
  }, []);

  const rankings = rankingData?.rankings ?? [];
  const excludedTitles = rankingData?.excludedSongs ?? [];

  const albums = useMemo(() => {
    const seen = new Set();
    return rankings.map(r => r.song?.album).filter(a => a && !seen.has(a) && seen.add(a));
  }, [rankings]);

  const filteredRankings = filterAlbum === "all"
    ? rankings
    : rankings.filter(r => r.song?.album === filterAlbum);

  const topSong = rankings[0]?.song;
  const topRating = rankings[0]?.rating;
  const tiedAtOne = rankings.filter(r => r.rating === topRating);

  if (!rankingData) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-white/40 text-sm mb-6">No ranking completed yet</p>
          <Link to={createPageUrl("Battle")} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm">
            <Swords className="w-4 h-4" />
            Start Ranking
          </Link>
        </motion.div>
      </div>
    );
  }

  // Comparison data
  const compareRanking = compareIndex !== null ? allRankings[compareIndex] : null;

  const getRankChange = (song, currentRank) => {
    if (!compareRanking) return null;
    const prev = compareRanking.rankings.findIndex(r => r.song?.title === song.title);
    if (prev === -1) return "missing";
    return (prev + 1) - (currentRank);
  };

  const handleSelectCompare = (i) => {
    setCompareIndex(i);
    setShowComparePicker(false);
    setShowSlideshow(true);
  };

  // Playlist: top songs (sorted)
  const playlistSongs = rankings.slice(0, 20);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatePresence>
        {showAnalysis && (
          <MiniAnalysis allRankings={allRankings} onClose={() => setShowAnalysis(false)} />
        )}
        {showSlideshow && compareRanking && (
          <CompareSlideshow
            currentRankings={rankings}
            prevRanking={compareRanking}
            onClose={() => setShowSlideshow(false)}
          />
        )}
        {showComparePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end justify-center p-4"
            onClick={() => setShowComparePicker(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-sm bg-[#0c0c0c] border border-white/12 rounded-2xl p-5 max-h-[70vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-white font-bold text-base mb-1">Compare with a Past Ranking</p>
              <p className="text-white/40 text-xs mb-4">Select a ranking to compare with your current one</p>
              <div className="space-y-2">
                {allRankings.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectCompare(i)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <p className="text-white/90 font-semibold text-sm">{r.label || `Ranking ${allRankings.length - i}`}</p>
                    <p className="text-white/35 text-xs mt-0.5">
                      {new Date(r.completedAt).toLocaleDateString()}
                      {r.albumFilter && r.albumFilter !== "all" ? ` · ${r.albumFilter}` : ""}
                      {r.songTypeFilter && r.songTypeFilter !== "all" ? ` · ${r.songTypeFilter}` : ""}
                    </p>
                    <p className="text-white/20 text-xs">{r.rankings?.length} songs</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-violet-500/5 rounded-full blur-[180px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1
          className="aurora-results font-bold text-xs tracking-wider"
          style={tintMode === 'tint' ? { background: 'none', WebkitBackgroundClip: 'unset', WebkitTextFillColor: 'rgb(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b))', animation: 'none' } : undefined}
        >MY Aespa Rank</h1>
        <style>{`
          .aurora-results,.aurora-eq { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: aurora-shift 4s ease infinite; }
          @keyframes aurora-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
          @keyframes aurora-pulse { 0%,100%{box-shadow:0 0 0 2px rgba(167,139,250,0.6),0 0 0 5px rgba(103,232,249,0.25),0 0 30px rgba(167,139,250,0.3)} 50%{box-shadow:0 0 0 2px rgba(103,232,249,0.7),0 0 0 6px rgba(240,171,252,0.3),0 0 40px rgba(103,232,249,0.4)} }
          .aurora-ring-1 { animation: aurora-pulse 3s ease-in-out infinite; border: 2px solid transparent; background-clip: padding-box; outline: 2px solid transparent; }
          ${tintMode === 'tint' ? `
            .aurora-results,.aurora-eq { background: none !important; -webkit-background-clip: unset !important; background-clip: unset !important; -webkit-text-fill-color: rgb(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b)) !important; animation: none !important; }
            .aurora-ring-1 { animation: none !important; box-shadow: 0 0 0 2px rgb(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b)), 0 0 20px rgba(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b),0.3) !important; }
          ` : ''}
        `}</style>
        <div className="w-9" />
      </div>

      {/* Tabs */}
      <div className="relative z-10 px-4 py-2 flex gap-2">
        {[
          { id: "ranking", label: "Rankings", icon: Crown },
          { id: "playlist", label: "Playlist", icon: Music },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide border transition-all ${
              activeTab === tab.id
                ? "bg-violet-600 border-violet-500 text-white"
                : "bg-white/5 border-white/10 text-white/40"
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "ranking" && (
          <motion.div key="ranking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Hero - #1 Song */}
            {topSong && (
              <div className="relative z-10 px-6 pt-2 pb-4 text-center">
                <p
                  className="aurora-results font-black text-4xl mb-1"
                  style={tintMode === 'tint' ? { background: 'none', WebkitBackgroundClip: 'unset', WebkitTextFillColor: 'rgb(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b))', animation: 'none' } : undefined}
                >#1</p>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-semibold mb-3">
                  {tiedAtOne.length > 1 ? `${tiedAtOne.length}-Way Tie for #1` : "Your #1 Song"}
                </p>
                {tiedAtOne.length > 1 ? (
                  <>
                    <div className="flex justify-center gap-3 mb-3 flex-wrap">
                      {tiedAtOne.map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl aurora-ring-1">
                            {item.song?.cover_url ? <img src={item.song.cover_url} alt={item.song?.album} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/20 text-lg">♪</div>}
                          </div>
                          <p className="text-white font-bold text-sm mt-1">{item.song?.title}</p>
                          <p className="text-white/30 text-[10px] uppercase tracking-widest">{item.song?.album}</p>
                          <SongPreviewPlayer songTitle={item.song?.title} compact />
                        </div>
                      ))}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-[10px] font-bold uppercase tracking-widest">
                      🤝 Tied at #1
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden shadow-2xl aurora-ring-1 mb-3">
                      {topSong.cover_url ? <img src={topSong.cover_url} alt={topSong.album} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/20 text-2xl">♪</div>}
                    </div>
                    <h2 className="text-white font-black text-xl tracking-tight">{topSong.title}</h2>
                    <p className="text-white/30 text-xs uppercase tracking-widest mt-1">{topSong.album}</p>
                    <div className="mt-2 flex justify-center">
                      <SongPreviewPlayer songTitle={topSong.title} compact={false} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Rewatch reveal button */}
            <div className="relative z-10 px-4 pb-2 flex justify-center">
              <button
                onClick={() => window.location.href = "/RankingReveal"}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-violet-500/30 text-violet-300/70 text-[10px] font-bold uppercase tracking-wider hover:bg-violet-500/10 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Watch Ranking Reveal Again
              </button>
            </div>

            {/* small compare hint */}
            {compareRanking && (
              <div className="relative z-10 px-4 pb-2 flex items-center justify-between gap-2">
                <span className="text-cyan-400/60 text-[10px] font-semibold">Comparing vs {new Date(compareRanking.completedAt).toLocaleDateString()}</span>
                <button
                  onClick={() => setShowSlideshow(true)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300/80 text-[10px] font-bold uppercase tracking-wider hover:bg-cyan-500/25 transition-colors"
                >
                  <GitCompare className="w-3 h-3" />
                  View Slideshow
                </button>
              </div>
            )}

            {/* Tier indicators */}
            <div className="relative z-10 px-4 pb-3">
              <div className="flex gap-4 justify-center">
                <div className="flex items-center gap-1.5"><Crown className="w-3.5 h-3.5 text-violet-400" /><span className="text-white/30 text-[10px] uppercase tracking-wider">#1</span></div>
                <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-violet-400" /><span className="text-white/30 text-[10px] uppercase tracking-wider">Top 5</span></div>
                <div className="flex items-center gap-1.5"><Medal className="w-3.5 h-3.5 text-cyan-400" /><span className="text-white/30 text-[10px] uppercase tracking-wider">Top 10</span></div>
              </div>
            </div>

            {/* Top Filter Pills */}
            <div className="relative z-10 px-4 pt-2 flex gap-2">
              {[
                { id: "all", label: "All", icon: null },
                { id: "top5", label: "Top 5", icon: Star },
                ...(rankings.length > 10 ? [{ id: "top10", label: "Top 10", icon: Medal }] : []),
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setTopFilter(pill.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide border transition-all ${
                    topFilter === pill.id
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "bg-white/5 border-white/10 text-white/40"
                  }`}
                >
                  {pill.icon && <pill.icon className="w-3 h-3" />}
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Album Filter */}
            {(!rankingData.albumFilter || rankingData.albumFilter === "all") && (
              <div className="relative z-10 px-4 py-2">
                <AlbumFilter albums={albums} selectedAlbum={filterAlbum} onSelect={setFilterAlbum} />
              </div>
            )}

            {/* Rankings list */}
            <div className="relative z-10 px-4 mt-2">
              {(() => {
                let uniqueRankCounter = 0;
                let prevRating = null;
                let currentGroupRank = 0;
                return (topFilter === "top5" ? filteredRankings.slice(0, 5) : topFilter === "top10" ? filteredRankings.slice(0, 10) : filteredRankings).map((item, index) => {
                if (item.rating !== prevRating) {
                  uniqueRankCounter++;
                  currentGroupRank = uniqueRankCounter;
                }
                prevRating = item.rating;
                const displayRank = currentGroupRank;
                // Is this item part of a tie group?
                const isTied = filteredRankings.filter(x => x.rating === item.rating).length > 1;
                const isFirstOfTie = isTied && (index === 0 || filteredRankings[index - 1].rating !== item.rating);
                const isLastOfTie = isTied && (index === filteredRankings.length - 1 || filteredRankings[index + 1].rating !== item.rating);
                const change = getRankChange(item.song, displayRank);
                return (
                  <div
                    key={item.songIndex}
                    className={`relative flex items-center gap-2 ${
                      isTied
                        ? `${isFirstOfTie ? "mt-4 rounded-t-xl" : ""} ${isLastOfTie ? "rounded-b-xl mb-2" : ""} bg-violet-950/20 border-l-2 border-violet-500/40`
                        : "mb-2"
                    }`}
                  >
                    {/* Tie label on first of group */}
                    {isFirstOfTie && (
                      <div className="absolute -top-2 left-0 text-[11px] text-violet-400/70 font-bold uppercase tracking-widest px-1">Tied</div>
                    )}
                    <div className="flex-1">
                      <RankingItem song={item.song} rank={displayRank} eloRating={item.rating} index={index} />
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1 pr-1">
                      <SongPreviewPlayer songTitle={item.song?.title} compact />
                      {change !== null && (
                        change === "missing"
                          ? <span className="text-[8px] text-white/25 font-semibold text-right leading-tight max-w-[50px]">Not in prev.</span>
                          : <span className={`font-black ${change > 0 ? "text-green-400 text-[11px]" : change < 0 ? "text-red-400 text-[11px]" : "aurora-eq text-base"}`}>
                              {change > 0 ? `▲${change}` : change < 0 ? `▼${Math.abs(change)}` : "="}
                            </span>
                      )}
                    </div>
                  </div>
                );
              });
              })()}
            </div>

            {/* Excluded Songs Section */}
            {filterAlbum === "all" && (
              <div className="relative z-10 px-4 pb-28 mt-4">
                <div className="border border-white/8 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-white/[0.03]">
                    <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">
                      Songs Excluded from This Ranking
                    </p>
                  </div>
                  {excludedTitles && excludedTitles.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {excludedTitles.map((title, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="text-white/20 text-[10px]">—</span>
                          <span className="text-white/40 text-sm">{title}</span>
                          <span className="ml-auto text-[9px] text-white/20 font-semibold uppercase tracking-wider">Excluded</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-white/20 text-xs">No songs excluded</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "playlist" && (
          <motion.div key="playlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative z-10 px-4 pt-2 pb-2">
              <p className="text-white/30 text-xs">Your top {playlistSongs.length} songs — ranked by battle results</p>
            </div>
            <div className="relative z-10 px-4 pb-28 space-y-1">
              {playlistSongs.map((item, index) => (
                <motion.div
                  key={item.songIndex}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <span className="w-6 text-center text-white/20 text-sm font-mono shrink-0">{index + 1}</span>
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white/5">
                    {item.song?.cover_url
                      ? <img src={item.song.cover_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">♪</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm truncate font-medium">{item.song?.title}</p>
                    <p className="text-white/30 text-xs truncate">{item.song?.album}</p>
                  </div>
                  <ListMusic className="w-4 h-4 text-white/10 shrink-0" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="max-w-md mx-auto space-y-2">
          {/* Analysis button - shown when 5+ rankings */}
          {allRankings.length >= 5 && (
            <button
              onClick={() => setShowAnalysis(true)}
              className="w-full flex items-center justify-center gap-3 rounded-2xl font-bold uppercase tracking-widest transition-all mb-1"
              style={{
                padding: "14px 24px",
                fontSize: "0.75rem",
                border: "1.5px solid rgba(167,139,250,0.45)",
                background: "linear-gradient(135deg, rgba(30,14,60,0.95), rgba(20,10,40,0.98))",
                boxShadow: "0 0 20px rgba(167,139,250,0.2), inset 0 1px 0 rgba(167,139,250,0.1)",
                color: "rgba(196,181,253,0.92)",
              }}
            >
              <Sparkles className="w-4 h-4" />
              Ranking Analysis ({allRankings.length} Rankings)
            </button>
          )}
          {/* Big compare button - electric blue, NOT aurora */}
          {allRankings.length > 1 && (
            <button
              onClick={() => setShowComparePicker(true)}
              className="w-full flex items-center justify-center gap-3 rounded-2xl font-bold uppercase tracking-widest transition-all"
              style={{
                padding: "18px 24px",
                fontSize: "0.8rem",
                border: "1.5px solid rgba(56,189,248,0.55)",
                background: "linear-gradient(135deg, rgba(14,30,50,0.95), rgba(8,20,40,0.98))",
                boxShadow: "0 0 20px rgba(56,189,248,0.3), 0 0 40px rgba(56,189,248,0.12), inset 0 1px 0 rgba(56,189,248,0.1)",
                color: "rgba(147,220,255,0.92)",
              }}
            >
              <GitCompare className="w-5 h-5" />
              Compare with Past Ranking
            </button>
          )}
          <div className="flex gap-2">
            <Link
              to={createPageUrl("Battle")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
            >
              <Swords className="w-4 h-4" />
              Rank Again
            </Link>
            <Link to={createPageUrl("Analytics")} className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white transition-colors" title="Analytics">
              <BarChart3 className="w-4 h-4" />
            </Link>
            <Link to={createPageUrl("ShareCard")} className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white transition-colors" title="Share Card">
              <Share2 className="w-4 h-4" />
            </Link>
            <Link to={createPageUrl("Community")} className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white transition-colors" title="Community Compare">
              <Users className="w-4 h-4" />
            </Link>
            <Link to={createPageUrl("Achievements")} className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white transition-colors" title="Achievements">
              <Trophy className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}