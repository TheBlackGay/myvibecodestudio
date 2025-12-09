
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import PreviewPanel from './components/PreviewPanel';
import SettingsModal from './components/SettingsModal';
import TemplateSelector from './components/TemplateSelector';
import AgentProgressPanel from './components/AgentProgressPanel';
import ProjectsManager from './components/ProjectsManager';
import { sendMessage } from './services/ai';
import { extractCodeBlock } from './utils/codeParser';
import { Message, Role, GeneratedCode, AISettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { ProjectTemplate } from './templates';
import { multiAgentService, AgentState } from './services/agents';
import { StoredProject, StorageService } from './services/storage';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  
  // Multi-agent state
  const [isMultiAgentMode, setIsMultiAgentMode] = useState(false);
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [agentProgress, setAgentProgress] = useState(0);
  const [agentPhase, setAgentPhase] = useState('');
  const [isAgentActive, setIsAgentActive] = useState(false);
  
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

  // Handle project load
  const handleLoadProject = (project: StoredProject) => {
    setGeneratedCode(project.files);
    setCurrentProjectId(project.id);
    
    // Add a message to chat indicating project loaded
    const loadMessage: Message = {
      id: Date.now().toString(),
      role: Role.MODEL,
      content: `📂 **Project Loaded:** ${project.name}\n\n${project.description}\n\n${Object.keys(project.files).length} files loaded. You can now preview and edit the project!`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, loadMessage]);
  };

  // Auto-save current project (every 30 seconds if there's code)
  useEffect(() => {
    if (!generatedCode) return;
    
    const autoSaveInterval = setInterval(() => {
      const projectName = currentProjectId 
        ? StorageService.getProject(currentProjectId)?.name 
        : undefined;
      
      StorageService.autoSave(projectName || 'Untitled Project', generatedCode);
      console.log('Project auto-saved');
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [generatedCode, currentProjectId]);
  
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
      // Check if multi-agent mode is enabled
      if (isMultiAgentMode) {
        // Use multi-agent system
        setIsAgentActive(true);
        setAgentProgress(0);
        setAgentPhase('Initializing multi-agent system...');

        const result = await multiAgentService.executeRequest(
          { userPrompt: messageText },
          settings,
          (status, progress, agents) => {
            setAgentPhase(status);
            setAgentProgress(progress);
            setAgentStates(agents);
          }
        );

        setIsAgentActive(false);

        if (result.success) {
          // Add agent summary message
          const summaryMessage: Message = {
            id: Date.now().toString(),
            role: Role.MODEL,
            content: `✨ **Multi-Agent System Complete**\n\n${result.summary}\n\n**Agents Involved:**\n- 🧠 Coordinator: Orchestrated the workflow\n- 🏗️ Architect: Designed the structure\n- 🎨 Frontend: Built the UI components\n- ⚙️ Backend: Implemented logic\n- 🔍 Reviewer: Ensured code quality\n\nYou can now preview and edit the generated code!`,
            timestamp: Date.now()
          };
          
          setMessages(prev => [...prev, summaryMessage]);
          setGeneratedCode(result.files);
        } else {
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: Role.MODEL,
            content: `❌ Multi-agent system encountered an error: ${result.summary}`,
            timestamp: Date.now(),
            isError: true
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        // Use single-agent system (original behavior)
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
        onOpenProjects={() => setIsProjectsOpen(true)}
        isMultiAgentMode={isMultiAgentMode}
        onToggleMultiAgent={() => setIsMultiAgentMode(!isMultiAgentMode)}
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

      <ProjectsManager
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        onLoadProject={handleLoadProject}
        currentFiles={generatedCode}
      />

      <AgentProgressPanel
        agents={agentStates}
        currentPhase={agentPhase}
        overallProgress={agentProgress}
        isActive={isAgentActive}
      />
    </div>
  );
}

export default App;
