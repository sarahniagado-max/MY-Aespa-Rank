import React from "react";
import { useTintMode } from '../AlbumTintManager';

// Shimmer overlay — position is driven by useSongCardShimmers hook via data-shimmer-inner
export default function SongCardShimmerOverlay({ songColor, opacity = 0.25 }) {
  const tintMode = useTintMode();

  let r, g, b;
  if (tintMode === 'tint') {
    r = 'var(--album-bg-r)';
    g = 'var(--album-bg-g)';
    b = 'var(--album-bg-b)';
  } else {
    const m = songColor ? songColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) : null;
    [r, g, b] = m ? [m[1], m[2], m[3]] : ['255', '255', '255'];
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div
        data-shimmer-inner
        style={{
          position: 'absolute',
          top: 0,
          left: '-120%',
          width: '50%',
          height: '100%',
          background: `linear-gradient(90deg, transparent, rgba(${r},${g},${b},${opacity}), transparent)`,
          transform: 'skewX(-15deg)',
          willChange: 'left',
        }}
      />
    </div>
  );
}

// JS-driven shimmer with per-album stagger + immediate restart after last card
// Attaches to a container that wraps ALL song cards across all tabs
export function useSongCardShimmers(depKey = '') {
  const ref = React.useRef(null);
  const cleanupRef = React.useRef([]);

  React.useEffect(() => {
    // Cancel any existing animations first
    cleanupRef.current.forEach(fn => fn());
    cleanupRef.current = [];

    // Use two rAF frames to ensure all cards are in DOM after React commit
    let outerRaf;
    let innerRaf;

    let timeoutId;
    outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        timeoutId = setTimeout(() => {
        if (!ref.current) return;

        const allCards = Array.from(ref.current.querySelectorAll('[data-song-shimmer]'));
        if (!allCards.length) return;

        // Group cards by data-album-key, preserving document order
        const albumGroups = new Map();
        const albumOrder = [];
        allCards.forEach(card => {
          const key = card.getAttribute('data-album-key') || '__none__';
          if (!albumGroups.has(key)) { albumGroups.set(key, []); albumOrder.push(key); }
          albumGroups.get(key).push(card);
        });

        const SWEEP = 2600;   // ms for one card sweep
        const STAGGER = 600;  // ms between consecutive card starts

        albumOrder.forEach(key => {
          const cards = albumGroups.get(key);
          const n = cards.length;
          const cycleLength = Math.max(SWEEP, (n - 1) * STAGGER + SWEEP);
          const startTime = performance.now();
          let animId;

          const tick = (now) => {
            const elapsed = (now - startTime) % cycleLength;
            cards.forEach((card, idx) => {
              const el = card.querySelector('[data-shimmer-inner]');
              if (!el) return;
              const cardElapsed = elapsed - idx * STAGGER;
              if (cardElapsed < 0 || cardElapsed > SWEEP) {
                el.style.left = '-120%';
              } else {
                const progress = cardElapsed / SWEEP;
                el.style.left = `${progress * 150 - 30}%`;
              }
            });
            animId = requestAnimationFrame(tick);
          };

          animId = requestAnimationFrame(tick);
          cleanupRef.current.push(() => cancelAnimationFrame(animId));
        });
        }, 50); // macrotask: 50ms ensures DOM is fully painted
      });
    });

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
      clearTimeout(timeoutId);
      cleanupRef.current.forEach(fn => fn());
      cleanupRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  return ref;
}
