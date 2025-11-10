import { GoogleGenAI, GenerateContentResponse, Part, Content } from "@google/genai";
import type { ChatMessage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelConfig = {
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are PAL AI, a friendly and helpful AI assistant. Your answers should be informative and well-formatted in markdown.',
    },
};

const convertMessagesToContent = (messages: ChatMessage[]): Content[] => {
    const geminiHistory: Content[] = [];
    for (const msg of messages) {
        const parts: Part[] = [];
        if (msg.content) {
            parts.push({ text: msg.content });
        }
        if (msg.attachment && msg.role === 'user') {
            parts.push({
                inlineData: {
                    data: msg.attachment.data,
                    mimeType: msg.attachment.mimeType,
                }
            });
        }
        
        if (parts.length > 0) {
            geminiHistory.push({ role: msg.role, parts });
        }
    }
    return geminiHistory;
}

export const sendMessageStream = (
  history: ChatMessage[],
  message: string,
  attachment?: { data: string; mimeType: string },
  useSearch?: boolean
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    
    const contents = convertMessagesToContent(history);
    
    const userParts: Part[] = [];
    if (message) {
      userParts.push({ text: message });
    }
    if (attachment) {
      userParts.push({ inlineData: { data: attachment.data, mimeType: attachment.mimeType }});
    }

    contents.push({ role: 'user', parts: userParts });
    
    // FIX: Conditionally add the `tools` property to the config object to avoid a TypeScript error.
    const config = {
      ...modelConfig.config,
      ...(useSearch && { tools: [{ googleSearch: {} }] }),
    };

    return ai.models.generateContentStream({
        model: modelConfig.model,
        contents: contents,
        config: config
    });
};

// Image generation
export const generateImage = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
  }
  throw new Error("Image generation failed or returned no images.");
};

// Describe image
export const describeImage = async (attachment: { data: string; mimeType: string }): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: "Describe this image in detail. What are the key objects, colors, and the overall mood? Format your response in markdown." },
        { inlineData: { data: attachment.data, mimeType: attachment.mimeType } }
      ]
    },
  });
  return response.text;
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
