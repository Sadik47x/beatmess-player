import React, { useState } from 'react';
import { useLibraryStore } from '../stores/libraryStore';
import { useUIStore } from '../stores/uiStore';
import { Save, RefreshCw, User, ShieldAlert, Sparkles, Globe } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { username, avatarUrl, pipedInstanceUrl, updateProfile, setPipedInstanceUrl, clearAllCache } = useLibraryStore();
  const { showToast } = useUIStore();

  const [inputName, setInputName] = useState(username);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarUrl);
  const [pipedInput, setPipedInput] = useState(pipedInstanceUrl);

  const avatars = [
    // Neon headphones avatar
    'https://lh3.googleusercontent.com/aida-public/AB6AXuARGfYCYnkA8W4OgmDNNlf5Ko6vP5QPTnaJZAyC0gHQR1MC2Rpdv5cJUfv0lza_qVn_cwDeYL0_pSfRSSFKPu0cEaiDz3fj48Fd1P3cFS-PTkvNqO2xipRKva_zjvl4Wy7pVhZhvNkOQ1h6iRuLKPYDzuG3kEwdF1kcXV-i1vtOog1Ods342qdLI8w8bJBOrulsDwpoPFfdMd4pyhJNk53f9WM7AUCeQBnHfUqvNillxTNqRTyMyuNt',
    // Female neon avatar
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCSkDYvPLsSNACGSkCV0_b7fDspHdfNK9Je2FhjkDb__fCwLz-8KruDEwwxWO3eg6lWjy_3axkLxdRflKEZPqMouxP5GiWxJpDK_rVnX4m2-nRh2qe_ThANYxL5UYdmssQ1J51vj3uNyLwzr7FtnCLr6S3JA4h6bf-aTuyLR2RNnQghovRWemPLpEtz1CPsT5r11lIV4DgYIb0oi85baFaibylhqszCgoJBMxM96llAEnNYvlKJk2qs',
    // Cyperbunk purple avatar
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCLbd9UkUzfjBp9pt0pdf-0mVMC4qlBBkO8z4dKeF_2nFbm86htTWso1QY3gqiDLMHnXSESfqzp47q_sFoFSgwio_MHE9mguy4LT-r-GWYUM9J2ADcKdK0vVn90rEbxZEANqC4Vt9yMgljQ7JKP8-_XWC9tegEDumQ7BN-oj9WL9tQpg_YTasdL06viPZ-NnYmO47VWa1PRM73BWwUjT7KEsUZ6Vw6EOaahhFA9corDuv2ogfY6Bl6X',
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    updateProfile(inputName, selectedAvatar);
    showToast('Profile updated successfully!', 'success');
  };

  const handleSavePipedUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipedInput.trim()) return;
    // Clean trailing slash
    const cleanedUrl = pipedInput.trim().replace(/\/$/, '');
    setPipedInstanceUrl(cleanedUrl);
    setPipedInput(cleanedUrl);
    showToast('YouTube source settings updated!', 'success');
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cache and reset the app? This deletes your local playlists, history, and liked songs.')) {
      clearAllCache();
      showToast('Cache cleared! Restarting...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col gap-6 overflow-y-auto h-full pb-32 hide-scrollbar">
      {/* Header */}
      <header className="flex justify-between items-center mt-2 select-none">
        <h1 className="font-headline-md text-[24px] font-bold tracking-tight text-glow">Settings</h1>
      </header>

      {/* Edit Profile Form */}
      <form onSubmit={handleSaveProfile} className="glass-panel border-white/5 bg-white/[0.01] p-5 rounded-2xl flex flex-col gap-4 select-none">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <User size={18} className="text-primary" />
          <h2 className="font-semibold text-sm text-on-surface">Personalize Profile</h2>
        </div>

        {/* Avatar Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase font-label-caps">Select Avatar</label>
          <div className="flex gap-4 mt-1">
            {avatars.map((avUrl, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedAvatar(avUrl)}
                className={`w-14 h-14 rounded-full overflow-hidden border-2 cursor-pointer transition-all duration-200 ${
                  selectedAvatar === avUrl ? 'border-primary scale-105 shadow-[0_0_12px_rgba(139,92,246,0.4)]' : 'border-transparent hover:border-white/20'
                }`}
              >
                <img src={avUrl} alt={`Avatar option ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase font-label-caps">Display Name</label>
          <input
            type="text"
            required
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Explorer"
            className="bg-white/[0.04] border border-white/12 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50"
          />
        </div>

        <button
          type="submit"
          className="mt-2 bg-white/5 border border-white/10 hover:bg-white/10 text-on-surface py-2.5 px-6 rounded-full font-label-caps text-[11px] font-bold tracking-wider hover:scale-103 active:scale-97 duration-200 transition-all flex items-center justify-center gap-1.5 self-start"
        >
          <Save size={14} /> SAVE PROFILE
        </button>
      </form>

      {/* YouTube Integration Config (Piped settings) */}
      <form onSubmit={handleSavePipedUrl} className="glass-panel border-white/5 bg-white/[0.01] p-5 rounded-2xl flex flex-col gap-4 select-none">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"></polygon></svg>
          <h2 className="font-semibold text-sm text-on-surface font-display-lg">YouTube Integration (Piped)</h2>
        </div>
        
        <p className="text-[13px] text-on-surface-variant leading-relaxed">
          YouTube searches query a community Piped API node. You can customize the active API endpoint below if the default node is slow or blocked.
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase font-label-caps flex items-center gap-1">
            <Globe size={10} /> Piped API Base URL
          </label>
          <input
            type="text"
            required
            value={pipedInput}
            onChange={(e) => setPipedInput(e.target.value)}
            placeholder="https://pipedapi.kavin.rocks"
            className="bg-white/[0.04] border border-white/12 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase font-label-caps">Public Server Suggestions:</span>
          <div className="text-[12px] text-on-surface-variant leading-relaxed pl-1 space-y-1 mt-1">
            <div>• Official Mirror: <code className="text-primary select-all">https://pipedapi.kavin.rocks</code></div>
            <div>• Lunar Mirror: <code className="text-primary select-all">https://piped-api.lunar.icu</code> (fallback)</div>
            <div>• Tokhmi Mirror: <code className="text-primary select-all">https://pipedapi.tokhmi.xyz</code> (bypass cert warnings)</div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 bg-white/5 border border-white/10 hover:bg-white/10 text-on-surface py-2.5 px-6 rounded-full font-label-caps text-[11px] font-bold tracking-wider hover:scale-103 active:scale-97 duration-200 transition-all flex items-center justify-center gap-1.5 self-start"
        >
          <Save size={14} /> UPDATE YOUTUBE API
        </button>
      </form>

      {/* Cache & Data Management */}
      <div className="glass-panel border-white/5 bg-white/[0.01] p-5 rounded-2xl flex flex-col gap-4 select-none">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <ShieldAlert size={18} className="text-red-400" />
          <h2 className="font-semibold text-sm text-on-surface">Data & Cache</h2>
        </div>

        <p className="text-[13px] text-on-surface-variant leading-relaxed">
          Clear cached files, reset settings, and remove all locally saved liked songs, custom playlists, and listening history.
        </p>

        <button
          onClick={handleClearCache}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 py-3 px-6 rounded-xl font-semibold text-sm hover:scale-102 active:scale-98 duration-200 transition-all flex items-center justify-center gap-2 self-start"
        >
          <RefreshCw size={14} /> Force Refresh & Clear Cache
        </button>
      </div>

      {/* About Section */}
      <div className="glass-panel border-white/5 bg-white/[0.01] p-5 rounded-2xl flex flex-col gap-3 select-none">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Sparkles size={16} className="text-primary animate-pulse" />
          <h2 className="font-semibold text-sm text-on-surface">About BeatMess</h2>
        </div>
        <p className="text-[12px] text-on-surface-variant leading-relaxed">
          <strong>Version:</strong> 1.1.0 (YouTube integration & suggestions)<br />
          Premium Glassmorphism Music client running entirely client-side. Built with React, Zustand, and Tailwind CSS.
        </p>
      </div>
    </div>
  );
};
export default SettingsPage;
