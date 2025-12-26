
import React from 'react';

interface BeadMalaProps {
  currentBead: number;
}

const BeadMala: React.FC<BeadMalaProps> = ({ currentBead }) => {
  const beads = Array.from({ length: 108 }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-wrap justify-center gap-1.5">
      {beads.map((bead) => {
        const isActive = bead === currentBead;
        const isPast = bead < currentBead;
        
        return (
          <div
            key={bead}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              isActive 
                ? 'bg-amber-400 scale-150 shadow-[0_0_15px_rgba(251,191,36,0.8)] z-10' 
                : isPast 
                  ? 'bg-amber-500/20' 
                  : 'bg-white/5 border border-white/10'
            }`}
            title={`Bead ${bead}`}
          />
        );
      })}
    </div>
  );
};

export default BeadMala;
