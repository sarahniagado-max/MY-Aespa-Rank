import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Plus, Trash2, X as XIcon, Pencil, Heart, Star } from "lucide-react";
import { isFavorite, toggleFavorite, getPersonalEntry, savePersonalEntry } from "../components/personalData";
import CoverImg from "../components/ranking/CoverImg";
import { getSongOrder } from "../components/ranking/aespaSongs";
import { useSongs } from "../components/ranking/useSongs";
import SongPreviewPlayer from "../components/ranking/SongPreviewPlayer";
import { getAlbumColor } from "../components/ranking/albumColors";
import { applyAlbumTint, clearAlbumTint, useTintMode, getTintBrightnessMode } from "../components/AlbumTintManager";
import AddSongModal from "../components/ranking/AddSongModal";
import EditSongModal from "../components/ranking/EditSongModal";
import ConfirmDeleteModal from "../components/ranking/ConfirmDeleteModal";
import { format } from "date-fns";

import SongCardShimmerOverlay, { useSongCardShimmers } from "../components/ranking/SongCardShimmerOverlay";
import { getBattleResults } from "../components/battleStats";
import { getPlayCount } from "../components/ranking/SongPreviewPlayer";

// ── Color interpolation ──────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.trim();
  return { r: parseInt(h.slice(1,3),16), g: parseInt(h.slice(3,5),16), b: parseInt(h.slice(5,7),16) };
}
function lerpColor(colors, t) {
  if (!colors || colors.length === 0) return 'rgb(100,100,100)';
  if (colors.length === 1) return colors[0];
  t = Math.max(0, Math.min(1, t));
  const scaled = t * (colors.length - 1);
  const i = Math.min(Math.floor(scaled), colors.length - 2);
  const f = scaled - i;
  const a = hexToRgb(colors[i]), b = hexToRgb(colors[i+1]);
  return `rgb(${Math.round(a.r+f*(b.r-a.r))},${Math.round(a.g+f*(b.g-a.g))},${Math.round(a.b+f*(b.b-a.b))})`;
}
function getSongColor(colors, songIndex, totalSongs) {
  if (!colors || colors.length === 0) return 'rgb(100,100,100)';
  const t = totalSongs <= 1 ? 0.5 : 0.15 + (songIndex / (totalSongs - 1)) * 0.7;
  return lerpColor(colors, t);
}
function parseColors(lightstick_color) {
  if (!lightstick_color) return null;
  const arr = lightstick_color.split(',').map(c => c.trim()).filter(c => /^#[0-9A-Fa-f]{6}$/.test(c));
  return arr.length > 0 ? arr : null;
}
// ─────────────────────────────────────────────────────────────────

const CUSTOM_SONGS_KEY = "aespa_custom_songs";

// Hardcoded fallbacks for albums that may have DB read issues
const LIGHTSTICK_FALLBACKS = {
  "Attitude": "#C070E0,#B868D8,#A860C8,#9868C8,#8878C8,#7888D0,#6898D8,#5898E0,#50A8E8,#50C0F0,#50C8FF,#50D0FF",
};

// Overrides always take precedence over DB values — hardcoded for albums that don't read correctly
const LIGHTSTICK_OVERRIDES = {
  "MY WORLD": "#082808,#105010,#1A7818,#28A020,#3DC93A,#50D848,#60E050,#50D0A0,#40C8E8,#60D8F0",
  "Regret of the Times": "#E8B820,#C49A30,#A07820,#686010,#282010,#101010,#101828,#183040,#2050A0",
};

function loadCustomSongs() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_SONGS_KEY) || "[]"); } catch { return []; }
}

const TYPE_LABELS = {
  title_track: "Title",
  b_side: "B-side",
  single: "Single",
  pre_release: "Pre-release",
  collaboration: "Collab",
  ost: "OST",
  solo: "Solo",
  cover: "Cover",
};

const TYPE_COLORS = {
  title_track: "text-violet-300 bg-violet-400/10",
  b_side: "text-white/50 bg-white/5",
  single: "text-cyan-300 bg-cyan-400/10",
  pre_release: "text-amber-300 bg-amber-400/10",
  collaboration: "text-pink-300 bg-pink-400/10",
  ost: "text-green-300 bg-green-400/10",
  solo: "text-rose-300 bg-rose-400/10",
  cover: "text-blue-300 bg-blue-400/10",
};

const MEMBER_STYLES = {
  Karina:  { color: "text-blue-300", border: "border-blue-400/30", bg: "bg-blue-900/20", emoji: "💙" },
  Giselle: { color: "text-pink-300", border: "border-pink-400/30", bg: "bg-pink-900/20", emoji: "🌙" },
  Winter:  { color: "text-red-300",  border: "border-red-400/30",  bg: "bg-red-900/20",  emoji: "⭐" },
  Ningning:{ color: "text-purple-300",border: "border-purple-400/30",bg: "bg-purple-900/20",emoji: "🦋" },
};

const TABS_BASE = ["All", "Title Tracks", "B-sides", "Singles", "Solos", "Collabs & OSTs"];
const SONG_TYPES = ["single", "b_side", "title_track", "ost", "collaboration", "cover", "solo"];

function AuroraDate({ date }) {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return <span className="aurora-date text-[11px] font-semibold">{date}</span>;
    return <span className="aurora-date text-[11px] font-semibold">{format(d, "MMM d, yyyy")}</span>;
  } catch { return <span className="aurora-date text-[11px] font-semibold">{date}</span>; }
}

export default function Songs() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [customSongs, setCustomSongs] = useState(loadCustomSongs);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const tintMode = useTintMode();
  const { songs: dbSongs, albums: dbAlbums, loading: songsLoading } = useSongs();

  useEffect(() => {
    setUser(null);
    setIsChecking(false);
  }, []);

  // Album cover lookup: name → cover_url
  const albumCoverMap = React.useMemo(() => {
    const m = {};
    (dbAlbums || []).forEach(a => { m[a.name] = a.cover_url; });
    return m;
  }, [dbAlbums]);

  // Lightstick color lookup: album name → hex color
  const lightstickColorMap = React.useMemo(() => {
    const m = {};
    (dbAlbums || []).forEach(a => {
      if (a.lightstick_color) m[a.name] = a.lightstick_color;
      console.log('[lightstick]', a.name, '->', a.lightstick_color ?? 'MISSING');
    });
    return m;
  }, [dbAlbums]);
  const coversAndUnreleased = [...dbSongs, ...customSongs].filter(s => s.song_type === "cover" || s.song_type === "unreleased");
  const showCoversTab = coversAndUnreleased.length >= 2;
  const TABS = showCoversTab ? [...TABS_BASE, "Covers / Unreleased"] : TABS_BASE;

  const allSongs = [...dbSongs, ...customSongs].sort((a, b) => {
    // Primary sort: release_date chronologically
    const dateA = a.release_date ? new Date(a.release_date) : new Date('9999-01-01');
    const dateB = b.release_date ? new Date(b.release_date) : new Date('9999-01-01');
    if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
    // Within same album: track_number first, then canonical order
    const tnA = a.track_number ?? null;
    const tnB = b.track_number ?? null;
    if (tnA !== null && tnB !== null) return tnA - tnB;
    if (tnA !== null) return -1;
    if (tnB !== null) return 1;
    const oa = getSongOrder(a.title);
    const ob = getSongOrder(b.title);
    if (oa !== 999 && ob !== 999) return oa - ob;
    return a.title.localeCompare(b.title);
  });

  const handleAddSong = (song) => {
    const updated = [...customSongs, song];
    setCustomSongs(updated);
    localStorage.setItem(CUSTOM_SONGS_KEY, JSON.stringify(updated));
  };

  const handleDeleteCustomSong = (title) => {
    setDeleteConfirm(title);
  };

  const confirmDelete = () => {
    const updated = customSongs.filter(s => s.title !== deleteConfirm);
    setCustomSongs(updated);
    localStorage.setItem(CUSTOM_SONGS_KEY, JSON.stringify(updated));
    setDeleteConfirm(null);
  };

  const handleEditSong = (song) => setEditingSong(song);

  const handleSaveEdit = (updatedSong) => {
    const updated = customSongs.map(s => s.title === editingSong.title ? updatedSong : s);
    setCustomSongs(updated);
    localStorage.setItem(CUSTOM_SONGS_KEY, JSON.stringify(updated));
    setEditingSong(null);
  };

  const filtered = React.useMemo(() => allSongs.filter(song => {
    const matchSearch = song.title.toLowerCase().includes(search.toLowerCase()) ||
      (song.album || '').toLowerCase().includes(search.toLowerCase());
    let matchTab = true;
    if (activeTab === "Title Tracks") matchTab = song.song_type === "title_track";
    else if (activeTab === "B-sides") matchTab = song.song_type === "b_side";
    else if (activeTab === "Solos") matchTab = song.song_type === "solo";
    else if (activeTab === "Singles") matchTab = ["single", "pre_release"].includes(song.song_type);
    else if (activeTab === "Collabs & OSTs") matchTab = ["collaboration", "ost"].includes(song.song_type);
    else if (activeTab === "Covers / Unreleased") matchTab = song.song_type === "cover" || song.song_type === "unreleased";
    return matchSearch && matchTab;
  }), [allSongs, activeTab, search]);

  // Group by album name only — same album always in one section
  const { grouped, groupedOrder } = React.useMemo(() => {
    const grouped = {};
    const groupedOrder = [];
    filtered.forEach(song => {
      const key = song.album || "";
      if (!grouped[key]) { grouped[key] = []; groupedOrder.push(key); }
      grouped[key].push(song);
    });
    Object.values(grouped).forEach(songs => {
      songs.sort((a, b) => {
        const tnA = a.track_number ?? null;
        const tnB = b.track_number ?? null;
        if (tnA !== null && tnB !== null) return tnA - tnB;
        if (tnA !== null) return -1;
        if (tnB !== null) return 1;
        return a.title.localeCompare(b.title);
      });
    });
    return { grouped, groupedOrder };
  }, [filtered]);

  const shimmerDepKey = songsLoading ? 'loading' : `loaded:${activeTab}:${groupedOrder.join(',')}`;
  const shimmersRef = useSongCardShimmers(shimmerDepKey);

  // For Solos tab, group by member
  const solosByMember = {};
  if (activeTab === "Solos") {
    filtered.forEach(song => {
      const member = song.member || "Unknown";
      if (!solosByMember[member]) solosByMember[member] = [];
      solosByMember[member].push(song);
    });
  }

  // IntersectionObserver: tint background based on which album section is in view
  useEffect(() => {
    const observers = [];
    const sectionEls = document.querySelectorAll('[data-album-lightstick]');
    sectionEls.forEach(el => {
      const color = el.getAttribute('data-album-lightstick');
      const obs = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && tintMode !== 'tint') applyAlbumTint(color, getTintBrightnessMode());
        },
        { threshold: 0.15, rootMargin: '-80px 0px -60% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => { observers.forEach(o => o.disconnect()); if (tintMode !== 'tint') clearAlbumTint(); };
  // Re-run whenever filtered songs change so new section elements get observed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length, tintMode]);

  if (songsLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  const albumSongsMap = {};
  allSongs.forEach(song => {
    const key = song.album || "";
    if (!albumSongsMap[key]) albumSongsMap[key] = [];
    albumSongsMap[key].push(song);
  });

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" ref={shimmersRef}>
      <style>{`
        .aurora-date {
          background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: aurora-shift 4s ease infinite;
        }
        .aurora-album-title {
          background: linear-gradient(135deg, #a78bfa, #67e8f9, #f0abfc, #34d399);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: aurora-shift 4s ease infinite;
        }
        @keyframes album-sidebar-breathe {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        .album-sidebar-breathe {
          animation: album-sidebar-breathe 3.5s ease-in-out infinite alternate;
        }
        @keyframes aurora-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-sm tracking-wider">SONG LIST</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 -mr-2 text-white/40 hover:text-violet-400 transition-colors"
          title="Add a song"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative z-10 px-4 pt-2 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search songs or albums..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => {
          const isCover = tab === "Covers";
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition-all ${
                isActive
                  ? isCover
                    ? "border-blue-500 text-white"
                    : "bg-violet-600 border-violet-500 text-white"
                  : isCover
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-300 hover:text-blue-200"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
              }`}
              style={isActive && isCover ? { background: "linear-gradient(135deg, #0070f3, #00b4ff)" } : {}}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <div className="relative z-10 px-4 pb-2">
        <p className="text-white/40 text-xs font-medium">{filtered.length} songs</p>
      </div>

      {/* Album Detail Modal */}
      <AnimatePresence>
        {selectedAlbum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedAlbum(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-sm bg-[#0c0c0c] border border-white/12 rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Album header */}
              {(() => {
                const albumSongs = albumSongsMap[selectedAlbum] || [];
                const albumName = albumSongs[0]?.album || selectedAlbum;
                const coverSong = albumSongs.find(s => s.title === albumName) || albumSongs.find(s => s.song_type === "title_track") || albumSongs[0];
                const coverUrl = coverSong?.cover_url || albumCoverMap[albumName];
                const releaseDate = albumSongs[0]?.release_date;
                const ac = getAlbumColor(selectedAlbum);
                return (
                  <>
                    <div className="relative">
                      {coverUrl && (
                        <CoverImg src={coverUrl} alt={selectedAlbum} className="w-full h-32 object-cover object-top" style={{ filter: "brightness(0.5) saturate(1.2)" }} fallbackClass="w-full h-32 bg-white/5" fallbackContent="" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0c0c0c]" />
                      <button onClick={() => setSelectedAlbum(null)} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white/60 hover:text-white transition-colors">
                        <XIcon className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-3 left-4">
                        <h2 className="text-white font-black text-lg leading-tight">{albumName}</h2>
                        {releaseDate && <p className="text-white/40 text-xs">{format(new Date(releaseDate), "MMM yyyy")}</p>}
                        <p className="text-white/30 text-xs">{albumSongs.length} tracks</p>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-3 space-y-1">
                      {albumSongs.map((song, songIdx) => (
                        <div
                          key={song.title}
                          className="flex items-center justify-between py-2 px-3 rounded-xl gap-2"
                          style={{ backgroundColor: `rgba(${ac.rgb}, 0.08)`, border: `1px solid rgba(${ac.rgb}, 0.2)` }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-white/90 text-sm truncate font-medium">{song.title}</p>
                            {song.collab_info && <p className="text-pink-400/70 text-[9px]">{song.collab_info}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <SongPreviewPlayer songTitle={song.title} songData={song} compact songIndex={songIdx} totalInAlbum={albumSongs.length} />
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[song.song_type] || "text-white/40 bg-white/5"}`}>
                              {TYPE_LABELS[song.song_type] || song.song_type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Covers / Unreleased tab */}
      {activeTab === "Covers / Unreleased" ? (
        <div className="relative z-10 px-4 pb-24 space-y-2">
          {filtered.map(song => {
            const albumSongs = grouped[song.album] || [];
            const ls = lightstickColorMap[song.album];
            return (
              <SongRow key={song.title} song={song} albumCoverMap={albumCoverMap} lightstickColor={ls} onDelete={song.isCustom ? handleDeleteCustomSong : null} onEdit={song.isCustom ? handleEditSong : null} />
            );
          })}
        </div>
      ) : activeTab === "Solos" ? (
        <div className="relative z-10 px-4 pb-24 space-y-6">
          {["Karina", "Giselle", "Winter", "Ningning"].map(member => {
            const songs = solosByMember[member] || [];
            if (songs.length === 0) return null;
            const style = MEMBER_STYLES[member] || { color: "text-white/60", border: "border-white/10", bg: "bg-white/5", emoji: "🎵" };
            return (
              <motion.div key={member} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] mb-2 ${style.color}`}>
                  <span>{style.emoji}</span>
                  <span>{member}</span>
                </div>
                <div className={`space-y-1 p-2 rounded-xl border ${style.border} ${style.bg}`}>
                   {songs.map(song => {
                     const ls = song.lightstick_color || lightstickColorMap[song.album] || null;
                     return (
                       <SongRow key={song.title} song={song} hideMember albumCoverMap={albumCoverMap} lightstickColor={ls} onEdit={song.isCustom ? handleEditSong : null} onDelete={song.isCustom ? handleDeleteCustomSong : null} />
                       );
                       })}
                       </div>
                       </motion.div>
                       );
                       })}
                 </div>
      ) : activeTab !== "Covers / Unreleased" && (
         <div className="relative z-10 px-4 pb-24 space-y-6">
          {groupedOrder.map(key => {
           const songs = grouped[key];
           const album = songs[0].album;
           const coverSong = songs.find(s => s.title === album) || songs.find(s => s.song_type === "title_track") || songs[0];
           const coverUrl = coverSong?.cover_url || albumCoverMap[album];
           const lightstick = LIGHTSTICK_OVERRIDES[album] || songs[0].lightstick_color || lightstickColorMap[album] || LIGHTSTICK_FALLBACKS[album] || "#888888";
           const colors = parseColors(lightstick);
           const midColor = lightstick ? (() => {
             const cs = lightstick.split(',').map(c => c.trim()).filter(c => /^#[0-9A-Fa-f]{6}$/.test(c));
             if (cs.length === 0) return null;
             const mid = cs[Math.floor(cs.length / 2)];
             // Check brightness of mid color
             const r = parseInt(mid.slice(1,3),16), g = parseInt(mid.slice(3,5),16), b = parseInt(mid.slice(5,7),16);
             const brightness = (r * 299 + g * 587 + b * 114) / 1000;
             if (brightness < 30) {
               // Use brightest color instead
               return cs.reduce((best, hex) => {
                 const br = parseInt(hex.slice(1,3),16), bg = parseInt(hex.slice(3,5),16), bb = parseInt(hex.slice(5,7),16);
                 const brt = (br * 299 + bg * 587 + bb * 114) / 1000;
                 const prevR = parseInt(best.slice(1,3),16), prevG = parseInt(best.slice(3,5),16), prevB = parseInt(best.slice(5,7),16);
                 const prevBrt = (prevR * 299 + prevG * 587 + prevB * 114) / 1000;
                 return brt > prevBrt ? hex : best;
               }, cs[0]);
             }
             return mid;
           })() : null;
           const headerStyle = midColor ? { border: `1px solid ${midColor}4D` } : {};
           return (
              <div key={key} data-album-lightstick={lightstick || ""}>
                <button
                  onClick={() => setSelectedAlbum(key)}
                  className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity active:scale-98 rounded-lg"
                  style={{...headerStyle, padding: '5px 8px', boxShadow: midColor ? `0 0 10px ${midColor}59` : 'none', minHeight: '0'}}
                 >
                  <div className="overflow-hidden shrink-0 bg-white/5" style={{ width: '28px', height: '28px', borderRadius: '5px' }}>
                   <CoverImg src={coverUrl} alt={album} className="w-full h-full object-cover" fallbackClass="w-full h-full bg-white/10 flex items-center justify-center text-[8px] text-white/30" fallbackContent="?" />
                 </div>
                 <div className="flex-1 min-w-0 leading-none">
                   <h3 className="text-white font-bold text-[13px] tracking-tight leading-snug">{album}</h3>
                   <AuroraDate date={songs[0].release_date} />
                 </div>
                 <span className="text-white/20 text-xs pr-2 leading-none flex-shrink-0">›</span>
                 </button>
                  <div className="flex gap-1 mt-1 pl-4">
                  {/* Tall vertical gradient line spanning all songs */}
                  <div style={{
                    width: '2px',
                    background: tintMode === 'tint'
                      ? 'rgb(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b))'
                      : (colors && colors.length > 1
                          ? `linear-gradient(to bottom, ${colors.join(', ')})`
                          : colors && colors.length === 1 ? colors[0] : 'rgba(255,255,255,0.15)'),
                    borderRadius: '1px',
                    flexShrink: 0,
                  }} />
                  {/* Song cards */}
                  <div className="flex-1 flex flex-col gap-0.5">
                    {songs.map((song, songIdx) => {
                      const songColor = colors ? getSongColor(colors, songIdx, songs.length) : null;
                      const nextSongColor = colors && songIdx < songs.length - 1 ? getSongColor(colors, songIdx + 1, songs.length) : null;
                      return (
                        <SongRow key={song.title} song={song} albumCoverMap={albumCoverMap} lightstickColor={lightstick} songColor={songColor} nextSongColor={nextSongColor} albumKey={key} shimmerOpacity={songIdx === 0 ? 0.5 : 0.25} onDelete={song.isCustom ? handleDeleteCustomSong : null} onEdit={song.isCustom ? handleEditSong : null} songIndex={songIdx} totalInAlbum={songs.length} />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )

      }

      <AnimatePresence>
        {showAddModal && (
          <AddSongModal onClose={() => setShowAddModal(false)} onAdd={handleAddSong} customSongs={customSongs} dbSongs={dbSongs} dbAlbums={dbAlbums} />
        )}
        {editingSong && (
          <EditSongModal song={editingSong} onClose={() => setEditingSong(null)} onSave={handleSaveEdit} allSongs={allSongs} />
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        open={!!deleteConfirm}
        title="Delete Song?"
        message={`Remove "${deleteConfirm}" from your custom songs? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

function SongRow({ song, hideMember = false, onDelete = null, onEdit = null, albumCoverMap = {}, lightstickColor = null, songColor = null, nextSongColor = null, albumKey = '', shimmerOpacity = 0.25, songIndex, totalInAlbum }) {
  const memberStyle = song.member ? MEMBER_STYLES[song.member] : null;
  const ac = getAlbumColor(song.album);
  const cardColor = songColor || null;
  const tintMode = useTintMode();
  const [isFav, setIsFav] = React.useState(() => isFavorite(song.title));
  const [showNotes, setShowNotes] = React.useState(false);
  const [personalEntry, setPersonalEntryState] = React.useState(() => getPersonalEntry(song.title));
  const [tempScore, setTempScore] = React.useState("");
  const [tempNotes, setTempNotes] = React.useState("");
  const [isHovered, setIsHovered] = React.useState(false);

  // Win rate
  const battleResults = React.useMemo(() => getBattleResults(), []);
  const songStats = battleResults[song.title];
  const totalBattles = songStats ? (songStats.wins || 0) + (songStats.losses || 0) + (songStats.ties || 0) : 0;
  const winRate = totalBattles > 0 ? Math.round(((songStats.wins || 0) / totalBattles) * 100) : null;

  // Play count (only show if > 0)
  const playCount = getPlayCount(song.title);

  const handleFavToggle = (e) => {
    e.stopPropagation();
    setIsFav(toggleFavorite(song.title));
  };

  const openNotes = (e) => { e.stopPropagation(); setTempScore(personalEntry.score != null ? String(personalEntry.score) : ""); setTempNotes(personalEntry.notes || ""); setShowNotes(true); };
  const saveNotes = () => {
    const d = { score: tempScore !== "" ? Math.min(10, Math.max(1, Number(tempScore))) : null, notes: tempNotes.trim() || null };
    savePersonalEntry(song.title, d);
    setPersonalEntryState(d);
    setShowNotes(false);
  };

  const titleUrl = `/SongDetail?title=${encodeURIComponent(song.title)}`;

  // Parse rgb values for rgba() usage — cardColor is "rgb(r,g,b)"
  const rgbVals = React.useMemo(() => {
    if (!cardColor) return null;
    const m = cardColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    return m ? `${m[1]},${m[2]},${m[3]}` : null;
  }, [cardColor]);

  const nextRgbVals = React.useMemo(() => {
    if (!nextSongColor) return null;
    const m = nextSongColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    return m ? `${m[1]},${m[2]},${m[3]}` : null;
  }, [nextSongColor]);

  const tintRgb = 'var(--album-bg-r),var(--album-bg-g),var(--album-bg-b)';
  const activeRgb = tintMode === 'tint' ? tintRgb : rgbVals;
  const cardStyle = activeRgb ? {
    borderLeft: `2px solid rgba(${activeRgb}, 0.8)`,
    background: '#080808',
    boxShadow: isHovered ? `0 0 12px rgba(${activeRgb},0.5)` : 'none',
    transition: '0.3s ease',
  } : {
    borderLeft: `2px solid rgba(255,255,255,0.3)`,
    background: '#080808',
    boxShadow: isHovered ? '0 0 12px rgba(255,255,255,0.2)' : 'none',
    transition: '0.3s ease',
  };

  return (
    <div
      data-song-shimmer
      data-album-key={albumKey}
      className="rounded-xl relative overflow-hidden"
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SongCardShimmerOverlay songColor={cardColor} opacity={shimmerOpacity} />
      <div className="flex items-center justify-between py-2 px-3 gap-2 relative z-10">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-[25px] h-[25px] overflow-hidden shrink-0 bg-white/5" style={{ borderRadius: '4px' }}>
            <CoverImg src={song.cover_url || albumCoverMap[song.album]} alt="" className="w-full h-full object-cover" fallbackClass="w-full h-full bg-white/10 flex items-center justify-center text-[8px] text-white/30" fallbackContent="?" />
          </div>
          <div className="min-w-0">
            <Link
              to={titleUrl}
              className={`text-white/90 text-sm truncate block font-medium transition-colors ${tintMode !== 'tint' ? 'hover:text-violet-300' : ''}`}
              style={tintMode === 'tint' ? { color: 'rgb(var(--album-bg-r),var(--album-bg-g),var(--album-bg-b))' } : undefined}
            >
              {song.title}
            </Link>
            <div className="flex items-center gap-1.5 flex-wrap">
              {song.collab_info && <span className="text-pink-400/70 text-[9px]">{song.collab_info}</span>}
              {song.label && <span className="text-amber-400/80 text-[9px] font-bold">{song.label}</span>}
              {song.song_type === "cover" && song.original_title && (
                <span className="text-cyan-400/70 text-[9px]">Cover of {song.original_title}{song.original_artist ? ` by ${song.original_artist}` : ""}</span>
              )}
              {!hideMember && song.member && (
                <span className={`text-[9px] font-semibold ${memberStyle ? memberStyle.color : "text-white/50"}`}
                  style={song.member_color ? { color: song.member_color } : undefined}>
                  {memberStyle?.emoji || "🎵"} {song.member}
                </span>
              )}
              {song.isCustom && <span className="text-violet-400/60 text-[9px] font-bold">Custom</span>}
              {personalEntry.score != null && (
                <span className="text-yellow-400/80 text-[9px] font-bold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-current" />{personalEntry.score}/10
                </span>
              )}
              {personalEntry.notes && (
                <span className="text-white/30 text-[9px] italic truncate max-w-[80px]">"{personalEntry.notes}"</span>
              )}

            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={handleFavToggle} className="transition-colors p-0.5">
            <Heart className={`w-3.5 h-3.5 transition-all ${isFav ? "fill-red-400 text-red-400" : "text-white/20 hover:text-red-400"}`} />
          </button>
          <button onClick={openNotes} className="text-white/20 hover:text-yellow-400 transition-colors p-0.5">
            <Star className="w-3.5 h-3.5" />
          </button>
          <SongPreviewPlayer songTitle={song.title} songData={song} compact songColor={cardColor} lightstickColor={lightstickColor} songIndex={songIndex} totalInAlbum={totalInAlbum} />
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[song.song_type] || "text-white/40 bg-white/5"}`}>
            {TYPE_LABELS[song.song_type] || song.song_type}
          </span>
          {winRate !== null && (
            <span className="text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-white/8 border border-white/10">
              {winRate}%
            </span>
          )}
          {onEdit && (
            <button onClick={() => onEdit(song)} className="text-white/20 hover:text-violet-400 transition-colors" title="Edit song">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(song.title)} className="text-red-400/50 hover:text-red-400 transition-colors" title="Delete custom song">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {showNotes && (
        <div className="px-3 pb-3 pt-0 border-t border-white/5 mt-0 space-y-2 relative z-10">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-white/30 text-[9px] uppercase tracking-wider block mb-1">Score (1–10)</label>
              <input type="number" min="1" max="10" value={tempScore} onChange={e => setTempScore(e.target.value)} placeholder="—"
                className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none" />
            </div>
            <div className="flex-[2]">
              <label className="text-white/30 text-[9px] uppercase tracking-wider block mb-1">Notes</label>
              <input type="text" value={tempNotes} onChange={e => setTempNotes(e.target.value)} placeholder="Quick note..."
                className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setShowNotes(false)} className="flex-1 py-1 rounded-lg text-white/30 text-xs border border-white/10 hover:bg-white/5">Cancel</button>
            <button onClick={saveNotes} className="flex-1 py-1 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}