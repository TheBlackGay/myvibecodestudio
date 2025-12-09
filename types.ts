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

export interface GeneratedCode {
  language: string;
  code: string;
}

export interface VibeSettings {
  model: string;
  creativity: number; // Temperature
  mode: 'architect' | 'designer' | 'developer';
}
