import React, { useState } from 'react';
import { useLibraryStore } from '../../stores/libraryStore';
import { X, Sparkles, Music, Globe, Check } from 'lucide-react';

interface OnboardingModalProps {
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const { setOnboardingPreferences } = useLibraryStore();
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [step, setStep] = useState(1);

  const artists = [
    'Arijit Singh', 'Diljit Dosanjh', 'Karan Aujla', 'Atif Aslam', 
    'Anirudh Ravichander', 'Anuv Jain', 'Tame Impala', 'Lata Mangeshkar', 
    'Sonu Nigam', 'Sidhu Moose Wala'
  ];

  const languages = ['Hindi', 'Punjabi', 'English', 'Bengali', 'Telugu', 'Tamil'];

  const genres = [
    { key: 'Lofi Chill Chillout Beats', label: 'Lofi Chill' },
    { key: 'Romantic Hindi Hits Love', label: 'Romantic Romance' },
    { key: 'Party Bollywood Hits Dance', label: 'Party & Dance' },
    { key: 'Classic Old Hindi Songs Retro', label: 'Retro Classics' },
    { key: 'Punjabi Hits Dance', label: 'Punjabi Beats' },
    { key: 'English Pop Hits Billboard', label: 'Pop & Rock' }
  ];

  const toggleArtist = (name: string) => {
    setSelectedArtists(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const toggleLang = (name: string) => {
    setSelectedLangs(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const toggleGenre = (key: string) => {
    setSelectedGenres(prev =>
      prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
    );
  };

  const handleFinish = () => {
    // Save selections as initial preference seed
    setOnboardingPreferences({
      artists: selectedArtists,
      languages: selectedLangs,
      genres: selectedGenres
    });
    localStorage.setItem('beatmess-onboarded', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#06060a]/90 backdrop-blur-md flex items-center justify-center p-6 select-none animate-fade-in">
      <div className="relative w-full max-w-md glass-panel border-white/10 bg-[#0c0c14]/80 p-8 rounded-3xl flex flex-col gap-6 shadow-2xl overflow-hidden max-h-[90vh]">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 filter blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-pink/20 filter blur-3xl rounded-full pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={() => {
            localStorage.setItem('beatmess-onboarded', 'true');
            onClose();
          }}
          className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-white/5 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <header className="text-center relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-accent-violet to-accent-pink flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <Sparkles size={22} className="text-white" />
          </div>
          <h2 className="font-display-lg text-xl font-bold bg-gradient-to-r from-white via-white to-on-surface-variant bg-clip-text text-transparent">Welcome to BeatMess</h2>
          <p className="text-xs text-on-surface-variant mt-1.5">Customize your starting personalized radio (Step {step} of 3)</p>
        </header>

        {/* Step Contents */}
        <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar relative z-10 min-h-0">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-sm text-glow flex items-center gap-1.5">
                <Music size={14} className="text-primary" /> Select Favorite Artists
              </h3>
              <div className="grid grid-cols-2 gap-2.5 mt-1">
                {artists.map(art => {
                  const selected = selectedArtists.includes(art);
                  return (
                    <button
                      key={art}
                      onClick={() => toggleArtist(art)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl border text-xs font-medium text-left duration-200 transition-all ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_8px_rgba(139,92,246,0.2)]'
                          : 'border-white/8 bg-white/[0.02] hover:bg-white/5 hover:border-white/12 text-on-surface-variant'
                      }`}
                    >
                      <span className="truncate">{art}</span>
                      {selected && <Check size={12} className="text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-sm text-glow flex items-center gap-1.5">
                <Globe size={14} className="text-primary" /> Select Preferred Languages
              </h3>
              <div className="grid grid-cols-2 gap-2.5 mt-1">
                {languages.map(lang => {
                  const selected = selectedLangs.includes(lang);
                  return (
                    <button
                      key={lang}
                      onClick={() => toggleLang(lang)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl border text-xs font-medium text-left duration-200 transition-all ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_8px_rgba(139,92,246,0.2)]'
                          : 'border-white/8 bg-white/[0.02] hover:bg-white/5 hover:border-white/12 text-on-surface-variant'
                      }`}
                    >
                      <span>{lang}</span>
                      {selected && <Check size={12} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-sm text-glow flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" /> Pick Your Music Vibes
              </h3>
              <div className="grid grid-cols-2 gap-2.5 mt-1">
                {genres.map(genre => {
                  const selected = selectedGenres.includes(genre.key);
                  return (
                    <button
                      key={genre.key}
                      onClick={() => toggleGenre(genre.key)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl border text-xs font-medium text-left duration-200 transition-all ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary shadow-[0_0_8px_rgba(139,92,246,0.2)]'
                          : 'border-white/8 bg-white/[0.02] hover:bg-white/5 hover:border-white/12 text-on-surface-variant'
                      }`}
                    >
                      <span>{genre.label}</span>
                      {selected && <Check size={12} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Nav Buttons */}
        <footer className="flex justify-between items-center mt-2 relative z-10 pt-2 border-t border-white/5">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-xs text-on-surface-variant hover:text-on-surface font-label-caps font-bold px-4 py-2 hover:bg-white/5 rounded-full"
            >
              PREVIOUS
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-on-surface text-xs font-bold font-label-caps px-6 py-2.5 rounded-full hover:scale-103 active:scale-97 duration-200 transition-all ml-auto"
            >
              CONTINUE
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="bg-gradient-to-r from-accent-violet to-accent-pink text-white text-xs font-bold font-label-caps px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 duration-200 transition-all ml-auto shadow-[0_0_15px_rgba(236,72,153,0.3)] border border-white/10"
            >
              LET'S PLAY
            </button>
          )}
        </footer>

      </div>
    </div>
  );
};
