import { db } from '@/api/base44Client';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getSongOrder } from './aespaSongs';
import { parseAlbumColors, getSongColor } from './colorUtils';

export function extractYtId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function useSongs() {
  const { data: dbSongs = [], isLoading } = useQuery({
    queryKey: ['songs'],
    queryFn: () => db.entities.Song.list('release_date', 500),
    staleTime: 5 * 60 * 1000,
  });

  const { data: dbAlbums = [] } = useQuery({
    queryKey: ['albums'],
    queryFn: () => db.entities.Album.list('release_date', 200),
    staleTime: 5 * 60 * 1000,
  });

  // Build album lookup by name → full album object
  const albumMap = useMemo(() => {
    const map = {};
    dbAlbums.forEach(a => { map[a.name] = a; });
    return map;
  }, [dbAlbums]);

  // Build per-album song index for color interpolation
  const albumSongCounts = useMemo(() => {
    const counts = {};
    dbSongs.forEach(s => { counts[s.album] = (counts[s.album] || 0) + 1; });
    return counts;
  }, [dbSongs]);

  const albumSongIndex = useMemo(() => {
    const indices = {};
    const counters = {};
    // Sort dbSongs by track_number then title for consistent indexing
    const sorted = [...dbSongs].sort((a, b) => {
      if (a.album !== b.album) return 0;
      const tnA = a.track_number ?? 999;
      const tnB = b.track_number ?? 999;
      if (tnA !== tnB) return tnA - tnB;
      return a.title.localeCompare(b.title);
    });
    sorted.forEach(s => {
      counters[s.album] = counters[s.album] || 0;
      indices[s.id] = counters[s.album];
      counters[s.album]++;
    });
    return indices;
  }, [dbSongs]);

  const songs = useMemo(() => {
    return dbSongs.map(dbSong => {
      const album = albumMap[dbSong.album];
      // Cover: song field → album entity cover_url
      const resolvedCover = (dbSong.cover_url && dbSong.cover_url.trim())
        ? dbSong.cover_url
        : (album?.cover_url?.trim() || null);
      const albumColors = parseAlbumColors(album?.lightstick_color);
      const songIdx = albumSongIndex[dbSong.id] ?? 0;
      const totalInAlbum = albumSongCounts[dbSong.album] ?? 1;
      const songColor = getSongColor(albumColors, songIdx, totalInAlbum);
      return {
        ...dbSong,
        cover_url: resolvedCover,
        yt_id: extractYtId(dbSong.youtube_url) || null,
        member: dbSong.featured_member || null,
        lightstick_color: album?.lightstick_color || null,
        album_colors: albumColors,
        song_color: songColor,
      };
    }).sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date) : new Date('9999-01-01');
      const dateB = b.release_date ? new Date(b.release_date) : new Date('9999-01-01');
      if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
      const tnA = a.track_number ?? null;
      const tnB = b.track_number ?? null;
      if (tnA !== null && tnB !== null) return tnA - tnB;
      if (tnA !== null) return -1;
      if (tnB !== null) return 1;
      const oa = getSongOrder(a.title);
      const ob = getSongOrder(b.title);
      if (oa !== 999 && ob !== 999) return oa - ob;
      if (oa !== 999) return -1;
      if (ob !== 999) return 1;
      return a.title.localeCompare(b.title);
    });
  }, [dbSongs, albumMap]);

  return { songs, albums: dbAlbums, loading: isLoading };
}