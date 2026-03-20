import { useEffect, useRef, useState } from 'react';

/**
 * Applies a parallelogram wave shimmer across multiple song cards
 * Drives the animation with JS, offsetting each card by 0.6s
 */
export function useSongCardShimmers() {
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('[data-song-shimmer]');
    if (cards.length === 0) return;

    let frameCount = 0;
    const animationDuration = 2.6; // 2.6s per sweep
    const cardOffset = 0.6; // 0.6s between each card

    const animate = () => {
      const now = Date.now() / 1000; // seconds
      
      cards.forEach((card, idx) => {
        const startDelay = idx * cardOffset;
        const cardTime = (now + startDelay) % animationDuration;
        const progress = cardTime / animationDuration; // 0-1
        
        // Shimmer travels left to right: -100% to 100%
        const shimmerX = progress * 200 - 100;
        
        const shimmer = card.querySelector('[data-shimmer-element]');
        if (shimmer) {
          // Translate and skew for parallelogram effect
          shimmer.style.transform = `translateX(${shimmerX}%) skewX(-15deg)`;
          shimmer.style.opacity = calculateShimmerOpacity(progress);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return containerRef;
}

function calculateShimmerOpacity(progress) {
  // Peak opacity in the middle (0.4 to 0.6), fade at edges
  if (progress < 0.2) return progress * 0.65 / 0.2; // 0 to 0.65
  if (progress < 0.4) return 0.65;
  if (progress < 0.6) return 0.65;
  if (progress < 0.8) return 0.65 * (1 - (progress - 0.6) / 0.2);
  return 0;
}

export function SongCardShimmerOverlay({ lightstickColor }) {
  return (
    <div
      data-shimmer-element
      className="absolute inset-0 pointer-events-none"
      style={{
        background: lightstickColor
          ? `linear-gradient(90deg, transparent, rgba(${hexToRgb(lightstickColor)}, 0.13), rgba(${hexToRgb(lightstickColor)}, 0.08), transparent)`
          : 'none',
        width: '30%',
      }}
    />
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
}