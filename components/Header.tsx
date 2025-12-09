
import React from 'react';
import { Sparkles, Terminal, Code2, Zap, Settings } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, onOpenSettings }) => {
  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
          <Sparkles className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            VibeCode Studio
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">AI Powered</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
           <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Flash Mode</span>
           </div>
           <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              <Terminal className="w-4 h-4 text-green-500" />
              <span>Full Stack</span>
           </div>
        </div>
        <div className="h-4 w-px bg-zinc-800 mx-2"></div>
        
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          title="Model Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        <button 
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-all border border-zinc-700"
        >
          <Code2 className="w-3.5 h-3.5" />
          New Project
        </button>
      </div>
    </header>
  );
};

export default Header;
