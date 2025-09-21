import type { ChatMessage } from "./api";

export const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant.";
export const TITLE_FALLBACK = "New conversation";

export interface ChatThread {
  id: string;
  title: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateThreadOptions {
  model: string;
  systemPrompt: string;
  firstMessage: ChatMessage;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 12);

export const sanitizeSystemPrompt = (value: string) => value.trim() || DEFAULT_SYSTEM_PROMPT;

export const buildTitleFromContent = (content: string): string => {
  const trimmed = content.trim();
  if (!trimmed) return TITLE_FALLBACK;
  const words = trimmed.split(/\s+/).slice(0, 8).join(" ");
  return trimmed.length > words.length ? `${words}…` : words;
};

export const buildRequestMessages = (
  history: ChatMessage[],
  systemPrompt: string
): ChatMessage[] => {
  const prompt = sanitizeSystemPrompt(systemPrompt);
  const initial: ChatMessage[] = prompt ? [{ role: "system", content: prompt }] : [];
  return initial.concat(history);
};

export const createThread = ({
  model,
  systemPrompt,
  firstMessage,
  id,
  createdAt,
  updatedAt,
}: CreateThreadOptions): ChatThread => {
  const timestamp = createdAt ?? new Date().toISOString();
  return {
    id: id ?? createId(),
    title: buildTitleFromContent(firstMessage.content),
    model,
    systemPrompt: sanitizeSystemPrompt(systemPrompt),
    messages: [firstMessage],
    createdAt: timestamp,
    updatedAt: updatedAt ?? timestamp,
  };
};
