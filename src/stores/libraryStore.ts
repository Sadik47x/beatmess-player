import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song } from '../types/song';
import type { Playlist } from '../types/playlist';
import { recommendationService } from '../services/recommendationService';
import type { UserInteraction, UserPreferenceProfile } from '../services/recommendationService';

interface LibraryState {
  likedSongs: Song[];
  playlists: Playlist[];
  history: Song[];
  searchHistory: string[];
  username: string;
  avatarUrl: string;
  pipedInstanceUrl: string;
  
  // Taste profile & feedback records
  interactions: UserInteraction[];
  preferenceProfile: UserPreferenceProfile;
  onboardingPreferences: { artists: string[]; languages: string[]; genres: string[] } | null;

  // Actions
  toggleLike: (song: Song) => void;
  isLiked: (songId: string) => boolean;
  setPipedInstanceUrl: (url: string) => void;
  
  createPlaylist: (title: string, description?: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  
  addToHistory: (song: Song) => void;
  clearHistory: () => void;
  
  addToSearchHistory: (query: string) => void;
  removeFromSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  
  updateProfile: (username: string, avatarUrl: string) => void;
  clearAllCache: () => void;
  
  // Custom taste actions
  recordInteraction: (song: Song, type: UserInteraction['type'], durationRatio?: number) => void;
  updatePreferenceProfile: () => void;
  setOnboardingPreferences: (prefs: { artists: string[]; languages: string[]; genres: string[] }) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      likedSongs: [],
      playlists: [],
      history: [],
      searchHistory: [],
      username: 'Guest Explorer',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARGfYCYnkA8W4OgmDNNlf5Ko6vP5QPTnaJZAyC0gHQR1MC2Rpdv5cJUfv0lza_qVn_cwDeYL0_pSfRSSFKPu0cEaiDz3fj48Fd1P3cFS-PTkvNqO2xipRKva_zjvl4Wy7pVhZhvNkOQ1h6iRuLKPYDzuG3kEwdF1kcXV-i1vtOog1Ods342qdLI8w8bJBOrulsDwpoPFfdMd4pyhJNk53f9WM7AUCeQBnHfUqvNillxTNqRTyMyuNt',
      pipedInstanceUrl: 'https://pipedapi.kavin.rocks',
      
      interactions: [],
      preferenceProfile: {
        favoriteArtists: {},
        favoriteGenres: {},
        favoriteMoods: {},
        favoriteLanguages: {},
        favoriteAlbums: {},
        skippedArtists: {},
        skippedSongs: {}
      },
      onboardingPreferences: null,

      toggleLike: (song) => {
        const { likedSongs } = get();
        const exists = likedSongs.some((s) => s.id === song.id);
        if (exists) {
          set({ likedSongs: likedSongs.filter((s) => s.id !== song.id) });
        } else {
          set({ likedSongs: [song, ...likedSongs] });
          get().recordInteraction(song, 'like');
        }
        get().updatePreferenceProfile();
      },

      isLiked: (songId) => {
        return get().likedSongs.some((s) => s.id === songId);
      },

      createPlaylist: (title, description = '') => {
        const newPlaylist: Playlist = {
          id: `playlist-${Date.now()}`,
          title,
          description,
          songs: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ playlists: [...state.playlists, newPlaylist] }));
      },

      deletePlaylist: (playlistId) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== playlistId),
        }));
      },

      addSongToPlaylist: (playlistId, song) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id === playlistId) {
              const alreadyHasSong = p.songs.some((s) => s.id === song.id);
              if (alreadyHasSong) return p;
              const updatedSongs = [...p.songs, song];
              return {
                ...p,
                songs: updatedSongs,
                coverImageUrl: p.coverImageUrl || song.image,
              };
            }
            return p;
          }),
        }));
        get().recordInteraction(song, 'add_to_queue');
      },

      removeSongFromPlaylist: (playlistId, songId) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id === playlistId) {
              const updatedSongs = p.songs.filter((s) => s.id !== songId);
              return {
                ...p,
                songs: updatedSongs,
                coverImageUrl: updatedSongs.length > 0 ? updatedSongs[0].image : undefined,
              };
            }
            return p;
          }),
        }));
      },

      addToHistory: (song) => {
        const { history } = get();
        const isReplay = history.length > 0 && history[0].id === song.id;
        
        // Remove existing copy of this song to push it to the top
        const filteredHistory = history.filter((s) => s.id !== song.id);
        const updatedHistory = [song, ...filteredHistory].slice(0, 50); // limit to 50 items
        set({ history: updatedHistory });

        if (isReplay) {
          const { interactions } = get();
          const replayInteraction: UserInteraction = {
            songId: song.id,
            artist: song.artist,
            album: song.album || '',
            language: song.language || 'Hindi',
            title: song.title,
            timestamp: Date.now(),
            type: 'play',
            score: 1.5 // Replay positive boost
          };
          set({ interactions: [replayInteraction, ...interactions].slice(0, 200) });
          get().updatePreferenceProfile();
        } else {
          get().recordInteraction(song, 'play');
        }
      },

      clearHistory: () => set({ history: [] }),

      addToSearchHistory: (query) => {
        if (!query.trim()) return;
        const { searchHistory } = get();
        const filtered = searchHistory.filter((q) => q.toLowerCase() !== query.toLowerCase());
        set({ searchHistory: [query, ...filtered].slice(0, 20) }); // limit to 20 queries
      },

      removeFromSearchHistory: (query) => {
        set((state) => ({
          searchHistory: state.searchHistory.filter((q) => q !== query),
        }));
      },

      clearSearchHistory: () => set({ searchHistory: [] }),

      updateProfile: (username, avatarUrl) => set({ username, avatarUrl }),

      setPipedInstanceUrl: (pipedInstanceUrl) => set({ pipedInstanceUrl }),

      clearAllCache: () => {
        localStorage.removeItem('beatmess-library-storage');
        localStorage.removeItem('beatmess_volume');
        set({
          likedSongs: [],
          playlists: [],
          history: [],
          searchHistory: [],
          username: 'Guest Explorer',
          pipedInstanceUrl: 'https://pipedapi.kavin.rocks',
          interactions: [],
          preferenceProfile: {
            favoriteArtists: {},
            favoriteGenres: {},
            favoriteMoods: {},
            favoriteLanguages: {},
            favoriteAlbums: {},
            skippedArtists: {},
            skippedSongs: {}
          },
          onboardingPreferences: null
        });
      },

      recordInteraction: (song, type, durationRatio) => {
        const { interactions } = get();
        const score = recommendationService.calculateInteractionScore(type, durationRatio);
        
        const newInteraction: UserInteraction = {
          songId: song.id,
          artist: song.artist,
          album: song.album || '',
          language: song.language || 'Hindi',
          title: song.title,
          timestamp: Date.now(),
          type,
          score
        };

        const updatedInteractions = [newInteraction, ...interactions].slice(0, 200);
        set({ interactions: updatedInteractions });
        get().updatePreferenceProfile();
      },

      updatePreferenceProfile: () => {
        const { history, likedSongs, interactions, onboardingPreferences } = get();
        const profile = recommendationService.buildPreferenceProfile(history, likedSongs, interactions, onboardingPreferences || undefined);
        set({ preferenceProfile: profile });
      },

      setOnboardingPreferences: (onboardingPreferences) => {
        set({ onboardingPreferences });
        get().updatePreferenceProfile();
      }
    }),
    {
      name: 'beatmess-library-storage',
    }
  )
);
