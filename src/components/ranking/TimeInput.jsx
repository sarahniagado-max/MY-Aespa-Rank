import React, { useState, useEffect } from "react";

// Convert seconds (decimal) to M:SS.0 format
function secondsToTime(seconds) {
  const s = Math.max(0, seconds || 0);
  const minutes = Math.floor(s / 60);
  const secs = (s % 60).toFixed(1);
  return `${minutes}:${secs.padStart(4, '0')}`;
}

// Convert M:SS.0 format to seconds
function timeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const minutes = parseInt(parts[0], 10) || 0;
  const secs = parseFloat(parts[1]) || 0;
  return minutes * 60 + secs;
}

export default function TimeInput({ value = 0, onChange }) {
  const [displayValue, setDisplayValue] = useState(secondsToTime(value));

  useEffect(() => {
    setDisplayValue(secondsToTime(value));
  }, [value]);

  const handleChange = (e) => {
    const newDisplay = e.target.value;
    setDisplayValue(newDisplay);
    
    // Try to parse and update parent
    try {
      const newSeconds = timeToSeconds(newDisplay);
      if (!isNaN(newSeconds)) {
        onChange(newSeconds);
      }
    } catch (_) {
      // Invalid format, don't update
    }
  };

  const handleBlur = () => {
    // Reformat on blur
    const seconds = timeToSeconds(displayValue);
    setDisplayValue(secondsToTime(seconds));
    onChange(seconds);
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="0:00.0"
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors font-mono"
    />
  );
}