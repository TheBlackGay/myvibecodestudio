import { GoogleGenAI, Chat, GenerativeModel } from "@google/genai";
import { INITIAL_SYSTEM_INSTRUCTION, GEMINI_MODEL } from "../constants";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

export const initializeGemini = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing from environment variables.");
    return;
  }
  try {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI", error);
  }
};

export const getChatSession = (): Chat => {
  if (!genAI) {
    initializeGemini();
    if (!genAI) {
       throw new Error("Gemini AI not initialized. Missing API Key?");
    }
  }

  if (!chatSession) {
    chatSession = genAI.chats.create({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: INITIAL_SYSTEM_INSTRUCTION,
        temperature: 0.7, // Balance creativity and correctness
      },
    });
  }
  return chatSession;
};

export const sendMessageStream = async (message: string) => {
  const chat = getChatSession();
  
  try {
    const result = await chat.sendMessageStream({ message });
    return result;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};

export const resetChat = () => {
  chatSession = null;
};
