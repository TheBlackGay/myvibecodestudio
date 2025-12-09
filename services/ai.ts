
import { AISettings, Message } from "../types";
import { streamGemini } from "./gemini";
import { streamOpenAI } from "./openai";

export const sendMessage = async (
  messages: Message[],
  settings: AISettings
) => {
  if (settings.provider === 'openai') {
    return streamOpenAI(messages, settings);
  } else {
    // Default to Gemini
    return streamGemini(messages, settings);
  }
};
