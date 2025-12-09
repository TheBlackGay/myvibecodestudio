
import React, { useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Gamepad2, Leaf, LayoutDashboard, Zap, ArrowRight } from 'lucide-react';
import { Message, Role } from '../types';
import { SUGGESTED_PROMPTS } from '../constants';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  onSend: (text?: string) => void;
  isLoading: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  Gamepad2,
  Leaf,
  LayoutDashboard,
  Zap
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  input,
  setInput,
  onSend,
  isLoading
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
    // Optional: auto-send
    // onSend(prompt); 
    // Better to let them preview/edit in input, or just send immediately.
    // Let's send immediately for "friendliness" and speed.
    onSend(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 w-full md:w-[450px] shrink-0 transition-all duration-300">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6 ring-1 ring-inset ring-white/10">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2 text-center">What's your vibe today?</h2>
            <p className="text-zinc-400 text-center text-sm max-w-xs mb-8">
              Describe a feeling, a style, or an app idea, and watch it come to life.
            </p>
            
            <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
              {SUGGESTED_PROMPTS.map((suggestion, idx) => {
                const Icon = iconMap[suggestion.icon] || Sparkles;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion.prompt)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-indigo-500/50 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors text-zinc-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                        {suggestion.title}
                      </div>
                      <div className="text-xs text-zinc-500 truncate group-hover:text-zinc-400">
                        {suggestion.subtitle}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
              msg.role === Role.USER ? 'flex-row-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                msg.role === Role.USER
                  ? 'bg-zinc-700 ring-1 ring-zinc-600'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-purple-500/20'
              }`}
            >
              {msg.role === Role.USER ? (
                <User className="w-4 h-4 text-zinc-300" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === Role.USER
                  ? 'bg-zinc-800 text-zinc-100 rounded-br-none ring-1 ring-inset ring-zinc-700'
                  : 'bg-zinc-950/80 backdrop-blur-sm border border-zinc-800/80 text-zinc-300 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.isError ? (
                 <div className="text-red-400 flex items-center gap-2">
                    <span className="block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {msg.content}
                 </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 animate-in fade-in duration-300">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                <Bot className="w-4 h-4 text-white" />
             </div>
             <div className="bg-zinc-950/50 border border-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm rounded-bl-none">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span className="text-xs text-zinc-400 font-medium">Crafting the code...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="relative rounded-xl bg-zinc-950 ring-1 ring-zinc-800 focus-within:ring-indigo-500/50 focus-within:ring-2 transition-all shadow-sm group">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your vision (e.g., 'A coffee shop landing page with a warm, cozy vibe')..."
            className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-500 p-4 pr-12 resize-none h-14 max-h-32 focus:outline-none scrollbar-hide"
          />
          <button
            onClick={() => onSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-900/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex justify-between items-center px-1">
          <span className="text-[10px] text-zinc-600 font-medium">VibeCode AI v2.5</span>
          <span className="text-[10px] text-zinc-600">Enter to send</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
