
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isError?: boolean;
}

export interface FileData {
  language: string;
  content: string;
}

export type GeneratedCode = Record<string, FileData>;

export type AIProvider = 'gemini' | 'openai';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
}
