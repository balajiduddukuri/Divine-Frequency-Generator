
import React from 'react';
import { AmbientSound } from '../types';
import { Music, X, Volume2 } from 'lucide-react';

const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: 'rain', name: 'Gentle Rain', icon: '🌧️', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder URLs for functionality
  { id: 'forest', name: 'Morning Forest', icon: '🌲', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'om', name: 'Divine Om', icon: '🧘', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'temple', name: 'Temple Bells', icon: '🔔', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
];

interface AmbientSelectorProps {
  currentSoundId: string | null;
  onSelect: (sound: AmbientSound | null) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
}

const AmbientSelector: React.FC<AmbientSelectorProps> = ({ 
  currentSoundId, 
  onSelect, 
  volume, 
  onVolumeChange,
  onClose 
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-2xl border border-amber-100 w-full max-w-xs animate-in fade-in zoom-in duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-amber-900 flex items-center gap-2">
          <Music size={18} /> Ambient Atmosphere
        </h3>
        <button onClick={onClose} className="text-amber-300 hover:text-amber-500 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-2 mb-6">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
            currentSoundId === null 
            ? 'bg-amber-100 text-amber-900 border border-amber-200' 
            : 'bg-amber-50/50 text-amber-700 hover:bg-amber-50'
          }`}
        >
          <span className="text-lg">🔇</span>
          <span className="font-medium text-sm">Silence</span>
        </button>

        {AMBIENT_SOUNDS.map((sound) => (
          <button
            key={sound.id}
            onClick={() => onSelect(sound)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
              currentSoundId === sound.id 
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 scale-[1.02]' 
              : 'bg-amber-50/50 text-amber-700 hover:bg-amber-50'
            }`}
          >
            <span className="text-lg">{sound.icon}</span>
            <span className="font-medium text-sm">{sound.name}</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-amber-700 uppercase tracking-tighter">
          <span>Ambient Volume</span>
          <span>{Math.round(volume * 100)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <Volume2 size={16} className="text-amber-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="flex-1 accent-amber-500 h-1.5 bg-amber-100 rounded-full appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default AmbientSelector;
