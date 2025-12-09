// Agent system types and interfaces

export type AgentRole = 'coordinator' | 'architect' | 'frontend' | 'backend' | 'reviewer';

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'done' | 'error';

export interface AgentMessage {
  role: AgentRole;
  content: string;
  timestamp: number;
}

export interface AgentTask {
  id: string;
  assignedTo: AgentRole;
  description: string;
  status: AgentStatus;
  result?: string;
  error?: string;
}

export interface AgentState {
  role: AgentRole;
  name: string;
  status: AgentStatus;
  currentTask?: string;
  progress: number;
  icon: string;
  color: string;
}

export interface MultiAgentRequest {
  userPrompt: string;
  context?: string;
  existingCode?: any;
}

export interface MultiAgentResponse {
  success: boolean;
  files: Record<string, { language: string; content: string }>;
  agentMessages: AgentMessage[];
  tasks: AgentTask[];
  summary: string;
}

export interface AgentConfig {
  role: AgentRole;
  name: string;
  systemPrompt: string;
  icon: string;
  color: string;
}
