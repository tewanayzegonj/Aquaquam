import React, { useState } from 'react';
import { ETHIOPIAN_MONTHS_GEEZ } from '../utils/ethiopianDate';
import { canonicalMonthlyCommemorations } from '../utils/liturgyData';

interface LiturgicalCMSEditorProps {
  onClose: () => void;
}

const LiturgicalCMSEditor: React.FC<LiturgicalCMSEditorProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'monthly' | 'annual'>('monthly');
  
  const [monthlyCustom, setMonthlyCustom] = useState<Record<string, string>>(() => {
      try {
          return JSON.parse(localStorage.getItem('monthlyCustom') || '{}');
      } catch (e) {
          console.error("Failed to load CMS data", e);
          return {};
      }
  });
  
  const [annualCustom, setAnnualCustom] = useState<Record<string, string>>(() => {
      try {
          return JSON.parse(localStorage.getItem('custom_annual_commemorations') || '{}');
      } catch (e) {
          console.error("Failed to load CMS data", e);
          return {};
      }
  });
  
  // Edit State
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleEditStart = (key: string, currentValue: string) => {
    setEditingKey(key);
    setEditValue(currentValue);
  };

  const handleSaveRequest = () => {
    setConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (!editingKey) return;

    const newValue = editValue.trim();
    
    if (activeTab === 'monthly') {
      const updated = { ...monthlyCustom };
      if (newValue) {
        updated[editingKey] = newValue;
      } else {
        delete updated[editingKey]; // Revert to default (delete override)
      }
      setMonthlyCustom(updated);
      localStorage.setItem('monthlyCustom', JSON.stringify(updated));
    } else {
      const updated = { ...annualCustom };
      if (newValue) {
        updated[editingKey] = newValue;
      } else {
        delete updated[editingKey];
      }
      setAnnualCustom(updated);
      localStorage.setItem('custom_annual_commemorations', JSON.stringify(updated));
    }

    setConfirmOpen(false);
    setEditingKey(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
    setConfirmOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#111] text-white font-sans">
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h3 className="text-xl font-bold">Edit Commemorations</h3>
        <button onClick={onClose} className="text-white/40 hover:text-white">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button 
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'monthly' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-white/40 hover:text-white'}`}
        >
          Monthly (1-30)
        </button>
        <button 
          onClick={() => setActiveTab('annual')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'annual' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-white/40 hover:text-white'}`}
        >
          Annual Feasts
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'monthly' ? (
          <div className="space-y-2">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
              <div key={day} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full font-mono text-amber-500 font-bold">{day}</span>
                  {editingKey === day.toString() ? (
                    <input 
                      autoFocus
                      type="text" 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="bg-black/50 border border-amber-500/50 rounded-lg px-2 py-1 text-white outline-none font-sans placeholder-white/20"
                      placeholder={canonicalMonthlyCommemorations[day]?.amharic || "System Default"}
                    />
                  ) : (
                    <span className={`font-sans ${monthlyCustom[day] ? 'text-white' : 'text-white/30 italic'}`}>
                      {monthlyCustom[day] || canonicalMonthlyCommemorations[day]?.amharic || "System Default"}
                    </span>
                  )}
                </div>
                
                {editingKey === day.toString() ? (
                  <div className="flex gap-2">
                    <button onClick={handleSaveRequest} className="text-green-400 hover:text-green-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleEditStart(day.toString(), monthlyCustom[day] || "")} className="text-white/20 hover:text-amber-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
             {/* Annual Editor - Grouped by Month */}
             {ETHIOPIAN_MONTHS_GEEZ.map((monthName, mIdx) => {
               const monthNum = mIdx + 1;
               if (monthNum > 13) return null; // Pagume handled normally

               return (
                 <div key={monthNum} className="space-y-2">
                   <h4 className="text-amber-500 font-bold text-sm sticky top-0 bg-[#111] py-2 z-10">{monthName}</h4>
                   
                   {/* Simplified Annual View: List defined + Add Button */}
                   <div className="space-y-2">
                      {Object.entries(annualCustom)
                        .filter(([k]) => k.startsWith(`${monthNum}-`))
                        .map(([key, val]) => {
                          const day = key.split('-')[1];
                          return (
                            <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                               <div className="flex items-center gap-4">
                                  <span className="text-white/60 font-mono text-xs">{monthName} {day}</span>
                                  {editingKey === key ? (
                                    <input 
                                      autoFocus
                                      type="text" 
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      className="bg-black/50 border border-amber-500/50 rounded-lg px-2 py-1 text-white outline-none font-sans"
                                    />
                                  ) : (
                                    <span className="font-sans text-white">{val}</span>
                                  )}
                               </div>
                               {editingKey === key ? (
                                  <div className="flex gap-2">
                                    <button onClick={handleSaveRequest} className="text-green-400 hover:text-green-300">Save</button>
                                    <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-300">Cancel</button>
                                  </div>
                               ) : (
                                  <button onClick={() => handleEditStart(key, val)} className="text-white/20 hover:text-amber-500">Edit</button>
                               )}
                            </div>
                          );
                        })
                      }
                      
                      {/* Add New for this month */}
                      <div className="p-2">
                        <button 
                          onClick={() => {
                             // Simple prompt for now or inline form
                             const day = prompt(`Enter Day for ${monthName} (1-30):`);
                             if (day && !isNaN(Number(day)) && Number(day) <= 30) {
                               const key = `${monthNum}-${day}`;
                               handleEditStart(key, "");
                             }
                          }}
                          className="text-xs text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1"
                        >
                          + Add Feast for {monthName}
                        </button>
                      </div>
                   </div>
                 </div>
               );
             })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-6 animate-fade-in">
           <div className="bg-[#1A1A1A] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full">
              <h4 className="text-lg font-bold text-white mb-2">Confirm Changes?</h4>
              <p className="text-white/60 text-sm mb-6">
                Are you sure you want to edit this commemoration? Saving a blank entry will revert to the system default.
              </p>
              <div className="flex gap-3">
                 <button onClick={handleCancelEdit} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors">Cancel</button>
                 <button onClick={handleConfirmSave} className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm transition-colors">Confirm</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LiturgicalCMSEditor;
