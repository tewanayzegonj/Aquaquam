import React, { useState, useRef } from 'react';
import { LibraryItem, Track, PerformanceType } from '../types';

import useOnClickOutside from '../hooks/useOnClickOutside';

interface LibraryViewProps {
  categoryId: string;
  items: LibraryItem[];
  favorites: Track[];
  onAddItem: (item: LibraryItem) => void;
  onUpdateItem: (id: string, updates: Partial<LibraryItem>) => void;
  onDeleteItem: (id: string | string[]) => void;
  onReorderItems: (items: LibraryItem[]) => void;
  onPlayTrack: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  currentTrackId?: string;
}

type ViewMode = 'grid' | 'list';

const LibraryView: React.FC<LibraryViewProps> = ({ 
  categoryId, 
  items, 
  favorites,
  onAddItem, 
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onPlayTrack,
  onToggleFavorite,
  currentTrackId 
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [itemToDelete, setItemToDelete] = useState<LibraryItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleFavorite = (e: React.MouseEvent, item: LibraryItem) => {
    e.stopPropagation();
    // Convert LibraryItem to Track for favorites
    const track: Track = {
        id: item.id,
        title: item.name,
        category: 'Imported',
        audio_url: item.url || '',
        available_performances: [PerformanceType.Zema],
        merigeta_metadata: { notes: "Imported from local device" },
        size: item.size,
        duration: item.duration
    };
    onToggleFavorite(track);
  };
  const newFolderFormRef = useRef<HTMLFormElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const manageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsAddingFolder(false);
    setNewFolderName("");
    setIsManageMode(false);
    setSelectedIds([]);
    setEditingItemId(null);
  }, [categoryId]);

  const currentItems = items.filter(item => 
    item.categoryId === categoryId && item.parentId === currentFolderId
  );

  const getBreadcrumbs = () => {
    const crumbs = [];
    let curr = items.find(i => i.id === currentFolderId);
    while (curr) {
        crumbs.unshift({ id: curr.id, name: curr.name });
        curr = items.find(i => i.id === curr?.parentId);
    }
    crumbs.unshift({ id: null, name: 'Home' });
    return crumbs;
  };

  // Helper: Format Bytes to human readable string
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Helper: Format Duration (seconds) to MM:SS
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: LibraryItem = {
      id: `folder_${Date.now()}`,
      parentId: currentFolderId,
      categoryId,
      name: newFolderName.trim(),
      type: 'folder',
      createdAt: Date.now()
    };
    onAddItem(newFolder);
    setNewFolderName("");
    setIsAddingFolder(false);
  };

  useOnClickOutside(newFolderFormRef, () => {
    if (isAddingFolder) {
      setIsAddingFolder(false);
      setNewFolderName("");
    }
  });

  const handleStartEdit = (item: LibraryItem) => {
      setEditingItemId(item.id);
      setEditNameValue(item.name);
      setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const handleSaveRename = () => {
      if (editingItemId && editNameValue.trim()) {
          onUpdateItem(editingItemId, { name: editNameValue.trim() });
      }
      setEditingItemId(null);
  };

  useOnClickOutside(renameInputRef, () => {
    if (editingItemId) {
      handleSaveRename();
    }
  });

  useOnClickOutside(manageMenuRef, () => {
    if (isManageMode) {
      setIsManageMode(false);
      setSelectedIds([]);
    }
  });

  const handleToggleSelect = (id: string) => {
      setSelectedIds(prev => 
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  };

  const handleSelectAll = () => {
      if (selectedIds.length === currentItems.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(currentItems.map(i => i.id));
      }
  };

  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  const handleDeleteSelected = () => {
      if (selectedIds.length === 0) return;
      setItemsToDelete(selectedIds);
  };

  const handleDeleteConfirm = () => {
      if (itemToDelete) {
          onDeleteItem(itemToDelete.id);
          setItemToDelete(null);
      } else if (itemsToDelete.length > 0) {
          onDeleteItem(itemsToDelete);
          setItemsToDelete([]);
          setSelectedIds([]);
          setIsManageMode(false);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      
      // Create a temporary audio element to extract duration
      const tempAudio = new Audio(objectUrl);
      
      tempAudio.onloadedmetadata = () => {
          const newFile: LibraryItem = {
            id: `file_${Date.now()}`,
            parentId: currentFolderId,
            categoryId,
            name: file.name.replace(/\.[^/.]+$/, ""),
            type: 'audio',
            url: objectUrl,
            createdAt: Date.now(),
            size: file.size,
            duration: tempAudio.duration
          };
          onAddItem(newFile);
      };

      // Fallback if metadata fails (e.g., immediate trigger without duration)
      tempAudio.onerror = () => {
         const newFile: LibraryItem = {
            id: `file_${Date.now()}`,
            parentId: currentFolderId,
            categoryId,
            name: file.name.replace(/\.[^/.]+$/, ""),
            type: 'audio',
            url: objectUrl,
            createdAt: Date.now(),
            size: file.size,
            duration: 0
         };
         onAddItem(newFile);
      }
    }
  };

  const handleAddDemoTrack = () => {
     const newFile: LibraryItem = {
        id: `demo_${Date.now()}`,
        parentId: currentFolderId,
        categoryId,
        name: `Demo Audio ${items.filter(i => i.name.includes('Demo')).length + 1}`,
        type: 'audio',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        createdAt: Date.now(),
        size: 8500000, // ~8.5MB dummy size
        duration: 372 // ~6:12 dummy duration
      };
      onAddItem(newFile);
  };

  const playItem = (item: LibraryItem) => {
    if (isManageMode) return; 
    if (item.type !== 'audio' || !item.url) return;
    const track: Track = {
        id: item.id,
        title: item.name,
        category: 'Imported',
        audio_url: item.url,
        available_performances: [PerformanceType.Zema],
        merigeta_metadata: { notes: "Imported from local device" },
        size: item.size,
        duration: item.duration
    };
    onPlayTrack(track);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentItems.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const itemA = currentItems[index];
    const itemB = currentItems[targetIndex];

    const globalIndexA = items.findIndex(i => i.id === itemA.id);
    const globalIndexB = items.findIndex(i => i.id === itemB.id);

    if (globalIndexA !== -1 && globalIndexB !== -1) {
        const newItems = [...items];
        // Swap items in the global list
        newItems[globalIndexA] = itemB;
        newItems[globalIndexB] = itemA;
        onReorderItems(newItems);
    }
  };

  const getViewClasses = () => {
      switch (viewMode) {
          case 'list': return 'grid grid-cols-1 gap-2';
          case 'grid': 
          default: 
            return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4';
      }
  };

  return (
    <div className="p-6 md:p-10 h-full flex flex-col relative">
      
      {(itemToDelete || itemsToDelete.length > 0) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setItemToDelete(null); setItemsToDelete([]); }}></div>
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl relative w-full max-w-sm animate-fade-in-up">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                    {itemToDelete ? `Delete ${itemToDelete.type}?` : `Delete ${itemsToDelete.length} items?`}
                  </h3>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                      {itemToDelete ? (
                        <>
                          Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-300">"{itemToDelete.name}"</span>? 
                          {itemToDelete.type === 'folder' && " This will delete all contents inside."}
                        </>
                      ) : (
                        <>Are you sure you want to delete these {itemsToDelete.length} items?</>
                      )}
                      <br/>This action is irreversible.
                  </p>
                  <div className="flex gap-4">
                      <button 
                        onClick={() => { setItemToDelete(null); setItemsToDelete([]); }}
                        className="flex-1 py-3 text-slate-500 font-bold text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleDeleteConfirm}
                        className="flex-1 py-3 bg-red-500 text-white font-bold text-sm rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-colors"
                      >
                          Delete
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col items-center mb-10 gap-6 w-full">
        <div className="w-full flex flex-wrap items-center justify-start gap-3 text-sm text-slate-400">
          {getBreadcrumbs().map((crumb, idx) => (
             <React.Fragment key={crumb.id || 'root'}>
                {idx > 0 && <span className="opacity-30">/</span>}
                <button 
                  onClick={() => setCurrentFolderId(crumb.id)}
                  disabled={isManageMode}
                  className={`font-bold transition-all px-3 py-1.5 rounded-xl ${
                    idx === getBreadcrumbs().length - 1 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                        : 'text-slate-500 hover:text-donezo-green'
                  }`}
                >
                  {crumb.name}
                </button>
             </React.Fragment>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 bg-white dark:bg-donezo-card-dark p-2 rounded-[2rem] md:rounded-full border border-slate-100 dark:border-slate-800 shadow-sm w-full md:w-auto">
           {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-1">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 text-donezo-green shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-donezo-green shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
           </div>

           <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

           {/* Manage Mode Toggle */}
           <div className="flex items-center gap-2" ref={manageMenuRef}>
             <button 
                  onClick={() => {
                    setIsManageMode(!isManageMode);
                    setSelectedIds([]);
                  }}
                  className={`p-2.5 rounded-2xl transition-all ${isManageMode ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-50'}`}
                  title="Manage"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             </button>

             {isManageMode && (
               <div className="flex items-center gap-2 animate-fade-in">
                 <button 
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                 >
                   {selectedIds.length === currentItems.length ? 'Deselect All' : 'Select All'}
                 </button>
                 {selectedIds.length > 0 && (
                   <button 
                    onClick={handleDeleteSelected}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                   >
                     Delete ({selectedIds.length})
                   </button>
                 )}
               </div>
             )}
           </div>
           
           <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

           {/* New Actions: Import and Demo */}
           {!isAddingFolder ? (
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsAddingFolder(true)} 
                  disabled={isManageMode}
                  className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center gap-2"
                  title="New Folder"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  <span className="hidden lg:inline text-xs font-bold">Folder</span>
                </button>

                <button 
                  onClick={handleAddDemoTrack} 
                  disabled={isManageMode}
                  className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-100 transition-all disabled:opacity-50 flex items-center gap-2"
                  title="Add Demo Track"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  <span className="hidden lg:inline text-xs font-bold">Demo</span>
                </button>

                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isManageMode}
                  className="p-2.5 bg-donezo-green text-white rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-donezo-green/20 disabled:opacity-50 flex items-center gap-2"
                  title="Import Audio"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span className="hidden lg:inline text-xs font-bold">Import</span>
                </button>

                <input 
                  type="file" 
                  accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.flac" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
             </div>
           ) : (
             <form ref={newFolderFormRef} onSubmit={handleCreateFolder} className="flex items-center gap-2 pr-2">
                <input 
                  autoFocus
                  type="text" 
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-1.5 text-sm outline-none w-32 focus:ring-1 focus:ring-donezo-green dark:text-white"
                />
                <button type="submit" className="text-donezo-green">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button type="button" onClick={() => setIsAddingFolder(false)} className="text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </form>
           )}
        </div>
      </div>

      <div className="flex-1">
        {currentItems.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem]">
            <p className="font-bold text-slate-500 mb-1">Empty Library</p>
            <p className="text-xs">Add folders or import audio to get started.</p>
          </div>
        ) : (
          <div className={getViewClasses()}>
            {currentItems.map((item, index) => {
              // Check if folder has audio content (shallow check)
              const hasAudioContent = item.type === 'folder' && items.some(i => i.parentId === item.id && i.type === 'audio');
              
              return (
              <div 
                key={item.id}
                onClick={() => {
                  if (isManageMode) {
                    handleToggleSelect(item.id);
                  } else {
                    if (item.type === 'folder') {
                      setCurrentFolderId(item.id);
                    } else {
                      playItem(item);
                    }
                  }
                }}
                className={`group relative p-5 rounded-3xl border transition-all flex items-center gap-4 
                    ${isManageMode ? 'border-amber-100 dark:border-amber-900/30 bg-amber-50/20 cursor-pointer' : 'cursor-pointer hover:shadow-xl hover:shadow-black/5'}
                    ${!isManageMode && currentTrackId === item.id 
                        ? 'bg-donezo-green text-white border-donezo-green' 
                        : 'bg-white dark:bg-donezo-card-dark border-slate-100 dark:border-slate-800 hover:border-donezo-green/30'
                    }
                    ${isManageMode && selectedIds.includes(item.id) ? 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-900/40' : ''}
                    ${viewMode === 'list' ? 'flex-row' : 'flex-col justify-center text-center h-48'}
                `}
              >
                 {!isManageMode && (
                    <button
                        onClick={(e) => handleToggleFavorite(e, item)}
                        className={`absolute z-30 p-1.5 rounded-full transition-all ${
                            favorites.some(f => f.id === item.id)
                                ? 'text-red-500 bg-red-50 dark:bg-red-900/20 opacity-100' 
                                : 'text-slate-300 hover:text-red-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
                        } ${viewMode === 'list' ? 'right-4 top-1/2 -translate-y-1/2' : 'top-3 right-3'}`}
                        title={favorites.some(f => f.id === item.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                        <svg className="w-5 h-5" fill={favorites.some(f => f.id === item.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                 )}

                 {isManageMode && (
                     <div className="absolute top-3 left-3 z-30">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.includes(item.id) ? 'bg-amber-500 border-amber-500' : 'border-slate-300 dark:border-slate-600'}`}>
                           {selectedIds.includes(item.id) && (
                             <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                           )}
                        </div>
                     </div>
                 )}

                 {isManageMode && (
                     <div className={`absolute flex items-center gap-1 z-30 animate-fade-in ${viewMode === 'list' ? 'right-3 top-1/2 -translate-y-1/2' : 'bottom-3 right-3'}`}>
                         <button 
                            onClick={(e) => { e.stopPropagation(); moveItem(index, 'up'); }}
                            disabled={index === 0}
                            className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-400 hover:text-blue-500 border border-slate-100 dark:border-slate-600 disabled:opacity-30 disabled:hover:text-slate-400"
                            title="Move Previous"
                         >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); moveItem(index, 'down'); }}
                            disabled={index === currentItems.length - 1}
                            className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-400 hover:text-blue-500 border border-slate-100 dark:border-slate-600 disabled:opacity-30 disabled:hover:text-slate-400"
                            title="Move Next"
                         >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                         </button>
                         
                         <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1"></div>

                         <button 
                            onClick={(e) => { e.stopPropagation(); handleStartEdit(item); }}
                            className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-400 hover:text-amber-500 border border-slate-100 dark:border-slate-600"
                         >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </button>
                         <button 
                            onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }}
                            className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-400 hover:text-red-500 border border-slate-100 dark:border-slate-600"
                         >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                     </div>
                 )}

                 <div className={`rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 flex-shrink-0 transition-transform group-hover:scale-105 ${viewMode === 'list' ? 'w-10 h-10' : 'w-14 h-14'}`}>
                   {item.type === 'folder' ? (
                     hasAudioContent ? (
                        <svg className={`w-7 h-7 ${!isManageMode && currentTrackId === item.id ? 'text-white' : 'text-donezo-green'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 3-2 3 2zm0 0v-8" /><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" opacity="0.3"/></svg>
                     ) : (
                        <svg className={`w-7 h-7 ${!isManageMode && currentTrackId === item.id ? 'text-white' : 'text-amber-400'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                     )
                   ) : (
                     <svg className={`w-7 h-7 ${!isManageMode && currentTrackId === item.id ? 'text-white' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 3-2 3 2zm0 0v-8" /></svg>
                   )}
                 </div>
                 
                 <div className={`flex-1 min-w-0 ${viewMode === 'list' ? 'pr-12' : 'px-2'}`}>
                    {editingItemId === item.id ? (
                        <input 
                            ref={renameInputRef}
                            type="text" 
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onBlur={handleSaveRename}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-sm font-bold bg-white dark:bg-slate-900 border border-donezo-green rounded-lg px-2 py-1 z-40 relative shadow-lg"
                            autoFocus
                        />
                    ) : (
                        <p className={`font-bold text-sm tracking-tight line-clamp-2 break-words text-center px-2 ${!isManageMode && currentTrackId === item.id ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {item.name}
                        </p>
                    )}
                    <p className={`text-[10px] uppercase font-bold tracking-widest mt-0.5 text-center ${!isManageMode && currentTrackId === item.id ? 'text-white/70' : 'text-slate-400'}`}>
                        {item.type} {item.type === 'audio' && `• ${formatSize(item.size)} • ${formatDuration(item.duration)}`}
                    </p>
                 </div>

                 {item.type === 'audio' && !isManageMode && (
                     <div className="absolute inset-0 bg-black/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                 )}
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryView;