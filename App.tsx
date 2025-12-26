
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Waves, Settings, Play, Square, Sparkles, Zap, Heart, Speaker, Loader2, RotateCcw, 
  CircleStop, Palette, Sliders, Headphones, Info, X, Leaf, Shell, Activity, User, 
  Check, Search, HelpCircle 
} from 'lucide-react';
import { Frequency, Waveform, JapaStats, ReflectionResponse, Theme, VisualizerSettings, MoodPreset } from './types';
import { audioEngine } from './services/audioEngine';
import Visualizer from './components/Visualizer';
import BeadMala from './components/BeadMala';
import StatsPanel from './components/StatsPanel';
import { getDailyInspiration, getMantraAudio } from './services/geminiService';
import { APP_STORAGE_KEY, THEMES, MOOD_PRESETS, FREQUENCIES } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'frequencies' | 'mantra'>('frequencies');
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [volume, setVolume] = useState(0.5);
  const [waveform, setWaveform] = useState<Waveform>('sine');
  const [mode, setMode] = useState<'single' | 'mix'>('single');
  const [isBinaural, setIsBinaural] = useState(false);
  const [reflection, setReflection] = useState<ReflectionResponse | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]); 
  const [visSettings, setVisSettings] = useState<VisualizerSettings>(MOOD_PRESETS[0].settings);
  const [showSettings, setShowSettings] = useState(false);
  const [infoFreq, setInfoFreq] = useState<Frequency | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShellPulsing, setIsShellPulsing] = useState(false);

  const [stats, setStats] = useState<JapaStats>(() => {
    const saved = localStorage.getItem(APP_STORAGE_KEY);
    if (saved) { try { return JSON.parse(saved); } catch (e) { console.error(e); } }
    return { totalMantras: 0, totalRounds: 0, currentBead: 0, dailyStreak: 0 };
  });

  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [isAutoChanting, setIsAutoChanting] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const ttsSource = useRef<AudioBufferSourceNode | null>(null);
  const mantraBuffer = useRef<AudioBuffer | null>(null);
  const isChantingRef = useRef(false);

  const isLight = currentTheme.id === 'light';
  const textPrimary = isLight ? 'text-slate-950' : 'text-white';
  const textSecondary = isLight ? 'text-slate-700' : 'text-slate-200';
  const cardBg = isLight ? 'bg-slate-100/80' : 'bg-slate-900/40';
  const cardBorder = isLight ? 'border-slate-300' : 'border-slate-700/50';

  const filteredFrequencies = useMemo(() => 
    FREQUENCIES.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.hz.toString().includes(searchQuery)
    ), [searchQuery]);

  const decodeAudio = async (data: string) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  const chantIteration = useCallback(async () => {
    if (!isChantingRef.current || !mantraBuffer.current) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = ctx.createBufferSource();
    source.buffer = mantraBuffer.current;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    source.connect(gainNode).connect(ctx.destination);
    
    source.onended = () => {
      if (!isChantingRef.current) return;
      setStats(prev => {
        let nextBead = prev.currentBead + 1;
        if (nextBead > 108) { stopAutoChant(); return { ...prev, currentBead: 108 }; }
        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 200);
        chantIteration();
        const updated = { ...prev, totalMantras: prev.totalMantras + 1, currentBead: nextBead };
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    };
    ttsSource.current = source;
    source.start();
  }, [volume]);

  const startAutoChant = async () => {
    if (isAutoChanting) { stopAutoChant(); return; }
    if (!mantraBuffer.current) {
      setIsTTSLoading(true);
      const audioData = await getMantraAudio();
      setIsTTSLoading(false);
      if (audioData) { mantraBuffer.current = await decodeAudio(audioData); } else return;
    }
    isChantingRef.current = true;
    setIsAutoChanting(true);
    chantIteration();
  };

  const stopAutoChant = () => {
    isChantingRef.current = false;
    setIsAutoChanting(false);
    ttsSource.current?.stop();
  };

  const handleManualChant = useCallback(() => {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 200);
    setStats(prev => {
      let nextBead = prev.currentBead + 1;
      let nextRounds = prev.totalRounds;
      if (nextBead > 108) { nextBead = 1; nextRounds += 1; }
      const updated = { ...prev, totalMantras: prev.totalMantras + 1, totalRounds: nextRounds, currentBead: nextBead };
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    if ('vibrate' in navigator) navigator.vibrate(40);
  }, []);

  // Fix: Added handleShellSound to trigger the shell sound from audioEngine
  const handleShellSound = useCallback(() => {
    setIsShellPulsing(true);
    audioEngine.playShellSound();
    // Duration in audioEngine.playShellSound is 5s
    setTimeout(() => setIsShellPulsing(false), 5000);
  }, []);

  const toggleFreq = (f: Frequency) => {
    if (activeIds.includes(f.id)) {
      audioEngine.stopTone(f.id);
      setActiveIds(ids => ids.filter(i => i !== f.id));
    } else {
      if (mode === 'single') { audioEngine.stopAll(); setActiveIds([f.id]); }
      else { setActiveIds(ids => [...ids, f.id]); }
      audioEngine.playTone(f.id, f.hz, waveform, isBinaural);
    }
  };

  useEffect(() => {
    const init = async () => setReflection(await getDailyInspiration());
    init();
  }, []);

  useEffect(() => audioEngine.setVolume(volume), [volume]);

  const activeColor = useMemo(() => 
    activeIds.length > 0 
      ? FREQUENCIES.find(f => f.id === activeIds[0])?.color || currentTheme.accent
      : currentTheme.accent
  , [activeIds, currentTheme.accent]);

  return (
    <div 
      className={`min-h-screen transition-colors duration-1000 ${textSecondary}`}
      style={{ backgroundColor: currentTheme.bg }}
    >
      {/* Decorative Vibe Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-30">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] blur-[120px] rounded-full" style={{ backgroundColor: activeColor + '33' }} />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] blur-[120px] rounded-full" style={{ backgroundColor: currentTheme.accent + '22' }} />
      </div>

      <header role="banner" className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl shadow-lg" style={{ backgroundColor: currentTheme.accent }}>
            <Activity className={isLight ? 'text-white' : 'text-black'} size={32} />
          </div>
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${textPrimary}`}>Aura Tuner</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: currentTheme.accent }}>Sacred Sonic Art Fusion</p>
          </div>
        </div>

        <nav role="navigation" aria-label="Main Application Navigation" className={`flex p-1.5 rounded-2xl border ${cardBg} ${cardBorder}`}>
          <button 
            onClick={() => setActiveTab('frequencies')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'frequencies' ? 'bg-white shadow-md text-slate-900' : 'hover:bg-white/10'}`}
          >
            SOUNDS
          </button>
          <button 
            onClick={() => setActiveTab('mantra')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'mantra' ? 'bg-white shadow-md text-slate-900' : 'hover:bg-white/10'}`}
          >
            MANTRA
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-3 rounded-2xl border transition-all ${showSettings ? 'bg-blue-600 text-white border-blue-600' : `${cardBg} ${cardBorder} hover:border-slate-400`}`}
            aria-expanded={showSettings}
            aria-label="Toggle Customization Menu"
          >
            <Settings size={22} />
          </button>
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-6 pb-40">
        {showSettings && (
          <section aria-label="Settings and Customization" className="mb-12 grid md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
            <div className={`p-6 rounded-[2.5rem] border ${cardBg} ${cardBorder}`}>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Palette size={16} /> Art Themes
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setCurrentTheme(t)}
                    className={`py-2 px-3 rounded-lg text-[10px] font-bold border transition-all ${currentTheme.id === t.id ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-400/20 hover:bg-white/5'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
            <div className={`p-6 rounded-[2.5rem] border ${cardBg} ${cardBorder}`}>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Sliders size={16} /> Waveform
              </h3>
              <div className="flex flex-wrap gap-2">
                {['sine', 'triangle', 'sawtooth'].map(w => (
                  <button 
                    key={w} onClick={() => setWaveform(w as Waveform)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold border uppercase ${waveform === w ? 'bg-white text-slate-900' : 'border-slate-400/20'}`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <div className={`p-6 rounded-[2.5rem] border ${cardBg} ${cardBorder}`}>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Info size={16} /> Application Info
              </h3>
              <div className="text-[10px] space-y-2 opacity-80">
                <p className="flex items-center gap-2"><User size={12} /> Developed by: <strong>BalajiDuddukuri</strong></p>
                <p>Version: 2.2-ArtFusion</p>
                <p>Data Source: Vedic Sonic Repository & Solfeggio Scale</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'frequencies' ? (
          <section aria-labelledby="freq-heading">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
              <h2 id="freq-heading" className={`text-4xl font-bold ${textPrimary}`}>Frequency Atelier</h2>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search resonance (e.g. 528)"
                  className={`w-full pl-12 pr-4 py-4 rounded-3xl border transition-all ${cardBg} ${cardBorder} focus:ring-4 focus:ring-blue-500/20 text-sm`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search frequency resonance"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFrequencies.map(f => {
                const isActive = activeIds.includes(f.id);
                return (
                  <article 
                    key={f.id} 
                    className={`group relative p-1 rounded-[2.5rem] transition-all duration-500 ${isActive ? 'scale-[1.02] shadow-2xl' : 'hover:scale-[1.01]'}`}
                    style={{ background: isActive ? `linear-gradient(135deg, ${f.color}, #ffffff)` : 'transparent' }}
                  >
                    <button 
                      onClick={() => toggleFreq(f)}
                      className={`w-full h-full p-8 rounded-[2.3rem] text-left transition-all ${isActive ? 'bg-white/10 text-white' : `${cardBg} border ${cardBorder} hover:border-slate-400`}`}
                      aria-pressed={isActive}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-5xl font-black tracking-tighter" style={{ color: isActive ? '#fff' : f.color }}>{f.hz}</span>
                        <div className={`p-3 rounded-full ${isActive ? 'bg-white/20' : 'bg-slate-500/10'}`}>
                          {isActive ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-1 underline decoration-2 underline-offset-8 decoration-blue-500/0 group-hover:decoration-blue-500/50 transition-all">{f.name}</h3>
                      <p className="text-sm opacity-80 leading-relaxed">{f.description}</p>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); setInfoFreq(f); }}
                        className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-600"
                        aria-label={`More info about ${f.name}`}
                      >
                        <HelpCircle size={14} /> LEARN MORE
                      </button>
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section aria-labelledby="mantra-heading" className="flex flex-col items-center">
            <StatsPanel stats={stats} />
            
            <div className="text-center my-20 max-w-3xl w-full relative">
              <div className="absolute -z-10 inset-0 blur-3xl opacity-10 animate-pulse" style={{ backgroundColor: currentTheme.accent }} />
              
              <h2 id="mantra-heading" className={`text-4xl md:text-7xl font-bold leading-tight mb-12 [text-shadow:0_4px_12px_rgba(0,0,0,0.1)] ${textPrimary}`}>
                Hare Krishna Hare Krishna<br />
                Krishna Krishna Hare Hare<br />
                Hare Rama Hare Rama<br />
                Rama Rama Hare Hare
              </h2>

              <div className="flex flex-wrap justify-center gap-6 mb-12">
                <button 
                  onClick={() => handleShellSound()}
                  className={`flex items-center gap-4 px-8 py-5 rounded-[2rem] border transition-all ${isShellPulsing ? 'bg-amber-500 text-white border-white scale-110 shadow-xl' : `${cardBg} ${cardBorder} hover:border-amber-400`}`}
                  aria-label="Play Conch Shell Ritual Sound"
                >
                  <Shell size={28} />
                  <span className="text-sm font-black tracking-widest uppercase">INVOKE SANKHA</span>
                </button>
                <button 
                  onClick={startAutoChant}
                  disabled={isTTSLoading}
                  className={`flex items-center gap-4 px-8 py-5 rounded-[2rem] border transition-all ${isAutoChanting ? 'bg-blue-600 text-white border-blue-600' : `${cardBg} ${cardBorder} hover:border-blue-400`}`}
                  aria-label={isAutoChanting ? "Stop automated chanting" : "Start automated chanting"}
                >
                  {isTTSLoading ? <Loader2 className="animate-spin" /> : isAutoChanting ? <CircleStop /> : <Speaker />}
                  <span className="text-sm font-black tracking-widest uppercase">{isAutoChanting ? 'STOP CHANT' : 'AUTO CHANT'}</span>
                </button>
              </div>
            </div>

            <div className="w-full mb-20" role="presentation">
              <BeadMala currentBead={stats.currentBead} isLight={isLight} />
            </div>

            <button
              onClick={handleManualChant}
              className={`group relative w-full max-w-md py-12 rounded-[4rem] text-3xl font-black transition-all transform active:scale-95 shadow-2xl flex flex-col items-center justify-center gap-4 ${isPulsing ? 'scale-[0.98]' : 'hover:scale-[1.02]'}`}
              style={{ backgroundColor: currentTheme.accent, color: isLight ? '#fff' : '#000' }}
              aria-label="Confirm Chanting of Mantra"
            >
              <span className="tracking-[0.2em]">CHANTED</span>
              <Heart size={42} fill="currentColor" className={isPulsing ? 'animate-ping' : 'group-hover:scale-110 transition-transform'} />
              <div className="absolute inset-0 rounded-[4rem] ring-4 ring-white/20 group-hover:ring-white/40 transition-all" />
            </button>
            
            <button 
              onClick={() => setStats({...stats, currentBead: 0})}
              className="mt-8 text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 hover:text-slate-400 flex items-center gap-3 transition-colors"
            >
              <RotateCcw size={16} /> RESTART BEAD CYCLE
            </button>
          </section>
        )}
      </main>

      {/* Frequency Info Modal with ARIA */}
      {infoFreq && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-title"
          className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[100] flex items-center justify-center p-6"
        >
          <div className={`max-w-2xl w-full rounded-[4rem] p-12 relative border ${cardBorder} ${isLight ? 'bg-white' : 'bg-slate-950'}`}>
            <button 
              onClick={() => setInfoFreq(null)}
              className="absolute top-10 right-10 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all"
              aria-label="Close dialog"
            >
              <X size={24} />
            </button>
            <div className="mb-8">
              <span className="text-7xl font-black block mb-2" style={{ color: infoFreq.color }}>{infoFreq.hz}Hz</span>
              <h2 id="modal-title" className={`text-4xl font-bold ${textPrimary}`}>{infoFreq.name}</h2>
              <p className="text-amber-500 font-black text-xs uppercase tracking-[0.4em] mt-3">{infoFreq.category} Resonance</p>
            </div>
            <p className={`text-2xl italic leading-relaxed mb-8 ${textPrimary}`}>"{infoFreq.description}"</p>
            <p className="text-lg opacity-80 leading-relaxed mb-10">{infoFreq.info}</p>
            <button 
              onClick={() => { toggleFreq(infoFreq); setInfoFreq(null); }}
              className="w-full py-6 rounded-3xl font-black tracking-widest text-sm uppercase shadow-2xl transition-transform active:scale-95"
              style={{ backgroundColor: infoFreq.color, color: '#fff' }}
            >
              TUNE TO RESONANCE
            </button>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 z-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <div className="max-w-6xl mx-auto flex justify-between items-center pointer-events-auto">
          <div className={`px-8 py-5 rounded-[2.5rem] border backdrop-blur-2xl shadow-2xl flex items-center gap-8 ${cardBg} ${cardBorder}`}>
             <div className="flex-1 min-w-[200px]">
                <div className="flex justify-between mb-3 text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="opacity-60">MASTER VOLUME</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-slate-400/20 rounded-full appearance-none"
                  aria-label="Master Output Volume"
                />
             </div>
             <div className="h-10 w-px bg-slate-500/20" />
             <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.4em]">
                <User size={14} className="text-blue-500" />
                <span className="opacity-80">BalajiDuddukuri</span>
             </div>
          </div>
        </div>
      </footer>

      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite">
        {isAutoChanting && "Automated chanting is currently active."}
        {!isAutoChanting && "Automated chanting stopped."}
        {activeIds.length > 0 && `Frequency ${activeIds.join(', ')} is now playing.`}
      </div>
    </div>
  );
};

export default App;
