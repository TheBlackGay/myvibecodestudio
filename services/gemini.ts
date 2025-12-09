
import { GoogleGenAI } from "@google/genai";
import { INITIAL_SYSTEM_INSTRUCTION } from "../constants";
import { AISettings, Message, Role } from "../types";

export const streamGemini = async function* (
  messages: Message[],
  settings: AISettings
) {
  if (!settings.apiKey) {
    throw new Error("Missing API Key for Gemini.");
  }

  const ai = new GoogleGenAI({ apiKey: settings.apiKey });
  
  // Transform app messages to Gemini history format
  // We exclude the very last message because sendMessageStream takes the new message
  const historyMessages = messages.slice(0, -1);
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.role !== Role.USER) {
      // Should not happen if called correctly
      throw new Error("Invalid message history structure.");
  }

  const chat = ai.chats.create({
    model: settings.model,
    config: {
      systemInstruction: INITIAL_SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
    history: historyMessages.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))
  });

  const result = await chat.sendMessageStream({ 
    message: lastMessage.content 
  });

  for await (const chunk of result) {
    const text = chunk.text;
    if (text) {
      yield { text };
    }
  }
};
