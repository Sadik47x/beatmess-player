import type { Song } from '../types/song';
import { useLibraryStore } from '../stores/libraryStore';

export const musicService = {
  /**
   * Search for songs via query string or JioSaavn link.
   * Fetches from our unified local backend proxy gateway.
   */
  search: async (query: string): Promise<Song[]> => {
    if (!query.trim()) return [];
    try {
      const url = `/api/search?q=${encodeURIComponent(query)}&source=saavn`;
      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API Error: ${response.statusText}`);
      }
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching from music search API:', error);
      throw error;
    }
  },

  /**
   * Fetch real trending Top Charts from Apple Music India.
   */
  getTrendingSongs: async (): Promise<Song[]> => {
    try {
      const url = '/api/trending';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching trending songs:', error);
      return [];
    }
  },

  getRecommendations: async (song: Song, homePageSongIds: string[] = []): Promise<Song[]> => {
    try {
      const url = `/api/recommendations`;
      const library = useLibraryStore.getState();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album || '',
          year: song.year || '',
          language: song.language || '',
          history: library.history || [],
          likedSongs: library.likedSongs || [],
          profile: library.preferenceProfile || null,
          homePageSongIds
        })
      });
      if (!response.ok) throw new Error('API Error');
      return await response.json();
    } catch (e) {
      console.warn('Error fetching recommendations from backend, falling back to artist search...');
      try {
        const results = await musicService.search(song.artist);
        return results.filter((s) => s.id !== song.id).slice(0, 15);
      } catch (err) {
        return [];
      }
    }
  },

  /**
   * Fetch real-time search suggestions (autocomplete) using JioSaavn API results
   * via our local backend suggestions proxy.
   */
  getSearchSuggestions: async (query: string): Promise<string[]> => {
    if (!query.trim() || query.length < 2) return [];
    try {
      const url = `/api/saavn/suggestions?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (!response.ok) return [];
      return await transitionToJSON(response);
    } catch (e) {
      return [];
    }
  },

  /**
   * Search YouTube for music tracks via our local backend API proxy.
   */
  searchYouTube: async (query: string): Promise<Song[]> => {
    if (!query.trim()) return [];
    try {
      const url = `/api/search?q=${encodeURIComponent(query)}&source=youtube`;
      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error: ${response.status}`);
      }
      const data = await response.json();
      return data.results || [];
    } catch (e) {
      console.error('Error searching YouTube via backend:', e);
      throw e;
    }
  },

  /**
   * Get direct stream audio URL for a YouTube videoId from our backend API proxy.
   */
  getYouTubeStreamUrl: async (videoId: string): Promise<string> => {
    try {
      const url = `/api/stream?id=yt-${encodeURIComponent(videoId)}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error: ${response.status}`);
      }
      const data = await response.json();
      return data.url || '';
    } catch (e) {
      console.error('Failed to resolve YouTube stream from backend:', e);
      return '';
    }
  }
};

async function transitionToJSON(response: Response) {
  try {
    return await response.json();
  } catch (e) {
    return [];
  }
}
