
import React from 'react';
import { JapaStats } from '../types';
import { Heart, RotateCcw, Flame, Hash } from 'lucide-react';

interface StatsPanelProps {
  stats: JapaStats;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mb-12">
      {[
        { label: 'Total', value: stats.totalMantras.toLocaleString(), icon: Hash },
        { label: 'Rounds', value: stats.totalRounds, icon: RotateCcw },
        { label: 'Streak', value: `${stats.dailyStreak} Days`, icon: Flame },
        { label: 'Bead', value: `${stats.currentBead}/108`, icon: Heart },
      ].map((stat, i) => (
        <div key={i} className="bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 flex flex-col items-center shadow-lg transition-transform hover:scale-[1.02]">
          <div className="bg-white/20 p-3 rounded-2xl mb-4 text-inherit">
            <stat.icon size={20} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">{stat.label}</span>
          <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
        </div>
      ))}
    </div>
  );
};

export default StatsPanel;
