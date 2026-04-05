import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import TimeInput from "./TimeInput";

const INPUT = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-white/50 text-[10px] uppercase tracking-wider font-semibold mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const SONG_TYPES = ["title_track","b_side","single","ost","collaboration","pre_release","solo"];

export default function SongEditModal({ song, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...song });
  const [err, setErr] = useState("");

  const updateMut = useMutation({
    mutationFn: (data) => db.entities.Song.update(song.id, data),
    onSuccess: () => { qc.invalidateQueries(['songs']); onClose(); },
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title?.trim()) return setErr("Title is required.");
    if (!form.album?.trim()) return setErr("Album is required.");
    updateMut.mutate(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-md bg-[#0c0c0c] border border-white/12 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-violet-400" />
              <h2 className="text-white font-bold text-base truncate">{song.title}</h2>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white shrink-0"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Title *">
              <input type="text" value={form.title || ""} onChange={e => set("title", e.target.value)} className={INPUT} />
            </Field>
            <Field label="Album *">
              <input type="text" value={form.album || ""} onChange={e => set("album", e.target.value)} className={INPUT} />
            </Field>
            <Field label="Song Type">
              <select value={form.song_type || ""} onChange={e => set("song_type", e.target.value)} className={INPUT}>
                <option value="" className="bg-black">—</option>
                {SONG_TYPES.map(t => <option key={t} value={t} className="bg-black">{t.replace(/_/g, " ")}</option>)}
              </select>
            </Field>
            <Field label="Track Number">
              <input type="number" min="1" value={form.track_number || ""} onChange={e => set("track_number", e.target.value ? Number(e.target.value) : null)} className={INPUT} />
            </Field>
            <Field label="Release Date">
              <input type="date" value={form.release_date || ""} onChange={e => set("release_date", e.target.value)} className={INPUT} />
            </Field>
            <Field label="YouTube URL">
              <input type="url" placeholder="https://youtube.com/watch?v=..." value={form.youtube_url || ""} onChange={e => set("youtube_url", e.target.value)} className={INPUT} />
            </Field>

            {/* Preview timestamps with M:SS.d inputs */}
            <div className="flex gap-3">
              <TimeInput label="Preview Start" value={form.preview_start ?? null} onChange={v => set("preview_start", v)} />
              <TimeInput label="Preview End" value={form.preview_end ?? null} onChange={v => set("preview_end", v)} />
            </div>

            <Field label="Cover URL">
              <input type="url" placeholder="https://..." value={form.cover_url || ""} onChange={e => set("cover_url", e.target.value)} className={INPUT} />
            </Field>
            <Field label="Notes">
              <textarea rows={2} value={form.notes || ""} onChange={e => set("notes", e.target.value)} className={INPUT + " resize-none"} />
            </Field>

            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button type="submit" disabled={updateMut.isPending} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors disabled:opacity-50">
              {updateMut.isPending ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}