import {create} from 'zustand';

export type Track = {
    id: string;
    title: string;
    artist: string;
    cover?: string;
    previewUrl?: string | null;
    duration?: number; // duration in seconds
};
export type Platlist = {
    id: string;
    title: string;
    tracks: Track[];
    cover?: string;
};

type State = {
    playlists: Record<string, Platlist>;
    ensurePlaylist: (id: string, title: string, cover?: string) => void;
    addTrackToPlaylist: (playlistId: string, track: Track) => void;
    removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
}

export const usePlaylistStore = create<State>((set) => ({
  playlists: {
    "pl-liked": { 
        id: "pl-liked", 
        title: "Liked Songs", 
        tracks: [] },
  },
  ensurePlaylist: (id, title, cover) =>
    set((s) => {
      if (s.playlists[id]) return s; 
      return {
        playlists: {
          ...s.playlists,
          [id]: { id, title, cover, tracks: [] },  
        },
      };
    }),

  addTrackToPlaylist: (playlistId, track) =>
    set((s) => {
      const p = s.playlists[playlistId] ?? { id: playlistId, title: playlistId, tracks: [] };
      if (p.tracks.some((t) => t.id === track.id)) return s;
      return { playlists: { ...s.playlists, [playlistId]: { ...p, tracks: [...p.tracks, track] } } };
    }),
  removeTrackFromPlaylist: (playlistId, trackId) =>
    set((s) => {
      const p = s.playlists[playlistId];
      if (!p) return s;
      return { playlists: { ...s.playlists, [playlistId]: { ...p, tracks: p.tracks.filter(t => t.id !== trackId) } } };
    }),
}));