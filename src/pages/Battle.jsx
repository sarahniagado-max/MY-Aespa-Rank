import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AnimatePresence as AP, motion as m } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, Undo2, SlidersHorizontal, X } from "lucide-react";
import { recordBattleResult, recordTieResult, recordDecisionTime, getBattleResults, setBattleResults } from "../components/battleStats";
import SongCard from "../components/ranking/SongCard";
import BattleProgress from "../components/ranking/BattleProgress";
import AlbumFilter from "../components/ranking/AlbumFilter";
import SongPreviewPlayer from "../components/ranking/SongPreviewPlayer";
import { useSongs } from "../components/ranking/useSongs";
import { getAlbumColor } from "../components/ranking/albumColors";

const CUSTOM_SONGS_KEY = "aespa_custom_songs";
import { checkAchievements } from "./Achievements";
import {
  calculateElo,
  calculateEloDraw,
  generateSmartBattlePairs,
  initializeRatings,
} from "../components/ranking/eloEngine";

// Hold button for last battle confirm
function HoldBtn({ children, onConfirm, disabled, className, style }) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);
  const startHold = (e) => {
    e.preventDefault();
    if (disabled) return;
    startRef.current = Date.now();
    const tick = () => {
      const p = Math.min(100, ((Date.now() - startRef.current) / 2000) * 100);
      setProgress(p);
      if (p < 100) { rafRef.current = requestAnimationFrame(tick); }
      else { onConfirm(); setProgress(0); }
    };
    rafRef.current = requestAnimationFrame(tick);
  };
  const cancelHold = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProgress(0);
  };
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
  return (
    <button onMouseDown={startHold} onMouseUp={cancelHold} onMouseLeave={cancelHold}
      onTouchStart={startHold} onTouchEnd={cancelHold}
      disabled={disabled} className={`relative overflow-hidden ${className}`} style={style}>
      {progress > 0 && <div className="absolute inset-0 origin-left" style={{ width: `${progress}%`, backgroundColor: 'rgba(255,255,255,0.15)', transition: 'none' }} />}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

const STORAGE_KEY = "aespa_ranking_state";
const COMPLETE_KEY = "aespa_ranking_complete";
const ALL_RANKINGS_KEY = "aespa_all_rankings";

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function Battle() {
  const navigate = useNavigate();
  const { songs: allDbSongs, loading: songsLoading } = useSongs();
  const rankAgainConfig0 = (() => { try { return JSON.parse(localStorage.getItem("aespa_rank_again") || "null"); } catch { return null; } })();
  const custom = (() => { try { return JSON.parse(localStorage.getItem(CUSTOM_SONGS_KEY) || "[]"); } catch { return []; } })();
  const songs = React.useMemo(() => {
    const all = [...allDbSongs, ...custom];
    if (rankAgainConfig0?.songTitles) {
      const set = new Set(rankAgainConfig0.songTitles);
      return all.filter(s => set.has(s.title));
    }
    return all;
  }, [allDbSongs, custom]);
  const [rankAgainConfig] = useState(() => {
    try {
      const r = JSON.parse(localStorage.getItem("aespa_rank_again") || "null");
      if (r) localStorage.removeItem("aespa_rank_again");
      return r || rankAgainConfig0;
    } catch { return null; }
  });
  const [albumFilter, setAlbumFilter] = useState("all");
  const [songTypeFilter, setSongTypeFilter] = useState("all");
  const [excludedSongs, setExcludedSongs] = useState(new Set());
  const [showExcludePanel, setShowExcludePanel] = useState(false);
  const [ratings, setRatings] = useState({});
  const [pairs, setPairs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [battleKey, setBattleKey] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [history, setHistory] = useState([]);
  const [tiedCards, setTiedCards] = useState(false);
  const battleStartTime = useRef(Date.now());
  const [showLastBattleBanner, setShowLastBattleBanner] = useState(false);
  const lastBattleShownRef = useRef(false);

  const getFilteredSongs = useCallback((album = albumFilter, typeFilter = songTypeFilter, excluded = excludedSongs) => {
    return songs.filter(s => {
      if (album !== "all" && s.album !== album) return false;
      if (typeFilter === "title_track" && s.song_type !== "title_track") return false;
      if (typeFilter === "b_side" && s.song_type !== "b_side") return false;
      if (typeFilter === "solo" && s.song_type !== "solo") return false;
      if (excluded.has(s.title)) return false;
      return true;
    });
  }, [songs, albumFilter, songTypeFilter, excludedSongs]);

  const initBattle = useCallback((songsToUse) => {
    if (songsToUse.length < 2) return;
    const ids = songsToUse.map((_, i) => i.toString());
    const newRatings = initializeRatings(ids);
    const newPairs = generateSmartBattlePairs(ids);
    setRatings(newRatings);
    setPairs(newPairs);
    setCurrentIndex(0);
    setBattleKey(k => k + 1);
    setHistory([]);
    saveState({ albumFilter, songTypeFilter, ratings: newRatings, pairs: newPairs, currentIndex: 0, history: [] });
  }, [albumFilter, songTypeFilter]);

  useEffect(() => {
    if (initialized) return;
    if (rankAgainConfig) {
      // "Rank these songs again" flow — ignore saved state, fresh session
      if (rankAgainConfig.albumFilter) setAlbumFilter(rankAgainConfig.albumFilter);
      if (rankAgainConfig.songTypeFilter) setSongTypeFilter(rankAgainConfig.songTypeFilter);
      const ids = songs.map((_, i) => i.toString());
      const newRatings = initializeRatings(ids);
      const newPairs = generateSmartBattlePairs(ids);
      setRatings(newRatings);
      setPairs(newPairs);
      setCurrentIndex(0);
      setHistory([]);
      setInitialized(true);
      return;
    }
    const saved = loadState();
    if (saved && saved.pairs && saved.pairs.length > 0) {
      setRatings(saved.ratings);
      setPairs(saved.pairs);
      setCurrentIndex(saved.currentIndex || 0);
      setHistory(saved.history || []);
      if (saved.albumFilter) setAlbumFilter(saved.albumFilter);
      if (saved.songTypeFilter) setSongTypeFilter(saved.songTypeFilter);
    } else {
      initBattle(getFilteredSongs());
    }
    setInitialized(true);
  }, [initialized, getFilteredSongs, initBattle, rankAgainConfig, songs]);

  const applyFilters = (album, typeFilter, newExcluded) => {
    newExcluded = newExcluded !== undefined ? newExcluded : excludedSongs;
    const excluded = album !== albumFilter ? new Set() : newExcluded;
    setAlbumFilter(album);
    setSongTypeFilter(typeFilter);
    if (album !== albumFilter) setExcludedSongs(new Set());
    const filtered = songs.filter(s => {
      if (album !== "all" && s.album !== album) return false;
      if (typeFilter === "title_track" && s.song_type !== "title_track") return false;
      if (typeFilter === "b_side" && s.song_type !== "b_side") return false;
      if (typeFilter === "solo" && s.song_type !== "solo") return false;
      if (excluded.has(s.title)) return false;
      return true;
    });
    if (filtered.length < 2) return;
    const ids = filtered.map((_, i) => i.toString());
    const newRatings = initializeRatings(ids);
    const newPairs = generateSmartBattlePairs(ids);
    setRatings(newRatings);
    setPairs(newPairs);
    setCurrentIndex(0);
    setBattleKey(k => k + 1);
    setHistory([]);
    saveState({ albumFilter: album, songTypeFilter: typeFilter, ratings: newRatings, pairs: newPairs, currentIndex: 0, history: [] });
  };

  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const handleRestart = () => {
    setShowRestartConfirm(true);
  };

  const confirmRestart = () => {
    setShowRestartConfirm(false);
    localStorage.removeItem(STORAGE_KEY);
    const filtered = getFilteredSongs();
    initBattle(filtered);
  };

  const getWinRate = (title, results) => {
    const r = (results || getBattleResults())[title] || {};
    const wins = r.wins || 0;
    const total = wins + (r.losses || 0) + (r.ties || 0);
    return total > 0 ? Math.round((wins / total) * 100) : null;
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRatings(prev.ratings);
    setCurrentIndex(prev.index);
    setBattleKey(k => k + 1);
    setHistory(h => h.slice(0, -1));
    if (prev.battleResults) setBattleResults(prev.battleResults);
    // Persist updated history so undo still works after navigation
    saveState({ albumFilter, songTypeFilter, ratings: prev.ratings, pairs, currentIndex: prev.index, history: history.slice(0, -1) });
  };

  const handleTie = () => {
    if (currentIndex >= pairs.length) return;
    const elapsed = (Date.now() - battleStartTime.current) / 1000;
    setTiedCards(true);
    setTimeout(() => {
      setTiedCards(false);
      const [aId, bId] = pairs[currentIndex];
      const currentSongs = getFilteredSongs();
      const songATitle = currentSongs[parseInt(aId)]?.title;
      const songBTitle = currentSongs[parseInt(bId)]?.title;
      const preBattleResults = getBattleResults();
      recordTieResult(songATitle, songBTitle);
      recordDecisionTime(songATitle, songBTitle, elapsed);
      const result = calculateEloDraw(ratings[aId] || 1400, ratings[bId] || 1400);
      const newRatings = { ...ratings, [aId]: result.a, [bId]: result.b };
      advanceBattle(newRatings, preBattleResults);
    }, 700);
  };

  const handleSelect = (winnerId) => {
    if (currentIndex >= pairs.length) return;
    const elapsed = (Date.now() - battleStartTime.current) / 1000;
    const [aId, bId] = pairs[currentIndex];
    const loserId = winnerId === aId ? bId : aId;
    const currentSongsForSelect = getFilteredSongs();
    const winnerTitle = currentSongsForSelect[parseInt(winnerId)]?.title;
    const loserTitle = currentSongsForSelect[parseInt(loserId)]?.title;
    const preBattleResults = getBattleResults();
    recordBattleResult(winnerTitle, loserTitle);
    recordDecisionTime(winnerTitle, loserTitle, elapsed);
    const result = calculateElo(ratings[winnerId] || 1400, ratings[loserId] || 1400);
    const newRatings = { ...ratings, [winnerId]: result.winner, [loserId]: result.loser };
    advanceBattle(newRatings, preBattleResults);
  };

  const advanceBattle = (newRatings, preBattleResults) => {
    const nextIndex = currentIndex + 1;
    battleStartTime.current = Date.now();
    setHistory(h => [...h.slice(-19), { ratings, index: currentIndex, battleResults: preBattleResults }]);
    setRatings(newRatings);
    setCurrentIndex(nextIndex);
    setBattleKey(k => k + 1);

    if (nextIndex >= pairs.length) {
      const songsToUse = getFilteredSongs();
      const rankedData = Object.entries(newRatings)
        .sort(([, a], [, b]) => b - a)
        .map(([id, rating]) => ({
          songIndex: parseInt(id),
          song: songsToUse[parseInt(id)],
          rating,
        }));

      const newEntry = {
        rankings: rankedData,
        albumFilter,
        songTypeFilter,
        excludedSongs: Array.from(excludedSongs),
        completedAt: new Date().toISOString(),
        label: `Ranking ${new Date().toLocaleDateString()}`,
      };

      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(COMPLETE_KEY, JSON.stringify(newEntry));
      const allRankings = (() => {
        try { return JSON.parse(localStorage.getItem(ALL_RANKINGS_KEY) || "[]"); } catch { return []; }
      })();
      allRankings.push(newEntry);
      localStorage.setItem(ALL_RANKINGS_KEY, JSON.stringify(allRankings));
      checkAchievements(newEntry, allRankings);
      localStorage.removeItem("aespa_ranking_name");
      navigate(createPageUrl("RankingReveal"));
      return;
    } else {
      saveState({ albumFilter, songTypeFilter, ratings: newRatings, pairs, currentIndex: nextIndex, history: [...history.slice(-19), { ratings, index: currentIndex }] });
    }
  };

  const songsToUse = getFilteredSongs();
  const currentPair = pairs[currentIndex];
  const songA = currentPair ? songsToUse[parseInt(currentPair[0])] : null;
  const songB = currentPair ? songsToUse[parseInt(currentPair[1])] : null;
  const isLastBattle = pairs.length > 0 && currentIndex === pairs.length - 1;

  useEffect(() => {
    if (isLastBattle && !lastBattleShownRef.current) {
      lastBattleShownRef.current = true;
      setShowLastBattleBanner(true);
      const t = setTimeout(() => setShowLastBattleBanner(false), 3500);
      return () => clearTimeout(t);
    }
    if (!isLastBattle) lastBattleShownRef.current = false;
  }, [isLastBattle]);
  const albums = useMemo(() => {
    const seen = new Set();
    return songs.filter(s => { if (seen.has(s.album)) return false; seen.add(s.album); return true; }).map(s => s.album);
  }, [songs]);
  const notEnough = songsToUse.length < 2;

  const activeFilterLabel = () => {
    if (songTypeFilter === "title_track") return "🎯 Title Tracks";
    if (songTypeFilter === "b_side") return "💿 B-Sides";
    if (songTypeFilter === "solo") return "⭐ Solos";
    if (albumFilter !== "all") return `💿 ${albumFilter}`;
    return null;
  };

  if (songsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      <style>{`
        .aurora-title {
          background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: aurora-shift 4s ease infinite;
        }
        @keyframes aurora-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .aurora-btn {
          border: 1.5px solid transparent;
          background: linear-gradient(#000, #000) padding-box,
                      linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399) border-box;
          box-shadow: 0 0 8px rgba(167,139,250,0.2), 0 0 16px rgba(103,232,249,0.1);
        }
        .aurora-btn:hover {
          box-shadow: 0 0 12px rgba(167,139,250,0.35), 0 0 24px rgba(103,232,249,0.2);
        }
        .aurora-btn-active {
          border: 1.5px solid transparent;
          background: linear-gradient(135deg, rgba(167,139,250,0.25), rgba(103,232,249,0.15)) padding-box,
                      linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399) border-box;
          box-shadow: 0 0 12px rgba(167,139,250,0.4), 0 0 24px rgba(103,232,249,0.2);
        }
      `}</style>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Last battle banner */}
      <AP>
        {showLastBattleBanner && (
          <m.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-3 px-4 bg-gradient-to-r from-violet-600 to-cyan-500"
          >
            <span className="text-white font-black text-sm uppercase tracking-widest">⚔️ This is your last battle!</span>
          </m.div>
        )}
      </AP>

      {/* Restart confirm overlay */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="w-full max-w-xs bg-[#0e0e0e] border border-white/12 rounded-2xl p-6 text-center">
            <p className="text-white font-bold text-base mb-2">Restart Ranking?</p>
            <p className="text-white/40 text-xs mb-5 leading-relaxed">This will reset your current session only. Your saved rankings will not be affected.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-white/12 text-white/50 font-semibold text-sm hover:bg-white/5 transition-colors"
              >Cancel</button>
              <button
                onClick={confirmRestart}
                className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-colors aurora-btn-active"
              >Restart</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <h1 className="aurora-title font-black text-sm tracking-wider">MY Aespa Rank</h1>
        </div>
        <button
          onClick={handleRestart}
          className="p-2 -mr-2 text-white/40 hover:text-red-400 transition-colors text-xs font-semibold uppercase tracking-wider"
        >
          Reset
        </button>
      </div>

      {/* Album Filter */}
      <div className="relative z-10 px-4 pt-1">
        <AlbumFilter
          albums={albums}
          selectedAlbum={albumFilter}
          onSelect={(album) => applyFilters(album, songTypeFilter)}
        />
      </div>

      {/* Filter Mode Buttons */}
      <div className="relative z-10 px-4 pt-2 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
        {[
          { key: "all", label: albumFilter !== "all" ? "All Tracks" : "All Songs" },
          { key: "title_track", label: "🎯 Titles" },
          { key: "b_side", label: "💿 B-Sides" },
          ...(albumFilter === "all" ? [{ key: "solo", label: "⭐ Solos" }] : []),
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => applyFilters(albumFilter, key)}
            className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
              songTypeFilter === key
                ? "aurora-btn-active text-white"
                : "aurora-btn text-white/55 hover:text-white/80"
            }`}
          >
            {label}
          </button>
        ))}

        <button
          onClick={() => setShowExcludePanel(v => !v)}
          className={`shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
            excludedSongs.size > 0
              ? "bg-red-900/40 border border-red-500/40 text-red-300"
              : "aurora-btn text-white/55 hover:text-white/80"
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Exclude{excludedSongs.size > 0 ? ` (${excludedSongs.size})` : ""}
        </button>
      </div>

      {activeFilterLabel() && (
        <div className="relative z-10 px-4 pb-1">
          <span className="text-[10px] text-cyan-400/70 font-semibold">{activeFilterLabel()} · {songsToUse.length} songs</span>
        </div>
      )}

      <AnimatePresence>
        {showExcludePanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-20 overflow-hidden"
          >
            <div className="mx-4 mb-2 p-3 bg-black/80 border border-white/10 rounded-xl max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">Tap to exclude songs</p>
                <button onClick={() => setShowExcludePanel(false)}>
                  <X className="w-4 h-4 text-white/30" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {songs.filter(s => {
                  if (albumFilter !== "all" && s.album !== albumFilter) return false;
                  if (songTypeFilter === "title_track" && s.song_type !== "title_track") return false;
                  if (songTypeFilter === "b_side" && s.song_type !== "b_side") return false;
                  if (songTypeFilter === "solo" && s.song_type !== "solo") return false;
                  return true;
                }).map(song => {
                  const isExcluded = excludedSongs.has(song.title);
                  const wouldLeaveEnough = (() => {
                    if (isExcluded) return true;
                    const remaining = songsToUse.filter(s => s.title !== song.title);
                    return remaining.length >= 2;
                  })();
                  const ac = getAlbumColor(song.album);
                  return (
                    <button
                      key={song.title}
                      disabled={!isExcluded && !wouldLeaveEnough}
                      onClick={() => {
                        const next = new Set(excludedSongs);
                        if (next.has(song.title)) {
                          next.delete(song.title);
                        } else {
                          if (!wouldLeaveEnough) return;
                          next.add(song.title);
                        }
                        setExcludedSongs(next);
                        applyFilters(albumFilter, songTypeFilter, next);
                      }}
                      style={isExcluded ? {} : !wouldLeaveEnough ? {} : {
                        backgroundColor: `rgba(${ac.rgb}, 0.15)`,
                        borderColor: `rgba(${ac.rgb}, 0.5)`,
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] border transition-all ${
                        isExcluded
                          ? "bg-red-900/50 border-red-500/40 text-red-300 line-through"
                          : !wouldLeaveEnough
                            ? "bg-white/2 border-white/5 text-white/20 cursor-not-allowed"
                            : "text-white/75 hover:opacity-80"
                      }`}
                    >
                      {song.title}
                    </button>
                  );
                })}
              </div>
              {excludedSongs.size > 0 && (
                <button
                  onClick={() => { const empty = new Set(); setExcludedSongs(empty); applyFilters(albumFilter, songTypeFilter, empty); }}
                  className="mt-2 text-[10px] text-white/30 underline"
                >
                  Clear all exclusions & restart
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 px-4 py-1">
        <BattleProgress current={currentIndex} total={pairs.length} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 relative z-10">
        {notEnough ? (
          <div className="text-center px-6">
            <p className="text-white/40 text-sm mb-2">Not enough songs to battle</p>
            <p className="text-white/20 text-xs">At least 2 songs are required. Try changing your filters.</p>
          </div>
        ) : songA && songB ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={battleKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md"
            >
              <div className="flex items-center justify-center mb-3">
                <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">
                  Which do you prefer?
                </span>
              </div>

              <div className="flex justify-around mb-3 px-2">
                <SongPreviewPlayer songTitle={songA.title} songData={songA} playerKey={`A-${battleKey}`} />
                <SongPreviewPlayer songTitle={songB.title} songData={songB} playerKey={`B-${battleKey}`} />
              </div>

              <div className="grid grid-cols-2 gap-3 relative">
                {isLastBattle ? (
                  <>
                    {/* Last battle: card not clickable — hold the Select pill to confirm */}
                    <SongCard song={songA} side="left" onClick={null} tied={tiedCards} winRateOverride={getWinRate(songA?.title, history[history.length - 1]?.battleResults)} onHoldConfirm={!tiedCards ? () => handleSelect(currentPair[0]) : undefined} />
                    <SongCard song={songB} side="right" onClick={null} tied={tiedCards} winRateOverride={getWinRate(songB?.title, history[history.length - 1]?.battleResults)} onHoldConfirm={!tiedCards ? () => handleSelect(currentPair[1]) : undefined} />
                  </>
                ) : (
                  <>
                    <SongCard song={songA} side="left" onClick={() => !tiedCards && handleSelect(currentPair[0])} tied={tiedCards} winRateOverride={getWinRate(songA?.title, history[history.length - 1]?.battleResults)} />
                    <SongCard song={songB} side="right" onClick={() => !tiedCards && handleSelect(currentPair[1])} tied={tiedCards} winRateOverride={getWinRate(songB?.title, history[history.length - 1]?.battleResults)} />
                  </>
                )}
                {tiedCards && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <span className="text-white font-black text-lg tracking-widest bg-black/70 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
                      Tied
                    </span>
                  </div>
                )}
              </div>


              <div className="flex justify-center mt-4 gap-2">
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  style={history.length === 0 ? { pointerEvents: 'none' } : {}}
                  className={`px-3 py-1.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                    history.length > 0
                      ? "aurora-btn text-white/60 hover:text-white/90"
                      : "border border-white/5 bg-transparent text-white/15 cursor-not-allowed"
                  }`}
                >
                  <Undo2 className="w-3 h-3" />
                  Back
                </button>

                <div className="aurora-btn flex items-center gap-2 px-4 py-1.5 rounded-full">
                  <Zap className="w-3 h-3 text-violet-400" />
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">vs</span>
                  <Zap className="w-3 h-3 text-cyan-400" />
                </div>

                {isLastBattle ? (
                  <HoldBtn
                    onConfirm={handleTie}
                    className="aurora-btn px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/60"
                  >
                    🤝 Tie
                  </HoldBtn>
                ) : (
                  <button
                    onClick={handleTie}
                    className="aurora-btn px-3 py-1.5 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white/90"
                  >
                    🤝 Tie
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    </div>
  );
}