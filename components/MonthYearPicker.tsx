import React from 'react';
import { ETHIOPIAN_MONTHS_GEEZ } from '../utils/ethiopianDate';

interface MonthYearPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: number;
  currentYear: number;
  onSelect: (month: number, year: number) => void;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  isOpen,
  onClose,
  currentMonth,
  currentYear,
  onSelect
}) => {
  if (!isOpen) return null;

  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white font-sans">Jump to Date</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Month Grid */}
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3 font-sans">Month</label>
            <div className="grid grid-cols-3 gap-2">
              {ETHIOPIAN_MONTHS_GEEZ.map((m, idx) => (
                <button
                  key={m}
                  onClick={() => onSelect(idx + 1, currentYear)}
                  className={`py-2 px-1 rounded-lg text-sm font-bold transition-colors font-sans ${currentMonth === idx + 1 ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Year Scroller (Simplified as Grid for now) */}
          <div>
            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3 font-sans">Year</label>
            <div className="grid grid-cols-4 gap-2">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => onSelect(currentMonth, y)}
                  className={`py-2 rounded-lg text-sm font-bold transition-colors font-mono ${currentYear === y ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthYearPicker;
