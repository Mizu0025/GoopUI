import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL,
  timeout: 60_000,
});

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  options?: Record<string, unknown>;
}

export interface ChatResponseChunk {
  model: string;
  created_at?: string;
  message?: ChatMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export const listModels = async () => {
  const response = await api.get<{ models: OllamaModel[] }>("/api/models");
  return response.data.models;
};

export const submitChat = async (payload: ChatRequest) => {
  const response = await api.post<ChatResponseChunk>("/api/chat", payload);
  return response.data;
};
