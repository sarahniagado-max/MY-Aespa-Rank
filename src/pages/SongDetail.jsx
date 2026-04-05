import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTintMode } from "../components/AlbumTintManager";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Star, Clock, Zap, Info } from "lucide-react";
import { useSongs } from "../components/ranking/useSongs";
import SongPreviewPlayer from "../components/ranking/SongPreviewPlayer";
import { getBattleResults, getAvgDecisionTime } from "../components/battleStats";
import { getPersonalEntry, savePersonalEntry, isFavorite, toggleFavorite } from "../components/personalData";
import SongTags from "../components/SongTags";

const COMPLETE_KEY = "aespa_ranking_complete";

const TYPE_LABELS = {
  title_track: "Title Track", b_side: "B-side", single: "Single",
  pre_release: "Pre-release", collaboration: "Collab", ost: "OST", solo: "Solo",
};

export default function SongDetail() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const title = decodeURIComponent(params.get("title") || "");
  const { songs } = useSongs();
  const song = songs.find(s => s.title === title) || null;

  const [isFav, setIsFav] = useState(() => isFavorite(title));
  const [personalEntry, setPersonalEntryState] = useState(() => getPersonalEntry(title));
  const [editing, setEditing] = useState(false);
  const [tempScore, setTempScore] = useState("");
  const [tempNotes, setTempNotes] = useState("");

  const tintMode = useTintMode();
  const rankingData = (() => { try { return JSON.parse(localStorage.getItem(COMPLETE_KEY) || "null"); } catch { return null; } })();
  const rankEntry = rankingData?.rankings?.find(r => r.song?.title === title);
  const rank = rankEntry ? (rankingData.rankings.indexOf(rankEntry) + 1) : null;
  const eloRating = rankEntry?.rating;
  const battleResults = getBattleResults();
  const songResults = battleResults[title] || { wins: 0, losses: 0, ties: 0 };
  const avgTime = getAvgDecisionTime(title);
  const totalBattles = (songResults.wins || 0) + (songResults.losses || 0) + (songResults.ties || 0);
  const winRate = totalBattles > 0 ? Math.round(((songResults.wins || 0) / totalBattles) * 100) : null;

  const handleFavToggle = () => {
    const newState = toggleFavorite(title);
    setIsFav(newState);
  };

  const startEdit = () => {
    setTempScore(personalEntry.score != null ? String(personalEntry.score) : "");
    setTempNotes(personalEntry.notes || "");
    setEditing(true);
  };

  const saveEdit = () => {
    const newData = {
      score: tempScore !== "" ? Math.min(10, Math.max(1, Number(tempScore))) : null,
      notes: tempNotes.trim() || null,
    };
    savePersonalEntry(title, newData);
    setPersonalEntryState(newData);
    setEditing(false);
  };

  if (!song) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 text-sm mb-3">Song not found</p>
          <button onClick={() => navigate(-1)} className="text-violet-400 text-sm underline">Go Back</button>
        </div>
      </div>
    );
  }

  const infoRows = [
    { label: "Type", value: TYPE_LABELS[song.song_type] || song.song_type },
    { label: "Album", value: song.album },
    { label: "Released", value: song.release_date },
    { label: "Member", value: song.featured_member || song.member },
    { label: "Language", value: song.lyrics_language },
    { label: "Japanese", value: song.is_japanese ? "Yes" : null },
    { label: "Collab", value: song.collab_artist },
    { label: "OST From", value: song.ost_source },
    { label: "Notes", value: song.notes },
  ].filter(r => r.value);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Blurred background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {song.cover_url && (
          <img src={song.cover_url} alt="" className="w-full h-[60%] object-cover opacity-15 scale-110 blur-2xl" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={handleFavToggle} className="p-2 -mr-2 transition-colors">
            <Heart className={`w-5 h-5 transition-all ${isFav ? "fill-red-400 text-red-400 scale-110" : "text-white/30 hover:text-red-400"}`} />
          </button>
        </div>

        {/* Cover + basic info */}
        <div className="px-6 pb-5 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-40 h-40 rounded-2xl overflow-hidden shadow-2xl mb-4"
            style={{ boxShadow: tintMode === 'tint'
              ? `0 0 30px rgba(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b),0.33)`
              : (song.lightstick_color ? `0 0 30px ${song.lightstick_color}55` : 'none') }}
          >
            {song.cover_url ? (
              <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20 text-5xl">♪</div>
            )}
          </motion.div>
          <h1 className="text-white font-black text-2xl leading-tight">{song.title}</h1>
          <p className="text-white/40 text-sm mt-0.5">{song.album}</p>
          {song.release_date && <p className="text-white/20 text-xs mt-0.5">{song.release_date}</p>}
          <div className="mt-3">
            <SongPreviewPlayer songTitle={song.title} songData={song} />
          </div>
        </div>

        {/* Stats row */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Rank", value: rank ? `#${rank}` : "—", icon: Star, color: "text-yellow-400" },
              { label: "ELO", value: eloRating ? Math.round(eloRating) : "—", icon: Zap, color: "text-violet-400" },
              { label: "Avg Decision", value: avgTime ? `${avgTime.toFixed(1)}s` : "—", icon: Clock, color: "text-cyan-400" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <s.icon className={`w-3.5 h-3.5 ${s.color} mx-auto mb-1.5`} />
                <div className="text-white font-black text-lg leading-none">{s.value}</div>
                <div className="text-white/25 text-[9px] uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Battle Record */}
          {totalBattles > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <h3 className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-3">Battle Record</h3>
              <div className="flex gap-4 justify-center mb-3">
                {[
                  { label: "Wins", value: songResults.wins || 0, color: "text-green-400" },
                  { label: "Ties", value: songResults.ties || 0, color: "text-white/40" },
                  { label: "Losses", value: songResults.losses || 0, color: "text-red-400" },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className={`${s.color} font-black text-2xl leading-none`}>{s.value}</div>
                    <div className="text-white/30 text-xs mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-cyan-500"
                  style={{ width: `${winRate || 0}%` }}
                />
              </div>
              {winRate !== null && (
                <p className="text-white/25 text-[10px] text-center mt-1.5">{winRate}% win rate · {totalBattles} total battles</p>
              )}
            </div>
          )}

          {/* Song Info */}
          {infoRows.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
              <h3 className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5">
                <Info className="w-3 h-3" /> Song Info
              </h3>
              <div className="space-y-2">
                {infoRows.map(r => (
                  <div key={r.label} className="flex gap-3">
                    <span className="text-white/25 text-xs w-20 shrink-0">{r.label}</span>
                    <span className="text-white/70 text-xs flex-1">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Tags */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
            <h3 className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-3">Personal Tags</h3>
            <SongTags songTitle={title} />
          </div>

          {/* Personal notes + score */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white/40 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5">
                <Star className="w-3 h-3" /> Personal
              </h3>
              {!editing && (
                <button onClick={startEdit} className="text-violet-400/70 text-xs hover:text-violet-300 transition-colors">
                  Edit
                </button>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-1">Score (1–10)</label>
                  <input
                    type="number" min="1" max="10" value={tempScore}
                    onChange={e => setTempScore(e.target.value)}
                    placeholder="—"
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-1">Notes</label>
                  <textarea
                    rows={3} value={tempNotes}
                    onChange={e => setTempNotes(e.target.value)}
                    placeholder="Your thoughts about this song..."
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-white/40 text-sm hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveEdit} className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-colors">
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {personalEntry.score != null && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-bold text-lg">{personalEntry.score}/10</span>
                  </div>
                )}
                {personalEntry.notes ? (
                  <p className="text-white/60 text-sm leading-relaxed">{personalEntry.notes}</p>
                ) : (
                  !personalEntry.score && (
                    <p className="text-white/20 text-xs">No personal notes yet — tap Edit to add some.</p>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}