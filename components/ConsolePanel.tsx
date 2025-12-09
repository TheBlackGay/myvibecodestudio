
import React from 'react';
import { Terminal, X, Trash2 } from 'lucide-react';

export interface ConsoleMessage {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

interface ConsolePanelProps {
  messages: ConsoleMessage[];
  onClear: () => void;
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({ messages, onClear }) => {
  const getMessageColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-zinc-300';
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '›';
    }
  };

  return (
    <div className="h-48 border-t border-zinc-800 bg-[#0d0d0d] flex flex-col">
      {/* Console Header */}
      <div className="h-9 px-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
          <Terminal className="w-4 h-4" />
          <span>CONSOLE</span>
          {messages.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] text-zinc-500">
              {messages.length}
            </span>
          )}
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
          title="Clear console"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Console Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
            Console output will appear here...
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 py-1 px-2 hover:bg-zinc-900/50 rounded ${getMessageColor(msg.type)}`}
            >
              <span className="shrink-0">{getMessageIcon(msg.type)}</span>
              <span className="flex-1 break-all leading-relaxed">{msg.message}</span>
              <span className="shrink-0 text-[10px] text-zinc-600">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConsolePanel;
