import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";
import {
  ChatMessage,
  ChatResponseChunk,
  listModels,
  OllamaModel,
  submitChat,
} from "./lib/api";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
};

const AssistantBubble = ({ message }: { message: ChatMessage }) => (
  <div className="flex gap-3">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent">
      AI
    </div>
    <div className="rounded-2xl bg-slate-800/80 p-4 text-sm leading-relaxed shadow-lg">
      {message.content}
    </div>
  </div>
);

const UserBubble = ({ message }: { message: ChatMessage }) => (
  <div className="ml-auto flex gap-3">
    <div className="rounded-2xl bg-accent p-4 text-sm font-medium leading-relaxed text-slate-900 shadow-lg">
      {message.content}
    </div>
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-200">
      You
    </div>
  </div>
);

const SystemCard = ({ message }: { message: string }) => (
  <div className="mx-auto max-w-3xl rounded-xl border border-slate-700/80 bg-slate-800/70 p-4 text-sm text-slate-300">
    <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">System prompt</div>
    {message || <span className="italic text-slate-500">No system prompt set</span>}
  </div>
);

const mapHistoryToChunks = (history: ChatMessage[], systemPrompt: string) => {
  const result: ChatMessage[] = [];
  if (systemPrompt.trim()) {
    result.push({ role: "system", content: systemPrompt.trim() });
  }
  return result.concat(history);
};

const App = () => {
  const {
    data: models,
    isLoading: loadingModels,
    error: modelsError,
  } = useQuery<OllamaModel[]>({ queryKey: ["models"], queryFn: listModels });
  const [selectedModel, setSelectedModel] = useState<string | undefined>();
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant.");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!models || models.length === 0) return;
    setSelectedModel((prev) => prev ?? models[0].name);
  }, [models]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, systemPrompt]);

  const isReady = useMemo(() => !loadingModels && !!selectedModel, [loadingModels, selectedModel]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedModel) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const nextHistory = [...history, userMessage];
    setHistory(nextHistory);
    setInput("");
    setIsSending(true);
    setErrorMessage(null);

    try {
      const payload = {
        model: selectedModel,
        messages: mapHistoryToChunks(nextHistory, systemPrompt),
        stream: false,
      };
      const response: ChatResponseChunk = await submitChat(payload);
      if (response.message) {
        setHistory((current) => [...current, response.message as ChatMessage]);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to send message. Check backend and Ollama server.");
      setHistory((current) => current.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setHistory([]);
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">GoopUI</h1>
            <p className="text-sm text-slate-400">Chat with your local Ollama models from any device.</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="flex flex-col text-sm text-slate-300">
              <span className="text-xs uppercase tracking-wide text-slate-500">Model</span>
              <select
                className="mt-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/50"
                value={selectedModel ?? ""}
                onChange={(event) => setSelectedModel(event.target.value)}
                disabled={!isReady}
              >
                <option value="" disabled>
                  {loadingModels ? "Loading models..." : "Select model"}
                </option>
                {models?.map((model) => (
                  <option key={model.name} value={model.name}>
                    {model.name} ({formatBytes(model.size)})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-accent hover:text-accent"
            >
              Reset chat
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 pb-32 pt-6">
        <section className="flex flex-col gap-6">
          <SystemCard message={systemPrompt} />
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-900/60 p-10 text-center text-sm text-slate-400">
              Start chatting by selecting a model and sending a prompt.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {history.map((message, index) => (
                <div key={`${message.role}-${index}`}>
                  {message.role === "assistant" ? (
                    <AssistantBubble message={message} />
                  ) : (
                    <UserBubble message={message} />
                  )}
                </div>
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 py-4">
          {modelsError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              Failed to load models. Ensure the backend is running.
            </div>
          )}
          {errorMessage && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
              {errorMessage}
            </div>
          )}
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder={selectedModel ? "Write your message..." : "Waiting for models..."}
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40 disabled:opacity-50"
            disabled={!isReady || isSending}
          />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2">
                <span className="uppercase tracking-wide text-slate-500">System</span>
                <input
                  type="text"
                  value={systemPrompt}
                  onChange={(event) => setSystemPrompt(event.target.value)}
                  placeholder="Optional system prompt"
                  className="w-60 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={!isReady || !input.trim() || isSending}
              className={clsx(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                isReady && input.trim() && !isSending
                  ? "bg-accent text-slate-900 hover:bg-sky-300"
                  : "bg-slate-800 text-slate-500"
              )}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
