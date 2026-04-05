import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { getFavorites, isFavorite, toggleFavorite } from "../components/personalData";
import { getPersonalEntry, savePersonalEntry } from "../components/personalData";
import { useSongs } from "../components/ranking/useSongs";
import CoverImg from "../components/ranking/CoverImg";
import SongPreviewPlayer from "../components/ranking/SongPreviewPlayer";
import { getAlbumColor } from "../components/ranking/albumColors";
import { getBattleResults } from "../components/battleStats";
import { useTintMode } from "../components/AlbumTintManager";
import { Star } from "lucide-react";

const TYPE_LABELS = {
  title_track: "Title", b_side: "B-side", single: "Single",
  pre_release: "Pre-release", collaboration: "Collab", ost: "OST", solo: "Solo", cover: "Cover",
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

function WinRate({ title }) {
  const results = getBattleResults();
  const r = results[title];
  if (!r) return null;
  const total = (r.wins || 0) + (r.losses || 0);
  if (total === 0) return null;
  const rate = Math.round((r.wins / total) * 100);
  return <span className="text-white/40 text-[11px]">{rate}% win rate</span>;
}

function FavSongRow({ song, albumCoverMap, lightstickColorMap, onUnfavorite }) {
  const tintMode = useTintMode();
  const ac = getAlbumColor(song.album);
  const lightstick = lightstickColorMap[song.album];
  const tintRgb = 'var(--album-bg-r),var(--album-bg-g),var(--album-bg-b)';
  const borderColor = tintMode === 'tint' ? `rgba(${tintRgb},0.33)` : (lightstick ? `${lightstick}55` : `rgba(${ac.rgb}, 0.3)`);
  const bgColor = lightstick ? `${lightstick}0a` : `rgba(${ac.rgb}, 0.06)`;
  const hoverBorderColor = tintMode === 'tint' ? `rgba(${tintRgb},0.6)` : (lightstick ? `${lightstick}99` : `rgba(${ac.rgb}, 0.6)`);
  const hoverGlow = tintMode === 'tint' ? `0 0 10px rgba(${tintRgb},0.19)` : (lightstick ? `0 0 10px ${lightstick}30` : `0 0 8px rgba(${ac.rgb}, 0.2)`);

  const [personalEntry] = useState(() => getPersonalEntry(song.title));
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="rounded-xl border transition-all duration-300"
      style={{
        backgroundColor: bgColor,
        borderColor: hovered ? hoverBorderColor : borderColor,
        boxShadow: hovered ? hoverGlow : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between py-2 px-3 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-md overflow-hidden shrink-0 bg-white/5">
            <CoverImg
              src={song.cover_url || albumCoverMap[song.album]}
              alt=""
              className="w-full h-full object-cover"
              fallbackClass="w-full h-full bg-white/10 flex items-center justify-center text-[8px] text-white/30"
              fallbackContent="?"
            />
          </div>
          <div className="min-w-0">
            <a
              href={`/SongDetail?title=${encodeURIComponent(song.title)}`}
              className="text-white/90 text-sm truncate block font-medium hover:text-violet-300 transition-colors"
            >
              {song.title}
            </a>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white/40 text-[10px]">{song.album}</span>
              <WinRate title={song.title} />
              {personalEntry.score != null && (
                <span className="text-yellow-400/80 text-[9px] font-bold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-current" />{personalEntry.score}/10
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <SongPreviewPlayer songTitle={song.title} songData={song} compact />
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[song.song_type] || "text-white/40 bg-white/5"}`}>
            {TYPE_LABELS[song.song_type] || song.song_type}
          </span>
          <button
            onClick={() => onUnfavorite(song.title)}
            className="transition-colors p-0.5"
          >
            <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400 hover:fill-white/20 hover:text-white/20 transition-all" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Favorites() {
  const { songs: dbSongs, albums: dbAlbums } = useSongs();
  const [favTitles, setFavTitles] = useState(() => [...getFavorites()]);

  const albumCoverMap = useMemo(() => {
    const m = {};
    (dbAlbums || []).forEach(a => { m[a.name] = a.cover_url; });
    return m;
  }, [dbAlbums]);

  const lightstickColorMap = useMemo(() => {
    const m = {};
    (dbAlbums || []).forEach(a => { if (a.lightstick_color) m[a.name] = a.lightstick_color; });
    return m;
  }, [dbAlbums]);

  const favSongs = dbSongs.filter(s => favTitles.includes(s.title));

  const handleUnfavorite = (title) => {
    toggleFavorite(title);
    setFavTitles(prev => prev.filter(t => t !== title));
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[250px] bg-red-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to="/Home" className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-sm tracking-wider flex items-center gap-2">
          <Heart className="w-4 h-4 fill-red-400 text-red-400" />
          FAVORITES
        </h1>
        <div className="w-9" />
      </div>

      <div className="relative z-10 px-4 pb-2">
        <p className="text-white/40 text-xs font-medium">{favSongs.length} favorited song{favSongs.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="relative z-10 px-4 pb-24">
        {favSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="w-12 h-12 text-white/10 mb-4" />
            <p className="text-white/40 text-base font-semibold mb-2">No favorites yet</p>
            <p className="text-white/25 text-sm max-w-xs">
              Tap the heart icon on any song in the Song List to add it here.
            </p>
            <Link
              to="/Songs"
              className="mt-6 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-semibold transition-colors"
            >
              Browse Songs
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {favSongs.map(song => (
              <FavSongRow
                key={song.title}
                song={song}
                albumCoverMap={albumCoverMap}
                lightstickColorMap={lightstickColorMap}
                onUnfavorite={handleUnfavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}