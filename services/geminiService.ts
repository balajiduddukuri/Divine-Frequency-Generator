
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ReflectionResponse } from "../types";

// Always initialize the client using a named parameter with process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDailyInspiration = async (): Promise<ReflectionResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a short, soulful, and inspiring reflection or quote related to the Hare Krishna Maha Mantra, its benefits for peace of mind, or the power of chanting. Keep it under 150 characters.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            source: { type: Type.STRING }
          },
          required: ["message"]
        }
      }
    });

    // Access the .text property directly from GenerateContentResponse
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as ReflectionResponse;
  } catch (error) {
    console.error("Error fetching inspiration:", error);
    return { 
      message: "The holy name is the most precious gift to humanity.",
      source: "Ancient Wisdom"
    };
  }
};

export const getMantraMeaning = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Briefly explain the spiritual meaning and significance of the Maha Mantra (Hare Krishna) in 2-3 sentences.",
    });
    return response.text;
  } catch (error) {
    return "The Maha Mantra is a call to the divine energy of God (Hare) and the all-attractive Lord (Krishna/Rama) for spiritual connection and peace.";
  }
};

export const getMantraAudio = async (): Promise<string | undefined> => {
  try {
    const prompt = `Say the Maha Mantra clearly and soulfully: 
    Hare Krishna Hare Krishna
    Krishna Krishna Hare Hare
    Hare Rama Hare Rama
    Rama Rama Hare Hare`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("Error generating TTS:", error);
    return undefined;
  }
};
