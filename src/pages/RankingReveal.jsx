import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, SkipForward } from "lucide-react";
import { stopAllPreviews } from "../components/ranking/SongPreviewPlayer";

const COMPLETE_KEY = "aespa_ranking_complete";

// ── Helpers ──────────────────────────────────────────────────────
function groupByTie(rankings) {
  const groups = [];
  let i = 0;
  while (i < rankings.length) {
    const rating = rankings[i].rating;
    const tied = [];
    while (i < rankings.length && rankings[i].rating === rating) {
      tied.push(rankings[i]);
      i++;
    }
    groups.push(tied);
  }
  return groups;
}

function buildSequence(allGroups, limit) {
  // allGroups: highest→lowest (original order from groupByTie on sorted desc rankings)
  // We want to reveal lowest rank first → reverse
  let filtered;
  if (limit > 0) {
    let count = 0;
    filtered = [];
    for (const g of [...allGroups].reverse()) {
      filtered.unshift(g);
      count += g.length;
      if (count >= limit) break;
    }
  } else {
    filtered = allGroups;
  }
  // reversed: index 0 = lowest rank group, last = #1
  return [...filtered].reverse();
}

function computeRank(groups, groupIdx) {
  // groups[0] = lowest rank
  const reversedIndex = groups.length - 1 - groupIdx;
  let rank = 1;
  for (let i = 0; i < reversedIndex; i++) {
    rank += groups[groups.length - 1 - i].length;
  }
  return rank;
}

// ── Audio helpers ────────────────────────────────────────────────
function buildYtSrc(song) {
  if (!song?.yt_id) return null;
  const start = song.preview_start || 0;
  const end = song.preview_end || null;
  let src = `https://www.youtube.com/embed/${song.yt_id}?autoplay=1&start=${start}&mute=0&controls=0&loop=0&modestbranding=1&rel=0&enablejsapi=1`;
  if (end) src += `&end=${end}`;
  return src;
}

// ── Timer bar ────────────────────────────────────────────────────
function TimerBar({ duration, active, resetKey }) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    setProgress(0);
    if (!active) return;
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [resetKey, active, duration]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-white/10">
      <div
        className="h-full transition-none"
        style={{
          width: "100%",
          transform: `scaleX(${1 - progress})`,
          transformOrigin: "right",
          background: "linear-gradient(90deg, #a78bfa, #67e8f9, #f0abfc)",
        }}
      />
    </div>
  );
}

// ── Full-screen song slide ────────────────────────────────────────
function SongSlide({ song, rank, isTop1, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`${song?.title}-${rank}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black"
        >
          <style>{`
            .aurora-text-rv { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: aurora-shift-rv 4s ease infinite; }
            @keyframes aurora-shift-rv { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
            .aurora-ring-rv { box-shadow: 0 0 0 3px rgba(167,139,250,0.7), 0 0 50px rgba(167,139,250,0.4); animation: aurora-pulse-rv 3s ease-in-out infinite; }
            @keyframes aurora-pulse-rv { 0%,100%{box-shadow:0 0 0 3px rgba(167,139,250,0.7),0 0 50px rgba(167,139,250,0.4)} 50%{box-shadow:0 0 0 3px rgba(103,232,249,0.8),0 0 60px rgba(103,232,249,0.5)} }
          `}</style>

          {/* Background blurred cover */}
          {song?.cover_url && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-15"
              style={{ backgroundImage: `url(${song.cover_url})`, filter: "blur(40px) saturate(1.5)" }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

          <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-sm w-full">
            {/* Rank */}
            <div className="mb-6">
              {isTop1 ? (
                <div className="flex items-center justify-center gap-2">
                  <Crown className="w-8 h-8 text-violet-400" />
                  <span className="aurora-text-rv font-black text-6xl">#1</span>
                  <Crown className="w-8 h-8 text-violet-400" />
                </div>
              ) : (
                <span className="text-white/50 font-black text-4xl">#{rank}</span>
              )}
            </div>

            {/* Cover */}
            <div className={`mb-6 rounded-2xl overflow-hidden shrink-0 ${isTop1 ? "w-56 h-56 aurora-ring-rv" : "w-44 h-44"}`}>
              {song?.cover_url
                ? <img src={song.cover_url} alt={song?.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-white/10 flex items-center justify-center text-4xl text-white/20">♪</div>}
            </div>

            {/* Song info */}
            <h2 className={`font-black text-2xl leading-tight mb-2 ${isTop1 ? "aurora-text-rv" : "text-white"}`}>
              {song?.title}
            </h2>
            <p className="text-white/50 text-sm mb-1">{song?.album}</p>
            {song?.release_date && (
              <p className="text-white/30 text-xs">{song.release_date.slice(0, 4)}</p>
            )}
          </div>

          {/* Hidden iframe */}
          <iframe id="rv-iframe" src="" allow="autoplay" className="w-0 h-0 absolute opacity-0 pointer-events-none" title="reveal-audio" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Tie group slide (all cards visible simultaneously, revealed one by one) ──
function TieSlide({ group, rank, isTop1, revealedCount, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`tie-${rank}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black overflow-hidden"
        >
          <style>{`
            .aurora-text-rv { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: aurora-shift-rv 4s ease infinite; }
            @keyframes aurora-shift-rv { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
            .aurora-ring-rv { animation: aurora-pulse-rv 3s ease-in-out infinite; }
            @keyframes aurora-pulse-rv { 0%,100%{box-shadow:0 0 0 3px rgba(167,139,250,0.7),0 0 40px rgba(167,139,250,0.4)} 50%{box-shadow:0 0 0 3px rgba(103,232,249,0.8),0 0 50px rgba(103,232,249,0.5)} }
          `}</style>

          {/* Background from first revealed song */}
          {group[0]?.song?.cover_url && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: `url(${group[0].song.cover_url})`, filter: "blur(40px)" }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />

          <div className="relative z-10 w-full px-4 flex flex-col items-center">
            {/* Rank header */}
            <div className="mb-5 text-center">
              {isTop1 ? (
                <div className="flex items-center justify-center gap-2">
                  <Crown className="w-6 h-6 text-violet-400" />
                  <span className="aurora-text-rv font-black text-5xl">#1</span>
                  <Crown className="w-6 h-6 text-violet-400" />
                </div>
              ) : (
                <span className="text-white/50 font-black text-3xl">#{rank}</span>
              )}
              <div className="mt-1 text-violet-300/60 text-[11px] font-bold uppercase tracking-widest">
                {group.length}-Way Tie
              </div>
            </div>

            {/* Cards row */}
            <div className="flex gap-3 justify-center flex-wrap max-w-sm">
              {group.map((item, i) => {
                const revealed = i < revealedCount;
                const song = item.song;
                return (
                  <motion.div
                    key={i}
                    animate={{ opacity: revealed ? 1 : 0.55 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className="flex flex-col items-center"
                    style={{ width: group.length === 2 ? 140 : 110 }}
                  >
                    <div
                      className={`rounded-xl overflow-hidden mb-2 ${isTop1 && revealed ? "aurora-ring-rv" : ""}`}
                      style={{
                        width: group.length === 2 ? 120 : 95,
                        height: group.length === 2 ? 120 : 95,
                        filter: revealed ? "none" : "blur(6px)",
                        transition: "filter 0.6s ease",
                      }}
                    >
                      {song?.cover_url
                        ? <img src={song.cover_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/20 text-2xl">♪</div>}
                    </div>
                    <p
                      className="text-center font-bold text-sm leading-tight"
                      style={{
                        color: revealed ? "white" : "transparent",
                        textShadow: revealed ? "none" : "0 0 8px rgba(255,255,255,0.3)",
                        transition: "color 0.6s ease, text-shadow 0.6s ease",
                        maxWidth: "100%",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {song?.title}
                    </p>
                    {revealed && (
                      <p className="text-white/40 text-[10px] mt-0.5 text-center truncate w-full">{song?.album}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
          <iframe id="rv-iframe" src="" allow="autoplay" className="w-0 h-0 absolute opacity-0 pointer-events-none" title="reveal-audio" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function RankingReveal() {
  const navigate = useNavigate();
  const [rankingData, setRankingData] = useState(null);
  const [started, setStarted] = useState(false);
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [rankingName, setRankingName] = useState("");

  // Sequence: flat list of { group, rank, tieCardIndex (for tie groups) }
  // We build a flat step sequence where each step is one "screen moment"
  const [sequence, setSequence] = useState([]); // array of { groupIdx, tieCardIdx, group, rank }
  const [seqIdx, setSeqIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [done, setDone] = useState(false);

  const iframeRef = useRef(null);
  const timerRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const timerKey = useRef(0);
  const seqIdxRef = useRef(0);
  const sequenceRef = useRef([]);
  const doneRef = useRef(false);

  // Load data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COMPLETE_KEY);
      if (saved) setRankingData(JSON.parse(saved));
    } catch {}
  }, []);

  // Build sequence
  useEffect(() => {
    if (!rankingData) return;
    const { rankings } = rankingData;
    const allGroups = groupByTie(rankings);
    const limit = rankings.length > 10 ? 10 : 5;
    const groups = buildSequence(allGroups, limit);

    const seq = [];
    groups.forEach((group, groupIdx) => {
      const rank = computeRank(groups, groupIdx);
      if (group.length === 1) {
        seq.push({ groupIdx, tieCardIdx: null, group, rank, isTie: false });
      } else {
        // One step per tied card
        group.forEach((_, tieCardIdx) => {
          seq.push({ groupIdx, tieCardIdx, group, rank, isTie: true });
        });
      }
    });
    setSequence(seq);
    sequenceRef.current = seq;
  }, [rankingData]);

  const stopAudio = useCallback(() => {
    const iframe = document.getElementById("rv-iframe");
    if (iframe) iframe.src = "";
    stopAllPreviews();
  }, []);

  const playAudio = useCallback((song) => {
    const src = buildYtSrc(song);
    const iframe = document.getElementById("rv-iframe");
    if (iframe && src) iframe.src = src;
  }, []);

  const getDuration = useCallback((step) => {
    if (!step) return 10000;
    const isTop1 = step.rank === 1;
    if (step.isTie) return 5000;
    if (isTop1) return 12000;
    return 10000;
  }, []);

  const scheduleNext = useCallback((currentIdx) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    const seq = sequenceRef.current;
    const step = seq[currentIdx];
    const duration = getDuration(step);

    timerRef.current = setTimeout(() => {
      if (doneRef.current) return;
      // Fade out audio ~1.5s early — we don't have volume API so just clear iframe
      fadeTimerRef.current = setTimeout(() => {
        stopAudio();
      }, duration - 1500 < 0 ? 0 : 0); // clear at end

      const nextIdx = currentIdx + 1;
      seqIdxRef.current = nextIdx;

      if (nextIdx >= seq.length) {
        // Done — transition out, then popup or navigate
        doneRef.current = true;
        setDone(true);
        setVisible(false);
        stopAudio();
        setTimeout(() => {
          if (localStorage.getItem("aespa_ranking_name")) {
            navigate(createPageUrl("Results"));
          } else {
            setShowNamePopup(true);
          }
        }, 1000);
        return;
      }

      // Cross-fade: hide current, then show next
      setVisible(false);
      stopAudio();
      setTimeout(() => {
        setSeqIdx(nextIdx);
        setVisible(true);
        timerKey.current += 1;
        const nextStep = seq[nextIdx];
        // For ties: only play audio for newly revealed card
        const songToPlay = nextStep.isTie
          ? nextStep.group[nextStep.tieCardIdx]?.song
          : nextStep.group[0]?.song;
        playAudio(songToPlay);
        scheduleNext(nextIdx);
      }, 700); // match fade duration
    }, duration);
  }, [getDuration, stopAudio, playAudio, navigate, setShowNamePopup]);

  const handleStart = useCallback(() => {
    setStarted(true);
    setSeqIdx(0);
    seqIdxRef.current = 0;
    doneRef.current = false;
    setDone(false);
    setVisible(true);
    timerKey.current = 1;

    setTimeout(() => {
      const seq = sequenceRef.current;
      if (seq.length === 0) return;
      const firstStep = seq[0];
      const songToPlay = firstStep.isTie
        ? firstStep.group[firstStep.tieCardIdx]?.song
        : firstStep.group[0]?.song;
      playAudio(songToPlay);
      scheduleNext(0);
    }, 100);
  }, [playAudio, scheduleNext]);

  // Auto-start as soon as the sequence is ready
  useEffect(() => {
    if (sequence.length > 0 && !started) {
      handleStart();
    }
  }, [sequence, handleStart, started]);

  const handleNext = useCallback(() => {
    if (doneRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    const seq = sequenceRef.current;
    const currentIdx = seqIdxRef.current;
    const nextIdx = currentIdx + 1;
    seqIdxRef.current = nextIdx;
    setVisible(false);
    stopAudio();
    if (nextIdx >= seq.length) {
      doneRef.current = true;
      setDone(true);
      return;
    }
    setTimeout(() => {
      setSeqIdx(nextIdx);
      setVisible(true);
      timerKey.current += 1;
      const nextStep = seq[nextIdx];
      const songToPlay = nextStep.isTie
        ? nextStep.group[nextStep.tieCardIdx]?.song
        : nextStep.group[0]?.song;
      playAudio(songToPlay);
      scheduleNext(nextIdx);
    }, 700);
  }, [stopAudio, playAudio, scheduleNext]);

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    stopAudio();
    doneRef.current = true;
    if (localStorage.getItem("aespa_ranking_name")) {
      navigate(createPageUrl("Results"));
    } else {
      setDone(true);
      setShowNamePopup(true);
    }
  }, [stopAudio, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      stopAudio();
    };
  }, [stopAudio]);

  if (!rankingData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/40 text-sm">No ranking data found.</p>
      </div>
    );
  }

  const currentStep = sequence[seqIdx];
  const isTop1 = currentStep ? currentStep.rank === 1 : false;
  const duration = currentStep ? getDuration(currentStep) : 10000;

  // For tie slides: how many cards revealed so far in this group
  // All steps in same groupIdx up to and including current tieCardIdx
  const tieRevealedCount = currentStep?.isTie ? (currentStep.tieCardIdx + 1) : 1;

  return (
    <div className="fixed inset-0 bg-black z-40 overflow-hidden">
      <style>{`
        .aurora-text-rv { background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399, #818cf8); background-size: 300% 300%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: aurora-shift-rv 4s ease infinite; }
        @keyframes aurora-shift-rv { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>

      {/* Timer bar — only during reveal */}
      {started && !done && (
        <TimerBar duration={duration} active={visible} resetKey={`${timerKey.current}-${seqIdx}`} />
      )}

      {/* Reveal counter — top left */}
      {started && !done && (
        <div className="fixed top-4 left-4 z-50 text-[11px] font-bold uppercase tracking-wider text-white/30">
          TOP {sequence.length} REVEAL · {seqIdx + 1}/{sequence.length}
        </div>
      )}

      {/* Skip button — top right during reveal */}
      {started && !done && (
        <button
          onClick={handleSkip}
          className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border border-white/15 text-white/30 hover:text-white/60 hover:border-white/30 transition-all bg-black/40 backdrop-blur-sm"
        >
          <SkipForward className="w-3 h-3" />
          Skip
        </button>
      )}

      {/* NEXT / SEE FULL RANKING button */}
      {started && !done && (
        <button
          onClick={
            seqIdx === sequence.length - 1
              ? () => {
                  if (localStorage.getItem("aespa_ranking_name")) {
                    navigate(createPageUrl("Results"));
                  } else {
                    setShowNamePopup(true);
                  }
                }
              : handleNext
          }
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border border-white/15 text-white/30 hover:text-white/60 hover:border-white/30 transition-all bg-black/40 backdrop-blur-sm"
        >
          {seqIdx === sequence.length - 1 ? "SEE FULL RANKING →" : "NEXT →"}
        </button>
      )}

      {/* Name Your Ranking popup */}
      <AnimatePresence>
        {showNamePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-[#0e0e0e] border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
            >
              <div>
                <h2 className="text-white font-black text-lg tracking-tight">Name Your Ranking</h2>
                <p className="text-white/35 text-xs mt-1">Optional — leave blank for an auto-generated name</p>
              </div>
              <input
                type="text"
                value={rankingName}
                onChange={e => setRankingName(e.target.value)}
                placeholder={`My Ranking · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 outline-none focus:border-violet-500/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const auto = `My Ranking · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
                    localStorage.setItem("aespa_ranking_name", auto);
                    navigate(createPageUrl("Results"));
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/40 text-sm font-semibold hover:text-white/60 hover:border-white/20 transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={() => {
                    const name = rankingName.trim() || `My Ranking · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
                    localStorage.setItem("aespa_ranking_name", name);
                    navigate(createPageUrl("Results"));
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-white text-sm font-semibold transition-all"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Song slides */}
      {started && currentStep && (
        currentStep.isTie ? (
          <TieSlide
            group={currentStep.group}
            rank={currentStep.rank}
            isTop1={isTop1}
            revealedCount={tieRevealedCount}
            visible={visible}
          />
        ) : (
          <SongSlide
            song={currentStep.group[0]?.song}
            rank={currentStep.rank}
            isTop1={isTop1}
            visible={visible}
          />
        )
      )}
    </div>
  );
}