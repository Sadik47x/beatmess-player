import express from 'express';
import { createServer as createViteServer } from 'vite';
import pathModule from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = pathModule.dirname(__filename);

const isWindows = process.platform === 'win32';
const binDir = pathModule.join(__dirname, 'bin');
const ytdlpPath = pathModule.join(binDir, isWindows ? 'yt-dlp.exe' : 'yt-dlp');

// Helper to download yt-dlp binary with redirect handling
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Ensures yt-dlp is downloaded and ready in bin/ folder
async function ensureYtdlp() {
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  if (fs.existsSync(ytdlpPath)) {
    console.log('[yt-dlp] Local binary already exists.');
    return;
  }

  const downloadUrl = isWindows
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

  console.log(`[yt-dlp] Local binary not found. Downloading the latest version for ${process.platform} from GitHub releases...`);
  try {
    await downloadFile(downloadUrl, ytdlpPath);
    console.log(`[yt-dlp] Download complete! Saved to bin/${isWindows ? 'yt-dlp.exe' : 'yt-dlp'}`);
    if (!isWindows) {
      fs.chmodSync(ytdlpPath, '755');
      console.log('[yt-dlp] Granted execute permissions (755) to the binary.');
    }
  } catch (err) {
    console.error('[yt-dlp] Download failed:', err.message);
  }
}

// Piped Provider Pool (Seed list of official instances)
let PIPED_INSTANCES = [
  { url: 'https://api.piped.private.coffee', score: 100, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://pipedapi.kavin.rocks', score: 90, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://pipedapi-libre.kavin.rocks', score: 85, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://pipedapi.leptons.xyz', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://pipedapi.nosebs.ru', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://pipedapi.reallyaweso.me', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://piped-api.privacy.com.de', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://pipedapi.adminforge.de', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://api.piped.yt', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://pipedapi.drgns.space', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://pipedapi.owo.si', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://pipedapi.ducks.party', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://piped-api.codespace.cz', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://pipedapi.darkness.services', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://pipedapi.orangenet.cc', score: 80, consecutiveFailures: 0, cooldownUntil: 0 }
];

// Invidious Provider Pool (Dynamically refreshed, with seed fallbacks)
let INVIDIOUS_INSTANCES = [
  { url: 'https://invidious.flokinet.to', score: 100, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://yewtu.be', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://invidious.privacydev.net', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://invidious.projectsegfau.lt', score: 80, consecutiveFailures: 0, cooldownUntil: 0 },
  { url: 'https://invidious.no-logs.com', score: 80, consecutiveFailures: 0, cooldownUntil: 0 }
];

// Fetch helper with strict timeout
async function fetchWithTimeout(url, options = {}) {
  const { timeout = 5000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Background dynamic refresh of Invidious instances
async function refreshInvidiousInstances() {
  console.log('[Invidious] Fetching dynamic instances from api.invidious.io...');
  try {
    const res = await fetchWithTimeout('https://api.invidious.io/instances.json', { timeout: 6000 });
    const data = await res.json();
    if (!Array.isArray(data)) return;

    const newInstances = [];
    for (const item of data) {
      const domain = item[0];
      const details = item[1];
      if (details.type === 'https' && details.monitor && details.monitor.uptime > 80) {
        newInstances.push({
          url: details.uri || `https://${domain}`,
          score: Math.min(100, Math.max(50, Math.round(details.monitor.uptime))),
          consecutiveFailures: 0,
          cooldownUntil: 0
        });
      }
    }

    if (newInstances.length > 0) {
      INVIDIOUS_INSTANCES = newInstances.map(newInst => {
        const existing = INVIDIOUS_INSTANCES.find(x => x.url === newInst.url);
        return existing ? existing : newInst;
      });
      console.log(`[Invidious] Refreshed successfully. Monitoring ${INVIDIOUS_INSTANCES.length} HTTPS instances.`);
    }
  } catch (err) {
    console.warn('[Invidious] Could not retrieve directory, relying on seed pool. Reason:', err.message);
  }
}

refreshInvidiousInstances();
setInterval(refreshInvidiousInstances, 30 * 60 * 1000);

// Circuit breaker helper logic
function isAvailable(instance) {
  return instance.cooldownUntil < Date.now();
}

function handleSuccess(instance, latency) {
  instance.consecutiveFailures = 0;
  const latencyScore = Math.max(0, Math.min(100, Math.round((6000 - latency) / 60)));
  instance.score = Math.round((instance.score * 0.8) + (latencyScore * 0.2));
}

function handleFailure(instance) {
  instance.consecutiveFailures += 1;
  if (instance.consecutiveFailures >= 3) {
    const cooldownDuration = Math.min(3600 * 1000, 300 * 1000 * Math.pow(2, instance.consecutiveFailures - 3));
    instance.cooldownUntil = Date.now() + cooldownDuration;
    console.log(`[Circuit Breaker] Blacklisted ${instance.url} for ${Math.round(cooldownDuration / 1000)} seconds.`);
  }
  instance.score = Math.max(0, instance.score - 15);
}

// ----------------------------------------------------
// MusicBrainz Metadata Lookup (Enrichment Only)
// ----------------------------------------------------
async function tryMusicBrainzCorrection(query) {
  try {
    const url = `https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(query)}&limit=3&fmt=json`;
    const res = await fetchWithTimeout(url, {
      timeout: 3000,
      headers: {
        'User-Agent': 'BeatMess/1.0.0 ( sadik@example.com )'
      }
    });
    if (res.status === 200) {
      const data = await res.json();
      const first = data.recordings?.[0];
      if (first && first.score >= 90) {
        const title = first.title;
        const artist = first['artist-credit']?.[0]?.name || '';
        const album = first.releases?.[0]?.title || '';
        const year = first['first-release-date'] ? first['first-release-date'].substring(0, 4) : '';
        console.log(`[MusicBrainz] Metadata match found: "${title}" by "${artist}" (Year: ${year}, Album: ${album})`);
        return { title, artist, album, year };
      }
    }
  } catch (e) {
    // Silent fail for background metadata
  }
  return null;
}

// ----------------------------------------------------
// Heuristic Re-ranking Engine for YouTube Results
// ----------------------------------------------------
function rankSearchItems(items, query, officialTitle, officialArtist) {
  const qLower = (query || '').toLowerCase();
  const oTitle = (officialTitle || '').toLowerCase();
  const oArtist = (officialArtist || '').toLowerCase();
  
  return items.sort((a, b) => {
    const titleA = (a.title || '').toLowerCase();
    const titleB = (b.title || '').toLowerCase();
    const artistA = (a.artist || '').toLowerCase();
    const artistB = (b.artist || '').toLowerCase();

    let scoreA = 0;
    let scoreB = 0;

    // Boost artist matches
    if (oArtist) {
      const artistWords = oArtist.split(/[\s,]+/);
      for (const word of artistWords) {
        if (word.length > 2) {
          if (titleA.includes(word) || artistA.includes(word)) scoreA += 30;
          if (titleB.includes(word) || artistB.includes(word)) scoreB += 30;
        }
      }
    }

    // Boost title matches
    if (oTitle) {
      const titleWords = oTitle.split(/[\s,]+/);
      for (const word of titleWords) {
        if (word.length > 2) {
          if (titleA.includes(word)) scoreA += 20;
          if (titleB.includes(word)) scoreB += 20;
        }
      }
    }

    // Boost original/official release indicators
    const officialKeywords = ['official', 'original', 'audio', 'lyric', 'music video', 'vevo', 't-series', 'yash raj', 'sony music', 'tips', 'zeemusic', 'speed records', 'geet mp3', 'saregama'];
    for (const kw of officialKeywords) {
      if (titleA.includes(kw)) scoreA += 15;
      if (titleB.includes(kw)) scoreB += 15;
    }

    // Penalize non-official content ONLY if they are not explicitly searched for by the user
    const penalizeKeywords = ['cover', 'karaoke', 'remix', 'reaction', 'live performance', 'live in', 'tribute', 'slowed', 'reverb', 'bass boosted'];
    for (const kw of penalizeKeywords) {
      if (!qLower.includes(kw)) {
        if (titleA.includes(kw)) scoreA -= 45;
        if (titleB.includes(kw)) scoreB -= 45;
      }
    }

    return scoreB - scoreA; // Descending
  });
}

// ----------------------------------------------------
// Apple Music India Top Charts Service
// ----------------------------------------------------
async function fetchTrendingCharts() {
  try {
    const url = 'https://rss.applemarketingtools.com/api/v2/in/music/most-played/20/songs.json';
    const res = await fetchWithTimeout(url, { timeout: 4000 });
    if (res.status === 200) {
      const data = await res.json();
      const results = data.feed?.results || [];
      return results.map(item => {
        // High quality artwork URL
        const artworkUrl = item.artworkUrl100 
          ? item.artworkUrl100.replace('{w}x{h}bb', '500x500bb').replace('100x100bb', '500x500bb') 
          : '';
        return {
          id: `saavn-charts-${item.id}`,
          title: item.name || 'Unknown Track',
          artist: item.artistName || 'Unknown Artist',
          album: item.collectionName || 'Top Chart',
          image: artworkUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=60',
          mediaUrl: '',
          duration: 180,
          language: 'Hindi/Punjabi',
          year: item.releaseDate ? item.releaseDate.substring(0, 4) : '',
          provider: 'jiosaavn'
        };
      });
    }
  } catch (e) {
    console.error('[Charts] Failed to fetch trending charts:', e.message);
  }

  // Fallback: Query JioSaavn for weekly hits
  try {
    console.log('[Charts Fallback] Fetching trending fallback from JioSaavn...');
    const fallbackResults = await trySaavnSearch('Weekly Top Songs');
    return fallbackResults.slice(0, 20);
  } catch (err) {
    console.error('[Charts Fallback] Failed to fetch JioSaavn fallback:', err.message);
  }
  return [];
}

// ----------------------------------------------------
// JioSaavn Service Manager
// ----------------------------------------------------
const SAAVN_POOL = [
  'https://saavnapi-nine.vercel.app',
  'https://saavn.dev'
];

async function trySaavnSearch(query) {
  for (const base of SAAVN_POOL) {
    try {
      console.log(`[JioSaavn Search] Querying: ${base} for "${query}"`);
      let songsRaw = null;
      let err = null;
      
      // Try /api/search/songs endpoint first to get up to 40 results
      try {
        const res = await fetchWithTimeout(`${base}/api/search/songs?query=${encodeURIComponent(query)}&limit=40`, { timeout: 3500 });
        if (res.status === 200) {
          const data = await res.json();
          songsRaw = data?.data?.results || data?.data || data;
        }
      } catch (e) {
        err = e;
      }
      
      // Try /search/songs endpoint as second choice
      if (!Array.isArray(songsRaw)) {
        try {
          const res = await fetchWithTimeout(`${base}/search/songs?query=${encodeURIComponent(query)}&limit=40`, { timeout: 3500 });
          if (res.status === 200) {
            const data = await res.json();
            songsRaw = data?.data?.results || data?.data || data;
          }
        } catch (e) {
          err = e;
        }
      }

      // Try /result/?query=... as final fallback
      if (!Array.isArray(songsRaw)) {
        try {
          const res = await fetchWithTimeout(`${base}/result/?query=${encodeURIComponent(query)}&lyrics=true`, { timeout: 3500 });
          if (res.status === 200) {
            const data = await res.json();
            songsRaw = data?.data?.results || data?.data || data;
          }
        } catch (e) {
          err = e;
        }
      }

      if (!Array.isArray(songsRaw) || songsRaw.length === 0) {
        throw err || new Error('Invalid search response structure');
      }

      return songsRaw.map(item => ({
        id: `saavn-${item.id}`,
        title: item.song || item.title || item.name || 'Unknown Title',
        artist: item.singers || item.primary_artists || (item.artists?.primary?.map(a => a.name).join(', ')) || 'Unknown Artist',
        album: item.album || item.album?.name || 'Unknown Album',
        image: item.image || (Array.isArray(item.image) ? item.image[item.image.length - 1]?.link : '') || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=60',
        mediaUrl: item.media_url || item.media_preview_url || (Array.isArray(item.downloadUrl) ? item.downloadUrl[item.downloadUrl.length - 1]?.link : '') || '',
        duration: item.duration ? parseInt(item.duration, 10) : 0,
        lyrics: item.lyrics || undefined,
        language: item.language || 'Hindi/English',
        year: item.year || '',
        provider: 'jiosaavn'
      })).filter(song => song.mediaUrl);
    } catch (e) {
      console.warn(`[JioSaavn Search] Failed on ${base}: ${e.message}`);
    }
  }
  throw new Error('All JioSaavn search attempts failed.');
}

async function trySaavnSuggestions(songId) {
  const cleanId = songId.replace('saavn-', '');
  for (const base of SAAVN_POOL) {
    try {
      console.log(`[JioSaavn Suggestions] Querying: ${base}/api/songs/${cleanId}/suggestions`);
      const isDev = base.includes('saavn.dev');
      
      // Standard path in sumitkolhe/jiosaavn-api is /api/songs/{id}/suggestions
      // but let's also try fallback endpoints if they fail
      const url = `${base}/api/songs/${cleanId}/suggestions`;

      const start = Date.now();
      const res = await fetchWithTimeout(url, { timeout: 4500 });
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const songsRaw = isDev ? data?.data : (data?.data || data);

      if (!Array.isArray(songsRaw) || songsRaw.length === 0) {
        throw new Error('Empty/Invalid suggestions response structure');
      }

      console.log(`[JioSaavn Suggestions] Success from ${base} in ${Date.now() - start}ms`);
      return songsRaw.map(item => ({
        id: `saavn-${item.id}`,
        title: item.song || item.title || item.name || 'Unknown Title',
        artist: item.singers || item.primary_artists || (item.artists?.primary?.map(a => a.name).join(', ')) || 'Unknown Artist',
        album: item.album || item.album?.name || 'Unknown Album',
        image: item.image || (Array.isArray(item.image) ? item.image[item.image.length - 1]?.link : '') || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=60',
        mediaUrl: item.media_url || item.media_preview_url || (Array.isArray(item.downloadUrl) ? item.downloadUrl[item.downloadUrl.length - 1]?.link : '') || '',
        duration: item.duration ? parseInt(item.duration, 10) : 0,
        lyrics: item.lyrics || undefined,
        language: item.language || 'Hindi/English',
        year: item.year || '',
        provider: 'jiosaavn'
      })).filter(song => song.mediaUrl);
    } catch (e) {
      console.warn(`[JioSaavn Suggestions] Failed on ${base}: ${e.message}`);
    }
  }
  return [];
}

// Helper to filter out non-music videos from YouTube search results
function isSongResult(title, duration, query) {
  const t = (title || '').toLowerCase();
  const q = (query || '').toLowerCase();

  // If duration exists, check boundaries (80s to 660s)
  if (duration && (duration < 80 || duration > 660)) {
    return false; // Filter out shorts/videos < 80s or long vlogs/movies/compilations > 11 mins
  }

  const excludeKeywords = [
    'vlog', 'gaming', 'unboxing', 'review', 'reaction', 'episode', 'season', 'news',
    'interview', 'tutorial', 'how to', 'compilation', 'playthrough', 'live news',
    'comedy skit', 'prank', 'diy', 'crafts', 'makeup', 'podcast', 'documentary',
    'highlights', 'weekly update', 'daily update', 'vlogger', 'challenge video',
    'behind the scenes', 'bts of', 'making of', 'press conference', 'trailer description'
  ];
  for (const kw of excludeKeywords) {
    if (t.includes(kw) && !q.includes(kw)) {
      return false;
    }
  }
  return true;
}

// Helper to classify song into a genre/era search query for better recommendations
function getGenreEraQuery(title, artist, album, year, language) {
  const t = (title || '').toLowerCase();
  const a = (artist || '').toLowerCase();
  const al = (album || '').toLowerCase();
  const lang = (language || 'Hindi').toLowerCase();
  const y = parseInt(year, 10);

  // 1. Lofi / Chillout
  if (t.includes('lofi') || t.includes('chill') || al.includes('lofi') || al.includes('chill')) {
    return 'Lofi Chill Chillout Beats';
  }
  // 2. Punjabi / Bhangra
  if (lang === 'punjabi' || t.includes('punjabi') || a.includes('diljit') || a.includes('karan aujla') || a.includes('shubh') || a.includes('ap dhillon') || a.includes('sidhu') || t.includes('punj') || al.includes('punjabi')) {
    return 'Punjabi Hits Dance';
  }
  // 3. 90's / 80's Bollywood Romance
  if ((y >= 1980 && y <= 2005) || a.includes('kumar sanu') || a.includes('udit narayan') || a.includes('alka yagnik') || a.includes('lata mangeshkar') || a.includes('asha bhosle') || a.includes('kishore kumar') || a.includes('sonu nigam') || al.includes('90s') || al.includes('classic') || t.includes('90s') || t.includes('80s')) {
    return '90s Hindi Romantic Hits Classics';
  }
  // 4. Retro Classics (Older than 1980)
  if ((y && y < 1980) || a.includes('kishore') || a.includes('rafi') || a.includes('mukesh') || a.includes('lata')) {
    return 'Classic Old Hindi Songs Retro';
  }
  // 5. Party / Dance Bollywood
  if (t.includes('party') || t.includes('remix') || t.includes('club') || t.includes('mashup') || t.includes('dhamaka')) {
    return 'Party Bollywood Hits Dance';
  }
  // 6. General Hindi / Bollywood Romance (Modern)
  if (lang === 'hindi' || a.includes('arijit') || a.includes('jubin') || a.includes('darshan') || a.includes('shreya') || a.includes('nehakakar') || a.includes('atif') || a.includes('pritam')) {
    return 'Romantic Hindi Hits Love';
  }
  // 7. Language specific fallbacks
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
  
  // Default: Fallback to the artist's hits
  return `${artist} hits`;
}

// ----------------------------------------------------
// Local YouTube Search via yt-dlp Scraper (Ditto YouTube Results)
// ----------------------------------------------------
async function tryYtdlpSearch(query) {
  if (!fs.existsSync(ytdlpPath)) {
    throw new Error('yt-dlp binary not found');
  }

  console.log(`[yt-dlp Search] Querying official YouTube for: "${query}"`);
  const start = Date.now();
  
  const { stdout } = await execPromise(`"${ytdlpPath}" "ytsearch30:${query}" --dump-json --flat-playlist`, { timeout: 8000 });
  const lines = stdout.trim().split('\n').filter(l => l.trim().length > 0);
  
  const mapped = lines.map(line => {
    try {
      const item = JSON.parse(line);
      if (!item.id) return null;
      
      const duration = item.duration ? parseInt(item.duration, 10) : 180;
      if (!isSongResult(item.title, duration, query)) {
        return null; // Filter out non-song videos
      }

      let img = item.thumbnail || '';
      if (Array.isArray(item.thumbnails) && item.thumbnails.length > 0) {
        img = item.thumbnails[item.thumbnails.length - 1]?.url || img;
      }
      
      return {
        id: `yt-${item.id}`,
        title: item.title || 'YouTube Music Track',
        artist: item.uploader || item.channel || 'YouTube Artist',
        album: 'YouTube Catalog',
        image: img,
        mediaUrl: '',
        duration: duration,
        language: 'YouTube',
        year: '',
        provider: 'ytdlp'
      };
    } catch (e) {
      return null;
    }
  }).filter(x => x !== null);

  if (mapped.length === 0) {
    throw new Error('yt-dlp returned 0 search results');
  }

  console.log(`[yt-dlp Search] Success! Fetched ${mapped.length} ditto results in ${Date.now() - start}ms`);
  return mapped;
}

// ----------------------------------------------------
// Piped Search Fallback Service
// ----------------------------------------------------
async function tryPipedSearch(query) {
  const activePool = PIPED_INSTANCES.filter(isAvailable).sort((a, b) => b.score - a.score);
  if (activePool.length === 0) {
    throw new Error('No active Piped instances available in pool.');
  }

  for (const instance of activePool) {
    const url = `${instance.url}/search?q=${encodeURIComponent(query)}&filter=music_songs`;
    const start = Date.now();
    try {
      console.log(`[Piped Search] Trying: ${instance.url} (Score: ${instance.score})`);
      const res = await fetchWithTimeout(url, { timeout: 4000 });
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data || !Array.isArray(data.items)) throw new Error('Missing items array');
      if (data.items.length === 0) throw new Error('Search returned 0 results');

      const mapped = data.items
        .filter(item => (item.type || '').toLowerCase() === 'stream')
        .map(item => {
          const videoId = item.videoId || (item.url ? item.url.split('v=')[1] : null);
          if (!videoId) return null;
          
          const duration = item.duration ? parseInt(item.duration, 10) : 180;
          if (!isSongResult(item.title, duration, query)) {
            return null; // Exclude non-music videos
          }

          return {
            id: `yt-${videoId}`,
            title: item.title || 'YouTube Music Track',
            artist: item.uploaderName || 'YouTube Artist',
            album: 'YouTube Catalog',
            image: item.thumbnail || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=60',
            mediaUrl: '',
            duration: duration,
            language: 'YouTube',
            year: '',
            provider: 'piped'
          };
        })
        .filter(song => song !== null);

      if (mapped.length === 0) throw new Error('No stream items found in search');

      handleSuccess(instance, Date.now() - start);
      return mapped;
    } catch (e) {
      console.warn(`[Piped Search] Failed on ${instance.url}: ${e.message}`);
      handleFailure(instance);
    }
  }
  throw new Error('All active Piped search instances failed.');
}

async function tryPipedStream(videoId) {
  const activePool = PIPED_INSTANCES.filter(isAvailable).sort((a, b) => b.score - a.score);
  for (const instance of activePool) {
    const url = `${instance.url}/streams/${videoId}`;
    const start = Date.now();
    try {
      console.log(`[Piped Stream] Trying: ${instance.url}/streams/${videoId}`);
      const res = await fetchWithTimeout(url, { timeout: 4500 });
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data || !Array.isArray(data.audioStreams) || data.audioStreams.length === 0) {
        throw new Error('Empty audioStreams array');
      }

      const sorted = data.audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      const chosenUrl = sorted[0].url || '';
      if (!chosenUrl) throw new Error('Selected audioStream contains no URL');

      handleSuccess(instance, Date.now() - start);
      return chosenUrl;
    } catch (e) {
      console.warn(`[Piped Stream] Failed on ${instance.url}: ${e.message}`);
      handleFailure(instance);
    }
  }
  throw new Error('All active Piped stream instances failed.');
}

// ----------------------------------------------------
// Invidious Search Fallback Service
// ----------------------------------------------------
async function tryInvidiousSearch(query) {
  const activePool = INVIDIOUS_INSTANCES.filter(isAvailable).sort((a, b) => b.score - a.score);
  if (activePool.length === 0) {
    throw new Error('No active Invidious instances available in pool.');
  }

  for (const instance of activePool) {
    const url = `${instance.url}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
    const start = Date.now();
    try {
      console.log(`[Invidious Search] Trying: ${instance.url}`);
      const res = await fetchWithTimeout(url, { timeout: 4000 });
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('Empty/Invalid search response');

      const mapped = data.map(item => {
        if (item.type !== 'video') return null;
        
        const duration = item.lengthSeconds ? parseInt(item.lengthSeconds, 10) : 180;
        if (!isSongResult(item.title, duration, query)) {
          return null; // Exclude non-music videos
        }

        return {
          id: `yt-${item.videoId}`,
          title: item.title || 'YouTube Music Track',
          artist: item.author || 'YouTube Artist',
          album: 'YouTube Catalog',
          image: item.videoThumbnails?.[0]?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=60',
          mediaUrl: '',
          duration: duration,
          language: 'YouTube',
          year: '',
          provider: 'invidious'
        };
      }).filter(song => song !== null);

      if (mapped.length === 0) throw new Error('No videos found in search');

      handleSuccess(instance, Date.now() - start);
      return mapped;
    } catch (e) {
      console.warn(`[Invidious Search] Failed on ${instance.url}: ${e.message}`);
      handleFailure(instance);
    }
  }
  throw new Error('All active Invidious search instances failed.');
}

async function tryInvidiousStream(videoId) {
  const activePool = INVIDIOUS_INSTANCES.filter(isAvailable).sort((a, b) => b.score - a.score);
  for (const instance of activePool) {
    const url = `${instance.url}/api/v1/videos/${videoId}`;
    const start = Date.now();
    try {
      console.log(`[Invidious Stream] Trying: ${instance.url}`);
      const res = await fetchWithTimeout(url, { timeout: 4500 });
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const formats = data.adaptiveFormats || data.formatStreams || [];
      const audioOnly = formats.filter(f => f.mimeType && f.mimeType.startsWith('audio/'));

      if (audioOnly.length === 0) throw new Error('No audio-only formats found');

      audioOnly.sort((a, b) => (parseInt(b.bitrate, 10) || 0) - (parseInt(a.bitrate, 10) || 0));
      const chosenUrl = audioOnly[0].url || '';
      if (!chosenUrl) throw new Error('Selected audio stream format has empty URL');

      handleSuccess(instance, Date.now() - start);
      return chosenUrl;
    } catch (e) {
      console.warn(`[Invidious Stream] Failed on ${instance.url}: ${e.message}`);
      handleFailure(instance);
    }
  }
  throw new Error('All active Invidious stream instances failed.');
}

// ----------------------------------------------------
// Autoplay Recommendations Service (YouTube & JioSaavn)
// ----------------------------------------------------
async function getRelatedYoutubeTracks(videoId) {
  const activePool = PIPED_INSTANCES.filter(isAvailable).sort((a, b) => b.score - a.score);
  for (const instance of activePool) {
    const url = `${instance.url}/streams/${videoId}`;
    const start = Date.now();
    try {
      console.log(`[Piped Recommendations] Querying: ${instance.url}/streams/${videoId}`);
      const res = await fetchWithTimeout(url, { timeout: 4500 });
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data || !Array.isArray(data.relatedStreams)) {
        throw new Error('relatedStreams array missing or invalid');
      }

      handleSuccess(instance, Date.now() - start);
      return data.relatedStreams
        .filter(item => (item.type || '').toLowerCase() === 'stream')
        .map(item => {
          const rId = item.videoId || (item.url ? item.url.split('v=')[1] : null);
          if (!rId) return null;
          return {
            id: `yt-${rId}`,
            title: item.title || 'YouTube Related Track',
            artist: item.uploaderName || 'YouTube Artist',
            album: 'YouTube Catalog',
            image: item.thumbnail || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=60',
            mediaUrl: '',
            duration: item.duration ? parseInt(item.duration, 10) : 180,
            language: 'YouTube',
            year: '',
            provider: 'piped'
          };
        })
        .filter(x => x !== null);
    } catch (e) {
      console.warn(`[Piped Recommendations] Failed on ${instance.url}: ${e.message}`);
      handleFailure(instance);
    }
  }

  // Fallback to Invidious
  const invidiousPool = INVIDIOUS_INSTANCES.filter(isAvailable).sort((a, b) => b.score - a.score);
  for (const instance of invidiousPool) {
    const url = `${instance.url}/api/v1/videos/${videoId}`;
    const start = Date.now();
    try {
      console.log(`[Invidious Recommendations] Querying: ${instance.url}`);
      const res = await fetchWithTimeout(url, { timeout: 4500 });
      if (res.status !== 200) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data || !Array.isArray(data.recommendedVideos)) {
        throw new Error('recommendedVideos array missing or invalid');
      }

      handleSuccess(instance, Date.now() - start);
      return data.recommendedVideos.map(item => ({
        id: `yt-${item.videoId}`,
        title: item.title || 'YouTube Related Track',
        artist: item.author || 'YouTube Artist',
        album: 'YouTube Catalog',
        image: item.videoThumbnails?.[0]?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&auto=format&fit=crop&q=60',
        mediaUrl: '',
        duration: item.lengthSeconds ? parseInt(item.lengthSeconds, 10) : 180,
        language: 'YouTube',
        year: '',
        provider: 'invidious'
      }));
    } catch (e) {
      console.warn(`[Invidious Recommendations] Failed on ${instance.url}: ${e.message}`);
      handleFailure(instance);
    }
  }

  throw new Error('All recommendation providers failed.');
}

async function getRelatedSaavnTracks(artist, title, album, year) {
  try {
    const genreQuery = getGenreEraQuery(title, artist, album, year);
    console.log(`[Recommendations] JioSaavn classified genre/era query: "${genreQuery}"`);
    const results = await trySaavnSearch(genreQuery);
    const filtered = results.filter(song => song.title.toLowerCase() !== title.toLowerCase());
    if (filtered.length > 0) return filtered;
  } catch (e) {
    console.warn('[Recommendations] JioSaavn genre classification search failed, falling back to artist search:', e.message);
  }

  try {
    const results = await trySaavnSearch(artist);
    return results.filter(song => song.title.toLowerCase() !== title.toLowerCase());
  } catch (e) {
    console.warn('[Recommendations] JioSaavn artist fallback recommendations failed:', e.message);
  }
  return [];
}

// ----------------------------------------------------
// Express Server Setup
// ----------------------------------------------------
async function createServer() {
  const app = express();
  const port = process.env.PORT || 5173;

  app.use(express.json({ limit: '5mb' }));

  // Make sure local yt-dlp binary is downloaded on boot
  await ensureYtdlp();

  // Trending Top Charts API Endpoint
  app.get('/api/trending', async (req, res) => {
    console.log(`\n--- [Trending Gateway] Loading Apple Music India Top Charts ---`);
    const results = await fetchTrendingCharts();
    if (results.length > 0) {
      return res.json(results);
    }
    return res.status(503).json({ error: 'Trending charts are temporarily unavailable.' });
  });

  // Unified Search API Endpoint
  app.get('/api/search', async (req, res) => {
    const query = req.query.q;
    const source = req.query.source || 'saavn';

    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    console.log(`\n--- [Search Gateway] Raw Query: "${query}", Source: "${source}" ---`);

    let corrected = null;
    try {
      corrected = await tryMusicBrainzCorrection(query);
    } catch (e) {}

    if (source === 'saavn') {
      let results = [];
      let successProvider = '';

      // Try JioSaavn first using raw user query (never overwrite queries!)
      try {
        results = await trySaavnSearch(query);
        successProvider = 'jiosaavn';
      } catch (err) {
        console.warn(`[Gateway] JioSaavn failed, falling back to local YouTube Search...`);
      }

      // Metadata hint for YouTube re-ranking
      let metaHint = null;
      if (results.length > 0) {
        metaHint = { title: results[0].title, artist: results[0].artist };
      } else if (corrected) {
        metaHint = { title: corrected.title, artist: corrected.artist };
      }

      // Fallback 1: Local yt-dlp search (ditto YouTube results)
      if (results.length === 0) {
        try {
          results = await tryYtdlpSearch(query);
          results = rankSearchItems(results, query, metaHint?.title, metaHint?.artist);
          successProvider = 'ytdlp';
        } catch (err) {
          console.warn(`[Gateway] Local YouTube search failed, falling back to Piped...`);
        }
      }

      // Fallback 2: Piped Search
      if (results.length === 0) {
        try {
          results = await tryPipedSearch(query);
          results = rankSearchItems(results, query, metaHint?.title, metaHint?.artist);
          successProvider = 'piped';
        } catch (err) {
          console.warn(`[Gateway] Piped fallback failed, falling back to Invidious...`);
        }
      }

      // Fallback 3: Invidious Search
      if (results.length === 0) {
        try {
          results = await tryInvidiousSearch(query);
          results = rankSearchItems(results, query, metaHint?.title, metaHint?.artist);
          successProvider = 'invidious';
        } catch (err) {
          console.error(`[Gateway] All fallback search providers failed.`);
          return res.status(503).json({
            status: 'fallback_unavailable',
            error: 'JioSaavn and all YouTube search fallbacks are temporarily offline.'
          });
        }
      }

      // Optional metadata enrichment: Perform a background MusicBrainz lookup to fetch release details (never overwrites query)
      if (corrected) {
        results.forEach(song => {
          const songTitle = song.title.toLowerCase();
          const correctTitle = corrected.title.toLowerCase();
          if (songTitle.includes(correctTitle) || correctTitle.includes(songTitle)) {
            song.year = song.year || corrected.year;
            if (song.album === 'Unknown Album' || song.album === 'YouTube Catalog') {
              song.album = corrected.album;
            }
          }
        });
      }

      return res.json({ status: 'ok', provider: successProvider, results });
    } else {
      // YouTube explicit search (Primary: Local yt-dlp -> Fallback: Piped -> Fallback 2: Invidious)
      let results = [];
      let successProvider = '';
      
      const metaHint = corrected ? { title: corrected.title, artist: corrected.artist } : null;

      // Try Local yt-dlp first (exact local results)
      try {
        results = await tryYtdlpSearch(query);
        results = rankSearchItems(results, query, null, null);
        successProvider = 'ytdlp';
      } catch (err) {
        console.warn(`[Gateway] Local YouTube search failed, trying Piped...`);
      }

      // Fallback to Piped
      if (results.length === 0) {
        try {
          results = await tryPipedSearch(query);
          results = rankSearchItems(results, query, null, null);
          successProvider = 'piped';
        } catch (err) {
          console.warn(`[Gateway] YouTube search failed on Piped, falling back to Invidious...`);
        }
      }

      // Fallback to Invidious
      if (results.length === 0) {
        try {
          results = await tryInvidiousSearch(query);
          results = rankSearchItems(results, query, null, null);
          successProvider = 'invidious';
        } catch (err) {
          console.error(`[Gateway] YouTube search failed on all Piped and Invidious instances.`);
          return res.status(503).json({
            status: 'fallback_unavailable',
            error: 'All YouTube search mirrors are currently offline.'
          });
        }
      }

      return res.json({ status: 'ok', provider: successProvider, results });
    }
  });

  // Unified Stream Resolution API Endpoint
  app.get('/api/stream', async (req, res) => {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ error: 'Parameter "id" is required' });
    }

    console.log(`\n--- [Stream Gateway] Resolving ID: "${id}" ---`);

    if (id.startsWith('saavn-')) {
      return res.status(400).json({ error: 'JioSaavn songs resolve streams client-side.' });
    }

    if (id.startsWith('yt-')) {
      const videoId = id.replace('yt-', '');

      // 1. Try local yt-dlp extractor (100% reliable local ISP connection)
      if (fs.existsSync(ytdlpPath)) {
        try {
          console.log(`[yt-dlp] Extracting stream url for video: ${videoId}`);
          const start = Date.now();
          const { stdout } = await execPromise(`"${ytdlpPath}" -g -f bestaudio "https://www.youtube.com/watch?v=${videoId}"`, { timeout: 8000 });
          const streamUrl = stdout.trim();
          if (streamUrl) {
            console.log(`[yt-dlp] Successfully extracted stream in ${Date.now() - start}ms`);
            return res.json({ url: streamUrl, provider: 'ytdlp' });
          }
        } catch (err) {
          console.warn(`[yt-dlp] Extraction failed: ${err.message}. Trying public fallbacks...`);
        }
      }

      // 2. Cloud Fallback: Try Piped Pool
      try {
        const streamUrl = await tryPipedStream(videoId);
        return res.json({ url: streamUrl, provider: 'piped' });
      } catch (e) {
        console.warn(`[Gateway] Stream resolve failed on Piped, trying Invidious...`);
      }

      // 3. Cloud Fallback: Try Invidious Pool
      try {
        const streamUrl = await tryInvidiousStream(videoId);
        return res.json({ url: streamUrl, provider: 'invidious' });
      } catch (e) {
        console.error(`[Gateway] Stream resolution failed completely.`);
        return res.status(503).json({
          status: 'fallback_unavailable',
          error: 'All YouTube streaming endpoints are temporarily offline.'
        });
      }
    }

    return res.status(400).json({ error: 'Invalid ID namespace' });
  });

  // ==========================================
  // METADATA ENRICHMENT & CACHING PIPELINE
  // ==========================================
  const cacheDir = pathModule.join(__dirname, 'cache');
  const cachePath = pathModule.join(cacheDir, 'metadata_cache.json');
  let metadataCache = {};

  function loadMetadataCache() {
    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      if (fs.existsSync(cachePath)) {
        metadataCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        console.log(`[Metadata Cache] Loaded ${Object.keys(metadataCache).length} cached tracks.`);
      }
    } catch (e) {
      console.warn('[Metadata Cache] Failed to load cache, starting fresh:', e.message);
    }
  }

  function saveMetadataCache() {
    try {
      fs.writeFileSync(cachePath, JSON.stringify(metadataCache, null, 2), 'utf8');
    } catch (e) {
      console.warn('[Metadata Cache] Failed to save cache:', e.message);
    }
  }

  // Load cache on bootstrap
  loadMetadataCache();

  // Helper to clean song titles (strips video tags and brackets)
  function cleanSongTitle(title) {
    if (!title) return '';
    return title
      .replace(/\(.*?\)|\[.*?\]/g, '')
      .replace(/official\s*video|lyric\s*video|official\s*audio|audio|video|hd|4k|1080p|clip\s*officiel/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Throttle to respect MusicBrainz 1 req/sec limit
  let lastMbRequestTime = 0;
  async function throttleMusicBrainz() {
    const now = Date.now();
    const elapsed = now - lastMbRequestTime;
    if (elapsed < 1200) {
      await new Promise(resolve => setTimeout(resolve, 1200 - elapsed));
    }
    lastMbRequestTime = Date.now();
  }

  async function fetchExternalMetadata(title, artist) {
    const cleanTitle = cleanSongTitle(title);
    const cleanArtist = artist || '';
    
    // Check cache
    const cacheKey = `${cleanArtist.toLowerCase()} - ${cleanTitle.toLowerCase()}`;
    if (metadataCache[cacheKey]) {
      return metadataCache[cacheKey];
    }

    const result = { genres: [], moods: [], year: '' };

    // 1. Try Last.fm if free API key is configured
    const lastFmKey = process.env.LASTFM_API_KEY;
    if (lastFmKey) {
      try {
        const url = `http://ws.audioscrobbler.com/2.0/?method=track.gettoptags&artist=${encodeURIComponent(cleanArtist)}&track=${encodeURIComponent(cleanTitle)}&api_key=${lastFmKey}&format=json`;
        const res = await fetchWithTimeout(url, { timeout: 3000 });
        if (res.status === 200) {
          const data = await res.json();
          const tags = data?.toptags?.tag || [];
          tags.slice(0, 10).forEach(t => {
            const tagName = t.name.toLowerCase();
            const knownMoods = ['sad', 'romantic', 'love', 'chill', 'lofi', 'party', 'dance', 'energetic', 'calm', 'happy', 'workout', 'study'];
            if (knownMoods.includes(tagName) || t.count > 30) {
              if (knownMoods.includes(tagName)) {
                result.moods.push(tagName);
              } else {
                result.genres.push(tagName);
              }
            }
          });
          metadataCache[cacheKey] = result;
          saveMetadataCache();
          console.log(`[Metadata Fetch] Last.fm tags success for: "${cleanTitle}" by "${cleanArtist}"`);
          return result;
        }
      } catch (e) {
        console.warn(`[Metadata Fetch] Last.fm query failed: ${e.message}`);
      }
    }

    // 2. Fallback to MusicBrainz (100% Free & Keyless)
    try {
      await throttleMusicBrainz();
      const url = `https://musicbrainz.org/ws/2/recording/?query=artist:"${encodeURIComponent(cleanArtist)}" AND recording:"${encodeURIComponent(cleanTitle)}"&fmt=json`;
      const res = await fetchWithTimeout(url, {
        timeout: 4000,
        headers: { 'User-Agent': 'BeatMess/1.1.0 ( contact@beatmess-app.internal )' }
      });
      if (res.status === 200) {
        const data = await res.json();
        const recordings = data.recordings || [];
        if (recordings.length > 0) {
          const first = recordings[0];
          // Year
          if (first.date) {
            result.year = first.date.substring(0, 4);
          } else if (first.releases && first.releases.length > 0) {
            const rel = first.releases.find(r => r.date);
            if (rel) result.year = rel.date.substring(0, 4);
          }

          // Tags
          const tags = first.tags || [];
          tags.forEach(t => {
            const name = t.name.toLowerCase();
            result.genres.push(name);
          });
          
          metadataCache[cacheKey] = result;
          saveMetadataCache();
          console.log(`[Metadata Fetch] MusicBrainz success for: "${cleanTitle}" by "${cleanArtist}" (Year: ${result.year})`);
          return result;
        }
      }
    } catch (e) {
      console.warn(`[Metadata Fetch] MusicBrainz query failed: ${e.message}`);
    }

    // Cache empty result to avoid API hammering
    metadataCache[cacheKey] = result;
    saveMetadataCache();
    return result;
  }

  // Background queue to throttle and process metadata fetches
  let mbQueue = [];
  let mbQueueProcessing = false;

  function enqueueMetadataFetch(title, artist) {
    const cleanTitle = cleanSongTitle(title);
    const cleanArtist = artist || '';
    const cacheKey = `${cleanArtist.toLowerCase()} - ${cleanTitle.toLowerCase()}`;
    
    if (metadataCache[cacheKey]) return;
    if (mbQueue.some(item => item.title === title && item.artist === artist)) return;

    mbQueue.push({ title, artist });
    
    if (!mbQueueProcessing) {
      processMetadataQueue();
    }
  }

  async function processMetadataQueue() {
    mbQueueProcessing = true;
    while (mbQueue.length > 0) {
      const nextItem = mbQueue.shift();
      try {
        await fetchExternalMetadata(nextItem.title, nextItem.artist);
      } catch (e) {
        console.warn(`[Metadata Queue] Failed for ${nextItem.title}: ${e.message}`);
      }
    }
    mbQueueProcessing = false;
  }

  // Centralized recommendation weights configuration
  const RECOMMENDATION_WEIGHTS = {
    songSimilarity: 0.25,
    userPreferenceScore: 0.15,
    artistSimilarity: 0.12,
    genreSimilarity: 0.10,
    moodSimilarity: 0.08,
    languageSimilarity: 0.05,
    popularityScore: 0.05,
    freshnessScore: 0.05,
    explorationScore: 0.10,

    artistRepetitionPenalty: 0.10,
    albumRepetitionPenalty: 0.08,
    recentlyPlayedPenalty: 0.15
  };

  // Helper to compute word overlapping ratio between titles
  function getTitleSimilarity(titleA, titleB) {
    const wordsA = new Set((titleA || '').toLowerCase().split(/[\s,.\-()\[\]]+/).filter(w => w.length > 2));
    const wordsB = new Set((titleB || '').toLowerCase().split(/[\s,.\-()\[\]]+/).filter(w => w.length > 2));
    if (wordsA.size === 0 || wordsB.size === 0) return 0.0;
    
    let intersectionSize = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) intersectionSize++;
    }
    return intersectionSize / Math.max(wordsA.size, wordsB.size);
  }

  // Helper to retrieve mood tags from titles and album contexts
  function getMoodKeywords(title, album) {
    const text = `${title} ${album}`.toLowerCase();
    const moods = [];
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

  // Scorer function for a candidate song
  function computeBaseScore(candidate, currentSong, history, likedSongs, currentGenreQuery, profile = null, activeWeights = RECOMMENDATION_WEIGHTS, homePageSongIds = []) {
    let score = 0.0;
    
    // 0. Home Page Exclusion Penalty (-8.0 matches target ~99% exclusion)
    if (homePageSongIds && homePageSongIds.includes(candidate.id)) {
      score -= 8.0;
    }

    // Retrieve cached metadata
    const candTitleClean = cleanSongTitle(candidate.title);
    const candArtistClean = candidate.artist || '';
    const candMeta = metadataCache[`${candArtistClean.toLowerCase()} - ${candTitleClean.toLowerCase()}`] || { genres: [], moods: [], year: '' };

    const currTitleClean = cleanSongTitle(currentSong.title);
    const currArtistClean = currentSong.artist || '';
    const currMeta = metadataCache[`${currArtistClean.toLowerCase()} - ${currTitleClean.toLowerCase()}`] || { genres: [], moods: [], year: '' };

    // Song Similarity
    let songSim = 0.0;
    if (candidate.id === currentSong.id) return -10.0; // Filter out active song
    if (candidate.provider === 'piped' || candidate.provider === 'invidious') {
      songSim = 0.8;
    }
    if (candidate.album && currentSong.album && candidate.album === currentSong.album && candidate.album !== 'Unknown Album' && candidate.album !== 'YouTube Catalog') {
      songSim = Math.max(songSim, 0.6);
    }
    const titleSim = getTitleSimilarity(candidate.title, currentSong.title);
    songSim = Math.max(songSim, titleSim);
    
    // Artist Similarity
    let artistSim = 0.0;
    const candArtist = (candidate.artist || '').toLowerCase();
    const currArtist = (currentSong.artist || '').toLowerCase();
    if (candArtist === currArtist) {
      artistSim = 1.0;
    } else {
      const historyArtists = history.map(s => (s.artist || '').toLowerCase());
      const likedArtists = likedSongs.map(s => (s.artist || '').toLowerCase());
      const totalCount = historyArtists.filter(a => a === candArtist).length + likedArtists.filter(a => a === candArtist).length;
      if (totalCount > 0) {
        artistSim = 0.5; // taste similarity
      }
    }

    // Genre Similarity (Leveraging cache)
    let genreSim = 0.0;
    const candGenres = candMeta.genres || [];
    const currGenres = currMeta.genres || [];
    if (candGenres.length > 0 && currGenres.length > 0) {
      const intersection = candGenres.filter(g => currGenres.includes(g));
      genreSim = intersection.length / Math.max(candGenres.length, currGenres.length);
    } else {
      const candGenreQuery = getGenreEraQuery(candidate.title, candidate.artist, candidate.album, candidate.year || candMeta.year);
      if (candGenreQuery === currentGenreQuery) {
        genreSim = 1.0;
      } else {
        const candQueryLower = candGenreQuery.toLowerCase();
        const currQueryLower = currentGenreQuery.toLowerCase();
        const categoryKeywords = ['lofi', 'punjabi', '90s', 'classic', 'party', 'arijit'];
        for (const kw of categoryKeywords) {
          if (candQueryLower.includes(kw) && currQueryLower.includes(kw)) {
            genreSim = 0.7;
            break;
          }
        }
      }
    }

    // Mood Similarity (Leveraging cache)
    let moodSim = 0.4;
    const candMoods = candMeta.moods.length > 0 ? candMeta.moods : getMoodKeywords(candidate.title, candidate.album);
    const currMoods = currMeta.moods.length > 0 ? currMeta.moods : getMoodKeywords(currentSong.title, currentSong.album);
    if (candMoods.length > 0 && currMoods.length > 0) {
      let matches = 0;
      for (const m of candMoods) {
        if (currMoods.includes(m)) matches++;
      }
      if (matches > 0) {
        moodSim = 1.0;
      } else {
        if ((candMoods.includes('sad') && currMoods.includes('party')) || (candMoods.includes('party') && currMoods.includes('sad'))) {
          moodSim = 0.0;
        } else if ((candMoods.includes('devotional') && currMoods.includes('energetic')) || (candMoods.includes('energetic') && currMoods.includes('devotional'))) {
          moodSim = 0.0;
        } else {
          moodSim = 0.2;
        }
      }
    }

    // Language Similarity
    let langSim = 0.0;
    const candLang = (candidate.language || 'Hindi').toLowerCase();
    const currLang = (currentSong.language || 'Hindi').toLowerCase();
    if (candLang === currLang) {
      langSim = 1.0;
    } else {
      const historyLangs = history.map(s => (s.language || 'Hindi').toLowerCase());
      const langCount = historyLangs.filter(l => l === candLang).length;
      if (historyLangs.length > 0) {
        langSim = langCount / historyLangs.length;
      }
    }

    // Popularity Score
    let popScore = 0.2;
    if (candidate.id.startsWith('saavn-charts-')) {
      popScore = 1.0;
    } else if (candidate.provider === 'ytdlp' || candidate.provider === 'jiosaavn') {
      popScore = 0.6;
    }

    // User Preference Score
    let prefScore = 0.0;
    if (profile) {
      const favArtists = profile.favoriteArtists || {};
      const favGenres = profile.favoriteGenres || {};
      const favMoods = profile.favoriteMoods || {};
      const favLangs = profile.favoriteLanguages || {};
      const favAlbums = profile.favoriteAlbums || {};
      
      const artistPref = favArtists[candArtist] ?? favArtists[candidate.artist] ?? 0.0;
      
      let genrePref = 0.0;
      if (candGenres.length > 0) {
        let sum = 0;
        candGenres.forEach(g => sum += favGenres[g] ?? 0.0);
        genrePref = sum / candGenres.length;
      } else {
        const candGenreQuery = getGenreEraQuery(candidate.title, candidate.artist, candidate.album, candidate.year || candMeta.year);
        genrePref = favGenres[candGenreQuery] ?? 0.0;
      }
      
      let moodPref = 0.0;
      if (candMoods.length > 0) {
        let sum = 0;
        candMoods.forEach(m => sum += favMoods[m] ?? 0.0);
        moodPref = sum / candMoods.length;
      }
      
      const langPref = favLangs[candLang] ?? favLangs[candidate.language] ?? 0.0;
      const albumPref = favAlbums[(candidate.album || '').toLowerCase()] ?? 0.0;
      
      prefScore = 0.35 * artistPref + 0.25 * genrePref + 0.15 * moodPref + 0.15 * langPref + 0.10 * albumPref;
    } else {
      const isLiked = likedSongs.some(s => s.id === candidate.id);
      const playCount = history.filter(s => s.id === candidate.id).length;
      const historyArtists = history.map(s => (s.artist || '').toLowerCase());
      const likedArtists = likedSongs.map(s => (s.artist || '').toLowerCase());
      const artistFreq = historyArtists.filter(a => a === candArtist).length + likedArtists.filter(a => a === candArtist).length;
      const artistRatio = Math.min(1.0, artistFreq / 10);
      prefScore = 0.5 * (isLiked ? 1.0 : 0.0) + 0.3 * artistRatio + 0.2 * Math.min(1.0, playCount / 3);
    }

    // Freshness Score
    let freshScore = 1.0;
    const lastPlayedIndex = history.findIndex(s => s.id === candidate.id);
    if (lastPlayedIndex !== -1) {
      freshScore = lastPlayedIndex / history.length;
    }

    // Exploration Score
    let exploreScore = 0.0;
    const inHistory = history.some(s => s.id === candidate.id);
    const inLiked = likedSongs.some(s => s.id === candidate.id);
    const historyArtists = history.map(s => (s.artist || '').toLowerCase());
    const likedArtists = likedSongs.map(s => (s.artist || '').toLowerCase());
    const artistInLikedOrHistory = historyArtists.includes(candArtist) || likedArtists.includes(candArtist);
    if (!inHistory && !inLiked && !artistInLikedOrHistory) {
      exploreScore = 1.0;
    }

    // Apply weights sum
    score += activeWeights.songSimilarity * songSim;
    score += activeWeights.artistSimilarity * artistSim;
    score += activeWeights.genreSimilarity * genreSim;
    score += activeWeights.moodSimilarity * moodSim;
    score += activeWeights.languageSimilarity * langSim;
    score += activeWeights.popularityScore * popScore;
    score += activeWeights.userPreferenceScore * prefScore;
    score += activeWeights.freshnessScore * freshScore;
    score += activeWeights.explorationScore * exploreScore;

    // Apply skip penalties if profile has negative feedback
    if (profile) {
      const skippedArtists = profile.skippedArtists || {};
      const skippedSongs = profile.skippedSongs || {};
      
      let skipPenalty = 0.0;
      if (skippedArtists[candArtist]) {
        skipPenalty += Math.min(1.0, skippedArtists[candArtist] * 0.25);
      }
      if (skippedSongs[candidate.id]) {
        skipPenalty += Math.min(1.0, skippedSongs[candidate.id] * 0.40);
      }
      score -= skipPenalty;
    }

    return score;
  }

  // Sequential queue selector using repetition penalties and MMR diversification
  function selectQueueMMR(candidates, currentSong, history, likedSongs, currentGenreQuery, queueSize = 10, profile = null, activeWeights = RECOMMENDATION_WEIGHTS, homePageSongIds = []) {
    const selected = [];
    const candidatePool = [...candidates];
    
    // Pre-calculate base scores
    candidatePool.forEach(c => {
      c.baseScore = computeBaseScore(c, currentSong, history, likedSongs, currentGenreQuery, profile, activeWeights, homePageSongIds);
    });

    for (let step = 0; step < queueSize; step++) {
      if (candidatePool.length === 0) break;
      
      const scoredCandidates = candidatePool.map((c, index) => {
        let score = c.baseScore;
        const candArtist = (c.artist || '').toLowerCase();
        
        // 1. Artist Repetition Penalties
        let artistPenalty = 0.0;
        if (selected.length > 0) {
          if ((selected[selected.length - 1].artist || '').toLowerCase() === candArtist) artistPenalty += 1.0;
          if (selected.length > 1 && (selected[selected.length - 2].artist || '').toLowerCase() === candArtist) artistPenalty += 0.7;
          if (selected.length > 2 && (selected[selected.length - 3].artist || '').toLowerCase() === candArtist) artistPenalty += 0.4;
          if (selected.length > 3 && (selected[selected.length - 4].artist || '').toLowerCase() === candArtist) artistPenalty += 0.2;
        }
        if ((currentSong.artist || '').toLowerCase() === candArtist) {
          if (selected.length === 0) artistPenalty += 1.0;
          else if (selected.length === 1) artistPenalty += 0.7;
          else if (selected.length === 2) artistPenalty += 0.4;
          else if (selected.length === 3) artistPenalty += 0.2;
        }

        // 2. Album Repetition Penalties
        let albumPenalty = 0.0;
        const candAlbum = (c.album || '').toLowerCase();
        if (candAlbum !== 'unknown album' && candAlbum !== 'youtube catalog') {
          if (selected.length > 0 && (selected[selected.length - 1].album || '').toLowerCase() === candAlbum) albumPenalty += 1.0;
          if (selected.length > 1 && (selected[selected.length - 2].album || '').toLowerCase() === candAlbum) albumPenalty += 0.5;
        }

        // 3. Recently Played Penalties
        let recPlayedPenalty = 0.0;
        if (selected.some(s => s.id === c.id)) {
          recPlayedPenalty = 1.0; // Block duplicates in same queue session
        } else {
          const historyIndex = history.findIndex(s => s.id === c.id);
          if (historyIndex !== -1) {
            recPlayedPenalty = Math.max(0, 1.0 - (historyIndex / 25)); 
          }
        }

        // Apply penalties
        score -= activeWeights.artistRepetitionPenalty * artistPenalty;
        score -= activeWeights.albumRepetitionPenalty * albumPenalty;
        score -= activeWeights.recentlyPlayedPenalty * recPlayedPenalty;

        // 4. Maximal Marginal Relevance (MMR) Diversifier (lambda = 0.3)
        if (selected.length > 0) {
          let maxSim = 0.0;
          for (const sel of selected) {
            let sim = 0.0;
            if ((sel.artist || '').toLowerCase() === candArtist) sim += 0.5;
            if (sel.album && c.album && sel.album === c.album && sel.album !== 'Unknown Album') sim += 0.3;
            sim += 0.2 * getTitleSimilarity(sel.title, c.title);
            maxSim = Math.max(maxSim, sim);
          }
          score -= 0.3 * maxSim;
        }

        return { index, score };
      }).sort((a, b) => b.score - a.score);

      // Controlled randomness: Select among the top 3 highest scores
      const topK = scoredCandidates.slice(0, 3);
      if (topK.length === 0) break;
      
      let chosenIdx = topK[0].index;
      const rand = Math.random();
      if (topK.length > 2) {
        if (rand < 0.60) chosenIdx = topK[0].index;
        else if (rand < 0.90) chosenIdx = topK[1].index;
        else chosenIdx = topK[2].index;
      } else if (topK.length > 1) {
        if (rand < 0.75) chosenIdx = topK[0].index;
        else chosenIdx = topK[1].index;
      }

      const chosenSong = candidatePool[chosenIdx];
      selected.push(chosenSong);
      candidatePool.splice(chosenIdx, 1);
    }

    return selected;
  }

  // POST recommendations API endpoint (Rebuilt from Scratch)
  app.post('/api/recommendations', async (req, res) => {
    const {
      id,
      title = '',
      artist = '',
      album = '',
      year = '',
      language = '',
      history = [],
      likedSongs = [],
      profile = null,
      weights = null,
      homePageSongIds = []
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Parameter "id" is required' });
    }

    console.log(`\n--- [Curation Gateway] Curating custom DJ mix for: "${title}" by "${artist}" (ID: ${id}, Language: ${language}) ---`);

    // Use requested weights or default configurable ones
    const activeWeights = {
      songSimilarity: weights?.songSimilarity ?? RECOMMENDATION_WEIGHTS.songSimilarity ?? 0.25,
      userPreferenceScore: weights?.userPreferenceScore ?? RECOMMENDATION_WEIGHTS.userPreferenceScore ?? 0.15,
      artistSimilarity: weights?.artistSimilarity ?? RECOMMENDATION_WEIGHTS.artistSimilarity ?? 0.12,
      genreSimilarity: weights?.genreSimilarity ?? RECOMMENDATION_WEIGHTS.genreSimilarity ?? 0.10,
      moodSimilarity: weights?.moodSimilarity ?? RECOMMENDATION_WEIGHTS.moodSimilarity ?? 0.08,
      languageSimilarity: weights?.languageSimilarity ?? RECOMMENDATION_WEIGHTS.languageSimilarity ?? 0.05,
      popularityScore: weights?.popularityScore ?? RECOMMENDATION_WEIGHTS.popularityScore ?? 0.05,
      freshnessScore: weights?.freshnessScore ?? RECOMMENDATION_WEIGHTS.freshnessScore ?? 0.05,
      explorationScore: weights?.explorationScore ?? RECOMMENDATION_WEIGHTS.explorationScore ?? 0.10,

      // Penalties
      artistRepetitionPenalty: weights?.artistRepetitionPenalty ?? RECOMMENDATION_WEIGHTS.artistRepetitionPenalty ?? 0.10,
      albumRepetitionPenalty: weights?.albumRepetitionPenalty ?? RECOMMENDATION_WEIGHTS.albumRepetitionPenalty ?? 0.08,
      recentlyPlayedPenalty: weights?.recentlyPlayedPenalty ?? RECOMMENDATION_WEIGHTS.recentlyPlayedPenalty ?? 0.15
    };

    try {
      const currentGenreQuery = getGenreEraQuery(title, artist, album, year, language);
      let candidates = [];
      const seenIds = new Set();
      seenIds.add(id); // Exclude current song

      // Helper to add unique candidates
      const addCandidates = (list) => {
        if (!Array.isArray(list)) return;
        list.forEach(song => {
          if (song && song.id && !seenIds.has(song.id)) {
            seenIds.add(song.id);
            candidates.push(song);
          }
        });
      };

      // 1. Fetch direct recommendations first (Highest quality source)
      if (id.startsWith('yt-')) {
        const videoId = id.replace('yt-', '');
        try {
          const directYt = await getRelatedYoutubeTracks(videoId);
          console.log(`[Curation] Fetched ${directYt.length} direct YouTube related tracks`);
          addCandidates(directYt);
        } catch (e) {
          console.warn('[Curation] Direct YouTube related tracks failed:', e.message);
        }
      } else {
        try {
          const directSaavn = await trySaavnSuggestions(id);
          console.log(`[Curation] Fetched ${directSaavn.length} direct JioSaavn recommendations`);
          addCandidates(directSaavn);
        } catch (e) {
          console.warn('[Curation] Direct JioSaavn recommendations failed:', e.message);
        }
      }

      // 2. Fetch genre/era and artist search results to guarantee high candidate volume
      if (id.startsWith('yt-')) {
        try {
          const genreYt = await tryYtdlpSearch(currentGenreQuery);
          addCandidates(genreYt);
        } catch (e) {
          console.warn('[Curation] Genre YouTube search failed:', e.message);
        }
      } else {
        try {
          const genreSaavn = await trySaavnSearch(currentGenreQuery);
          addCandidates(genreSaavn);
        } catch (e) {
          console.warn('[Curation] Genre JioSaavn search failed:', e.message);
        }
        try {
          const artistSaavn = await trySaavnSearch(artist);
          addCandidates(artistSaavn);
        } catch (e) {
          console.warn('[Curation] Artist JioSaavn search failed:', e.message);
        }
      }

      // 3. Inject user preferences (Liked songs and general trending songs as fallback/discovery)
      addCandidates(likedSongs);
      try {
        const trendingCharts = await fetchTrendingCharts();
        addCandidates(trendingCharts);
      } catch (e) {}

      // 4. Fallback if pool is too small
      if (candidates.length < 80) {
        try {
          const fallbackHits = await trySaavnSearch(language === 'punjabi' ? 'New Punjabi Songs' : 'New Bollywood Songs');
          addCandidates(fallbackHits);
        } catch (e) {}
      }

      console.log(`[Curation Engine] Total unique candidates in pool: ${candidates.length}`);

      const currentSong = { id, title, artist, album, year, language };
      const rankedQueue = selectQueueMMR(candidates, currentSong, history, likedSongs, currentGenreQuery, 50, profile, activeWeights, homePageSongIds);

      // Log Home Page Exclusion statistics
      const totalRanked = rankedQueue.length;
      const homePageOverlap = rankedQueue.filter(s => homePageSongIds.includes(s.id)).length;
      const overlapPercent = totalRanked > 0 ? (homePageOverlap / totalRanked) * 100 : 0;
      
      console.log(`[Curation Engine] Home Page Exclusion Stats: Total Delivered: ${totalRanked} | Home Page Overlap: ${homePageOverlap} (${overlapPercent.toFixed(1)}%) | Non-Home Page: ${(100 - overlapPercent).toFixed(1)}%`);

      // Enqueue selected tracks for background metadata enrichment
      rankedQueue.slice(0, 15).forEach(song => {
        enqueueMetadataFetch(song.title, song.artist);
      });

      console.log(`[Curation Engine] Generated ${rankedQueue.length} curated songs using MMR ranking. Unique artists: ${new Set(rankedQueue.map(s => s.artist)).size}`);
      return res.json(rankedQueue);
    } catch (err) {
      console.error('[Curation Gateway] Curation failed:', err.message);
      return res.json([]);
    }
  });

  // JioSaavn Auto-suggestions Proxy
  app.get('/api/saavn/suggestions', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);

    for (const base of SAAVN_POOL) {
      try {
        const isDev = base.includes('saavn.dev');
        const url = isDev
          ? `${base}/api/search/songs?query=${encodeURIComponent(query)}&limit=6`
          : `${base}/result/?query=${encodeURIComponent(query)}`;

        const resSug = await fetchWithTimeout(url, { timeout: 3000 });
        if (resSug.status === 200) {
          const data = await resSug.json();
          const items = isDev ? data?.data?.results : data;

          if (Array.isArray(items)) {
            const suggestions = new Set();
            items.slice(0, 6).forEach(item => {
              const name = item.song || item.title || item.name;
              if (name) suggestions.add(name.trim());
              const singer = item.singers || item.primary_artists || item.artists?.primary?.[0]?.name;
              if (singer) {
                const primary = singer.split(',')[0].trim();
                if (primary) suggestions.add(primary);
              }
            });
            return res.json(Array.from(suggestions).slice(0, 6));
          }
        }
      } catch (e) {
        // Fallback to next suggestion provider
      }
    }
    return res.json([]);
  });

  // Serve Frontend
  const distPath = pathModule.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('/:path*', (req, res) => {
      res.sendFile(pathModule.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(` BeatMess App with Backend running on http://localhost:${port}`);
    console.log(`======================================================\n`);
  });
}

createServer();
