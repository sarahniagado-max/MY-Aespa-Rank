import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, Music, ShieldOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { format } from "date-fns";
import CoverImg from "../components/ranking/CoverImg";
import TimeInput from "../components/ranking/TimeInput";

const INPUT = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-white/50 text-[10px] uppercase tracking-wider font-semibold mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function SongEditModal({ song, onClose, onSave, loading, allSongs, dbAlbums = [] }) {
  const [form, setForm] = useState(song || {});
  const [err, setErr] = useState("");
  const [albumMode, setAlbumMode] = useState(song?.album ? "existing" : "new");

  const uniqueAlbums = [...new Set(allSongs.map(s => s.album)), ...dbAlbums.map(a => a.name)].filter(Boolean);

  const handleAlbumSelect = (albumName) => {
    const albumRecord = dbAlbums.find(a => a.name === albumName);
    setForm(f => ({
      ...f,
      album: albumName,
      cover_url: albumRecord?.cover_url || f.cover_url || "",
      release_date: albumRecord?.release_date || f.release_date || "",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title?.trim()) return setErr("Title required.");
    if (!form.album?.trim()) return setErr("Album required.");
    
    // Validate track number uniqueness
    const sameAlbumSongs = allSongs.filter(s => s.album === form.album && s.id !== song?.id);
    if (form.track_number && sameAlbumSongs.some(s => s.track_number === form.track_number)) {
      return setErr(`Track number ${form.track_number} already used in this album.`);
    }

    onSave(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-sm bg-[#0c0c0c] border border-white/12 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-base">{song?.id ? "Edit Song" : "Add Song"}</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Title *">
              <input type="text" placeholder="Song title" value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={INPUT} />
            </Field>
            <Field label="Album *">
              <div className="flex gap-2 mb-2">
                {["existing", "new"].map(mode => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => { setAlbumMode(mode); setForm(f => ({ ...f, album: "" })); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      albumMode === mode
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-white/5 border-white/10 text-white/50"
                    }`}
                  >
                    {mode === "existing" ? "Existing" : "New"}
                  </button>
                ))}
              </div>
              {albumMode === "existing" ? (
                <select
                  value={form.album || ""}
                  onChange={e => handleAlbumSelect(e.target.value)}
                  className={INPUT}
                >
                  <option value="">— Select Album —</option>
                  {uniqueAlbums.map(a => (
                    <option key={a} value={a} className="bg-black">{a}</option>
                  ))}
                </select>
              ) : (
                <input type="text" placeholder="New album name" value={form.album || ""} onChange={e => setForm(f => ({ ...f, album: e.target.value }))} className={INPUT} />
              )}
            </Field>
            <Field label="Track Number">
              <input type="number" min="1" value={form.track_number || ""} onChange={e => setForm(f => ({ ...f, track_number: e.target.value ? Number(e.target.value) : null }))} className={INPUT} />
            </Field>
            <Field label="Release Date">
              <input type="date" value={form.release_date || ""} onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))} className={INPUT} />
            </Field>
            <Field label="Cover Image URL">
              <input type="url" placeholder="https://..." value={form.cover_url || ""} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} className={INPUT} />
              {form.cover_url && (
                <CoverImg src={form.cover_url} alt="" className="w-16 h-16 rounded-xl object-cover mt-2 border border-white/10" fallbackClass="hidden" fallbackContent="" />
              )}
            </Field>
            <Field label="YouTube URL">
              <input type="url" placeholder="https://youtube.com/watch?v=..." value={form.youtube_url || ""} onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))} className={INPUT} />
            </Field>
            <Field label="Preview Start (M:SS.0)">
              <TimeInput value={form.preview_start || 0} onChange={v => setForm(f => ({ ...f, preview_start: v }))} />
            </Field>
            <Field label="Preview End (M:SS.0)">
              <TimeInput value={form.preview_end || 45} onChange={v => setForm(f => ({ ...f, preview_end: v }))} />
            </Field>
            <Field label="Song Type">
              <select value={form.song_type || ""} onChange={e => setForm(f => ({ ...f, song_type: e.target.value }))} className={INPUT}>
                <option value="">Select type</option>
                {["title_track", "b_side", "single", "ost", "collaboration", "pre_release", "solo"].map(t => (
                  <option key={t} value={t} className="bg-black">{t.replace("_", " ")}</option>
                ))}
              </select>
            </Field>
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors disabled:opacity-50">
              {loading ? "Saving…" : song?.id ? "Save Changes" : "Add Song"}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminSongs() {
  const qc = useQueryClient();
  const isAdmin = localStorage.getItem("aespa_admin") === "1";

  const { data: allSongs = [], isLoading } = useQuery({
    queryKey: ['songs'],
    queryFn: () => db.entities.Song.list('release_date', 500),
    staleTime: 60 * 1000,
  });

  const { data: dbAlbums = [] } = useQuery({
    queryKey: ['albums'],
    queryFn: () => db.entities.Album.list('release_date', 200),
    staleTime: 60 * 1000,
  });

  const [editing, setEditing] = useState(null);

  const createMut = useMutation({
    mutationFn: (data) => db.entities.Song.create(data),
    onSuccess: () => { qc.invalidateQueries(['songs']); setEditing(null); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.Song.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['songs']); setEditing(null); },
  });

  if (!isAdmin) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <ShieldOff className="w-10 h-10 text-white/20" />
      <p className="text-white/40 text-sm">Admin access only</p>
      <Link to={createPageUrl("Home")} className="text-violet-400 text-sm underline">Go Home</Link>
    </div>
  );

  const handleSave = (form) => {
    // If new album, create Album entity record
    if (form.album && !dbAlbums.some(a => a.name === form.album)) {
      db.entities.Album.create({
        name: form.album,
        cover_url: form.cover_url || "",
        release_date: form.release_date || "",
      }).then(() => qc.invalidateQueries(['albums'])).catch(() => {});
    }

    const data = {
      title: form.title,
      album: form.album,
      track_number: form.track_number || null,
      release_date: form.release_date || null,
      cover_url: form.cover_url || null,
      youtube_url: form.youtube_url || null,
      preview_start: form.preview_start || 0,
      preview_end: form.preview_end || 45,
      song_type: form.song_type || null,
    };

    if (editing?.id) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const isMutating = createMut.isPending || updateMut.isPending;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-sm tracking-wider">ADMIN SONG EDITOR</h1>
        <button onClick={() => setEditing({})} className="p-2 -mr-2 text-white/40 hover:text-violet-400 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="relative z-10 px-4 pb-24 space-y-2">
          {allSongs.map(song => (
            <motion.div key={song.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                  <CoverImg src={song.cover_url} alt={song.title} className="w-full h-full object-cover" fallbackClass="w-full h-full flex items-center justify-center text-white/20 text-xs" fallbackContent="?" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{song.title}</p>
                  <p className="text-white/30 text-xs">{song.album}</p>
                </div>
                <button onClick={() => setEditing(song)} className="text-white/20 hover:text-violet-400 transition-colors p-1">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing !== null && (
          <SongEditModal song={editing.id ? editing : null} onSave={handleSave} onClose={() => setEditing(null)} loading={isMutating} allSongs={allSongs} dbAlbums={dbAlbums} />
        )}
      </AnimatePresence>
    </div>
  );
}