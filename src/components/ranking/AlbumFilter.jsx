import React from "react";
import { motion } from "framer-motion";

export default function AlbumFilter({ albums, selectedAlbum, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect("all")}
        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
          selectedAlbum === "all"
            ? "bg-violet-500 text-white"
            : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
        }`}
      >
        All
      </button>
      {albums.map((album) => (
        <button
          key={album}
          onClick={() => onSelect(album)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all whitespace-nowrap ${
            selectedAlbum === album
              ? "bg-violet-500 text-white"
              : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
          }`}
        >
          {album}
        </button>
      ))}
    </div>
  );
}