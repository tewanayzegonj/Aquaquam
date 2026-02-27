import React, { useState, useRef } from 'react';
import { LibraryItem } from '../types';
import useOnClickOutside from '../hooks/useOnClickOutside';

interface FolderSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: LibraryItem[];
  onSelectFolder: (folderId: string | null) => void;
  onCreateNewFolder: (name: string) => void;
}

const FolderSelectionModal: React.FC<FolderSelectionModalProps> = ({
  isOpen,
  onClose,
  folders,
  onSelectFolder,
  onCreateNewFolder
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(modalRef, onClose);

  if (!isOpen) return null;

  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateNewFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div ref={modalRef} className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up border border-white/10">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Assign to Folder</h3>
          <p className="text-sm text-slate-500">Where should this file live?</p>
        </div>

        <div className="p-4">
          {!isCreating ? (
            <>
              <button 
                onClick={() => setIsCreating(true)}
                className="w-full py-3 mb-4 bg-donezo-green/10 text-donezo-green rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-donezo-green/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Create New Folder
              </button>

              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="Search folders..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-donezo-green dark:text-white placeholder-slate-400"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>

              <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                <button 
                  onClick={() => onSelectFolder(null)}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 group"
                >
                   <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                   </div>
                   <div>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Root Library</p>
                      <p className="text-xs text-slate-400">No specific folder</p>
                   </div>
                </button>

                {filteredFolders.map(folder => (
                  <button 
                    key={folder.id}
                    onClick={() => onSelectFolder(folder.id)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 group"
                  >
                     <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                     </div>
                     <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">{folder.name}</p>
                        <p className="text-xs text-slate-400 truncate">Existing Folder</p>
                     </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Folder Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Kidist Arsema"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-donezo-green dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 text-slate-500 font-bold text-sm bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="flex-1 py-3 bg-donezo-green text-white font-bold text-sm rounded-xl hover:bg-green-600 shadow-lg shadow-donezo-green/20 transition-colors disabled:opacity-50 disabled:shadow-none"
                >
                  Continue
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderSelectionModal;
