import React, { useState } from "react";

/**
 * CoverImg — renders an img with React state-based error handling.
 * Falls back to a placeholder on error or missing src.
 * NO nextSibling DOM hacking — pure React state.
 */
export default function CoverImg({ src, alt = "", className = "", style, fallbackClass = "", fallbackContent = "♪" }) {
  const [error, setError] = useState(false);

  if (src && !error) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={fallbackClass || "w-full h-full bg-gradient-to-br from-violet-900/60 to-black/80 flex items-center justify-center text-white/20 text-4xl"}>
      {fallbackContent}
    </div>
  );
}