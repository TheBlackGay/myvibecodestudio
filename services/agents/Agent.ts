// Base Agent class

import { AgentRole, AgentStatus, AgentMessage } from './types';
import { getAgentSystemPrompt } from './prompts';
import { sendMessage } from '../ai';
import { AISettings, Message, Role } from '../../types';

export class Agent {
  role: AgentRole;
  name: string;
  status: AgentStatus;
  systemPrompt: string;
  messages: AgentMessage[];
  settings: AISettings;
  
  constructor(role: AgentRole, name: string, settings: AISettings) {
    this.role = role;
    this.name = name;
    this.status = 'idle';
    this.systemPrompt = getAgentSystemPrompt(role);
    this.messages = [];
    this.settings = settings;
  }

  async execute(task: string, context?: string): Promise<string> {
    this.status = 'thinking';
    
    try {
      // Build the prompt with context
      const prompt = context 
        ? `${task}\n\nContext:\n${context}`
        : task;

      // Create messages with system prompt embedded in user message
      const fullPrompt = `${this.systemPrompt}\n\n---\n\nTask: ${prompt}`;
      
      const aiMessages: Message[] = [
        { 
          id: Date.now().toString(),
          role: Role.USER, 
          content: fullPrompt,
          timestamp: Date.now()
        }
      ];

      // Send to AI with agent's system prompt
      let fullResponse = '';
      
      const stream = await sendMessage(aiMessages, this.settings);
      
      for await (const chunk of stream) {
        if (chunk.text) {
          fullResponse += chunk.text;
        }
      }

      this.status = 'done';
      
      // Log the message
      this.messages.push({
        role: this.role,
        content: fullResponse,
        timestamp: Date.now()
      });

      return fullResponse;
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  reset() {
    this.status = 'idle';
    this.messages = [];
  }

  getMessages(): AgentMessage[] {
    return this.messages;
  }

  getStatus(): AgentStatus {
    return this.status;
  }
}
