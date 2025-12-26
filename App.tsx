
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Waves, 
  Settings, 
  Volume2, 
  Play,
  Square,
  Sparkles,
  Zap,
  Activity,
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
  Leaf
} from 'lucide-react';
import { Frequency, Waveform, JapaStats, ReflectionResponse, Theme, ThemeId, VisualizerSettings, MoodPreset } from './types';
import { audioEngine } from './services/audioEngine';
import Visualizer from './components/Visualizer';
import BeadMala from './components/BeadMala';
import StatsPanel from './components/StatsPanel';
import { getDailyInspiration, getMantraAudio } from './services/geminiService';

const APP_STORAGE_KEY = 'aura_tuner_japa_stats';

const THEMES: Theme[] = [
  { id: 'classic', name: 'Classic', primary: 'amber-500', secondary: 'amber-100', bg: '#050510', accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
  { id: 'neon', name: 'Neon', primary: 'cyan-400', secondary: 'fuchsia-400', bg: '#020617', accent: '#22d3ee', glow: 'rgba(34, 211, 238, 0.5)' },
  { id: 'earth', name: 'Tulsi Earth', primary: 'emerald-600', secondary: 'stone-200', bg: '#0c1109', accent: '#84cc16', glow: 'rgba(132, 204, 22, 0.3)' },
  { id: 'zen', name: 'Zen', primary: 'emerald-400', secondary: 'stone-200', bg: '#06160e', accent: '#34d399', glow: 'rgba(52, 211, 153, 0.3)' },
  { id: 'celestial', name: 'Celestial', primary: 'indigo-400', secondary: 'violet-200', bg: '#020015', accent: '#818cf8', glow: 'rgba(129, 140, 248, 0.4)' },
];

const MOOD_PRESETS: MoodPreset[] = [
  { id: 'zen', name: 'Deep Zen', settings: { particleSize: 0.8, growthSpeed: 0.5, density: 1.5, opacity: 0.6 } },
  { id: 'cosmic', name: 'Cosmic Pulse', settings: { particleSize: 1.8, growthSpeed: 1.5, density: 0.8, opacity: 0.9 } },
  { id: 'gentle', name: 'Gentle Flow', settings: { particleSize: 0.5, growthSpeed: 0.8, density: 2.5, opacity: 0.4 } },
];

const FREQUENCIES: Frequency[] = [
  { id: '174', hz: 174, name: 'Pain Relief', description: 'Natural anesthetic.', info: 'The 174Hz frequency is the lowest of the Solfeggio scale. It acts as a natural anesthetic, helping to reduce physical pain and providing a sense of security and love to the body\'s organs.', category: 'solfeggio', color: '#4f46e5' },
  { id: '285', hz: 285, name: 'Tissue Healing', description: 'Restructures energy.', info: 'This frequency is associated with the healing of tissue and organs. It sends a message to restructure damaged organs, helping the body to return to its original, healthy state.', category: 'solfeggio', color: '#0ea5e9' },
  { id: '396', hz: 396, name: 'Root / Fear', description: 'Liberates guilt and fear.', info: 'Associated with the Root Chakra, 396Hz is used for balancing the energy center. It helps in releasing feelings of guilt and fear, turning them into joy.', category: 'solfeggio', color: '#ef4444' },
  { id: '417', hz: 417, name: 'Sacral / Change', description: 'Facilitates renewal.', info: 'Connected to the Sacral Chakra, 417Hz clears traumatic experiences and destructive influences from the past. It facilitates positive change and inner renewal.', category: 'solfeggio', color: '#f97316' },
  { id: '528', hz: 528, name: 'Heart / Transformation', description: 'The Love Frequency.', info: 'The most famous Solfeggio tone, known as the "Miracle" frequency. It is believed to repair DNA, bring transformation, and open the heart to unconditional love.', category: 'solfeggio', color: '#10b981' },
  { id: '639', hz: 639, name: 'Connection', description: 'Harmonizes relationships.', info: 'Used for balancing the Heart Chakra and improving interpersonal relationships. It enhances communication, understanding, tolerance, and love.', category: 'solfeggio', color: '#22c55e' },
  { id: '741', hz: 741, name: 'Throat / Expression', description: 'Cleansing energy.', info: 'Associated with self-expression and spiritual consciousness. It leads to a healthier, simpler life by cleansing the cells of toxins and electromagnetic radiations.', category: 'solfeggio', color: '#06b6d4' },
  { id: '852', hz: 852, name: 'Third Eye', description: 'Spiritual awakening.', info: 'Linked to the Third Eye Chakra, this tone awakens intuition and helps to see through illusions. it is used to return the mind to a spiritual order.', category: 'solfeggio', color: '#6366f1' },
  { id: '963', hz: 963, name: 'Crown / Oneness', description: 'Divine connection.', info: 'The frequency of Pure Consciousness. It awakens any system to its original, perfect state, allowing direct experience and connection with the Divine.', category: 'solfeggio', color: '#a855f7' },
  { id: '432', hz: 432, name: 'Universal Harmony', description: 'Mathematical resonance.', info: 'Known as "Verdi\'s A", 432Hz is mathematically consistent with the universe. It is said to have a healing effect on our bodies and helps with emotional balance.', category: 'universal', color: '#fbbf24' },
];

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
  const [showSettings, setShowSettings] = useState(false);
  const [infoFreq, setInfoFreq] = useState<Frequency | null>(null);

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
  const randomIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const pickRandomFrequency = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * FREQUENCIES.length);
    const freq = FREQUENCIES[randomIndex];
    audioEngine.stopAll();
    audioEngine.playTone(freq.id, freq.hz, waveform, isBinaural);
    setActiveIds([freq.id]);
  }, [waveform, isBinaural]);

  useEffect(() => {
    if (mode === 'random') {
      pickRandomFrequency();
      randomIntervalRef.current = setInterval(pickRandomFrequency, 12000);
    } else if (randomIntervalRef.current) {
      clearInterval(randomIntervalRef.current);
      randomIntervalRef.current = null;
    }
    return () => { if (randomIntervalRef.current) clearInterval(randomIntervalRef.current); };
  }, [mode, pickRandomFrequency]);

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

  return (
    <div 
      className={`min-h-screen text-${currentTheme.secondary} selection:bg-${currentTheme.primary}/30 font-sans pb-32 transition-colors duration-1000`}
      style={{ backgroundColor: currentTheme.bg }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 opacity-40">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-all duration-1000"
          style={{ backgroundColor: activeColor + '33' }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-all duration-1000"
          style={{ backgroundColor: currentTheme.accent + '22' }}
        />
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl shadow-lg transition-all duration-500`} style={{ backgroundColor: currentTheme.accent }}>
              {currentTheme.id === 'earth' ? <Leaf className="text-white w-6 h-6" /> : <Activity className="text-white w-6 h-6" />}
            </div>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-${currentTheme.primary} to-${currentTheme.secondary}`}>Aura Tuner</h1>
              <p className={`text-[10px] font-bold uppercase tracking-widest opacity-80`} style={{ color: currentTheme.accent }}>Divine Resonance</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-white/60 hover:text-white"
            >
              <Settings size={20} />
            </button>
            <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              <button 
                onClick={() => setActiveTab('frequencies')}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'frequencies' ? `bg-${currentTheme.primary} text-white` : 'text-white/40 hover:text-white/60'}`}
                style={{ backgroundColor: activeTab === 'frequencies' ? currentTheme.accent : '' }}
              >
                TUNING
              </button>
              <button 
                onClick={() => setActiveTab('mantra')}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'mantra' ? `bg-${currentTheme.primary} text-white` : 'text-white/40 hover:text-white/60'}`}
                style={{ backgroundColor: activeTab === 'mantra' ? currentTheme.accent : '' }}
              >
                MANTRA
              </button>
            </nav>
          </div>
        </header>

        {showSettings && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-top-4">
             <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Palette size={14} /> Themes
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setCurrentTheme(t)}
                      className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${currentTheme.id === t.id ? 'border-white/40 bg-white/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
             </div>
             <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sparkles size={14} /> Mood Presets
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {MOOD_PRESETS.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => setVisSettings(p.settings)}
                      className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border bg-white/5 hover:bg-white/10 border-white/5`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
             </div>
             <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-md">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sliders size={14} /> Visualizer Tuning
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Size', key: 'particleSize' },
                    { label: 'Growth', key: 'growthSpeed' },
                    { label: 'Density', key: 'density' },
                    { label: 'Opacity', key: 'opacity' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-4">
                      <span className="text-[10px] font-bold uppercase w-16 opacity-60 tracking-wider">{s.label}</span>
                      <input 
                        type="range" min="0.1" max="3" step="0.1"
                        value={visSettings[s.key as keyof VisualizerSettings]}
                        onChange={(e) => setVisSettings({...visSettings, [s.key]: parseFloat(e.target.value)})}
                        className="flex-1 accent-white h-1 bg-white/10 rounded-full appearance-none"
                      />
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {infoFreq && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-white/10 max-w-lg w-full rounded-[3rem] p-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: infoFreq.color }}></div>
               <button onClick={() => setInfoFreq(null)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all">
                  <X size={20} />
               </button>
               <div className="mb-6">
                 <span className="text-3xl font-black block mb-2" style={{ color: infoFreq.color }}>{infoFreq.hz}Hz</span>
                 <h2 className="text-2xl font-bold text-white">{infoFreq.name}</h2>
                 <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mt-1">{infoFreq.category} Resonance</p>
               </div>
               <div className="space-y-4">
                 <p className="text-white/80 leading-relaxed text-lg italic">"{infoFreq.description}"</p>
                 <div className="h-px bg-white/5 w-full"></div>
                 <p className="text-white/60 leading-relaxed">{infoFreq.info}</p>
               </div>
               <button 
                  onClick={() => { handleToggleTone(infoFreq); setInfoFreq(null); }}
                  className="w-full mt-8 py-4 rounded-2xl text-white font-bold tracking-widest uppercase text-xs"
                  style={{ backgroundColor: infoFreq.color }}
               >
                 TUNE TO THIS FREQUENCY
               </button>
            </div>
          </div>
        )}

        <section className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div className="relative group">
            <Visualizer isPlaying={activeIds.length > 0 || isPulsing || isAutoChanting || mode === 'random'} color={activeColor} settings={visSettings} />
            {activeIds.length === 0 && !isPulsing && !isAutoChanting && mode !== 'random' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                <Sparkles size={48} className="text-white/10 mb-4" />
                <h2 className="text-xl font-medium text-white/20">Divine Sound Unlocks Here</h2>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl min-h-[140px] flex flex-col justify-center">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: currentTheme.accent }}>
                <Sparkles size={14} /> Divine Intention
              </h3>
              <p className="text-lg md:text-xl font-medium italic text-white/90 leading-relaxed transition-all duration-700">
                "{reflection?.message || 'Realign your spiritual geometry through sound.'}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
                <label className="text-[10px] font-bold uppercase mb-2 block tracking-widest opacity-60">Sequence Mode</label>
                <div className="flex gap-2">
                  <button onClick={() => setMode('single')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${mode === 'single' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>SINGLE</button>
                  <button onClick={() => setMode('mix')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${mode === 'mix' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>MIX</button>
                  <button onClick={() => setMode('random')} className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${mode === 'random' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}><Shuffle size={10} /> RAND</button>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-3xl flex items-center justify-center">
                 <button 
                  onClick={() => { audioEngine.stopAll(); setActiveIds([]); stopAutoChant(); setMode('single'); }}
                  className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest"
                >
                  <Zap size={14} /> Kill Sync
                </button>
              </div>
            </div>
          </div>
        </section>

        {activeTab === 'frequencies' ? (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Waves style={{ color: currentTheme.accent }} /> Frequency Library
              </h2>
              <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                  <Headphones size={18} className={isBinaural ? 'text-amber-500' : 'text-white/20'} />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Binaural Entrainment</span>
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
                  className={`w-12 h-6 rounded-full relative transition-all ${isBinaural ? 'bg-amber-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isBinaural ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FREQUENCIES.map((freq) => {
                const active = activeIds.includes(freq.id);
                return (
                  <div key={freq.id} className="relative group">
                    <button
                      onClick={() => handleToggleTone(freq)}
                      className={`w-full relative p-6 rounded-[2rem] border transition-all duration-500 text-left ${active ? 'bg-white border-white scale-[1.02] shadow-xl' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                      style={{ backgroundColor: active ? currentTheme.accent : '', borderColor: active ? 'white' : '' }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-2xl font-black ${active ? 'text-white' : ''}`} style={{ color: !active ? currentTheme.accent : '' }}>{freq.hz}Hz</span>
                        {active ? <Square size={16} fill="white" /> : <Play size={16} fill="currentColor" style={{ color: currentTheme.accent }} />}
                      </div>
                      <h4 className={`text-sm font-bold mb-1 ${active ? 'text-white' : 'text-white/80'}`}>{freq.name}</h4>
                      <p className={`text-[10px] leading-tight pr-8 ${active ? 'text-white/70' : 'text-white/40'}`}>{freq.description}</p>
                    </button>
                    <button 
                       onClick={() => setInfoFreq(freq)}
                       className={`absolute bottom-6 right-6 p-2 rounded-full transition-all ${active ? 'bg-white/20 text-white' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'}`}
                    >
                      <Info size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
            <StatsPanel stats={stats} />
            
            <div className="text-center my-8 relative max-w-lg w-full">
              <button 
                onClick={startAutoChant}
                disabled={isTTSLoading}
                className={`absolute -right-4 md:-right-16 top-0 p-4 rounded-2xl border transition-all ${isAutoChanting ? 'bg-white text-black border-white' : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'} shadow-xl`}
                style={{ backgroundColor: isAutoChanting ? currentTheme.accent : '', color: isAutoChanting ? 'white' : '' }}
              >
                {isTTSLoading ? <Loader2 className="animate-spin" size={24} /> : isAutoChanting ? <CircleStop size={24} /> : <Speaker size={24} />}
              </button>
              <h2 className="text-2xl md:text-4xl font-bold text-white/90 leading-tight serif-font mb-4 px-8 tracking-wide">
                Hare Krishna Hare Krishna<br />
                Krishna Krishna Hare Hare<br />
                Hare Rama Hare Rama<br />
                Rama Rama Hare Hare
              </h2>
            </div>

            <div className="w-full mb-12" onClick={handleManualChant}>
              <BeadMala currentBead={stats.currentBead} />
            </div>

            <div className="flex flex-col gap-4 w-full max-w-md items-center">
              <button
                onClick={handleManualChant}
                className={`w-full py-6 rounded-3xl text-xl font-bold text-white shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${isPulsing ? 'scale-[0.98]' : ''}`}
                style={{ backgroundColor: currentTheme.accent }}
              >
                <span>MANUAL CHANT</span>
                <Heart size={24} className={isPulsing ? 'animate-ping' : ''} />
              </button>
              
              <button onClick={() => setStats({...stats, currentBead: 0})} className="text-xs font-bold text-white/20 hover:text-white/40 flex items-center gap-2 transition-colors">
                <RotateCcw size={12} /> Reset Round
              </button>
            </div>
          </section>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-black via-black/90 to-transparent z-50 pointer-events-none">
          <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-md border border-white/10 p-4 md:p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-6 transition-all duration-1000 pointer-events-auto">
            <div className="flex-1">
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: currentTheme.accent }}
              />
              <div className="flex justify-between mt-2 px-1">
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Master Amplitude</span>
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{Math.round(volume * 100)}%</span>
              </div>
            </div>
            <div className="hidden md:flex bg-white/5 p-4 rounded-3xl items-center gap-3">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Waveform</label>
              <div className="flex gap-1">
                {['sine', 'triangle'].map(w => (
                  <button 
                    key={w} onClick={() => setWaveform(w as Waveform)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${waveform === w ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}
                  >
                    {w[0].toUpperCase()}
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
