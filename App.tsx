
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import PreviewPanel from './components/PreviewPanel';
import { initializeGemini, sendMessageStream, resetChat } from './services/gemini';
import { extractCodeBlock } from './utils/codeParser';
import { Message, Role, GeneratedCode } from './types';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);

  useEffect(() => {
    initializeGemini(); // Initialize on mount
    
    // Check if API KEY is present (handled by env in initialization)
    if (!process.env.API_KEY) {
       setMessages([{
           id: 'error-1',
           role: Role.MODEL,
           content: "System Error: Missing API_KEY in environment variables.",
           timestamp: Date.now(),
           isError: true
       }]);
    }
  }, []);

  const handleReset = () => {
    resetChat();
    setMessages([]);
    setGeneratedCode(null);
    setInput('');
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput(''); // Clear input if it came from the text area
    setIsLoading(true);

    try {
      // Create a placeholder message for streaming
      const botMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: botMessageId, role: Role.MODEL, content: '', timestamp: Date.now() },
      ]);

      const stream = await sendMessageStream(messageText);
      let fullContent = '';

      for await (const chunk of stream) {
        const text = chunk.text; // Access text property directly
        if (text) {
          fullContent += text;
          
          // Update message in real-time
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === botMessageId ? { ...msg, content: fullContent } : msg
            )
          );
        }
      }

      // After stream finishes, check for code
      const extracted = extractCodeBlock(fullContent);
      if (extracted) {
        setGeneratedCode(extracted);
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { 
            id: Date.now().toString(), 
            role: Role.MODEL, 
            content: "Sorry, I encountered an error connecting to the creative engine. Please check your API Key or try again.", 
            timestamp: Date.now(),
            isError: true
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      <Header onReset={handleReset} />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <ChatInterface
          messages={messages}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isLoading={isLoading}
        />
        <PreviewPanel code={generatedCode} />
      </main>
    </div>
  );
}

export default App;
