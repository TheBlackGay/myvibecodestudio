
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import PreviewPanel from './components/PreviewPanel';
import SettingsModal from './components/SettingsModal';
import TemplateSelector from './components/TemplateSelector';
import { sendMessage } from './services/ai';
import { extractCodeBlock } from './utils/codeParser';
import { Message, Role, GeneratedCode, AISettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { ProjectTemplate } from './templates';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  
  // Handle code changes from Monaco Editor
  const handleCodeChange = (filePath: string, content: string) => {
    if (!generatedCode) return;
    
    setGeneratedCode(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [filePath]: {
          ...prev[filePath],
          content
        }
      };
    });
  };

  // Handle file creation
  const handleFileCreate = (path: string, content: string, language: string) => {
    setGeneratedCode(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [path]: {
          language,
          content
        }
      };
    });
  };

  // Handle file deletion
  const handleFileDelete = (path: string) => {
    setGeneratedCode(prev => {
      if (!prev) return prev;
      const newCode = { ...prev };
      delete newCode[path];
      return newCode;
    });
  };

  // Handle template selection
  const handleTemplateSelect = (template: ProjectTemplate) => {
    setGeneratedCode(template.files);
  };
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  
  // Ref to track if the current request should be stopped
  const stopRef = useRef(false);

  // Load settings and history from local storage on mount
  useEffect(() => {
    // Load Settings
    const savedSettings = localStorage.getItem('vibe_ai_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }

    // Load History
    const savedMessages = localStorage.getItem('vibe_messages');
    const savedCode = localStorage.getItem('vibe_code');
    if (savedMessages) {
        try { setMessages(JSON.parse(savedMessages)); } catch (e) { console.error(e); }
    }
    if (savedCode) {
        try { setGeneratedCode(JSON.parse(savedCode)); } catch (e) { console.error(e); }
    }
  }, []);

  // Persist messages and code whenever they change
  useEffect(() => {
    localStorage.setItem('vibe_messages', JSON.stringify(messages));
    if (generatedCode) {
        localStorage.setItem('vibe_code', JSON.stringify(generatedCode));
    }
  }, [messages, generatedCode]);

  const handleSettingsSave = (newSettings: AISettings) => {
    setSettings(newSettings);
    localStorage.setItem('vibe_ai_settings', JSON.stringify(newSettings));
    
    // If saving valid settings, clear any error messages about missing keys
    if (newSettings.apiKey) {
      setMessages(prev => prev.filter(m => !m.isError));
    }
  };

  const handleReset = () => {
    setMessages([]);
    setGeneratedCode(null);
    setInput('');
    stopRef.current = false;
    // Clear persistence
    localStorage.removeItem('vibe_messages');
    localStorage.removeItem('vibe_code');
  };

  const handleStop = () => {
    stopRef.current = true;
    setIsLoading(false);
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;
    
    // Check if key is configured
    if (!settings.apiKey) {
      setIsSettingsOpen(true);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: Role.MODEL,
        content: "Please configure your API Key in the settings to start vibe coding.",
        timestamp: Date.now(),
        isError: true
      }]);
      return;
    }

    // Reset stop flag for new request
    stopRef.current = false;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: messageText,
      timestamp: Date.now(),
    };

    // Update state with user message
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Create a placeholder message for streaming
      const botMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: botMessageId, role: Role.MODEL, content: '', timestamp: Date.now() },
      ]);

      const stream = await sendMessage(newMessages, settings);
      let fullContent = '';

      for await (const chunk of stream) {
        // Check if user pressed stop
        if (stopRef.current) {
          break;
        }

        const text = chunk.text;
        if (text) {
          fullContent += text;
          
          // Update message in real-time
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === botMessageId ? { ...msg, content: fullContent } : msg
            )
          );

          // Try to extract code in real-time (even partial) for the preview
          const extracted = extractCodeBlock(fullContent);
          if (extracted) {
             setGeneratedCode(extracted);
          }
        }
      }

    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { 
            id: Date.now().toString(), 
            role: Role.MODEL, 
            content: `Error: ${error.message || "Failed to connect to the AI model."}`, 
            timestamp: Date.now(),
            isError: true
        },
      ]);
    } finally {
      setIsLoading(false);
      stopRef.current = false;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      <Header 
        onReset={handleReset} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
      />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <ChatInterface
          messages={messages}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          onStop={handleStop}
          isLoading={isLoading}
        />
        <PreviewPanel 
          code={generatedCode} 
          onCodeChange={handleCodeChange}
          onFileCreate={handleFileCreate}
          onFileDelete={handleFileDelete}
        />
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSettingsSave}
      />

      <TemplateSelector
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}

export default App;
