import { create } from 'zustand';

export type TabType = 'home' | 'search' | 'library' | 'settings';

interface UIState {
  activeTab: TabType;
  selectedPlaylistId: string | null;
  selectedArtistId: string | null;
  toastMessage: string | null;
  toastType: 'success' | 'error' | 'info';
  
  // Navigation stack for detailed views
  openPlaylist: (playlistId: string) => void;
  openArtist: (artistId: string) => void;
  closeDetailView: () => void;
  setActiveTab: (tab: TabType) => void;
  
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'home',
  selectedPlaylistId: null,
  selectedArtistId: null,
  toastMessage: null,
  toastType: 'success',

  openPlaylist: (playlistId) => set({
    selectedPlaylistId: playlistId,
    selectedArtistId: null, // Clear other views
  }),

  openArtist: (artistId) => set({
    selectedArtistId: artistId,
    selectedPlaylistId: null, // Clear other views
  }),

  closeDetailView: () => set({
    selectedPlaylistId: null,
    selectedArtistId: null,
  }),

  setActiveTab: (activeTab) => set({
    activeTab,
    selectedPlaylistId: null, // Reset views on tab switch
    selectedArtistId: null,
  }),

  showToast: (toastMessage, toastType = 'success') => {
    set({ toastMessage, toastType });
    setTimeout(() => {
      set({ toastMessage: null });
    }, 3000);
  },

  clearToast: () => set({ toastMessage: null }),
}));
