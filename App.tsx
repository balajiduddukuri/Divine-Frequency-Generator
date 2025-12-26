import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Waves, 
  Settings, 
  Play,
  Square,
  Sparkles,
  Zap,
  Heart,
  Speaker,
  Loader2,
  RotateCcw,
  CircleStop,
  Shuffle,
  Palette,
  Sliders,
  Headphones,
  Info,
  X,
  Leaf,
  Shell,
  Activity,
  User,
  Check
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
  const [mode, setMode] = useState<'single' | 'mix' | 'random'>('single');
  const [isBinaural, setIsBinaural] = useState(false);
  const [reflection, setReflection] = useState<ReflectionResponse | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]); 
  const [visSettings, setVisSettings] = useState<VisualizerSettings>(MOOD_PRESETS[0].settings);
  const [activePresetId, setActivePresetId] = useState<string | null>(MOOD_PRESETS[0].id);
  const [showSettings, setShowSettings] = useState(false);
  const [infoFreq, setInfoFreq] = useState<Frequency | null>(null);
  const [isShellPulsing, setIsShellPulsing] = useState(false);

  const [stats, setStats] = useState<JapaStats>(() => {
    const saved = localStorage.getItem(APP_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return { totalMantras: 0, totalRounds: 0, currentBead: 0, dailyStreak: 0 };
  });

  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [isAutoChanting, setIsAutoChanting] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  const ttsSource = useRef<AudioBufferSourceNode | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const mantraBuffer = useRef<AudioBuffer | null>(null);
  const isChantingRef = useRef(false);

  const getCtx = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioCtx.current;
  };

  const decodeBase64 = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  };

  const chantIteration = useCallback(() => {
    if (!isChantingRef.current || !mantraBuffer.current) return;
    const ctx = getCtx();
    const source = ctx.createBufferSource();
    source.buffer = mantraBuffer.current;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    source.connect(gainNode).connect(ctx.destination);
    
    source.onended = () => {
      if (!isChantingRef.current) return;
      setStats(prev => {
        let nextBead = prev.currentBead + 1;
        if (nextBead > 108) {
          stopAutoChant();
          return { ...prev, currentBead: 108 }; 
        }
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
      if (audioData) {
        const ctx = getCtx();
        mantraBuffer.current = await decodeAudioData(decodeBase64(audioData), ctx);
      } else return;
    }
    const ctx = getCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    isChantingRef.current = true;
    setIsAutoChanting(true);
    chantIteration();
  };

  const stopAutoChant = () => {
    isChantingRef.current = false;
    setIsAutoChanting(false);
    if (ttsSource.current) {
      try { ttsSource.current.stop(); } catch(e) {}
      ttsSource.current = null;
    }
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
    if ('vibrate' in navigator) navigator.vibrate(20);
  }, []);

  const handleShellSound = () => {
    setIsShellPulsing(true);
    audioEngine.playShellSound();
    setTimeout(() => setIsShellPulsing(false), 5000);
  };

  const handleToggleTone = (freq: Frequency) => {
    if (mode === 'random') setMode('single');
    if (activeIds.includes(freq.id)) {
      audioEngine.stopTone(freq.id);
      setActiveIds(prev => prev.filter(id => id !== freq.id));
    } else {
      if (mode === 'single') {
        audioEngine.stopAll();
        setActiveIds([freq.id]);
        audioEngine.playTone(freq.id, freq.hz, waveform, isBinaural);
      } else {
        setActiveIds(prev => [...prev, freq.id]);
        audioEngine.playTone(freq.id, freq.hz, waveform, isBinaural);
      }
    }
  };

  const handlePresetSelect = (preset: MoodPreset) => {
    setActivePresetId(preset.id);
    setVisSettings(preset.settings);
  };

  const handleVisSliderChange = (key: keyof VisualizerSettings, val: number) => {
    setActivePresetId(null); 
    setVisSettings(prev => ({ ...prev, [key]: val }));
  };

  useEffect(() => {
    const load = async () => setReflection(await getDailyInspiration());
    load();
  }, []);

  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  const activeColor = activeIds.length > 0 
    ? FREQUENCIES.find(f => f.id === activeIds[0])?.color || currentTheme.accent
    : isAutoChanting ? currentTheme.accent : currentTheme.accent;

  // Theme-aware styling tokens
  const isLight = currentTheme.id === 'light';
  const textPrimary = isLight ? 'text-slate-900' : 'text-white';
  const textSecondary = isLight ? 'text-slate-600' : 'text-stone-300';
  const textMuted = isLight ? 'text-slate-400' : 'text-stone-500';
  const cardBg = isLight ? 'bg-slate-900/5' : 'bg-white/10';
  const cardBgHover = isLight ? 'bg-slate-900/10' : 'bg-white/15';
  const cardBorder = isLight ? 'border-slate-900/10' : 'border-white/10';
  const cardBorderHover = isLight ? 'border-slate-900/20' : 'border-white/30';
  const iconColor = isLight ? 'text-slate-600' : 'text-stone-400';

  return (
    <div 
      className={`min-h-screen ${textSecondary} selection:bg-${currentTheme.primary}/30 font-sans pb-32 transition-all duration-1000`}
      style={{ backgroundColor: currentTheme.bg }}
    >
      {/* Optimized Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 opacity-20">
        <div 
          className="absolute top-[-15%] left-[-15%] w-[80%] h-[80%] rounded-full blur-[160px] transition-all duration-1000"
          style={{ backgroundColor: activeColor + (isLight ? '22' : '44') }}
        />
        <div 
          className="absolute bottom-[-15%] right-[-15%] w-[80%] h-[80%] rounded-full blur-[160px] transition-all duration-1000"
          style={{ backgroundColor: currentTheme.accent + (isLight ? '11' : '33') }}
        />
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-3xl shadow-xl transition-all duration-500`} style={{ backgroundColor: currentTheme.accent }}>
              {/* Fix: Simplified redundant comparison that caused TypeScript error in ternary branches */}
              {currentTheme.id === 'earth' ? <Leaf className={isLight ? 'text-white' : 'text-black'} size={28} /> : <Activity className={isLight ? 'text-white' : 'text-black'} size={28} />}
            </div>
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${textPrimary}`}>Aura Tuner</h1>
              <p className={`text-[11px] font-black uppercase tracking-[0.3em] opacity-90`} style={{ color: currentTheme.accent }}>Sacred Sonic Geometry</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 border rounded-2xl transition-all ${showSettings ? 'bg-slate-800 border-slate-700 text-white' : `${cardBg} ${cardBorder} ${textPrimary} hover:${cardBgHover}`}`}
              aria-label="Toggle Settings"
            >
              <Settings size={22} />
            </button>
            <nav className={`flex ${cardBg} p-1.5 rounded-2xl border ${cardBorder}`}>
              <button 
                onClick={() => setActiveTab('frequencies')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'frequencies' ? `bg-white/20 ${textPrimary} shadow-lg` : `${isLight ? 'text-slate-400' : 'text-stone-400'} hover:${textPrimary}`}`}
              >
                TUNING
              </button>
              <button 
                onClick={() => setActiveTab('mantra')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'mantra' ? `bg-white/20 ${textPrimary} shadow-lg` : `${isLight ? 'text-slate-400' : 'text-stone-400'} hover:${textPrimary}`}`}
              >
                MANTRA
              </button>
            </nav>
          </div>
        </header>

        {showSettings && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-top-6 duration-300">
             <div className={`${cardBg} border ${cardBorder} p-8 rounded-[2.5rem] backdrop-blur-xl`}>
                <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3 ${isLight ? 'text-slate-600' : 'text-stone-200'}`}>
                  <Palette size={16} className={iconColor} /> Sacred Themes
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setCurrentTheme(t)}
                      className={`py-3 px-4 rounded-xl text-[11px] font-bold transition-all border ${currentTheme.id === t.id ? 'border-blue-500/50 bg-blue-500/10 text-blue-600' : `${cardBorder} bg-black/5 ${isLight ? 'text-slate-500' : 'text-stone-400'} hover:bg-black/10 hover:${textPrimary}`}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
             </div>
             <div className={`${cardBg} border ${cardBorder} p-8 rounded-[2.5rem] backdrop-blur-xl`}>
                <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3 ${isLight ? 'text-slate-600' : 'text-stone-200'}`}>
                  <Sparkles size={16} className={iconColor} /> Mood Presets
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {MOOD_PRESETS.map(p => {
                    const isActive = activePresetId === p.id;
                    return (
                      <button 
                        key={p.id}
                        onClick={() => handlePresetSelect(p)}
                        className={`py-3 px-3 rounded-xl text-[10px] font-bold transition-all border flex items-center justify-between ${isActive ? 'border-white/50 bg-white/30 text-white' : `${cardBorder} bg-black/5 ${isLight ? 'text-slate-500' : 'text-stone-400'} hover:bg-black/10 hover:${textPrimary}`}`}
                      >
                        {p.name}
                        {isActive && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
             </div>
             <div className={`${cardBg} border ${cardBorder} p-8 rounded-[2.5rem] backdrop-blur-xl`}>
                <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3 ${isLight ? 'text-slate-600' : 'text-stone-200'}`}>
                  <Sliders size={16} className={iconColor} /> Advanced Particles
                </h3>
                <div className="space-y-5">
                  {[
                    { label: 'Size', key: 'particleSize', min: 0.1, max: 4.0 },
                    { label: 'Growth', key: 'growthSpeed', min: 0.1, max: 5.0 },
                    { label: 'Density', key: 'density', min: 0.1, max: 8.0 },
                    { label: 'Opacity', key: 'opacity', min: 0.1, max: 1.0 },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold uppercase w-16 tracking-wider ${isLight ? 'text-slate-500' : 'text-stone-300'}`}>{s.label}</span>
                      <input 
                        type="range" min={s.min} max={s.max} step="0.05"
                        value={visSettings[s.key as keyof VisualizerSettings]}
                        onChange={(e) => handleVisSliderChange(s.key as keyof VisualizerSettings, parseFloat(e.target.value))}
                        className={`flex-1 h-1 rounded-full appearance-none ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}
                        style={{ accentColor: currentTheme.accent }}
                      />
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* Frequency Encyclopedia Modal */}
        {infoFreq && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
            <div className={`border border-white/20 max-w-xl w-full rounded-[3.5rem] p-12 relative overflow-hidden shadow-2xl ${isLight ? 'bg-white' : 'bg-[#0a0a0a]'}`}>
               <div className="absolute top-0 left-0 w-full h-3" style={{ backgroundColor: infoFreq.color }}></div>
               <button onClick={() => setInfoFreq(null)} className={`absolute top-8 right-8 p-3 rounded-full transition-all ${isLight ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  <X size={28} />
               </button>
               <div className="mb-10">
                 <span className="text-5xl font-black block mb-3" style={{ color: infoFreq.color }}>{infoFreq.hz}Hz</span>
                 <h2 className={`text-4xl font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{infoFreq.name}</h2>
                 <p className="text-amber-500 text-xs font-black uppercase tracking-[0.3em] mt-3">{infoFreq.category} Resonance</p>
               </div>
               <div className="space-y-8">
                 <p className={`text-2xl italic leading-relaxed font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}>"{infoFreq.description}"</p>
                 <div className={`h-px w-full ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>
                 <p className={`leading-relaxed text-lg ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>{infoFreq.info}</p>
               </div>
               <button 
                  onClick={() => { handleToggleTone(infoFreq); setInfoFreq(null); }}
                  className="w-full mt-12 py-6 rounded-3xl text-white font-black tracking-widest uppercase text-xs transition-transform active:scale-95 shadow-xl"
                  style={{ backgroundColor: infoFreq.color }}
               >
                 TUNE TO THIS FREQUENCY
               </button>
            </div>
          </div>
        )}

        <section className="grid md:grid-cols-2 gap-10 items-center mb-16">
          <div className="relative group overflow-hidden rounded-[4rem]">
            <Visualizer isPlaying={activeIds.length > 0 || isPulsing || isAutoChanting || mode === 'random' || isShellPulsing} color={activeColor} settings={visSettings} />
            {activeIds.length === 0 && !isPulsing && !isAutoChanting && mode !== 'random' && !isShellPulsing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none bg-black/5">
                <Activity size={56} className={`${isLight ? 'text-slate-200' : 'text-white/10'} mb-5`} />
                <h2 className={`text-2xl font-bold uppercase tracking-[0.4em] ${isLight ? 'text-slate-300' : 'text-white/30'}`}>Aura Silent</h2>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className={`${cardBg} backdrop-blur-2xl border ${cardBorder} p-10 rounded-[3.5rem] shadow-2xl min-h-[180px] flex flex-col justify-center relative overflow-hidden group`}>
               <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
               </div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] mb-5 flex items-center gap-3" style={{ color: currentTheme.accent }}>
                <Sparkles size={16} /> Divine Intention
              </h3>
              <p className={`text-2xl md:text-3xl font-medium italic leading-relaxed transition-all duration-700 ${textPrimary}`}>
                "{reflection?.message || 'Realign your spiritual geometry through sound.'}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className={`${cardBg} border ${cardBorder} p-6 rounded-[2.5rem]`}>
                <label className={`text-[11px] font-black uppercase mb-4 block tracking-[0.2em] ${textMuted}`}>Session Mode</label>
                <div className="flex gap-2.5">
                  <button onClick={() => setMode('single')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${mode === 'single' ? `${isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'}` : `${cardBg} ${textPrimary} hover:${cardBgHover}`}`}>SINGLE</button>
                  <button onClick={() => setMode('mix')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${mode === 'mix' ? `${isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'}` : `${cardBg} ${textPrimary} hover:${cardBgHover}`}`}>MIX</button>
                </div>
              </div>
              <div className={`${cardBg} border ${cardBorder} p-6 rounded-[2.5rem] flex flex-col items-center justify-center`}>
                 <button 
                  onClick={() => { audioEngine.stopAll(); setActiveIds([]); stopAutoChant(); setMode('single'); }}
                  className="flex items-center gap-3 text-xs font-black text-rose-500 hover:text-rose-400 transition-colors uppercase tracking-[0.2em]"
                >
                  <Zap size={18} /> STOP ALL
                </button>
              </div>
            </div>
          </div>
        </section>

        {activeTab === 'frequencies' ? (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
              <h2 className={`text-3xl font-bold flex items-center gap-4 ${textPrimary}`}>
                <Waves className="w-8 h-8" style={{ color: currentTheme.accent }} /> Frequency Library
              </h2>
              <div className={`${cardBg} px-8 py-4 rounded-3xl border ${cardBorder}`}>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Headphones size={22} className={isBinaural ? 'text-blue-500' : iconColor} />
                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${textSecondary}`}>Binaural Mode</span>
                  </div>
                  <button 
                    onClick={() => {
                      const nextVal = !isBinaural;
                      setIsBinaural(nextVal);
                      if (activeIds.length > 0) {
                        const id = activeIds[0];
                        const freq = FREQUENCIES.find(f => f.id === id);
                        if (freq) {
                          audioEngine.stopAll();
                          setTimeout(() => audioEngine.playTone(id, freq.hz, waveform, nextVal), 300);
                        }
                      }
                    }}
                    className={`w-14 h-7 rounded-full relative transition-all ${isBinaural ? 'bg-blue-500' : (isLight ? 'bg-slate-200' : 'bg-stone-700')}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isBinaural ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className={`mb-12 p-8 ${cardBg} rounded-[3rem] border ${cardBorder} shadow-xl`}>
              <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] mb-6 ${textMuted}`}>Sacred Ritual Instruments</h3>
              <div className="flex flex-wrap gap-6">
                <button 
                  onClick={handleShellSound}
                  className={`flex items-center gap-5 px-8 py-5 rounded-[2.5rem] border transition-all duration-300 ${isShellPulsing ? 'bg-amber-500 border-white text-white shadow-xl' : `${cardBg} ${cardBorder} ${textPrimary} hover:${cardBgHover}`}`}
                >
                  <Shell size={32} className={isShellPulsing ? 'animate-pulse' : ''} />
                  <div className="text-left">
                    <p className="text-lg font-bold">Invoke Śankha</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isShellPulsing ? 'text-white/70' : textMuted}`}>Conch Resonance</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FREQUENCIES.map((freq) => {
                const active = activeIds.includes(freq.id);
                return (
                  <div key={freq.id} className="relative group">
                    <button
                      onClick={() => handleToggleTone(freq)}
                      className={`w-full relative p-10 rounded-[3rem] border transition-all duration-500 text-left ${active ? 'bg-white scale-[1.03] shadow-2xl' : `${cardBg} ${cardBorder} hover:${cardBorderHover} hover:${cardBgHover}`}`}
                      style={{ backgroundColor: active ? freq.color : '', borderColor: active ? 'white' : '' }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <span className={`text-4xl font-black ${active ? 'text-white' : ''}`} style={{ color: !active ? freq.color : '' }}>{freq.hz}Hz</span>
                        {active ? <Square size={24} fill="white" className="text-white" /> : <Play size={24} fill="currentColor" style={{ color: freq.color }} />}
                      </div>
                      <h4 className={`text-xl font-bold mb-2 ${active ? 'text-white' : textPrimary}`}>{freq.name}</h4>
                      <p className={`text-sm leading-relaxed pr-8 ${active ? 'text-white/90' : textSecondary}`}>{freq.description}</p>
                    </button>
                    <button 
                       onClick={(e) => { e.stopPropagation(); setInfoFreq(freq); }}
                       className={`absolute top-10 right-10 p-2.5 rounded-full transition-all ${active ? 'bg-white/20 text-white hover:bg-white/30' : `${cardBg} ${iconColor} hover:${textPrimary}`}`}
                    >
                      <Info size={20} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-500 flex flex-col items-center">
            <StatsPanel stats={stats} />
            
            <div className="text-center my-16 relative max-w-3xl w-full">
              <button 
                onClick={handleShellSound}
                className={`absolute -left-8 md:-left-32 top-8 p-9 rounded-full border transition-all duration-500 shadow-2xl ${isShellPulsing ? 'scale-110 border-amber-400 bg-amber-500 text-white' : `${cardBg} ${cardBorder} ${textPrimary} hover:${cardBgHover}`}`}
              >
                <Shell size={42} className={isShellPulsing ? 'animate-pulse' : ''} />
              </button>

              <button 
                onClick={startAutoChant}
                disabled={isTTSLoading}
                className={`absolute -right-8 md:-right-28 top-8 p-6 rounded-3xl border transition-all duration-500 shadow-2xl ${isAutoChanting ? 'bg-white text-black' : `${cardBg} ${cardBorder} ${textPrimary} hover:${cardBgHover}`}`}
                style={{ backgroundColor: isAutoChanting ? currentTheme.accent : '', color: isAutoChanting ? (isLight ? 'white' : 'black') : '' }}
              >
                {isTTSLoading ? <Loader2 className="animate-spin" size={32} /> : isAutoChanting ? <CircleStop size={32} /> : <Speaker size={32} />}
              </button>
              
              <h2 className={`text-4xl md:text-6xl font-bold leading-[1.4] tracking-tight mb-8 px-14 ${textPrimary} ${!isLight ? '[text-shadow:0_4px_12px_rgba(0,0,0,0.8)]' : ''}`}>
                Hare Krishna Hare Krishna<br />
                Krishna Krishna Hare Hare<br />
                Hare Rama Hare Rama<br />
                Rama Rama Hare Hare
              </h2>
            </div>

            <div className="w-full mb-20" onClick={handleManualChant}>
              <BeadMala currentBead={stats.currentBead} isLight={isLight} />
            </div>

            <div className="flex flex-col gap-8 w-full max-w-md items-center">
              <button
                onClick={handleManualChant}
                className={`w-full py-10 rounded-[3.5rem] text-3xl font-black shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-5 ${isPulsing ? 'scale-[0.97]' : ''}`}
                style={{ backgroundColor: currentTheme.accent, color: isLight && currentTheme.id === 'light' ? 'white' : 'black' }}
              >
                <span>CHANTED</span>
                <Heart size={36} fill="currentColor" className={isPulsing ? 'animate-ping' : ''} />
              </button>
              
              <button onClick={() => setStats({...stats, currentBead: 0})} className={`text-xs font-black flex items-center gap-3 transition-colors uppercase tracking-[0.3em] ${textMuted} hover:${textSecondary}`}>
                <RotateCcw size={16} /> RESET ROUND BEADS
              </button>
            </div>
          </section>
        )}

        <div className="mt-24 flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-700">
          <div className={`flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] ${textSecondary}`}>
            <User size={14} style={{ color: currentTheme.accent }} /> Author: BalajiDuddukuri
          </div>
          <div className={`h-px w-12 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>
          <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${textMuted}`}>Masterful Digital Sonic Meditation</p>
        </div>

        {/* Global Control Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-black via-black/90 to-transparent z-50 pointer-events-none">
          <div className={`max-w-4xl mx-auto backdrop-blur-3xl border p-6 md:p-8 rounded-[3.5rem] shadow-2xl flex items-center gap-10 transition-all duration-1000 pointer-events-auto ${isLight ? 'bg-white/95 border-slate-200' : 'bg-[#1a1a1a]/95 border-white/20'}`}>
            <div className="flex-1">
              <div className="flex justify-between mb-4 px-3">
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 ${textMuted}`}>Amplitude</span>
                <span className={`text-[11px] font-black tracking-widest ${textPrimary}`}>{Math.round(volume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${isLight ? 'bg-slate-200' : 'bg-stone-800'}`}
                style={{ accentColor: currentTheme.accent }}
              />
            </div>
            <div className={`hidden md:flex p-5 rounded-[2rem] items-center gap-6 border ${cardBg} ${cardBorder}`}>
              <label className={`text-[11px] font-black uppercase tracking-[0.2em] ${textMuted}`}>Waves</label>
              <div className="flex gap-2.5">
                {['sine', 'triangle'].map(w => (
                  <button 
                    key={w} onClick={() => setWaveform(w as Waveform)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all ${waveform === w ? `${isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'}` : `${cardBg} ${textSecondary} hover:${textPrimary}`}`}
                  >
                    {w.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
