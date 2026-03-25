import db from "../api/base44Client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, X, Zap, BarChart2, Trophy, BookOpen, Trash2, HelpCircle, Pencil, ImageIcon } from "lucide-react";
import MoodWalkthrough from "../components/MoodWalkthrough";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useSongs } from "../components/ranking/useSongs";
import CoverImg from "../components/ranking/CoverImg";
import MoodBattlePhase from "../components/MoodBattlePhase";
import MoodReveal from "../components/MoodReveal";

const DEFAULT_MOODS = [
  { id: "sad", name: "Sad", color: "#6B96C8" },
  { id: "hype", name: "Hype", color: "#FF6B6B" },
  { id: "chill", name: "Chill", color: "#6EE7B7" },
  { id: "nostalgic", name: "Nostalgic", color: "#A855F7" },
];

const MOODS_LS_KEY = "aespa_mood_list";

function loadMoodList() {
  try {
    const d = JSON.parse(localStorage.getItem(MOODS_LS_KEY) || "null");
    if (Array.isArray(d)) return d;
  } catch {}
  return DEFAULT_MOODS;
}

function saveMoodList(moods) {
  localStorage.setItem(MOODS_LS_KEY, JSON.stringify(moods));
}

function parseJson(s, fallback) {
  try { return JSON.parse(s || "null") || fallback; } catch { return fallback; }
}

export default function MoodRanking() {
  const { songs, loading: songsLoading } = useSongs();
  const queryClient = useQueryClient();

  const [moodList, setMoodList] = useState(loadMoodList);
  const [tab, setTab] = useState("active"); // "active" | "saved"
  const [view, setView] = useState("home"); // "home" | "battle" | "reveal"
  const [activeMoodId, setActiveMoodId] = useState(null);
  const [showCreateMood, setShowCreateMood] = useState(false);
  const [newMoodName, setNewMoodName] = useState("");
  const [newMoodColor, setNewMoodColor] = useState("#a78bfa");
  const [confirmDeleteMood, setConfirmDeleteMood] = useState(null);
  const [confirmDeleteSaved, setConfirmDeleteSaved] = useState(null);
  const [editingSavedId, setEditingSavedId] = useState(null);
  const [editSavedName, setEditSavedName] = useState("");
  const [imageUploadRankingId, setImageUploadRankingId] = useState(null);
  const moodCoverFileRef = useRef(null);
  const [revealData, setRevealData] = useState(null); // { eloRatings, eliminatedIds, mood }
  const [userEmail, setUserEmail] = useState(null);
  const [showWalkthrough, setShowWalkthrough] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("walkthrough") === "1";
  });

  // Palette of distinct colors to auto-suggest
  const COLOR_PALETTE = ["#a78bfa","#67e8f9","#f0abfc","#34d399","#fb7185","#fbbf24","#60a5fa","#f97316","#e879f9","#4ade80"];
  const getAutoColor = () => {
    const used = new Set(moodList.map(m => m.color.toLowerCase()));
    return COLOR_PALETTE.find(c => !used.has(c.toLowerCase())) || COLOR_PALETTE[moodList.length % COLOR_PALETTE.length];
  };

  useEffect(() => {
    db.auth.me().then(u => setUserEmail(u?.email)).catch(() => {});
  }, []);

  const { data: dbRankings = [] } = useQuery({
    queryKey: ["moodRankings", userEmail],
    queryFn: () => db.entities.MoodRanking.filter({ user_id: userEmail }),
    enabled: !!userEmail,
  });

  const updateRankingMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.MoodRanking.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["moodRankings", userEmail] }),
  });

  const createRankingMutation = useMutation({
    mutationFn: (data) => db.entities.MoodRanking.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["moodRankings", userEmail] }),
  });

  const deleteRankingMutation = useMutation({
    mutationFn: (id) => db.entities.MoodRanking.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["moodRankings", userEmail] }),
  });

  // Active rankings = not complete. Saved = complete.
  const activeRankings = dbRankings.filter(r => !r.is_complete);
  const savedRankings = dbRankings.filter(r => r.is_complete);

  const getRanking = (moodId) => {
    const matches = activeRankings.filter(r => r.mood_id === moodId);
    if (matches.length === 0) return undefined;
    return matches.reduce((best, r) => ((r.phase || 1) > (best.phase || 1) ? r : best));
  };

  const handleSave = useCallback(async (moodId, updates) => {
    if (!userEmail) return;
    const existing = getRanking(moodId);
    if (existing) {
      await updateRankingMutation.mutateAsync({ id: existing.id, data: updates });
    } else {
      await createRankingMutation.mutateAsync({ mood_id: moodId, user_id: userEmail, ...updates });
    }
  }, [userEmail, activeRankings]);

  const handlePhase1Complete = useCallback(async (winnerIds) => {
    if (!userEmail || !activeMoodId) return;
    const fresh = await db.entities.MoodRanking.filter({ mood_id: activeMoodId, user_id: userEmail });
    const existing = fresh.find(r => !r.is_complete) || fresh[0];
    const updates = { phase: 2, phase1_winners: JSON.stringify(winnerIds) };
    if (existing) {
      await updateRankingMutation.mutateAsync({ id: existing.id, data: updates });
    } else {
      await createRankingMutation.mutateAsync({ mood_id: activeMoodId, user_id: userEmail, ...updates });
    }
    queryClient.invalidateQueries({ queryKey: ["moodRankings", userEmail] });
  }, [userEmail, activeMoodId]);

  const handlePhase2Complete = useCallback(async (finalElo) => {
    const existing = getRanking(activeMoodId);
    const activeMood = moodList.find(m => m.id === activeMoodId);
    if (existing) {
      // Archive this ranking
      await updateRankingMutation.mutateAsync({
        id: existing.id,
        data: {
          elo_ratings: JSON.stringify(finalElo),
          is_complete: true,
          mood_name: activeMood?.name || "",
          mood_color: activeMood?.color || "",
          completed_at: new Date().toISOString(),
        }
      });
    }
    setRevealData({ eloRatings: finalElo, eliminatedIds: parseJson(existing?.phase1_eliminated, []), mood: activeMood });
    setView("reveal");
    queryClient.invalidateQueries({ queryKey: ["moodRankings", userEmail] });
  }, [activeMoodId, activeRankings, moodList, userEmail]);

  const handleCreateMood = () => {
    const name = newMoodName.trim();
    if (!name) return;
    const id = `custom_${Date.now()}`;
    const updated = [...moodList, { id, name, color: newMoodColor }];
    setMoodList(updated);
    saveMoodList(updated);
    setNewMoodName("");
    setNewMoodColor(getAutoColor());
    setShowCreateMood(false);
  };

  const handleDeleteMood = (moodId) => {
    const updated = moodList.filter(m => m.id !== moodId);
    setMoodList(updated);
    saveMoodList(updated);
  };

  const handleReset = useCallback(async (moodId) => {
    if (!userEmail) return;
    const existing = activeRankings.find(r => r.mood_id === moodId);
    const resetData = {
      elo_ratings: JSON.stringify({}),
      phase1_seen_songs: JSON.stringify([]),
      phase1_winners: JSON.stringify([]),
      phase1_eliminated: JSON.stringify([]),
      battles_completed: 0,
      phase: 1,
    };
    if (existing) {
      await updateRankingMutation.mutateAsync({ id: existing.id, data: resetData });
    } else {
      await createRankingMutation.mutateAsync({ mood_id: moodId, user_id: userEmail, ...resetData });
    }
    setView("home");
  }, [userEmail, activeRankings]);

  const handleSaveMoodRename = async (ranking) => {
    const name = editSavedName.trim();
    if (!name) return;
    await updateRankingMutation.mutateAsync({ id: ranking.id, data: { mood_name: name } });
    setEditingSavedId(null);
  };

  const handleMoodCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !imageUploadRankingId) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await updateRankingMutation.mutateAsync({ id: imageUploadRankingId, data: { notes: ev.target.result } });
      setImageUploadRankingId(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleResetPhase2 = useCallback(async (moodId) => {
    if (!userEmail) return;
    const existing = activeRankings.find(r => r.mood_id === moodId);
    if (!existing) return;
    await updateRankingMutation.mutateAsync({
      id: existing.id,
      data: {
        elo_ratings: JSON.stringify({}),
        battles_completed: 0,
        phase: 2, // stay in phase 2 but reset battles
      }
    });
    setView("home");
  }, [userEmail, activeRankings]);

  const activeMood = moodList.find(m => m.id === activeMoodId);

  if (songsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (view === "battle" && activeMood) {
    const ranking = getRanking(activeMoodId);
    const phase = ranking?.phase || 1;
    return (
      <MoodBattlePhase
        mood={activeMood}
        songs={songs}
        rankingData={ranking || null}
        phase={phase}
        onBack={() => setView("home")}
        onSave={(updates) => handleSave(activeMoodId, updates)}
        onPhase1Complete={handlePhase1Complete}
        onPhase2Complete={handlePhase2Complete}
        onReset={() => handleReset(activeMoodId)}
        onResetPhase2={() => handleResetPhase2(activeMoodId)}
      />
    );
  }

  if (view === "reveal" && revealData) {
    return (
      <MoodReveal
        mood={revealData.mood}
        eloRatings={revealData.eloRatings}
        eliminatedIds={revealData.eliminatedIds || []}
        songs={songs}
        onBack={() => { setView("home"); setRevealData(null); }}
        skipIntro={revealData.skipIntro || false}
      />
    );
  }

  // Home view
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <input ref={moodCoverFileRef} type="file" accept="image/*" className="hidden" onChange={handleMoodCoverUpload} />
      <style>{`
        .mood-aurora { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: mood-shift 4s ease infinite; }
        @keyframes mood-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .aurora-confirm-btn { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399); background-size: 300% 300%; animation: mood-shift 3s ease infinite; color: #000; font-weight: 800; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to="/Home" className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowWalkthrough(true)} className="p-2 text-white/30 hover:text-violet-400 transition-colors">
            <HelpCircle className="w-4 h-4" />
          </button>
          <h1 className="mood-aurora font-bold text-sm tracking-wider">MOOD RANKING</h1>
          <button onClick={() => { setNewMoodColor(getAutoColor()); setShowCreateMood(true); }} className="p-2 text-white/40 hover:text-violet-400 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      {showWalkthrough && <MoodWalkthrough onClose={() => setShowWalkthrough(false)} />}

      {/* Tabs */}
      <div className="relative z-10 px-4 pb-3 flex gap-2">
        <button
          onClick={() => setTab("active")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${tab === "active" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
        >
          Active
        </button>
        <button
          onClick={() => setTab("saved")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${tab === "saved" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
        >
          <BookOpen className="w-3 h-3" />
          Saved Rankings {savedRankings.length > 0 && <span className="text-[9px] bg-violet-500/40 px-1.5 py-0.5 rounded-full">{savedRankings.length}</span>}
        </button>
      </div>

      {tab === "active" && (
        <div className="relative z-10 px-4 pb-24 space-y-3">
          <p className="text-white/30 text-xs mb-2">Phase 1: discover songs. Phase 2: battle your picks.</p>
          {moodList.map(mood => {
            const ranking = getRanking(mood.id);
            const phase = ranking?.phase || 1;
            const seenIds = parseJson(ranking?.phase1_seen_songs, []);
            const winnerIds = parseJson(ranking?.phase1_winners, []);
            const seenCount = seenIds.length;
            const totalCount = songs.length;
            const battles = ranking?.battles_completed || 0;
            const isDefault = DEFAULT_MOODS.some(d => d.id === mood.id);
            const eloMap = parseJson(ranking?.elo_ratings, {});
            const topSongs = Object.entries(eloMap)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([id]) => songs.find(s => s.id === id))
              .filter(Boolean);

            return (
              <motion.div
                key={mood.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border overflow-hidden"
                style={{ borderColor: `${mood.color}30`, backgroundColor: `${mood.color}08` }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: mood.color }} />
                      <span className="text-white font-bold text-base">{mood.name}</span>
                      <span className="text-white/25 text-[10px] font-mono">
                        {phase === 1 ? `Phase 1 · ${seenCount}/${totalCount} seen` : `Phase 2 · ${winnerIds.length} songs`}
                      </span>
                    </div>
                    <div className="flex gap-1 items-center">
                      {!isDefault && (
                        <button onClick={() => setConfirmDeleteMood(mood)} className="p-1 text-white/20 hover:text-red-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {phase === 2 && battles > 0 && (
                        <button
                          onClick={() => {
                            setActiveMoodId(mood.id);
                            setRevealData({ eloRatings: eloMap, eliminatedIds: parseJson(ranking?.phase1_eliminated, []), mood });
                            setView("reveal");
                          }}
                          className="p-1 text-white/20 hover:text-white/60 transition-colors"
                          title="View ranking"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {phase === 1 && seenCount > 0 && (
                    <div className="mb-3">
                      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(seenCount / totalCount) * 100}%`, backgroundColor: mood.color }}
                        />
                      </div>
                      <p className="text-white/20 text-[9px] mt-1">{totalCount - seenCount} songs left to discover</p>
                    </div>
                  )}

                  {topSongs.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {topSongs.map((song, i) => (
                        <div key={song.id} className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-white/20 text-[9px] font-mono shrink-0">#{i + 1}</span>
                          <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 bg-white/5">
                            <CoverImg src={song.cover_url} alt="" className="w-full h-full object-cover" fallbackClass="w-full h-full bg-white/10" fallbackContent="" />
                          </div>
                          <p className="text-white/60 text-[10px] truncate">{song.title}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {topSongs.length === 0 && phase === 1 && (
                    <p className="text-white/20 text-xs mb-3">Start Phase 1 to discover your "{mood.name}" songs!</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setActiveMoodId(mood.id); setView("battle"); }}
                      className="flex-1 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
                      style={{ backgroundColor: `${mood.color}22`, border: `1.5px solid ${mood.color}55`, color: mood.color }}
                    >
                      <Zap className="w-3.5 h-3.5 inline mr-1.5" />
                      {phase === 2 ? "Continue Phase 2" : seenCount === 0 ? "Start Phase 1" : seenCount >= totalCount ? "Continue Phase 1" : "Continue Phase 1"}
                    </button>
                    {/* View Results button — only if Phase 2 has battles */}
                    {phase === 2 && battles > 0 && (
                      <button
                        onClick={() => {
                          setActiveMoodId(mood.id);
                          setRevealData({ eloRatings: eloMap, eliminatedIds: parseJson(ranking?.phase1_eliminated, []), mood, skipIntro: true });
                          setView("reveal");
                        }}
                        className="px-3 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all"
                        style={{ borderColor: `${mood.color}40`, color: `${mood.color}99` }}
                        title="View Results"
                      >
                        <BarChart2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {tab === "saved" && (
        <div className="relative z-10 px-4 pb-24 space-y-3">
          {savedRankings.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-white/40 text-sm">No saved rankings yet.</p>
              <p className="text-white/20 text-xs mt-1">Complete Phase 2 for any mood to see it here.</p>
            </div>
          ) : (
            savedRankings.sort((a, b) => new Date(b.completed_at || b.created_date) - new Date(a.completed_at || a.created_date)).map(ranking => {
              const moodName = ranking.mood_name || ranking.mood_id;
              const moodColor = ranking.mood_color || "#a78bfa";
              const eloMap = parseJson(ranking.elo_ratings, {});
              const winnerIds = parseJson(ranking.phase1_winners, []);
              const eliminatedIds = parseJson(ranking.phase1_eliminated, []);
              const topEntry = Object.entries(eloMap).sort(([, a], [, b]) => b - a)[0];
              const topSong = topEntry ? songs.find(s => s.id === topEntry[0]) : null;
              const completedDate = ranking.completed_at
                ? new Date(ranking.completed_at).toLocaleDateString()
                : new Date(ranking.created_date).toLocaleDateString();

              return (
                <motion.div
                  key={ranking.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: `${moodColor}30`, backgroundColor: `${moodColor}06` }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        {editingSavedId === ranking.id ? (
                          <div className="flex gap-2 items-center mb-1">
                            <input
                              autoFocus
                              value={editSavedName}
                              onChange={e => setEditSavedName(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") handleSaveMoodRename(ranking); if (e.key === "Escape") setEditingSavedId(null); }}
                              className="flex-1 bg-white/10 border border-violet-500/40 rounded-lg px-2 py-1 text-white text-sm focus:outline-none"
                            />
                            <button onClick={() => handleSaveMoodRename(ranking)} className="px-2 py-1 rounded-lg bg-violet-600 text-white text-xs font-semibold">Save</button>
                            <button onClick={() => setEditingSavedId(null)} className="px-2 py-1 rounded-lg bg-white/10 text-white/50 text-xs">×</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: moodColor }} />
                            <span className="text-white font-bold text-base truncate">{moodName}</span>
                            <button onClick={() => { setEditingSavedId(ranking.id); setEditSavedName(moodName); }} className="p-0.5 text-white/20 hover:text-white/60 transition-colors shrink-0">
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-white/25 text-[10px]">Completed {completedDate} · {winnerIds.length} songs ranked</p>
                      </div>
                      <button
                        onClick={() => setConfirmDeleteSaved(ranking)}
                        className="p-1 text-white/20 hover:text-violet-400 transition-colors ml-2 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      {/* Clickable cover pic area */}
                      <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden relative group cursor-pointer"
                        onClick={() => { setImageUploadRankingId(ranking.id); moodCoverFileRef.current?.click(); }}
                      >
                        {(ranking.notes?.startsWith('data:image') || topSong?.cover_url) ? (
                          <img src={ranking.notes?.startsWith('data:image') ? ranking.notes : topSong?.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20 text-xl">♪</div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ImageIcon className="w-4 h-4 text-white/70" />
                        </div>
                      </div>
                      {topSong && (
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold block" style={{ color: moodColor }}>#1 Song</span>
                          <p className="text-white/80 text-xs font-semibold truncate">{topSong.title}</p>
                          <p className="text-white/30 text-[10px] truncate">{topSong.album}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const mood = moodList.find(m => m.id === ranking.mood_id) || { id: ranking.mood_id, name: moodName, color: moodColor };
                          setRevealData({ eloRatings: eloMap, eliminatedIds, mood, skipIntro: true });
                          setView("reveal");
                        }}
                        className="flex-1 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                        style={{ backgroundColor: `${moodColor}18`, border: `1.5px solid ${moodColor}40`, color: moodColor }}
                      >
                        <Trophy className="w-3 h-3 inline mr-1" />
                        View Ranking
                      </button>
                      <button
                        onClick={() => {
                          // Start a new ranking for the same mood (create fresh active record)
                          setActiveMoodId(ranking.mood_id);
                          createRankingMutation.mutateAsync({
                            mood_id: ranking.mood_id,
                            user_id: userEmail,
                            mood_name: moodName,
                            mood_color: moodColor,
                            elo_ratings: JSON.stringify({}),
                            phase1_seen_songs: JSON.stringify([]),
                            phase1_winners: JSON.stringify([]),
                            phase1_eliminated: JSON.stringify([]),
                            battles_completed: 0,
                            phase: 1,
                            is_complete: false,
                          }).then(() => {
                            setView("battle");
                          });
                        }}
                        className="px-3 py-2 rounded-xl border border-white/15 text-white/40 text-xs font-bold uppercase tracking-widest hover:text-white/70 transition-all"
                      >
                        New Run
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Delete saved ranking confirmation */}
      <AnimatePresence>
        {confirmDeleteSaved && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setConfirmDeleteSaved(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs bg-[#0c0c0c] border border-white/12 rounded-2xl p-5 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-white font-bold text-sm">Delete Saved Ranking?</p>
              <p className="text-white/50 text-xs leading-relaxed">
                This will permanently delete this completed ranking for <span className="text-white font-semibold">"{confirmDeleteSaved.mood_name || confirmDeleteSaved.mood_id}"</span>. Cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDeleteSaved(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/50 text-sm font-semibold hover:bg-white/5">Cancel</button>
                <button onClick={() => { deleteRankingMutation.mutate(confirmDeleteSaved.id); setConfirmDeleteSaved(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold aurora-confirm-btn">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete mood confirmation */}
      <AnimatePresence>
        {confirmDeleteMood && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setConfirmDeleteMood(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs bg-[#0c0c0c] border border-white/12 rounded-2xl p-5 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-white font-bold text-sm">Delete Mood?</p>
              <p className="text-white/50 text-xs leading-relaxed">
                Are you sure you want to delete <span className="text-white font-semibold">"{confirmDeleteMood.name}"</span>? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDeleteMood(null)} className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/50 text-sm font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={() => { handleDeleteMood(confirmDeleteMood.id); setConfirmDeleteMood(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold aurora-confirm-btn">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create mood modal */}
      <AnimatePresence>
        {showCreateMood && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowCreateMood(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-sm bg-[#0c0c0c] border border-white/12 rounded-2xl p-5 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-base">Create Mood</h2>
                <button onClick={() => setShowCreateMood(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1.5 block">Mood Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sad, Workout, Late Night…"
                  value={newMoodName}
                  onChange={e => setNewMoodName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateMood()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1.5 block">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={newMoodColor} onChange={e => setNewMoodColor(e.target.value)} className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                  <div className="flex-1 h-10 rounded-lg border border-white/10" style={{ backgroundColor: newMoodColor }} />
                </div>
              </div>
              <button
                onClick={handleCreateMood}
                disabled={!newMoodName.trim()}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors disabled:opacity-40"
              >
                Create Mood
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}