
import React, { useState, useEffect } from 'react';
import { X, Save, Server, Key, Box, Globe } from 'lucide-react';
import { AISettings, AIProvider } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AISettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: keyof AISettings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            Model Configuration
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Manufacturer / Provider</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleChange('provider', 'gemini')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  localSettings.provider === 'gemini'
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <span>Google Gemini</span>
              </button>
              <button
                onClick={() => handleChange('provider', 'openai')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  localSettings.provider === 'openai'
                    ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <span>OpenAI Compatible</span>
              </button>
            </div>
          </div>

          {/* Model Name */}
          <div className="space-y-2">
             <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
               <Box className="w-3 h-3" /> Model Name
             </label>
             <input
               type="text"
               value={localSettings.model}
               onChange={(e) => handleChange('model', e.target.value)}
               placeholder={localSettings.provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o'}
               className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-zinc-600"
             />
             <p className="text-[10px] text-zinc-600">
                {localSettings.provider === 'gemini' 
                  ? "Recommended: gemini-2.5-flash, gemini-1.5-pro" 
                  : "e.g., gpt-4o, deepseek-coder, llama3-70b"}
             </p>
          </div>

           {/* Base URL (Conditional) */}
           <div className={`space-y-2 transition-all duration-300 ${localSettings.provider === 'openai' ? 'opacity-100 max-h-32' : 'opacity-50 max-h-32'}`}>
             <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
               <Globe className="w-3 h-3" /> Request Address (Base URL)
             </label>
             <input
               type="text"
               value={localSettings.baseUrl || ''}
               onChange={(e) => handleChange('baseUrl', e.target.value)}
               placeholder="https://api.openai.com/v1"
               disabled={localSettings.provider === 'gemini'} // Gemini SDK handles URL usually
               className={`w-full bg-zinc-900/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-zinc-600 ${localSettings.provider === 'gemini' ? 'opacity-50 cursor-not-allowed' : ''}`}
             />
             {localSettings.provider === 'openai' && (
               <p className="text-[10px] text-zinc-600">
                 Leave empty for default OpenAI. Use local address (e.g. http://localhost:11434/v1) for Ollama.
               </p>
             )}
          </div>

          {/* API Key */}
          <div className="space-y-2">
             <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
               <Key className="w-3 h-3" /> Connection Key
             </label>
             <input
               type="password"
               value={localSettings.apiKey}
               onChange={(e) => handleChange('apiKey', e.target.value)}
               placeholder="sk-..."
               className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-zinc-600 font-mono"
             />
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-900/20"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
