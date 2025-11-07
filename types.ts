export interface Source {
  uri: string;
  title: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  sources?: Source[];
}

export interface User {
    name: string;
    email: string;
    password?: string; // Only used for mock signup
}

export interface UserCredentials {
    email: string;
    password?: string;
    name?: string;
}

export interface ImageGeneratorState {
  prompt: string;
  isLoading: boolean;
  imageUrl: string | null;
  error: string | null;
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