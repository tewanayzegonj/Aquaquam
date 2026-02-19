import React from 'react';
import { ServiceSection } from '../types';

interface Props {
  activeService: ServiceSection;
  onSelectService: (s: ServiceSection) => void;
  totalTracks: number;
}

const QuickAccessCards: React.FC<Props> = ({ activeService, onSelectService, totalTracks }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Active tracks"
        value={totalTracks}
        subtitle="Increased from last week"
        trend="+12"
        active={true}
        onClick={() => {}}
      />
      
      <div 
        onClick={() => onSelectService(ServiceSection.Wazema)}
        className={`group relative overflow-hidden bg-white dark:bg-donezo-card-dark p-6 rounded-[2rem] border transition-all cursor-pointer ${activeService === ServiceSection.Wazema ? 'border-donezo-green ring-4 ring-donezo-green/5' : 'border-slate-100 dark:border-slate-800 shadow-sm'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-tight">Wazema Cycle</p>
          <div className={`p-2 rounded-xl transition-colors ${activeService === ServiceSection.Wazema ? 'bg-donezo-green text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707" /></svg>
          </div>
        </div>
        <p className="text-4xl font-bold dark:text-white mb-2">5</p>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Wazema Items</p>
      </div>

      <div 
        onClick={() => onSelectService(ServiceSection.Mahlet)}
        className={`group relative overflow-hidden bg-white dark:bg-donezo-card-dark p-6 rounded-[2rem] border transition-all cursor-pointer ${activeService === ServiceSection.Mahlet ? 'border-donezo-green ring-4 ring-donezo-green/5' : 'border-slate-100 dark:border-slate-800 shadow-sm'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-tight">Mahlet Cycle</p>
          <div className={`p-2 rounded-xl transition-colors ${activeService === ServiceSection.Mahlet ? 'bg-donezo-green text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          </div>
        </div>
        <p className="text-4xl font-bold dark:text-white mb-2">12</p>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Mahlet Items</p>
      </div>

      <StatCard 
        title="Pending Downloads"
        value="0"
        subtitle="Library fully synced"
        active={false}
        onClick={() => {}}
      />
    </div>
  );
};

const StatCard = ({ title, value, subtitle, trend = "", active = false, onClick }) => (
  <div 
    onClick={onClick}
    className={`relative overflow-hidden p-6 rounded-[2rem] border transition-all ${active ? 'bg-gradient-to-br from-[#1b5e40] to-donezo-green border-transparent text-white' : 'bg-white dark:bg-donezo-card-dark border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm'}`}
  >
    {active && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>}
    <div className="flex items-center justify-between mb-4 relative z-10">
      <p className={`font-bold text-sm tracking-tight ${active ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{title}</p>
      <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${active ? 'border-white/20 text-white' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
      </div>
    </div>
    <p className="text-4xl font-bold mb-2 relative z-10">{value}</p>
    <div className="flex items-center gap-2 relative z-10">
      {trend && <div className={`text-[10px] px-1 py-0.5 rounded ${active ? 'bg-white/20' : 'bg-donezo-green/10 text-donezo-green'}`}>{trend}</div>}
      <p className={`text-[10px] font-medium uppercase tracking-widest ${active ? 'text-white/60' : 'text-slate-400'}`}>{subtitle}</p>
    </div>
  </div>
);

export default QuickAccessCards;