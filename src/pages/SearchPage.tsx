import React, { useState, useEffect, useRef } from 'react';
import { musicService } from '../services/musicService';
import type { Song } from '../types/song';
import { SongRow } from '../components/song/SongRow';
import { useLibraryStore } from '../stores/libraryStore';
import { Search, X, Music, Radio, Sparkles, Flame, Headphones, Compass } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const { searchHistory, addToSearchHistory, removeFromSearchHistory, clearSearchHistory } = useLibraryStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSource, setSearchSource] = useState<'saavn' | 'youtube'>('saavn');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search & suggestion fetching
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSuggestions([]);
      setSearched(false);
      setErrorMsg(null);
      return;
    }

    // Suggestions fetch
    const suggestionsTimeout = setTimeout(async () => {
      const suggestionsData = await musicService.getSearchSuggestions(query);
      setSuggestions(suggestionsData);
    }, 200);

    // Search execute
    const searchTimeout = setTimeout(() => {
      handleSearch(query, searchSource);
    }, 500);

    return () => {
      clearTimeout(suggestionsTimeout);
      clearTimeout(searchTimeout);
    };
  }, [query, searchSource]);

  const handleSearch = async (searchQuery: string, source: 'saavn' | 'youtube') => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearched(true);
    setShowSuggestions(false);
    setErrorMsg(null); // Clear previous error
    try {
      let searchResults: Song[] = [];
      if (source === 'saavn') {
        searchResults = await musicService.search(searchQuery);
      } else {
        searchResults = await musicService.searchYouTube(searchQuery);
      }
      setResults(searchResults);
      addToSearchHistory(searchQuery);
    } catch (e: any) {
      console.error('Search failed:', e);
      setErrorMsg(e.message || 'An error occurred during search.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setSearched(false);
    setShowSuggestions(false);
    setErrorMsg(null);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setQuery(categoryName);
    handleSearch(categoryName, searchSource);
  };

  const handleChipClick = (histQuery: string) => {
    setQuery(histQuery);
    handleSearch(histQuery, searchSource);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion, searchSource);
  };

  // Static list of browse categories
  const categories = [
    { name: 'Bollywood Hits', color: 'from-amber-500/20 to-orange-500/20 hover:border-orange-500/30', icon: <Flame className="text-orange-400" size={20} /> },
    { name: 'Lofi Beats', color: 'from-blue-500/20 to-indigo-500/20 hover:border-indigo-500/30', icon: <Headphones className="text-indigo-400" size={20} /> },
    { name: 'Punjabi Hits', color: 'from-purple-500/20 to-pink-500/20 hover:border-pink-500/30', icon: <Sparkles className="text-pink-400" size={20} /> },
    { name: 'EDM & Dance', color: 'from-cyan-500/20 to-blue-500/20 hover:border-blue-500/30', icon: <Radio className="text-blue-400" size={20} /> },
    { name: 'Indian Pop', color: 'from-emerald-500/20 to-teal-500/20 hover:border-teal-500/30', icon: <Music className="text-teal-400" size={20} /> },
    { name: 'Workout Power', color: 'from-red-500/20 to-rose-500/20 hover:border-rose-500/30', icon: <Compass className="text-rose-400" size={20} /> },
  ];

  return (
    <div className="flex flex-col gap-6 overflow-y-auto h-full pb-32 hide-scrollbar relative">
      {/* Search Input Bar & Autocomplete suggestions */}
      <div className="relative flex flex-col mt-2 z-30">
        <div className="relative flex items-center w-full">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            placeholder={searchSource === 'saavn' ? 'Search JioSaavn library...' : 'Search YouTube fallback catalog...'}
            className="w-full bg-white/[0.04] backdrop-blur-[20px] border border-white/12 rounded-full pl-12 pr-12 py-3.5 text-[15px] text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
          />
          <Search className="absolute left-4 text-on-surface-variant" size={20} />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-white/5 active:scale-95 duration-200 transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Floating Autocomplete Suggestions Panel */}
        {showSuggestions && suggestions.length > 0 && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setShowSuggestions(false)}></div>
            <div className="absolute top-14 left-0 right-0 z-30 glass-panel bg-[#121218]/95 border-white/12 rounded-2xl py-2 shadow-2xl flex flex-col backdrop-blur-xl">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(s)}
                  className="px-5 py-3 hover:bg-white/5 text-left text-sm text-on-surface flex items-center gap-3 active:scale-99 transition-all"
                >
                  <Search size={14} className="text-on-surface-variant" />
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Switch Tabs: JioSaavn vs YouTube */}
      <div className="flex gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-full select-none max-w-sm">
        <button
          onClick={() => {
            setSearchSource('saavn');
            if (query.trim()) handleSearch(query, 'saavn');
          }}
          className={`flex-1 py-2 rounded-full font-label-caps text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 duration-200 transition-all ${
            searchSource === 'saavn'
              ? 'bg-gradient-to-r from-accent-violet/20 to-accent-pink/20 text-primary border border-primary/20 shadow-inner'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Music size={12} />
          <span>JioSaavn</span>
        </button>
        <button
          onClick={() => {
            setSearchSource('youtube');
            if (query.trim()) handleSearch(query, 'youtube');
          }}
          className={`flex-1 py-2 rounded-full font-label-caps text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 duration-200 transition-all ${
            searchSource === 'youtube'
              ? 'bg-gradient-to-r from-accent-violet/20 to-accent-pink/20 text-primary border border-primary/20 shadow-inner'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"></polygon></svg>
          <span>YouTube (Piped)</span>
        </button>
      </div>

      {/* Conditional Layouts */}
      {!searched ? (
        /* Pre-Search State */
        <div className="flex flex-col gap-6 select-none z-10">
          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-xs tracking-wider uppercase text-on-surface-variant">Recent Searches</h3>
                <button
                  onClick={clearSearchHistory}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((hist, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleChipClick(hist)}
                    className="glass-panel border-white/5 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full text-xs text-on-surface flex items-center gap-1.5 cursor-pointer hover:border-white/10 active:scale-95 duration-200 transition-all"
                  >
                    <span>{hist}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromSearchHistory(hist);
                      }}
                      className="text-on-surface-variant hover:text-on-surface p-0.5 rounded-full"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Browse Categories Grid */}
          <div>
            <h3 className="font-semibold text-xs tracking-wider uppercase text-on-surface-variant mb-4">Browse Categories</h3>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`glass-panel border-white/5 bg-gradient-to-br ${cat.color} p-4 rounded-2xl flex flex-col justify-between aspect-[1.8/1] cursor-pointer active:scale-97 transition-all duration-200 shadow-md`}
                >
                  <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center">
                    {cat.icon}
                  </div>
                  <span className="font-semibold text-sm text-on-surface truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Results State */
        <div className="flex-1 min-h-0 flex flex-col gap-4 z-10">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-xs tracking-wider uppercase text-on-surface-variant">
                Results from {results[0]?.id.startsWith('yt-') ? 'YouTube (Fallback Catalog)' : (searchSource === 'saavn' ? 'JioSaavn' : 'YouTube')}
              </h3>
            </div>
            {results[0]?.id.startsWith('yt-') && searchSource === 'saavn' && (
              <div className="text-[11px] font-medium text-amber-400 bg-amber-500/5 border border-amber-500/10 px-4 py-2 rounded-xl flex items-center gap-1.5 self-start select-none shadow-sm backdrop-blur-md">
                <span>⚠️ JioSaavn is currently offline. Showing YouTube fallback results.</span>
              </div>
            )}
          </div>

          {loading ? (
            /* Results Skeleton loader */
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="glass-panel border-white/5 p-3 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-white/10"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-white/10 rounded"></div>
                    <div className="h-3 w-1/4 bg-white/10 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : errorMsg ? (
            /* Custom Backend/Piped API Failure Error State */
            <div className="glass-panel border-red-500/20 bg-red-500/5 p-8 rounded-2xl flex flex-col items-center justify-center text-center select-none shadow-lg">
              <span className="text-red-400 font-bold mb-3 font-label-caps text-[10px] tracking-wider flex items-center gap-1.5 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                ⚠️ SERVICE TEMPORARILY OFFLINE
              </span>
              <p className="font-semibold text-sm text-on-surface mb-2">{errorMsg}</p>
              <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
                All public YouTube music mirrors are currently unresponsive. Please try again in a few moments, or toggle back to the JioSaavn tab.
              </p>
            </div>
          ) : results.length > 0 ? (
            /* Results List */
            <div className="flex flex-col gap-3">
              {results.map((song, idx) => (
                <SongRow key={song.id} song={song} index={idx} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="glass-panel border-white/5 p-12 rounded-2xl flex flex-col items-center justify-center text-center">
              <Compass className="text-on-surface-variant opacity-40 mb-4 animate-spin" style={{ animationDuration: '8s' }} size={42} />
              <p className="font-semibold text-base text-on-surface mb-1">No Results Found</p>
              <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed">
                {searchSource === 'youtube'
                  ? 'No matching YouTube streams found. Try modifying your search query or switch back to JioSaavn library.'
                  : 'No results found on JioSaavn. Try switching to the YouTube (Piped) tab fallback.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default SearchPage;
