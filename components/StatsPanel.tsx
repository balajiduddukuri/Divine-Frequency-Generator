
import React from 'react';
import { JapaStats } from '../types';
import { Heart, RotateCcw, Flame, Hash } from 'lucide-react';

interface StatsPanelProps {
  stats: JapaStats;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
      {[
        { label: 'Total', value: stats.totalMantras.toLocaleString(), icon: Hash },
        { label: 'Rounds', value: stats.totalRounds, icon: RotateCcw },
        { label: 'Streak', value: `${stats.dailyStreak} Days`, icon: Flame },
        { label: 'Bead', value: `${stats.currentBead}/108`, icon: Heart },
      ].map((stat, i) => (
        <div key={i} className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10 flex flex-col items-center">
          <div className="bg-amber-500/10 p-2 rounded-xl mb-2 text-amber-500">
            <stat.icon size={16} />
          </div>
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{stat.label}</span>
          <span className="text-lg font-bold text-amber-50">{stat.value}</span>
        </div>
      ))}
    </div>
  );
};

export default StatsPanel;
