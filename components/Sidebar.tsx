import React, { useState, useRef, useEffect } from 'react';
import { Category, CategoryData, DayData, NavItemType } from '../types';

interface SidebarProps {
  isCollapsed: boolean;
  categories: NavItemType[];
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  onSelectDay: (day: DayData) => void;
  onAddCategory: (name: string) => void;
  onEditCategory: (id: string, newName: string) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategories: (categories: NavItemType[]) => void;
  db: CategoryData[];
}

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
);

const LibraryIcon = ({ color }: { color: string }) => (
  <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  categories, 
  selectedCategory, 
  onSelectCategory,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onReorderCategories,
  db 
}) => {
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Adding State
  const [isAdding, setIsAdding] = useState(false);
  const [showCollapsedAdd, setShowCollapsedAdd] = useState(false);
  const [newValue, setNewValue] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);
  const collapsedInputRef = useRef<HTMLInputElement>(null);

  // Deletion State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Auto-close states when sidebar collapses/expands
  useEffect(() => {
    if (isCollapsed) {
      setIsEditing(false);
      setIsAdding(false);
      setEditingId(null);
      setDeleteConfirmId(null);
    } else {
      setShowCollapsedAdd(false);
    }
  }, [isCollapsed]);

  // Focus input when adding starts
  useEffect(() => {
    if (isAdding && addInputRef.current) {
        addInputRef.current.focus();
    }
    if (showCollapsedAdd && collapsedInputRef.current) {
        collapsedInputRef.current.focus();
    }
  }, [isAdding, showCollapsedAdd]);

  // Generate HSL color gradient based on index
  const getCategoryColor = (index: number, total: number) => {
    const startHue = 170;
    const endHue = 270;
    const step = total > 1 ? (endHue - startHue) / (total - 1) : 0;
    const hue = startHue + (step * index);
    return `hsl(${hue}, 70%, 50%)`;
  };

  // --- Handlers ---

  const handleStartEdit = (cat: NavItemType) => {
    setEditingId(cat.id);
    setEditValue(cat.name);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      onEditCategory(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleAddClick = () => {
    if (isCollapsed) {
        setShowCollapsedAdd(!showCollapsedAdd);
        setNewValue("");
    } else {
        setIsAdding(!isAdding);
        setNewValue("");
    }
  };

  const handleSaveNew = () => {
    if (newValue.trim()) {
        onAddCategory(newValue.trim());
    }
    setIsAdding(false);
    setShowCollapsedAdd(false);
    setNewValue("");
  };

  const handleCancelNew = () => {
    setIsAdding(false);
    setShowCollapsedAdd(false);
    setNewValue("");
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCats = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newCats.length) {
      [newCats[index], newCats[targetIndex]] = [newCats[targetIndex], newCats[index]];
      onReorderCategories(newCats);
    }
  };

  const categoryToDelete = categories.find(c => c.id === deleteConfirmId);

  return (
    <aside 
      className={`fixed top-0 left-0 z-50 h-full bg-white dark:bg-donezo-card-dark border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72 shadow-2xl'}`}
    >
      {/* Centered Deletion Dialog */}
      {deleteConfirmId && categoryToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative animate-fade-in-up">
             <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Delete Library?</h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                   Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-slate-300">"{categoryToDelete.name}"</span>? This will remove the library access.
                </p>
             </div>
             
             <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-4 text-sm font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { onDeleteCategory(deleteConfirmId); setDeleteConfirmId(null); }}
                  className="flex-1 py-4 text-sm font-bold text-white bg-red-500 rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Brand / Title Area - Zema */}
      <div className="h-24 flex items-center justify-center border-b border-slate-100 dark:border-slate-800/50 flex-shrink-0 relative bg-gradient-to-b from-transparent to-slate-50/5 dark:to-white/5">
         
         <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out transform ${isCollapsed ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90 pointer-events-none'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-eotc-gold to-eotc-red rounded-xl flex items-center justify-center text-white font-black font-serif text-xl shadow-[0_4px_20px_rgba(217,119,6,0.3)]">
                Z
            </div>
         </div>

         <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-out transform ${isCollapsed ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
            <h1 className="font-serif font-black text-4xl tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-eotc-gold via-eotc-red to-pink-600 drop-shadow-sm">
                Zema
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-0.5">
                Audio Library
            </p>
         </div>
      </div>

      {/* Nav List - Scrollable */}
      <div className="flex-1 overflow-y-auto py-6 space-y-2 px-3 scrollbar-hide">
        
        <button 
          onClick={() => { onSelectCategory('Dashboard'); setIsEditing(false); setIsAdding(false); setShowCollapsedAdd(false); }}
          className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all ${selectedCategory === 'Dashboard' ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-black/10' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
           <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0`}>
              <DashboardIcon />
           </div>
           <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
             Dashboard
           </span>
        </button>

        <div className={`my-4 border-b border-slate-100 dark:border-slate-800 ${isCollapsed ? 'mx-2' : 'mx-0'}`}></div>

        {/* Sticky Libraries Header */}
        {!isCollapsed && (
          <div className="sticky top-[-24px] z-10 bg-white dark:bg-donezo-card-dark pt-4 pb-2 -mx-1 px-3 mb-2 flex items-center justify-between border-b border-transparent">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Libraries</span>
            <div className="flex gap-1">
               <button 
                onClick={() => { setIsEditing(!isEditing); setIsAdding(false); }} 
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isEditing ? 'text-donezo-green bg-donezo-green/10' : 'text-slate-400'}`}
                title="Edit / Reorder"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
               </button>
               <button 
                 onClick={handleAddClick} 
                 className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isAdding ? 'text-donezo-green bg-donezo-green/10' : 'text-slate-400'}`}
                 title="Add New Library"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
               </button>
            </div>
          </div>
        )}

        {!isCollapsed && isAdding && (
          <div className="px-3 mb-2 animate-fade-in">
              <input 
                ref={addInputRef}
                className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-donezo-green rounded-xl px-3 py-2 text-sm outline-none text-slate-900 dark:text-white placeholder-slate-400"
                placeholder="Library Name..."
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNew();
                    if (e.key === 'Escape') handleCancelNew();
                }}
              />
              <p className="text-[10px] text-slate-400 mt-1 ml-1">Enter to save • Esc to cancel</p>
          </div>
        )}

        <div className="space-y-2">
          {categories.map((cat, idx) => {
            const isActive = selectedCategory === cat.name;
            const iconColor = getCategoryColor(idx, categories.length);
            
            return (
              <div key={cat.id} className="group relative">
                <div 
                  onClick={() => { 
                      if (!isEditing) {
                          onSelectCategory(cat.name);
                          setIsEditing(false); 
                      }
                  }}
                  className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all relative 
                    ${isActive ? 'bg-white border-slate-200 shadow-md dark:bg-slate-800 dark:border-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'}
                    ${isEditing ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex-shrink-0 transition-transform group-hover:scale-110">
                    <LibraryIcon color={isActive ? iconColor : (isCollapsed ? iconColor : '#94a3b8')} />
                  </div>
                  
                  {editingId === cat.id ? (
                    <input 
                      ref={editInputRef}
                      className="flex-1 bg-slate-100 dark:bg-slate-900 border border-donezo-green rounded px-2 py-1 text-sm outline-none w-full min-w-0"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className={`font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'} ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                      {cat.name}
                    </span>
                  )}

                  {!isCollapsed && isEditing && editingId !== cat.id && (
                    <div className="absolute right-2 flex items-center gap-1 bg-white dark:bg-slate-800 shadow-sm p-1 rounded-lg animate-fade-in">
                      <button onClick={(e) => { e.stopPropagation(); moveCategory(idx, 'up'); }} className="p-1 text-slate-400 hover:text-blue-500" title="Move Up">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); moveCategory(idx, 'down'); }} className="p-1 text-slate-400 hover:text-blue-500" title="Move Down">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleStartEdit(cat); }} className="p-1 text-slate-400 hover:text-amber-500" title="Rename">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(cat.id); }} className="p-1 text-slate-400 hover:text-red-500" title="Delete">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isCollapsed && (
        <div className="flex justify-center flex-shrink-0 pb-6">
           <button 
             onClick={handleAddClick} 
             className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 active:scale-90 ${
               showCollapsedAdd 
               ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white rotate-[135deg]' 
               : 'bg-gradient-to-br from-emerald-400 via-donezo-green to-teal-600 text-white hover:shadow-emerald-500/20'
             }`}
             title="Add New Library"
           >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
           </button>
        </div>
      )}

      {/* Collapsed Add Overlay */}
      {isCollapsed && showCollapsedAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancelNew}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-xs p-8 rounded-[2.5rem] shadow-2xl border-2 border-donezo-green relative animate-fade-in-up">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">New Library</h3>
                <button onClick={handleCancelNew} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             
             <input 
                ref={collapsedInputRef}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-donezo-green dark:text-white mb-6 shadow-inner"
                placeholder="Enter name..."
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNew();
                    if (e.key === 'Escape') handleCancelNew();
                }}
             />
             
             <div className="flex gap-3">
                <button 
                  onClick={handleCancelNew}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveNew}
                  className="flex-1 py-3 text-sm font-bold text-white bg-donezo-green rounded-2xl shadow-lg shadow-donezo-green/30 hover:bg-green-600 transition-colors"
                >
                  Create
                </button>
             </div>
             
             <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">Press Enter to Confirm</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;