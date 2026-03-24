
import { GoogleGenAI, Type, Modality } from "@google/genai";

export const getGeminiAdvisor = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: `You are a helpful and kind medical assistant for elderly people. 
      Answer questions about medicines clearly. Use simple language. 
      Always advise consulting a doctor for professional medical changes. 
      If a user says they missed a dose, give safe general advice based on the medicine's common protocols.`,
    },
  });
  return response.text;
};

export const getAdherenceReport = async (logs: any[], medicines: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const dataString = JSON.stringify({ logs, medicines });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this medicine adherence data and provide a concise summary for a doctor. Highlight any missed doses and trends: ${dataString}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          score: { type: Type.NUMBER, description: 'Compliance score out of 100' },
          alerts: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["summary", "score", "alerts"]
      }
    }
  });
  
  return JSON.parse(response.text || '{}');
};

export const generateVoiceReminder = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
};
