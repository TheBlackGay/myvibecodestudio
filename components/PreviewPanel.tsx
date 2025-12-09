
import React, { useState } from 'react';
import { Eye, Code, Smartphone, Monitor, Tablet, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import { GeneratedCode } from '../types';

interface PreviewPanelProps {
  code: GeneratedCode | null;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ code }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [key, setKey] = useState(0); // Used to force iframe refresh
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const handleOpenInNewTab = () => {
    if (!code) return;
    const blob = new Blob([code.code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // If no code is present yet
  if (!code) {
    return (
      <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center text-zinc-600 relative overflow-hidden">
        {/* Ambient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl"></div>
        </div>

        <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl shadow-black/50 group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Sparkles className="w-10 h-10 text-zinc-700 group-hover:text-indigo-400 transition-colors duration-500" />
          </div>
          <h3 className="text-xl font-medium text-zinc-300 mb-2 tracking-tight">Vibe Canvas</h3>
          <p className="max-w-md text-center text-sm px-6 text-zinc-500 leading-relaxed">
            Your generated application will appear here live. <br/>
            Use the chat to describe your dream UI.
          </p>
        </div>
      </div>
    );
  }

  const getViewportClass = () => {
    switch(viewport) {
      case 'mobile': return 'w-[375px] shadow-2xl shadow-black/50 my-8 rounded-2xl border-y-[12px] border-x-4 border-zinc-800';
      case 'tablet': return 'w-[768px] shadow-2xl shadow-black/50 my-8 rounded-xl border-4 border-zinc-800';
      default: return 'w-full';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 h-full overflow-hidden border-l border-zinc-800">
      {/* Toolbar */}
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-1 bg-zinc-800/50 p-1 rounded-lg border border-zinc-700/30">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'preview'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'code'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Code
          </button>
        </div>

        {activeTab === 'preview' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-zinc-500 bg-zinc-800/30 p-1 rounded-lg border border-zinc-800">
               <button onClick={() => setViewport('mobile')} className={`p-1.5 rounded hover:bg-zinc-700 transition ${viewport === 'mobile' ? 'text-indigo-400 bg-zinc-800' : ''}`} title="Mobile"><Smartphone className="w-4 h-4"/></button>
               <button onClick={() => setViewport('tablet')} className={`p-1.5 rounded hover:bg-zinc-700 transition ${viewport === 'tablet' ? 'text-indigo-400 bg-zinc-800' : ''}`} title="Tablet"><Tablet className="w-4 h-4"/></button>
               <button onClick={() => setViewport('desktop')} className={`p-1.5 rounded hover:bg-zinc-700 transition ${viewport === 'desktop' ? 'text-indigo-400 bg-zinc-800' : ''}`} title="Desktop"><Monitor className="w-4 h-4"/></button>
            </div>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition" title="Reload Preview">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={handleOpenInNewTab} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition" title="Open in New Tab">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className={`flex-1 bg-[#09090b] relative overflow-hidden flex justify-center ${viewport !== 'desktop' ? 'items-start overflow-y-auto' : ''}`}>
        {activeTab === 'preview' ? (
          <div className={`transition-all duration-300 ease-in-out bg-white ${getViewportClass()} ${viewport === 'desktop' ? 'h-full' : 'shrink-0'}`}>
            <iframe
              key={key}
              title="Preview"
              srcDoc={code.code}
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin allow-modals"
            />
          </div>
        ) : (
          <div className="w-full h-full overflow-auto p-6 text-sm font-mono leading-relaxed bg-[#1e1e1e] text-[#d4d4d4]">
             <pre className="whitespace-pre-wrap">{code.code}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
