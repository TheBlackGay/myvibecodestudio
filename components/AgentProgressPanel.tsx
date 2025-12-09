import React from 'react';
import { Brain, Layers, Palette, Database, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { AgentState } from '../services/agents/types';

interface AgentProgressPanelProps {
  agents: AgentState[];
  currentPhase: string;
  overallProgress: number;
  isActive: boolean;
}

const AgentProgressPanel: React.FC<AgentProgressPanelProps> = ({ 
  agents, 
  currentPhase, 
  overallProgress,
  isActive 
}) => {
  const getAgentIcon = (role: string) => {
    switch (role) {
      case 'coordinator': return Brain;
      case 'architect': return Layers;
      case 'frontend': return Palette;
      case 'backend': return Database;
      case 'reviewer': return CheckCircle;
      default: return Brain;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
      case 'thinking':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'done':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-zinc-700" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
      case 'thinking':
        return 'border-indigo-500 bg-indigo-500/10';
      case 'done':
        return 'border-green-500 bg-green-500/10';
      case 'error':
        return 'border-red-500 bg-red-500/10';
      default:
        return 'border-zinc-700 bg-zinc-900/50';
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm">Multi-Agent System</h3>
            <p className="text-indigo-100 text-xs">{currentPhase}</p>
          </div>
        </div>
        
        {/* Overall Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-indigo-100 mb-1">
            <span>Overall Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {agents.map((agent) => {
          const Icon = getAgentIcon(agent.role);
          const isActive = agent.status === 'working' || agent.status === 'thinking';
          
          return (
            <div 
              key={agent.role}
              className={`p-3 rounded-lg border-2 transition-all ${getStatusColor(agent.status)} ${
                isActive ? 'shadow-lg' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Agent Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-indigo-500/20' : 'bg-zinc-800'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? agent.color : 'text-zinc-500'}`} />
                </div>

                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-semibold text-sm ${
                      isActive ? 'text-white' : 'text-zinc-400'
                    }`}>
                      {agent.name}
                    </span>
                    {getStatusIcon(agent.status)}
                  </div>
                  
                  {agent.currentTask && (
                    <p className="text-xs text-zinc-400 mb-2">{agent.currentTask}</p>
                  )}

                  {/* Progress Bar for Active Agent */}
                  {isActive && agent.progress > 0 && (
                    <div className="mt-2">
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-300"
                          style={{ width: `${agent.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span>Agents collaborating on your project...</span>
        </div>
      </div>
    </div>
  );
};

export default AgentProgressPanel;
