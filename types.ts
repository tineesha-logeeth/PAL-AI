export interface Source {
  uri: string;
  title: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  sources?: Source[];
  attachment?: {
    data: string;
    mimeType: string;
    previewUrl: string;
  };
}

export interface ImageGeneratorState {
  prompt: string;
  isLoading: boolean;
  generatedImageUrl: string | null;
  generatedDescription: string | null;
  error: string | null;
  mode: 'create' | 'describe';
  uploadedImage: { data: string; mimeType: string; previewUrl: string } | null;
}

export type Task = 'summarize' | 'proofread' | 'rephrase';
export type Model = 'gemini-2.5-pro' | 'gemini-2.5-flash';

export interface ToolsState {
  inputText: string;
  outputText: string;
  isLoading: boolean;
  selectedTask: Task;
  selectedModel: Model;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

// FIX: Add UserCredentials interface to resolve import error in AuthModal.tsx
export interface UserCredentials {
  email: string;
  password: string;
  name: string;
}
