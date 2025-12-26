
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
  Shuffle
} from 'lucide-react';
import { Frequency, Waveform, JapaStats, ReflectionResponse } from './types';
import { audioEngine } from './services/audioEngine';
import Visualizer from './components/Visualizer';
import BeadMala from './components/BeadMala';
import StatsPanel from './components/StatsPanel';
import { getDailyInspiration, getMantraAudio } from './services/geminiService';

const APP_STORAGE_KEY = 'aura_tuner_japa_stats';

const FREQUENCIES: Frequency[] = [
  { id: '174', hz: 174, name: 'Pain Relief', description: 'Natural anesthetic. Grounds energy.', category: 'solfeggio', color: '#4f46e5' },
  { id: '285', hz: 285, name: 'Tissue Healing', description: 'Restructures damaged organs.', category: 'solfeggio', color: '#0ea5e9' },
  { id: '396', hz: 396, name: 'Root / Fear', description: 'Liberates guilt and fear.', category: 'solfeggio', color: '#ef4444' },
  { id: '417', hz: 417, name: 'Sacral / Change', description: 'Facilitates change and renewal.', category: 'solfeggio', color: '#f97316' },
  { id: '528', hz: 528, name: 'Heart / Transformation', description: 'The Love Frequency. DNA repair.', category: 'solfeggio', color: '#10b981' },
  { id: '639', hz: 639, name: 'Connection', description: 'Harmonizes relationships.', category: 'solfeggio', color: '#22c55e' },
  { id: '741', hz: 741, name: 'Throat / Expression', description: 'Stabilizes a spiritual life.', category: 'solfeggio', color: '#06b6d4' },
  { id: '852', hz: 852, name: 'Third Eye', description: 'Spiritual awakening.', category: 'solfeggio', color: '#6366f1' },
  { id: '963', hz: 963, name: 'Crown / Oneness', description: 'Connection to the Divine.', category: 'solfeggio', color: '#a855f7' },
  { id: '432', hz: 432, name: 'Universal Harmony', description: 'Universal consistency.', category: 'universal', color: '#fbbf24' },
];

const App: React.FC = () => {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<'frequencies' | 'mantra'>('frequencies');
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [volume, setVolume] = useState(0.5);
  const [waveform, setWaveform] = useState<Waveform>('sine');
  const [mode, setMode] = useState<'single' | 'mix' | 'random'>('single');
  const [reflection, setReflection] = useState<ReflectionResponse | null>(null);
  
  // --- Japa State ---
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

  // --- Refs for Audio ---
  const ttsSource = useRef<AudioBufferSourceNode | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const mantraBuffer = useRef<AudioBuffer | null>(null);
  const isChantingRef = useRef(false);
  const randomIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Audio Utils ---
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

  // --- Chanting Logic ---
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
        let nextRounds = prev.totalRounds;
        
        if (nextBead > 108) {
          stopAutoChant();
          return { ...prev, currentBead: 108 }; 
        }

        setIsPulsing(true);
        setTimeout(() => setIsPulsing(false), 200);
        if ('vibrate' in navigator) navigator.vibrate(20);

        chantIteration();

        const updated = {
          ...prev,
          totalMantras: prev.totalMantras + 1,
          currentBead: nextBead,
          totalRounds: nextRounds
        };
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    };

    ttsSource.current = source;
    source.start();
  }, [volume]);

  const startAutoChant = async () => {
    if (isAutoChanting) {
      stopAutoChant();
      return;
    }

    if (!mantraBuffer.current) {
      setIsTTSLoading(true);
      const audioData = await getMantraAudio();
      setIsTTSLoading(false);
      
      if (audioData) {
        const ctx = getCtx();
        const buffer = await decodeAudioData(decodeBase64(audioData), ctx);
        mantraBuffer.current = buffer;
      } else {
        return; 
      }
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
      if (nextBead > 108) {
        nextBead = 1;
        nextRounds += 1;
      }
      const updated = {
        ...prev,
        totalMantras: prev.totalMantras + 1,
        totalRounds: nextRounds,
        currentBead: nextBead,
      };
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if ('vibrate' in navigator) navigator.vibrate(20);
  }, []);

  // --- Random Frequency Mode Logic ---
  const pickRandomFrequency = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * FREQUENCIES.length);
    const freq = FREQUENCIES[randomIndex];
    audioEngine.stopAll();
    audioEngine.playTone(freq.id, freq.hz, waveform);
    setActiveIds([freq.id]);
  }, [waveform]);

  useEffect(() => {
    if (mode === 'random') {
      pickRandomFrequency();
      randomIntervalRef.current = setInterval(pickRandomFrequency, 12000); // Change every 12 seconds
    } else {
      if (randomIntervalRef.current) {
        clearInterval(randomIntervalRef.current);
        randomIntervalRef.current = null;
      }
    }
    return () => {
      if (randomIntervalRef.current) clearInterval(randomIntervalRef.current);
    };
  }, [mode, pickRandomFrequency]);

  const handleToggleTone = (freq: Frequency) => {
    if (mode === 'random') setMode('single'); // Exit random mode if manual selection made

    if (activeIds.includes(freq.id)) {
      audioEngine.stopTone(freq.id);
      setActiveIds(prev => prev.filter(id => id !== freq.id));
    } else {
      if (mode === 'single' || mode === 'random') {
        audioEngine.stopAll();
        setActiveIds([freq.id]);
        audioEngine.playTone(freq.id, freq.hz, waveform);
      } else {
        setActiveIds(prev => [...prev, freq.id]);
        audioEngine.playTone(freq.id, freq.hz, waveform);
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
    ? FREQUENCIES.find(f => f.id === activeIds[0])?.color || '#fbbf24' 
    : isAutoChanting ? '#fbbf24' : '#1e1b4b';

  return (
    <div className="min-h-screen bg-[#050510] text-amber-50 selection:bg-amber-500/30 font-sans pb-32">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-2xl shadow-lg shadow-amber-500/20">
              <Activity className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-100">Aura Tuner</h1>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest opacity-80">Divine Resonance</p>
            </div>
          </div>
          
          <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setActiveTab('frequencies')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'frequencies' ? 'bg-amber-500 text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              TUNING
            </button>
            <button 
              onClick={() => setActiveTab('mantra')}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'mantra' ? 'bg-amber-500 text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              MANTRA
            </button>
          </nav>
        </header>

        <section className="grid md:grid-cols-2 gap-8 items-center mb-12">
          <div className="relative group">
            <Visualizer isPlaying={activeIds.length > 0 || isPulsing || isAutoChanting || mode === 'random'} color={activeColor} />
            {activeIds.length === 0 && !isPulsing && !isAutoChanting && mode !== 'random' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                <Sparkles size={48} className="text-amber-500/20 mb-4" />
                <h2 className="text-xl font-medium text-amber-50/40">Select Sound or Start Chanting</h2>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl min-h-[140px] flex flex-col justify-center">
              <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles size={14} /> Divine Intention
              </h3>
              <p className="text-lg md:text-xl font-medium italic text-amber-50/90 leading-relaxed">
                "{reflection?.message || 'Realign your spiritual geometry through sound.'}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
                <label className="text-[10px] font-bold uppercase text-amber-500 mb-2 block tracking-widest">Master Mode</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setMode('single')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${mode === 'single' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    SINGLE
                  </button>
                  <button 
                    onClick={() => setMode('mix')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${mode === 'mix' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    MIX
                  </button>
                  <button 
                    onClick={() => setMode('random')}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${mode === 'random' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    <Shuffle size={10} /> RANDOM
                  </button>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-3xl flex items-center justify-center">
                 <button 
                  onClick={() => { audioEngine.stopAll(); setActiveIds([]); stopAutoChant(); setMode('single'); }}
                  className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest"
                >
                  <Zap size={14} /> Clear All
                </button>
              </div>
            </div>
          </div>
        </section>

        {activeTab === 'frequencies' ? (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Waves className="text-amber-500" /> Solfeggio Library
              </h2>
              <div className="h-[1px] flex-1 bg-white/5 mx-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FREQUENCIES.map((freq) => {
                const active = activeIds.includes(freq.id);
                return (
                  <button
                    key={freq.id}
                    onClick={() => handleToggleTone(freq)}
                    className={`relative group p-6 rounded-[2rem] border transition-all duration-300 text-left ${active ? 'bg-amber-500 border-amber-400 scale-[1.02] shadow-xl shadow-amber-500/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-2xl font-black ${active ? 'text-white' : 'text-amber-500'}`}>{freq.hz}Hz</span>
                      {active ? <Square size={16} fill="white" /> : <Play size={16} fill="currentColor" className="text-amber-500" />}
                    </div>
                    <h4 className="text-sm font-bold mb-1">{freq.name}</h4>
                    <p className={`text-[10px] opacity-60 leading-tight`}>{freq.description}</p>
                    {active && mode === 'random' && (
                      <div className="absolute bottom-2 right-4 flex gap-1">
                        <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    )}
                  </button>
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
                className={`absolute -right-4 md:-right-16 top-0 p-4 rounded-2xl border transition-all ${isAutoChanting ? 'bg-amber-500 text-white border-amber-400' : 'bg-white/5 text-amber-500 border-white/10 hover:bg-white/10'} disabled:opacity-50 shadow-xl`}
                title={isAutoChanting ? "Stop Auto-Chant" : "Start Auto-Chant Loop"}
              >
                {isTTSLoading ? <Loader2 className="animate-spin" size={24} /> : isAutoChanting ? <CircleStop size={24} /> : <Speaker size={24} />}
              </button>
              <h2 className="text-2xl md:text-4xl font-bold text-amber-100 leading-tight serif-font mb-4 px-8 tracking-wide drop-shadow-md">
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
                className={`w-full py-6 rounded-3xl text-xl font-bold text-white shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${isPulsing ? 'bg-amber-600' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'}`}
              >
                <span>MANUAL CHANT</span>
                <Heart size={24} className={isPulsing ? 'animate-ping' : ''} />
              </button>
              
              <button 
                onClick={() => setStats({...stats, currentBead: 0})}
                className="text-xs font-bold text-white/20 hover:text-white/40 flex items-center gap-2 transition-colors"
              >
                <RotateCcw size={12} /> Reset Round Progress
              </button>
            </div>
          </section>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-[#050510] via-[#050510]/95 to-transparent z-50">
          <div className="max-w-3xl mx-auto bg-white/10 border border-white/20 p-4 md:p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-6">
            <div className="flex-1">
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-2 px-1">
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Aura Intensity</span>
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{Math.round(volume * 100)}%</span>
              </div>
            </div>
            <div className="hidden md:flex bg-white/5 p-4 rounded-3xl items-center gap-3">
              <label className="text-[10px] font-bold uppercase text-amber-500 tracking-widest">Wave</label>
              <div className="flex gap-1">
                {(['sine', 'triangle'] as Waveform[]).map(w => (
                  <button 
                    key={w}
                    onClick={() => setWaveform(w)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${waveform === w ? 'bg-amber-500 text-white' : 'bg-white/5 text-white/40'}`}
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
