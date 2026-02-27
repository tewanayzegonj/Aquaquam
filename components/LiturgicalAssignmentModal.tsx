import React, { useState } from 'react';
import { ETHIOPIAN_MONTHS, ETHIOPIAN_MONTHS_GEEZ } from '../utils/ethiopianDate';
import { FIXED_CEREMONIES } from '../data/ceremonies';

interface LiturgicalAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (month: number, day: number, ceremony?: string) => void;
  itemName: string;
}

const LiturgicalAssignmentModal: React.FC<LiturgicalAssignmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName
}) => {
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [customCeremony, setCustomCeremony] = useState("");

  if (!isOpen) return null;

  const daysInMonth = selectedMonth === 13 ? 6 : 30; // Pagume has up to 6 days
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleConfirm = () => {
    // Check if there's a fixed ceremony for this date
    const key = `${selectedMonth}-${selectedDay}`;
    const fixedCeremony = FIXED_CEREMONIES[key];
    const ceremonyName = customCeremony.trim() || fixedCeremony || "Regular Service";
    
    onConfirm(selectedMonth, selectedDay, ceremonyName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl relative w-full max-w-md animate-fade-in-up border border-slate-100 dark:border-slate-800">
        
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
            Liturgical Assignment
          </h3>
          <p className="text-slate-500 text-sm">
            When will <span className="font-bold text-slate-800 dark:text-slate-300">"{itemName}"</span> be used?
          </p>
        </div>

        <div className="space-y-6">
          {/* Date Picker */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Month</label>
              <select 
                value={selectedMonth}
                onChange={(e) => {
                    setSelectedMonth(Number(e.target.value));
                    // Reset day if out of bounds (e.g. switching to Pagume)
                    if (selectedDay > 5 && Number(e.target.value) === 13) setSelectedDay(1);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-donezo-green outline-none appearance-none"
              >
                {ETHIOPIAN_MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {i + 1}. {m} ({ETHIOPIAN_MONTHS_GEEZ[i]})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Day</label>
              <select 
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-donezo-green outline-none appearance-none"
              >
                {days.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Auto-detected Ceremony or Custom Input */}
          <div className="space-y-2">
             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ceremony Name</label>
             <div className="relative">
                <input 
                  type="text" 
                  value={customCeremony}
                  onChange={(e) => setCustomCeremony(e.target.value)}
                  placeholder={FIXED_CEREMONIES[`${selectedMonth}-${selectedDay}`] || "e.g. Weekly Service"}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-donezo-green outline-none placeholder:text-slate-400"
                />
                {FIXED_CEREMONIES[`${selectedMonth}-${selectedDay}`] && !customCeremony && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-donezo-green bg-donezo-green/10 px-2 py-1 rounded-lg pointer-events-none">
                        Auto-Detected
                    </span>
                )}
             </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-3.5 text-slate-500 font-bold text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
            >
              Skip / Cancel
            </button>
            <button 
              onClick={handleConfirm}
              className="flex-1 py-3.5 bg-donezo-green text-white font-bold text-sm rounded-2xl hover:bg-emerald-600 shadow-lg shadow-donezo-green/20 transition-colors"
            >
              Confirm Assignment
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LiturgicalAssignmentModal;
