import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Zap, Undo2 } from "lucide-react";
import CoverImg from "./ranking/CoverImg";
import SongPreviewPlayer, { stopAllPreviews } from "./ranking/SongPreviewPlayer";
import { calculateElo, calculateEloDraw } from "./ranking/eloEngine";
import { recordDecisionTime, getBattleResults, setBattleResults } from "./battleStats";

// Hold-to-confirm button — when holdRequired=true fills over 2s, otherwise instant click
function HoldButton({ children, onConfirm, style, className, disabled, holdRequired = true }) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  const startHold = useCallback((e) => {
    e.preventDefault();
    if (disabled) return;
    if (!holdRequired) { onConfirm(); return; }
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(100, (elapsed / 2000) * 100);
      setProgress(p);
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onConfirm();
        setProgress(0);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [disabled, onConfirm, holdRequired]);

  const cancelHold = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProgress(0);
    startRef.current = null;
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {progress > 0 && (
        <div
          className="absolute inset-0 origin-left"
          style={{ width: `${progress}%`, backgroundColor: 'rgba(255,255,255,0.15)', transition: 'none' }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

// Aurora pill button style (matches main Battle page)
function AuroraPill({ children, onClick, onConfirm, disabled, isHold, className = "" }) {
  const base = `aurora-pill-btn px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${className}`;
  if (isHold) {
    return (
      <HoldButton
        onConfirm={onConfirm}
        disabled={disabled}
        className={`${base} ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
      >
        {children}
      </HoldButton>
    );
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}>
      {children}
    </button>
  );
}

export default function MoodBattlePhase({
  mood,
  songs,         // all songs from DB
  rankingData,   // full MoodRanking record from DB
  phase,         // 1 or 2
  onBack,        // exits battle WITHOUT undo
  onSave,        // (updates) => void
  onPhase1Complete,
  onPhase2Complete,
  onReset,       // () => void — resets Phase 1 + all progress
  onResetPhase2, // () => void — resets Phase 2 only
}) {
  const totalSongs = songs.length;

  const parseJson = (s, fallback) => { try { return JSON.parse(s || "null") || fallback; } catch { return fallback; } };
  const initElo = parseJson(rankingData?.elo_ratings, {});
  const initSeenIds = parseJson(rankingData?.phase1_seen_songs, []);
  const initWinnerIds = parseJson(rankingData?.phase1_winners, []);
  const initCurrentPair = parseJson(rankingData?.current_pair, []);
  const initNextPair = parseJson(rankingData?.next_pair, []);

  const getEloVal = (id, eloMap) => eloMap[id] ?? 1400;

  // Pick a pair from pool, preferring unseen in phase 1
  const pickPair = useCallback((pool) => {
    if (!pool || pool.length < 2) return songs.slice(0, 2);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }, [songs]);

  const [currentPhase, setCurrentPhase] = useState(phase);
  const [elo, setElo] = useState(initElo);
  const [seenIds, setSeenIds] = useState(new Set(initSeenIds));
  const [winnerIds, setWinnerIds] = useState(new Set(initWinnerIds));
  const [pair, setPair] = useState(() => {
    const winnerSet = new Set(initWinnerIds);
    if (initCurrentPair.length === 2 && (phase !== 2 || (winnerSet.has(initCurrentPair[0]) && winnerSet.has(initCurrentPair[1])))) {
      const a = songs.find(s => s.id === initCurrentPair[0]);
      const b = songs.find(s => s.id === initCurrentPair[1]);
      if (a && b) return [a, b];
    }
    if (phase === 1 && songs.length >= 2) {
      const unseen = songs.filter(s => !initSeenIds.includes(s.id));
      // All seen already — we'll show phase1DoneModal via useEffect
      if (unseen.length === 0) return [songs[0], songs[1]];
      if (unseen.length === 1) return [songs[0], songs[1]]; // lone wolf will trigger
      const shuffled = [...unseen].sort(() => Math.random() - 0.5);
      return [shuffled[0], shuffled[1]];
    }
    const pool = phase === 2
      ? initWinnerIds.map(id => songs.find(s => s.id === id)).filter(Boolean)
      : songs;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  });
  const [battleKey, setBattleKey] = useState(0);
  const [battlesCompleted, setBattlesCompleted] = useState(rankingData?.battles_completed || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [phase1DoneModal, setPhase1DoneModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const battleStart = useRef(Date.now());
  const initNextPairSongs = (() => {
    if (initNextPair.length !== 2) return null;
    if (phase === 2) {
      const winnerSet = new Set(initWinnerIds);
      if (!winnerSet.has(initNextPair[0]) || !winnerSet.has(initNextPair[1])) return null;
    }
    const a = songs.find(s => s.id === initNextPair[0]);
    const b = songs.find(s => s.id === initNextPair[1]);
    return a && b ? [a, b] : null;
  })();
  const savedNextPairRef = useRef(initNextPairSongs);

  // Odd-song lone wolf screen (phase 1 only)
  const [loneSong, setLoneSong] = useState(null);

  // Battle history for undo
  const [history, setHistory] = useState([]);

  const phase2Songs = currentPhase === 2
    ? [...winnerIds].map(id => songs.find(s => s.id === id)).filter(Boolean)
    : [];
  const battleSongs = currentPhase === 1 ? songs : phase2Songs;

  // Last battle detection
  const isLastBattle = (() => {
    if (currentPhase === 1) {
      const unseenNotInPair = songs.filter(s => !seenIds.has(s.id) && !pair.some(p => p?.id === s.id));
      return unseenNotInPair.length === 0 && pair.some(s => !seenIds.has(s.id));
    }
    // Phase 2: last battle is when battles_completed + 1 >= threshold
    if (currentPhase === 2) {
      const minBattlesNeeded = phase2Songs.length * 2;
      return battlesCompleted + 1 >= minBattlesNeeded;
    }
    return false;
  })();

  // On mount: if phase 1 and all songs already seen, immediately show completion
  useEffect(() => {
    if (currentPhase === 1) {
      const allSeen = songs.every(s => initSeenIds.includes(s.id));
      if (allSeen) setPhase1DoneModal(true);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (phase1DoneModal) onSave({ phase: 2, phase1_winners: JSON.stringify([...winnerIds]), battles_completed: 0 });
  }, [phase1DoneModal]);

  const [showLastBanner, setShowLastBanner] = useState(false);
  const lastBattleShownRef = useRef(false);
  useEffect(() => {
    if (isLastBattle && !lastBattleShownRef.current) {
      lastBattleShownRef.current = true;
      setShowLastBanner(true);
      const t = setTimeout(() => setShowLastBanner(false), 3500);
      return () => clearTimeout(t);
    }
    if (!isLastBattle) lastBattleShownRef.current = false;
  }, [isLastBattle]);

  const nextPairAfter = (newSeen) => {
    if (currentPhase === 1) {
      const unseen = songs.filter(s => !newSeen.has(s.id));
      // Odd number: 1 unseen left → lone wolf screen
      if (unseen.length === 1) return { lone: unseen[0] };
      if (unseen.length >= 2) {
        const shuffled = [...unseen].sort(() => Math.random() - 0.5);
        return { pair: [shuffled[0], shuffled[1]] };
      }
      return null; // all seen
    } else {
      const shuffled = [...phase2Songs].sort(() => Math.random() - 0.5);
      return { pair: [shuffled[0], shuffled[1]] };
    }
  };

  const initEliminatedIds = parseJson(rankingData?.phase1_eliminated, []);
  const [eliminatedIds, setEliminatedIds] = useState(new Set(initEliminatedIds));

  const saveState = (newElo, newSeen, newWinners, newBattles, newEliminated, currentPairIds, nextPairIds) => {
    const elim = newEliminated !== undefined ? newEliminated : eliminatedIds;
    onSave({
      elo_ratings: JSON.stringify(newElo),
      phase1_seen_songs: JSON.stringify([...newSeen]),
      phase1_winners: JSON.stringify([...newWinners]),
      phase1_eliminated: JSON.stringify([...elim]),
      battles_completed: newBattles,
      phase: currentPhase,
      current_pair: JSON.stringify(currentPairIds ?? pair.map(s => s.id)),
      next_pair: JSON.stringify(nextPairIds ?? null),
    });
  };

  const afterBattle = (newElo, newSeen, newWinners, newBattles, newEliminated) => {
    setElo(newElo);
    setSeenIds(newSeen);
    setWinnerIds(newWinners);
    setBattlesCompleted(newBattles);

    // Phase 1 completion
    if (currentPhase === 1) {
      const allSeen = songs.every(s => newSeen.has(s.id));
      if (allSeen) {
        setTimeout(() => { setIsAnimating(false); setPhase1DoneModal(true); }, 300);
        return;
      }
      const next = savedNextPairRef.current ? { pair: savedNextPairRef.current } : nextPairAfter(newSeen);
      savedNextPairRef.current = null;
      if (!next) { setTimeout(() => { setIsAnimating(false); setPhase1DoneModal(true); }, 300); return; }
      if (next.lone) { setLoneSong(next.lone); setIsAnimating(false); return; }
      setPair(next.pair);
      const lookaheadSeen = new Set([...newSeen, ...next.pair.map(s => s.id)]);
      const lookahead = nextPairAfter(lookaheadSeen);
      saveState(newElo, newSeen, newWinners, newBattles, newEliminated, next.pair.map(s => s.id), lookahead?.pair?.map(s => s.id) ?? null);
      setBattleKey(k => k + 1);
      battleStart.current = Date.now();
      setTimeout(() => setIsAnimating(false), 200);
      return;
    }

    // Phase 2 completion
    if (currentPhase === 2 && phase2Songs.length > 0) {
      const minBattlesNeeded = phase2Songs.length * 2;
      if (newBattles >= minBattlesNeeded) {
        setTimeout(() => { setIsAnimating(false); onPhase2Complete(newElo); }, 300);
        return;
      }
    }

    const p2pair = savedNextPairRef.current || [...phase2Songs].sort(() => Math.random() - 0.5).slice(0, 2);
    savedNextPairRef.current = null;
    setPair(p2pair);
    saveState(newElo, newSeen, newWinners, newBattles, newEliminated, p2pair.map(s => s.id), null);
    setBattleKey(k => k + 1);
    battleStart.current = Date.now();
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleSelect = (winner, loser) => {
    if (isAnimating) return;
    setIsAnimating(true);
    stopAllPreviews();

    const elapsed = (Date.now() - battleStart.current) / 1000;
    recordDecisionTime(winner.title, loser.title, elapsed);

    const result = calculateElo(getEloVal(winner.id, elo), getEloVal(loser.id, elo));
    const newElo = { ...elo, [winner.id]: result.winner, [loser.id]: result.loser };
    const newSeen = new Set(seenIds); newSeen.add(winner.id); newSeen.add(loser.id);
    const newWinners = new Set(winnerIds);
    if (currentPhase === 1) newWinners.add(winner.id);
    const newBattles = battlesCompleted + 1;

    if (!savedNextPairRef.current) {
      const computedNext = nextPairAfter(newSeen);
      savedNextPairRef.current = computedNext?.pair || null;
    }
    const nextPair = savedNextPairRef.current;
    setHistory(prev => [...prev, { elo: { ...elo }, seenIds: new Set(seenIds), winnerIds: new Set(winnerIds), pair, battlesCompleted, battleResults: getBattleResults(), nextPair }]);
    afterBattle(newElo, newSeen, newWinners, newBattles);
  };

  const handleTie = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    stopAllPreviews();

    const elapsed = (Date.now() - battleStart.current) / 1000;
    const [a, b] = pair;
    recordDecisionTime(a.title, b.title, elapsed);
    const result = calculateEloDraw(getEloVal(a.id, elo), getEloVal(b.id, elo));
    const newElo = { ...elo, [a.id]: result.a, [b.id]: result.b };
    const newSeen = new Set(seenIds); newSeen.add(a.id); newSeen.add(b.id);
    const newWinners = new Set(winnerIds);
    if (currentPhase === 1) { newWinners.add(a.id); newWinners.add(b.id); }
    const newBattles = battlesCompleted + 1;

    if (!savedNextPairRef.current) {
      const computedNext = nextPairAfter(newSeen);
      savedNextPairRef.current = computedNext?.pair || null;
    }
    const nextPair = savedNextPairRef.current;
    setHistory(prev => [...prev, { elo: { ...elo }, seenIds: new Set(seenIds), winnerIds: new Set(winnerIds), pair, battlesCompleted, battleResults: getBattleResults(), nextPair }]);
    afterBattle(newElo, newSeen, newWinners, newBattles);
  };

  const handleNoneOfThese = () => {
    if (isAnimating || currentPhase !== 1) return;
    setIsAnimating(true);
    stopAllPreviews();

    const elapsed = (Date.now() - battleStart.current) / 1000;
    recordDecisionTime(pair[0].title, pair[1].title, elapsed);

    const newSeen = new Set(seenIds); newSeen.add(pair[0].id); newSeen.add(pair[1].id);
    const newEliminated = new Set(eliminatedIds); newEliminated.add(pair[0].id); newEliminated.add(pair[1].id);
    const newBattles = battlesCompleted + 1;

    if (!savedNextPairRef.current) {
      const computedNext = nextPairAfter(newSeen);
      savedNextPairRef.current = computedNext?.pair || null;
    }
    const nextPair = savedNextPairRef.current;
    setHistory(prev => [...prev, { elo: { ...elo }, seenIds: new Set(seenIds), winnerIds: new Set(winnerIds), eliminatedIds: new Set(eliminatedIds), pair, battlesCompleted, battleResults: getBattleResults(), nextPair }]);
    setEliminatedIds(newEliminated);
    afterBattle({ ...elo }, newSeen, new Set(winnerIds), newBattles, newEliminated);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    stopAllPreviews();
    setLoneSong(null);
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setElo(prev.elo);
    setSeenIds(prev.seenIds);
    setWinnerIds(prev.winnerIds);
    if (prev.eliminatedIds) setEliminatedIds(prev.eliminatedIds);
    // Restore the exact same pair that was shown in the undone battle (item 5)
    setPair(prev.pair);
    setBattlesCompleted(prev.battlesCompleted);
    if (prev.battleResults) setBattleResults(prev.battleResults);
    savedNextPairRef.current = prev.nextPair || null;
    setBattleKey(k => k + 1);
    battleStart.current = Date.now();
    saveState(prev.elo, prev.seenIds, prev.winnerIds, prev.battlesCompleted, undefined, prev.pair.map(s => s.id), prev.nextPair?.map(s => s.id) ?? null);
  };

  // Lone-wolf answer
  const handleLoneWolf = (fits) => {
    stopAllPreviews();
    const newWinners = new Set(winnerIds);
    const newSeen = new Set(seenIds); newSeen.add(loneSong.id);
    if (fits) newWinners.add(loneSong.id);
    setLoneSong(null);
    const newBattles = battlesCompleted + 1;
    setHistory(prev => [...prev, { elo: { ...elo }, seenIds: new Set(seenIds), winnerIds: new Set(winnerIds), pair, battlesCompleted }]);
    setSeenIds(newSeen); setWinnerIds(newWinners); setBattlesCompleted(newBattles);
    saveState({ ...elo }, newSeen, newWinners, newBattles);
    // All seen now
    setTimeout(() => setPhase1DoneModal(true), 200);
  };

  const unseenCount = phase === 1 ? songs.filter(s => !seenIds.has(s.id)).length : 0;
  const [songA, songB] = pair || [];
  const moodColor = mood.color;
  // Gray out only on the very first battle ever (no history in session AND no persisted battles)
  const undoEnabled = history.length > 0 || battlesCompleted > 0;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <style>{`
        .aurora-pill-btn {
          border: 1.5px solid ${moodColor}55;
          background: linear-gradient(#000, #000) padding-box,
                      linear-gradient(135deg, ${moodColor}, ${moodColor}88) border-box;
          box-shadow: 0 0 8px ${moodColor}33, 0 0 16px ${moodColor}18;
          color: rgba(255,255,255,0.6);
        }
        .aurora-pill-btn:hover:not(:disabled) {
          box-shadow: 0 0 12px ${moodColor}55, 0 0 24px ${moodColor}33;
          color: rgba(255,255,255,0.9);
        }
        .aurora-pill-vs {
          border: 1.5px solid transparent;
          background: linear-gradient(135deg, ${moodColor}33, ${moodColor}18) padding-box,
                      linear-gradient(135deg, ${moodColor}, ${moodColor}88) border-box;
          box-shadow: 0 0 12px ${moodColor}55, 0 0 24px ${moodColor}22;
        }
        .aurora-confirm-btn {
          background: ${moodColor};
          color: #000;
          font-weight: 800;
        }
      `}</style>

      {/* Last battle banner */}
      <AnimatePresence>
        {showLastBanner && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-3 px-4"
            style={{ background: `linear-gradient(135deg, ${moodColor}cc, ${moodColor}88)` }}
          >
            <span className="text-white font-black text-sm uppercase tracking-widest">⚔️ This is your last battle!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button
          onClick={() => { stopAllPreviews(); onBack(); }}
          className="p-2 -ml-2 text-white/40 hover:text-white transition-colors"
          title="Back to mood home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: moodColor }}>
            {mood.name} — Phase {currentPhase}
          </span>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="p-2 -mr-2 text-white/20 hover:text-red-400 transition-colors"
          title="Reset progress"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      {currentPhase === 1 && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-end mb-1">
            <span className="text-white/40 text-[9px] font-mono">{totalSongs - unseenCount} / {totalSongs}</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: moodColor }}
              animate={{ width: `${((totalSongs - unseenCount) / totalSongs) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      {currentPhase === 2 && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/30 text-[9px] uppercase tracking-widest">Phase 2 — {phase2Songs.length} songs</span>
            <span className="text-white/40 text-[9px] font-mono">{battlesCompleted} battles</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${moodColor}, #67e8f9)` }}
              animate={{ width: `${Math.min(100, (battlesCompleted / Math.max(1, phase2Songs.length * 2)) * 100)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-center mb-2 px-4">
        <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">
          {currentPhase === 2 ? "Which do you prefer?" : `Which fits "${mood.name}" better?`}
        </span>
      </div>

      {/* Lone wolf screen */}
      <AnimatePresence>
        {loneSong && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center px-6 pb-8 gap-5"
          >
            {/* Mood badge */}
            <div className="px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest"
              style={{ borderColor: `${moodColor}55`, color: moodColor, backgroundColor: `${moodColor}12` }}>
              {mood.name}
            </div>

            {/* Preview — above cover art */}
            <SongPreviewPlayer
              songTitle={loneSong?.title || ""}
              songData={loneSong}
              compact
              lightstickColor={moodColor}
            />

            {/* Cover with glow */}
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl blur-2xl opacity-40" style={{ backgroundColor: moodColor }} />
              <div className="relative w-44 h-44 rounded-3xl overflow-hidden border-2" style={{ borderColor: `${moodColor}60` }}>
                <CoverImg src={loneSong.cover_url} alt={loneSong.album} className="w-full h-full object-cover" fallbackClass="w-full h-full bg-white/5 flex items-center justify-center text-white/20 text-4xl" fallbackContent="♪" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-white font-black text-xl leading-tight">{loneSong.title}</p>
              <p className="text-white/30 text-xs mt-1 uppercase tracking-wider">{loneSong.album}</p>
            </div>

            {/* Question */}
            <div className="text-center px-4 py-3 rounded-2xl border" style={{ borderColor: `${moodColor}30`, backgroundColor: `${moodColor}08` }}>
              <p className="text-white/80 text-sm font-bold">Does this song fit</p>
              <p className="font-black text-base mt-0.5" style={{ color: moodColor }}>"{mood.name}"?</p>
            </div>

            <div className="flex gap-3 w-full max-w-xs">
              <HoldButton
                onConfirm={() => handleLoneWolf(false)}
                holdRequired
                className="flex-1 py-3.5 rounded-2xl border border-white/15 text-white/60 font-bold uppercase tracking-wider text-sm relative overflow-hidden"
              >
                ✕ No
              </HoldButton>
              <HoldButton
                onConfirm={() => handleLoneWolf(true)}
                holdRequired
                className="flex-1 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-sm relative overflow-hidden"
                style={{ backgroundColor: moodColor, color: '#000' }}
              >
                ✓ Yes
              </HoldButton>
            </div>
            <p className="text-white/20 text-[10px]">Hold to confirm</p>

            {/* Undo button on lone wolf screen */}
            <button
              onClick={handleUndo}
              disabled={!undoEnabled}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all aurora-pill-btn ${!undoEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <Undo2 className="w-3 h-3" />
              Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!loneSong && !phase1DoneModal && (
        <AnimatePresence mode="wait">
          <motion.div
            key={battleKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col items-center justify-center px-4 pb-8"
          >
            {/* Cards — equal height via grid + stretch */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-md items-stretch">
              {[songA, songB].map((song, idx) => {
                const opponent = idx === 0 ? songB : songA;
                const isLeft = idx === 0;

                const cardStyle = {
                  borderColor: `${moodColor}40`,
                  boxShadow: isLeft
                    ? `-6px 0 18px ${moodColor}33`
                    : `6px 0 18px ${moodColor}33`,
                };

                const CardContent = () => (
                  <div className="flex flex-col h-full">
                    {/* Preview pill above cover */}
                    <div className="flex justify-center mb-1.5">
                      <SongPreviewPlayer
                        songTitle={song?.title || ""}
                        songData={song}
                        compact
                        lightstickColor={moodColor}
                      />
                    </div>

                    {/* Card — clickable for normal battles */}
                    <motion.div
                      className="relative rounded-2xl border bg-white/[0.03] group flex-1 flex flex-col cursor-pointer"
                      style={cardStyle}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { if (!isAnimating && !isLastBattle) handleSelect(song, opponent); }}
                    >
                      <div className="aspect-square w-full overflow-hidden">
                        <CoverImg
                          src={song?.cover_url}
                          alt={song?.album}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          fallbackClass="w-full h-full bg-white/5 flex items-center justify-center text-white/20 text-4xl"
                          fallbackContent="♪"
                        />
                      </div>
                      <div className="p-3 text-center" style={{ minHeight: 64 }}>
                        <p className="text-white font-bold text-sm leading-tight line-clamp-2">{song?.title}</p>
                        <p className="text-white/30 text-[10px] mt-0.5 uppercase tracking-wider">{song?.album}</p>
                      </div>
                    </motion.div>

                    {/* Select button */}
                    <HoldButton
                      onConfirm={() => !isAnimating && handleSelect(song, opponent)}
                      disabled={isAnimating}
                      className="mt-2 w-full py-2 rounded-full border text-[11px] font-bold uppercase tracking-widest transition-all aurora-pill-btn disabled:opacity-50"
                      holdRequired={isLastBattle}
                    >
                      {isLastBattle ? "Hold to Select" : "Select"}
                    </HoldButton>
                  </div>
                );

                return <div key={song?.id} className="flex flex-col h-full"><CardContent /></div>;
              })}
            </div>

            {/* Bottom buttons row — aurora pill style matching main Battle */}
            <div className="flex justify-center mt-4 gap-2 w-full max-w-md">
              {/* Back / Undo */}
              <AuroraPill
                onClick={handleUndo}
                disabled={!undoEnabled}
                isHold={false}
              >
                <Undo2 className="w-3 h-3" />
                Back
              </AuroraPill>

              {/* Middle: None of These (Phase 1) or VS badge (Phase 2) */}
              {currentPhase === 1 ? (
                <HoldButton
                  onConfirm={handleNoneOfThese}
                  disabled={isAnimating}
                  holdRequired={isLastBattle}
                  className={`aurora-pill-vs px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${isAnimating ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  None of These
                </HoldButton>
              ) : (
                <div className="aurora-pill-vs px-4 py-1.5 rounded-full flex items-center gap-2">
                  <Zap className="w-3 h-3 text-violet-400" />
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">vs</span>
                  <Zap className="w-3 h-3 text-cyan-400" />
                </div>
              )}

              {/* Tie */}
              <HoldButton
                onConfirm={handleTie}
                disabled={isAnimating}
                holdRequired={isLastBattle}
                className={`aurora-pill-btn px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${isAnimating ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                🤝 Tie
              </HoldButton>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Phase 1 complete modal — shows winners vs ALL eliminated */}
      <AnimatePresence>
        {phase1DoneModal && (() => {
          // All eliminated = songs NOT in winnerIds (lost battles) + those eliminated via "None of These"
          const allEliminatedIds = [...seenIds]
            .filter(id => !winnerIds.has(id));
          return (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col overflow-y-auto"
          >
            <div className="flex-1 px-4 pt-6 pb-8">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🏁</div>
                <h2 className="text-white font-black text-xl mb-1">Phase 1 Complete!</h2>
                <p className="text-white/40 text-sm">
                  {[...winnerIds].length} songs qualified · {allEliminatedIds.length} eliminated
                </p>
              </div>

              {/* Winners */}
              <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-2">Qualified for Phase 2</p>
              <div className="space-y-1.5 mb-5">
                {[...winnerIds].map(id => {
                  const s = songs.find(x => x.id === id);
                  if (!s) return null;
                  return (
                    <div key={id} className="flex items-center gap-3 px-3 py-2 rounded-xl border" style={{ borderColor: `${moodColor}40`, backgroundColor: `${moodColor}10` }}>
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white/5">
                        <CoverImg src={s.cover_url} alt="" className="w-full h-full object-cover" fallbackClass="w-full h-full bg-white/10" fallbackContent="" />
                      </div>
                      <p className="text-white/80 text-xs font-semibold truncate flex-1">{s.title}</p>
                      <span className="text-[10px]" style={{ color: moodColor }}>✓</span>
                    </div>
                  );
                })}
              </div>

              {/* ALL eliminated (losers + none-of-these) */}
              {allEliminatedIds.length > 0 && (
                <>
                  <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold mb-2">Eliminated</p>
                  <div className="space-y-1.5 mb-6">
                    {allEliminatedIds.map(id => {
                      const s = songs.find(x => x.id === id);
                      if (!s) return null;
                      return (
                        <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/15 bg-white/[0.04]">
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white/5">
                            <CoverImg src={s.cover_url} alt="" className="w-full h-full object-cover" fallbackClass="w-full h-full bg-white/10" fallbackContent="" />
                          </div>
                          <p className="text-white/60 text-xs font-semibold truncate flex-1">{s.title}</p>
                          <svg className="w-3 h-3 text-violet-400/60 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2a9 9 0 0 0-9 9c0 3.25 1.73 6.1 4.32 7.68V21a1 1 0 0 0 1 1h7.36a1 1 0 0 0 1-1v-2.32A9 9 0 0 0 21 11a9 9 0 0 0-9-9zm-2 16v-1h4v1h-4zm4.93-3.22-.93.6-.93-.6A7 7 0 1 1 14.93 14.78zM10 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0zm4 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0z" />
                          </svg>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Start Phase 2 at VERY BOTTOM, below all song lists */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => {
                    onPhase1Complete([...winnerIds]);
                    const p2 = [...winnerIds].map(id => songs.find(s => s.id === id)).filter(Boolean);
                    const shuffled = [...p2].sort(() => Math.random() - 0.5);
                    setPair([shuffled[0], shuffled[1]]);
                    setBattlesCompleted(0);
                    setHistory([]);
                    lastBattleShownRef.current = false;
                    battleStart.current = Date.now();
                    setBattleKey(k => k + 1);
                    setCurrentPhase(2);
                    setPhase1DoneModal(false);
                  }}
                  className="aurora-confirm-btn w-full py-4 rounded-2xl text-sm uppercase tracking-widest"
                >
                  Start Phase 2 →
                </button>
                <button
                  onClick={() => { setPhase1DoneModal(false); onBack(); }}
                  className="w-full py-3 rounded-2xl border border-white/15 text-white/40 text-sm hover:text-white/70 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Reset confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs bg-[#0c0c0c] border border-white/12 rounded-2xl p-5 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-white font-bold text-sm">Reset Progress?</p>
              {currentPhase === 2 ? (
                <div className="space-y-2">
                  <button
                    onClick={() => { setShowResetConfirm(false); onResetPhase2?.(); }}
                    className="w-full py-2.5 rounded-xl border text-sm font-semibold transition-colors hover:bg-white/5"
                    style={{ borderColor: `${moodColor}55`, color: moodColor }}
                  >
                    Reset Phase 2 Only
                  </button>
                  <p className="text-white/30 text-[10px]">Keeps Phase 1 qualified songs. Restarts battles from the beginning.</p>
                  <button
                    onClick={() => { setShowResetConfirm(false); onReset(); }}
                    className="aurora-confirm-btn w-full py-2.5 rounded-xl text-sm font-semibold"
                  >
                    Reset Everything
                  </button>
                  <p className="text-white/30 text-[10px]">Clears Phase 1 and Phase 2. Cannot be undone.</p>
                </div>
              ) : (
                <>
                  <p className="text-white/50 text-xs leading-relaxed">
                    This will clear all Phase 1 progress for "{mood.name}". This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/50 text-sm font-semibold hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { setShowResetConfirm(false); onReset(); }}
                      className="aurora-confirm-btn flex-1 py-2.5 rounded-xl text-sm"
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}
              {currentPhase === 2 && (
                <button onClick={() => setShowResetConfirm(false)} className="w-full py-2 text-white/30 text-xs hover:text-white/60">
                  Cancel
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}