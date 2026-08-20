import type { Song } from '../types/song';

export interface UserInteraction {
  songId: string;
  artist: string;
  album: string;
  language: string;
  title: string;
  timestamp: number;
  type: 'play' | 'skip' | 'complete' | 'like' | 'dislike' | 'add_to_queue' | 'remove_from_queue';
  score: number; // implicit feedback strength
}

export interface UserPreferenceProfile {
  favoriteArtists: Record<string, number>;
  favoriteGenres: Record<string, number>;
  favoriteMoods: Record<string, number>;
  favoriteLanguages: Record<string, number>;
  favoriteAlbums: Record<string, number>;
  skippedArtists: Record<string, number>;
  skippedSongs: Record<string, number>;
}

// Mood extractor matching server.js keywords
export function getMoodKeywords(title: string, album: string): string[] {
  const text = `${title} ${album}`.toLowerCase();
  const moods: string[] = [];
  if (text.includes('sad') || text.includes('emotional') || text.includes('dard') || text.includes('judai') || text.includes('breakup') || text.includes('alone') || text.includes('crying') || text.includes('duri')) {
    moods.push('sad');
  }
  if (text.includes('love') || text.includes('romantic') || text.includes('dil') || text.includes('pyaar') || text.includes('ishq') || text.includes('mohabbat') || text.includes('sanam') || text.includes('dhadkan')) {
    moods.push('romantic');
  }
  if (text.includes('party') || text.includes('dance') || text.includes('club') || text.includes('remix') || text.includes('mashup') || text.includes('beat') || text.includes('dhamaka')) {
    moods.push('party');
  }
  if (text.includes('chill') || text.includes('lofi') || text.includes('slowed') || text.includes('study') || text.includes('relax') || text.includes('peaceful') || text.includes('sleep')) {
    moods.push('chill');
  }
  if (text.includes('devotional') || text.includes('bhajan') || text.includes('god') || text.includes('shiva') || text.includes('krishna') || text.includes('aarti') || text.includes('mantra')) {
    moods.push('devotional');
  }
  if (text.includes('aggressive') || text.includes('rap') || text.includes('hip hop') || text.includes('hiphop') || text.includes('swagger') || text.includes('badboy')) {
    moods.push('energetic');
  }
  return moods;
}

// Genre classifier matching server.js rules
export function getGenreEraQuery(title: string, artist: string, album: string, year?: string, language?: string): string {
  const t = (title || '').toLowerCase();
  const a = (artist || '').toLowerCase();
  const al = (album || '').toLowerCase();
  const lang = (language || 'Hindi').toLowerCase();
  const y = year ? parseInt(year, 10) : NaN;

  if (t.includes('lofi') || t.includes('chill') || al.includes('lofi') || al.includes('chill')) {
    return 'Lofi Chill Chillout Beats';
  }
  if (lang === 'punjabi' || t.includes('punjabi') || a.includes('diljit') || a.includes('karan aujla') || a.includes('shubh') || a.includes('ap dhillon') || a.includes('sidhu') || t.includes('punj') || al.includes('punjabi')) {
    return 'Punjabi Hits Dance';
  }
  if ((y >= 1980 && y <= 2005) || a.includes('kumar sanu') || a.includes('udit narayan') || a.includes('alka yagnik') || a.includes('lata mangeshkar') || a.includes('asha bhosle') || a.includes('kishore kumar') || a.includes('sonu nigam') || al.includes('90s') || al.includes('classic') || t.includes('90s') || t.includes('80s')) {
    return '90s Hindi Romantic Hits Classics';
  }
  if ((y && y < 1980) || a.includes('kishore') || a.includes('rafi') || a.includes('mukesh') || a.includes('lata')) {
    return 'Classic Old Hindi Songs Retro';
  }
  if (t.includes('party') || t.includes('remix') || t.includes('club') || t.includes('mashup') || t.includes('dhamaka')) {
    return 'Party Bollywood Hits Dance';
  }
  if (lang === 'hindi' || a.includes('arijit') || a.includes('jubin') || a.includes('darshan') || a.includes('shreya') || a.includes('nehakakar') || a.includes('atif') || a.includes('pritam')) {
    return 'Romantic Hindi Hits Love';
  }
  if (lang === 'bengali') {
    return 'Bengali Hits Romantic';
  }
  if (lang === 'telugu') {
    return 'Telugu Hits';
  }
  if (lang === 'tamil') {
    return 'Tamil Hits';
  }
  if (lang === 'english' || lang === 'youtube') {
    return 'English Pop Hits Billboard';
  }
  return `${artist} hits`;
}

export const recommendationService = {
  /**
   * Determine feedback score strength for an interaction.
   */
  calculateInteractionScore: (
    type: UserInteraction['type'],
    durationRatio?: number
  ): number => {
    switch (type) {
      case 'like':
        return 2.0; // extremely strong positive
      case 'dislike':
        return -2.0; // extremely strong negative
      case 'complete':
        return 1.0; // strong positive
      case 'remove_from_queue':
        return -0.8; // strong negative
      case 'add_to_queue':
        return 0.3; // weak positive
      case 'play':
        return 0.1; // tiny seed play
      case 'skip':
        if (durationRatio !== undefined) {
          if (durationRatio < 0.1) {
            return -1.0; // skipped immediately -> strong negative
          } else if (durationRatio < 0.5) {
            return -0.2; // partial listen -> weak negative
          } else if (durationRatio < 0.9) {
            return 0.5; // >50% completion -> positive
          } else {
            return 1.0; // >90% completion -> strong positive
          }
        }
        return -0.5; // default skip penalty
      default:
        return 0.0;
    }
  },

  /**
   * Recalculate preference profile based on history, likes, and interaction logs.
   */
  buildPreferenceProfile: (
    history: Song[],
    likedSongs: Song[],
    interactions: UserInteraction[],
    onboardingPreferences?: { artists: string[]; languages: string[]; genres: string[] }
  ): UserPreferenceProfile => {
    const favoriteArtists: Record<string, number> = {};
    const favoriteGenres: Record<string, number> = {};
    const favoriteMoods: Record<string, number> = {};
    const favoriteLanguages: Record<string, number> = {};
    const favoriteAlbums: Record<string, number> = {};
    const skippedArtists: Record<string, number> = {};
    const skippedSongs: Record<string, number> = {};

    // 0. Process onboarding choices as baseline seed parameters
    if (onboardingPreferences) {
      const { artists = [], languages = [], genres = [] } = onboardingPreferences;
      artists.forEach(art => {
        const artLower = art.toLowerCase();
        favoriteArtists[artLower] = (favoriteArtists[artLower] || 0) + 1.2;
      });
      languages.forEach(lang => {
        const langLower = lang.toLowerCase();
        favoriteLanguages[langLower] = (favoriteLanguages[langLower] || 0) + 1.2;
      });
      genres.forEach(gen => {
        favoriteGenres[gen] = (favoriteGenres[gen] || 0) + 1.2;
      });
    }

    // 1. Process Liked Songs (Base Positive Signals)
    likedSongs.forEach(song => {
      const artist = (song.artist || '').toLowerCase();
      const album = (song.album || '').toLowerCase();
      const genre = getGenreEraQuery(song.title, song.artist, song.album, song.year, song.language);
      const moods = getMoodKeywords(song.title, song.album || '');
      const lang = (song.language || 'Hindi').toLowerCase();

      favoriteArtists[artist] = (favoriteArtists[artist] || 0) + 1.0;
      if (album && album !== 'unknown album' && album !== 'youtube catalog') {
        favoriteAlbums[album] = (favoriteAlbums[album] || 0) + 0.8;
      }
      favoriteGenres[genre] = (favoriteGenres[genre] || 0) + 1.0;
      moods.forEach(m => favoriteMoods[m] = (favoriteMoods[m] || 0) + 0.8);
      favoriteLanguages[lang] = (favoriteLanguages[lang] || 0) + 0.8;
    });

    // 2. Process listening history (Frequency multiplier)
    history.forEach((song, idx) => {
      const artist = (song.artist || '').toLowerCase();
      const genre = getGenreEraQuery(song.title, song.artist, song.album, song.year, song.language);
      const weight = Math.max(0.1, 1 - idx / history.length); // decay weight for older history

      favoriteArtists[artist] = (favoriteArtists[artist] || 0) + 0.3 * weight;
      favoriteGenres[genre] = (favoriteGenres[genre] || 0) + 0.3 * weight;
    });

    // 3. Process Interaction Logs (Detailed Skips and Completes)
    interactions.forEach(inter => {
      const artist = (inter.artist || '').toLowerCase();
      const album = (inter.album || '').toLowerCase();
      const genre = getGenreEraQuery(inter.title, inter.artist, inter.album, undefined, inter.language);
      const moods = getMoodKeywords(inter.title, inter.album || '');
      const lang = (inter.language || 'Hindi').toLowerCase();
      const score = inter.score;

      // Update favorite scores
      favoriteArtists[artist] = (favoriteArtists[artist] || 0) + score * 0.2;
      if (album && album !== 'unknown album' && album !== 'youtube catalog') {
        favoriteAlbums[album] = (favoriteAlbums[album] || 0) + score * 0.15;
      }
      favoriteGenres[genre] = (favoriteGenres[genre] || 0) + score * 0.2;
      moods.forEach(m => favoriteMoods[m] = (favoriteMoods[m] || 0) + score * 0.1);
      favoriteLanguages[lang] = (favoriteLanguages[lang] || 0) + score * 0.1;

      // Log negative logs explicitly
      if (score < 0) {
        skippedArtists[artist] = (skippedArtists[artist] || 0) + 1;
        skippedSongs[inter.songId] = (skippedSongs[inter.songId] || 0) + 1;
      }
    });

    // Normalize all scores to be between 0 and 1, except skipped tallies which are counts.
    const normalize = (record: Record<string, number>, maxScore = 5.0) => {
      for (const k in record) {
        record[k] = Math.min(1.0, Math.max(0.0, record[k] / maxScore));
      }
    };

    normalize(favoriteArtists, 5.0);
    normalize(favoriteGenres, 4.0);
    normalize(favoriteMoods, 3.0);
    normalize(favoriteLanguages, 4.0);
    normalize(favoriteAlbums, 3.0);

    return {
      favoriteArtists,
      favoriteGenres,
      favoriteMoods,
      favoriteLanguages,
      favoriteAlbums,
      skippedArtists,
      skippedSongs
    };
  }
};
