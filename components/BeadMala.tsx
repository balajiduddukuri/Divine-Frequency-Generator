
import React from 'react';

interface BeadMalaProps {
  currentBead: number;
  isLight?: boolean;
}

const BeadMala: React.FC<BeadMalaProps> = ({ currentBead, isLight }) => {
  const beads = Array.from({ length: 108 }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-3xl mx-auto p-6 flex flex-wrap justify-center gap-2">
      {beads.map((bead) => {
        const isActive = bead === currentBead;
        const isPast = bead < currentBead;
        
        return (
          <div
            key={bead}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ease-out border ${
              isActive 
                ? (isLight ? 'bg-slate-900 scale-[1.6] shadow-xl border-slate-900' : 'bg-white scale-[1.6] shadow-[0_0_25px_rgba(255,255,255,0.9)] z-10 border-white')
                : isPast 
                  ? 'bg-amber-400/80 border-amber-400/20' 
                  : (isLight ? 'bg-slate-900/10 border-slate-900/5' : 'bg-white/10 border-white/5')
            }`}
            title={`Bead ${bead}`}
          />
        );
      })}
    </div>
  );
};

export default BeadMala;
