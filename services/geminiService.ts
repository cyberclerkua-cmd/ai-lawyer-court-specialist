
import { GoogleGenAI, Chat, Content } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const startChat = (systemInstruction: string, history?: Content[]): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
    config: {
      systemInstruction: systemInstruction,
    },
  });
};