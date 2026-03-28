const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, Music, ShieldOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { format } from "date-fns";
import CoverImg from "../components/ranking/CoverImg";
import SongEditModal from "../components/ranking/SongEditModal";

const INPUT = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors";
function Field({ label, children }) {
  return (
    <div>
      <label className="text-white/50 text-[10px] uppercase tracking-wider font-semibold mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const ALBUM_TYPES = [
  { value: "mini", label: "Mini Album" },
  { value: "full", label: "Full Album" },
  { value: "single", label: "Single" },
  { value: "japanese", label: "Japanese" },
  { value: "special_single", label: "Special Single" },
  { value: "collaboration", label: "Collaboration" },
  { value: "ost", label: "OST" },
];

const EMPTY_FORM = { name: "", album_number: "", cover_url: "", release_date: "", album_type: "mini", description: "", lightstick_color: "", notes: "" };

function AlbumForm({ initial, onSave, onClose, loading }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [err, setErr] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr("Album name is required.");
    onSave({ ...form, name: form.name.trim() });
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
            <h2 className="text-white font-bold text-base">{initial?.id ? "Edit Album" : "Add Album"}</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Name *">
              <input type="text" placeholder="e.g. MY WORLD" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={INPUT} />
            </Field>
            <Field label="Album Number (e.g. 1st Mini Album)">
              <input type="text" placeholder="e.g. 3rd Mini Album" value={form.album_number || ""} onChange={e => setForm(f => ({ ...f, album_number: e.target.value }))} className={INPUT} />
            </Field>
            <Field label="Type">
              <select value={form.album_type} onChange={e => setForm(f => ({ ...f, album_type: e.target.value }))} className={INPUT}>
                {ALBUM_TYPES.map(t => <option key={t.value} value={t.value} className="bg-black">{t.label}</option>)}
              </select>
            </Field>
            <Field label="Release Date">
              <input type="date" value={form.release_date} onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))} className={INPUT} />
            </Field>
            <Field label="Cover Image URL">
              <input type="url" placeholder="https://..." value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} className={INPUT} />
              {form.cover_url && (
                <CoverImg src={form.cover_url} alt="" className="w-16 h-16 rounded-xl object-cover mt-2 border border-white/10" fallbackClass="hidden" fallbackContent="" />
              )}
            </Field>
            <Field label="Description">
              <textarea rows={2} placeholder="e.g. aespa's debut single" value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={INPUT + " resize-none"} />
            </Field>
            <Field label="Lightstick Color (hex)">
              <div className="flex items-center gap-3">
                <input type="color" value={form.lightstick_color || "#7c3aed"} onChange={e => setForm(f => ({ ...f, lightstick_color: e.target.value }))} className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                <input type="text" placeholder="#7c3aed" value={form.lightstick_color || ""} onChange={e => setForm(f => ({ ...f, lightstick_color: e.target.value }))} className={INPUT} />
              </div>
            </Field>
            <Field label="Notes">
              <textarea rows={2} value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={INPUT + " resize-none"} />
            </Field>
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors disabled:opacity-50">
              {loading ? "Saving…" : initial?.id ? "Save Changes" : "Add Album"}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Albums() {
  const qc = useQueryClient();
  const isAdmin = localStorage.getItem("aespa_admin") === "1";
  const { data: albums = [], isLoading } = useQuery({
    queryKey: ['albums'],
    queryFn: () => db.entities.Album.list('release_date', 200),
    staleTime: 60 * 1000,
  });
  const { data: allSongs = [] } = useQuery({
    queryKey: ['songs'],
    queryFn: () => db.entities.Song.list('release_date', 500),
    staleTime: 60 * 1000,
  });

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [expandedAlbum, setExpandedAlbum] = useState(null);
  const [editingSong, setEditingSong] = useState(null);

  const createMut = useMutation({
    mutationFn: (data) => db.entities.Album.create(data),
    onSuccess: () => { qc.invalidateQueries(['albums']); setEditing(null); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.Album.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['albums']); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => db.entities.Album.delete(id),
    onSuccess: () => { qc.invalidateQueries(['albums']); setDeleting(null); },
  });

  // Build a map: album name → songs[]
  const songsByAlbum = useMemo(() => {
    const m = {};
    allSongs.forEach(s => {
      const key = s.album || "";
      if (!m[key]) m[key] = [];
      m[key].push(s);
    });
    // Sort each group by track_number
    Object.values(m).forEach(arr => arr.sort((a, b) => (a.track_number ?? 999) - (b.track_number ?? 999)));
    return m;
  }, [allSongs]);

  if (!isAdmin) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <ShieldOff className="w-10 h-10 text-white/20" />
      <p className="text-white/40 text-sm">Admin access only</p>
      <Link to="/Home" className="text-violet-400 text-sm underline">Go Home</Link>
    </div>
  );

  const handleSave = (form) => {
    if (editing?.id) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  const isMutating = createMut.isPending || updateMut.isPending;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-sm tracking-wider">ALBUM MANAGEMENT</h1>
        <button onClick={() => setEditing(EMPTY_FORM)} className="p-2 -mr-2 text-white/40 hover:text-violet-400 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="relative z-10 px-4 pt-2 pb-2">
        <p className="text-white/30 text-xs">{albums.length} albums · Cover art here overrides per-song covers</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30 gap-3">
          <p className="text-sm">No albums yet</p>
          <button onClick={() => setEditing(EMPTY_FORM)} className="px-4 py-2 rounded-xl bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm font-semibold">
            Add First Album
          </button>
        </div>
      ) : (
        <div className="relative z-10 px-4 pb-24 space-y-2">
          {albums.map(album => {
            const songs = songsByAlbum[album.name] || [];
            const isExpanded = expandedAlbum === album.id;
            return (
              <motion.div key={album.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/5">
                    <CoverImg src={album.cover_url} alt={album.name} className="w-full h-full object-cover" fallbackClass="w-full h-full flex items-center justify-center text-white/20 text-xs" fallbackContent="?" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{album.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {album.album_number && (
                        <span className="text-amber-300/70 text-[10px] font-semibold">{album.album_number}</span>
                      )}
                      {album.album_type && (
                        <span className="text-violet-300/70 text-[10px] font-semibold uppercase tracking-wider">
                          {ALBUM_TYPES.find(t => t.value === album.album_type)?.label || album.album_type}
                        </span>
                      )}
                      {album.release_date && (
                        <span className="text-white/30 text-[10px]">
                          {(() => { try { return format(new Date(album.release_date), "MMM yyyy"); } catch { return album.release_date; } })()}
                        </span>
                      )}
                      {songs.length > 0 && (
                        <span className="text-white/25 text-[10px]">{songs.length} track{songs.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                    {album.description && <p className="text-white/30 text-[10px] truncate mt-0.5">{album.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {songs.length > 0 && (
                      <button onClick={() => setExpandedAlbum(isExpanded ? null : album.id)} className="text-white/20 hover:text-white/60 transition-colors p-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={() => setEditing(album)} className="text-white/20 hover:text-violet-400 transition-colors p-1">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleting(album)} className="text-red-400/40 hover:text-red-400 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                   {isExpanded && songs.length > 0 && (
                     <motion.div
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: "auto", opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       transition={{ duration: 0.2 }}
                       className="overflow-hidden border-t border-white/5"
                     >
                       <div className="px-3 py-3 space-y-2">
                         {songs.map((song, i) => (
                           <motion.div 
                             key={song.id || song.title} 
                             initial={{ opacity: 0, x: -8 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: i * 0.05 }}
                             onClick={() => setEditingSong(song)} 
                             className="flex items-center gap-3 p-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer">
                             <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                               <CoverImg src={song.cover_url} alt="" className="w-full h-full object-cover" fallbackClass="w-full h-full bg-white/5 flex items-center justify-center" fallbackContent={<Music className="w-3 h-3 text-white/20" />} />
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="text-white/80 text-xs font-semibold truncate">{song.title}</p>
                               {song.song_type && (
                                 <span className="text-white/25 text-[10px]">{song.song_type.replace("_", " ")}</span>
                               )}
                             </div>
                             {song.track_number && (
                               <span className="text-white/20 text-[10px] font-mono shrink-0">#{song.track_number}</span>
                             )}
                           </motion.div>
                         ))}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {deleting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-[#111] border border-white/12 rounded-2xl p-6 w-full max-w-xs space-y-4">
              <p className="text-white font-bold text-base">Delete Album?</p>
              <p className="text-white/50 text-sm">Remove <span className="text-white font-semibold">"{deleting.name}"</span>? This only removes the album record — songs are not deleted.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleting(null)} className="flex-1 py-2 rounded-xl border border-white/15 text-white/60 text-sm font-semibold">Cancel</button>
                <button onClick={() => deleteMut.mutate(deleting.id)} disabled={deleteMut.isPending} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50">
                  {deleteMut.isPending ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing !== null && (
          <AlbumForm initial={editing} onSave={handleSave} onClose={() => setEditing(null)} loading={isMutating} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingSong && (
          <SongEditModal song={editingSong} onClose={() => setEditingSong(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}