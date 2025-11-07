import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Chat session for the regular chatbot
const chatSession: Chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction: 'You are PAL AI, a friendly and helpful AI assistant. Your answers should be informative and well-formatted in markdown.',
  },
});

export const sendMessageStream = (message: string): Promise<AsyncGenerator<GenerateContentResponse>> => {
  return chatSession.sendMessageStream({ message });
};

// Stateless call for search-grounded queries
export const sendMessageWithSearch = async (message: string): Promise<GenerateContentResponse> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: message,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response;
};

// Image generation
export const generateImage = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: '1:1',
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
  }
  throw new Error("Image generation failed or returned no images.");
};

// General purpose AI tasks
export const performTask = async (
  prompt: string, 
  model: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite'
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
  });
  return response.text;
};

// Real-time grammar correction
export const correctGrammar = async (text: string): Promise<string> => {
  if (!text.trim()) {
    return text;
  }
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: `Correct any grammar and spelling mistakes in the following text. Only return the corrected text. Do not add any extra explanations, comments, or markdown formatting. If the text is already correct, return it unchanged. Original text: "${text}"`,
    config: {
        temperature: 0.2,
    }
  });
  return response.text.trim();
};
