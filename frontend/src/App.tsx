import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";
import {
  ChatMessage,
  ChatResponseChunk,
  listModels,
  OllamaModel,
  submitChat,
} from "./lib/api";
import LoadingIndicator from "./components/LoadingIndicator";
import {
  DEFAULT_SYSTEM_PROMPT,
  TITLE_FALLBACK,
  buildRequestMessages,
  buildTitleFromContent,
  createThread,
  sanitizeSystemPrompt,
} from "./lib/chat";
import type { ChatThread } from "./lib/chat";

const THREADS_STORAGE_KEY = "goopui_threads_v1";
const ACTIVE_THREAD_STORAGE_KEY = "goopui_active_thread";

const promptIdeas = [
  {
    title: "Summarize",
    description: "Paste a document and ask for a concise summary.",
    prompt: "Summarize the following article and highlight key takeaways:\n",
  },
  {
    title: "Brainstorm",
    description: "Generate ideas for projects, events, or content.",
    prompt: "Brainstorm five novel project ideas that combine AI and sustainability.",
  },
  {
    title: "Explain",
    description: "Ask for explanations in plain language.",
    prompt: "Explain quantum entanglement in simple terms for a 12-year-old.",
  },
  {
    title: "Draft",
    description: "Create drafts for messages, emails, or plans.",
    prompt: "Draft a friendly email following up after a networking event.",
  },
];

const ScrollToBottomButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-sky-100 shadow-lg shadow-slate-950/40 transition hover:border-sky-400 hover:bg-slate-900"
  >
    ↓ Latest
  </button>
);

const resolveThreadTitle = (thread: ChatThread): string => {
  if (thread.title && thread.title.trim() && thread.title !== TITLE_FALLBACK) {
    return thread.title;
  }
  const assistantFirst = thread.messages.find((message) => message.role === "assistant");
  if (assistantFirst?.content.trim()) {
    return buildTitleFromContent(assistantFirst.content);
  }
  const userFirst = thread.messages.find((message) => message.role === "user");
  if (userFirst?.content.trim()) {
    return buildTitleFromContent(userFirst.content);
  }
  return TITLE_FALLBACK;
};

const App = () => {
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    const raw = window.localStorage.getItem(THREADS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ChatThread[]) : [];
    } catch (error) {
      console.error("Failed to parse stored threads", error);
      return [];
    }
  });
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(ACTIVE_THREAD_STORAGE_KEY);
  });
  const [systemPromptInput, setSystemPromptInput] = useState(DEFAULT_SYSTEM_PROMPT);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    data: models,
    isLoading: loadingModels,
    error: modelsError,
  } = useQuery<OllamaModel[]>({ queryKey: ["models"], queryFn: listModels });

  const currentThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      const updatedDiff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (updatedDiff !== 0) return updatedDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [threads]);

  const history = currentThread?.messages ?? [];
  const hasThreads = threads.length > 0;

  useEffect(() => {
    setThreads((prev) => {
      let changed = false;
      const next = prev.map((thread) => {
        const derived = resolveThreadTitle(thread);
        if (derived !== thread.title) {
          changed = true;
          return { ...thread, title: derived };
        }
        return thread;
      });
      return changed ? next : prev;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeThreadId) {
      window.localStorage.setItem(ACTIVE_THREAD_STORAGE_KEY, activeThreadId);
    } else {
      window.localStorage.removeItem(ACTIVE_THREAD_STORAGE_KEY);
    }
  }, [activeThreadId]);

  useEffect(() => {
    if (!activeThreadId) return;
    if (threads.some((thread) => thread.id === activeThreadId)) return;
    setActiveThreadId(threads[0]?.id ?? null);
  }, [threads, activeThreadId]);

  useEffect(() => {
    if (currentThread) {
      setSystemPromptInput(currentThread.systemPrompt);
    } else {
      setSystemPromptInput(DEFAULT_SYSTEM_PROMPT);
    }
  }, [currentThread?.id, currentThread?.systemPrompt]);

  useEffect(() => {
    if (loadingModels) return;
    const firstModel = models?.[0]?.name;
    if (currentThread) {
      if (currentThread.model && currentThread.model !== selectedModel) {
        setSelectedModel(currentThread.model);
      }
    } else if (!selectedModel && firstModel) {
      setSelectedModel(firstModel);
    }
  }, [loadingModels, models, currentThread?.id, currentThread?.model, selectedModel]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setIsScrolledUp(distanceFromBottom > 160);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [currentThread?.id]);

  useEffect(() => {
    if (!currentThread) {
      setIsScrolledUp(false);
      requestAnimationFrame(() => scrollToBottom("auto"));
      return;
    }
    if (!isScrolledUp) {
      requestAnimationFrame(() => scrollToBottom(history.length <= 1 ? "auto" : "smooth"));
    }
  }, [history.length, currentThread?.id, isScrolledUp]);

  useEffect(() => {
    if (!isScrolledUp && isSending) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
    }
  }, [isSending, isScrolledUp]);

  const isReady = useMemo(
    () => !loadingModels && !!selectedModel,
    [loadingModels, selectedModel]
  );

  const statusText = loadingModels
    ? "Loading models…"
    : isReady
    ? "Ready"
    : "Select a model";

  const canChangeModel = !currentThread || currentThread.messages.length === 0;
  const modelSelectDisabled = loadingModels || !canChangeModel || (models?.length ?? 0) === 0;

  const handleSystemPromptChange = (value: string) => {
    setSystemPromptInput(value);
    if (currentThread) {
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === currentThread.id ? { ...thread, systemPrompt: value } : thread
        )
      );
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedModel) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const promptForRequest = currentThread ? currentThread.systemPrompt : systemPromptInput;
    const requestMessages = buildRequestMessages([...history, userMessage], promptForRequest);

    setInput("");
    setIsSending(true);
    setErrorMessage(null);

    const now = new Date().toISOString();
    let threadId = currentThread?.id ?? null;
    let threadWasCreated = false;

    if (!currentThread) {
      const newThread = createThread({
        model: selectedModel,
        systemPrompt: systemPromptInput,
        firstMessage: userMessage,
      });
      setThreads((prev) => [...prev, newThread]);
      setActiveThreadId(newThread.id);
      threadId = newThread.id;
      threadWasCreated = true;
    } else {
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === currentThread.id
            ? {
                ...thread,
                title:
                  thread.messages.length === 0
                    ? buildTitleFromContent(userMessage.content)
                    : thread.title,
                messages: [...thread.messages, userMessage],
                updatedAt: now,
              }
            : thread
        )
      );
    }

    requestAnimationFrame(() => scrollToBottom("smooth"));

    try {
      const response: ChatResponseChunk = await submitChat({
        model: selectedModel,
        messages: requestMessages,
        stream: false,
      });

      if (response.message && threadId) {
        const assistantMessage = response.message;
        setThreads((prev) =>
          prev.map((thread) => {
            if (thread.id !== threadId) {
              return thread;
            }
            const nextTitle = assistantMessage.content.trim()
              ? buildTitleFromContent(assistantMessage.content)
              : thread.title;
            return {
              ...thread,
              title:
                thread.title && thread.title !== TITLE_FALLBACK
                  ? thread.title
                  : nextTitle,
              messages: [...thread.messages, assistantMessage],
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to send message. Check backend and Ollama server.");
      if (threadId) {
        setThreads((prev) => {
          const updated: ChatThread[] = [];
          prev.forEach((thread) => {
            if (thread.id !== threadId) {
              updated.push(thread);
              return;
            }
            const messages = thread.messages.slice(0, -1);
            if (messages.length === 0) {
              return;
            }
            updated.push({
              ...thread,
              messages,
              updatedAt: new Date().toISOString(),
            });
          });
          return updated;
        });
        if (threadWasCreated) {
          setActiveThreadId(null);
        }
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setActiveThreadId(null);
    setSystemPromptInput(DEFAULT_SYSTEM_PROMPT);
    setInput("");
    setErrorMessage(null);
    setIsScrolledUp(false);
    setShowHistory(false);
    requestAnimationFrame(() => scrollToBottom("auto"));
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setShowHistory(false);
    setIsScrolledUp(false);
    requestAnimationFrame(() => scrollToBottom("auto"));
  };

  const handleIdeaClick = (prompt: string) => {
    setInput(prompt);
    setShowHistory(false);
    requestAnimationFrame(() => scrollToBottom("smooth"));
  };

  const handleDeleteThread = (threadId: string) => {
    setThreads((prev) => {
      const updated = prev.filter((thread) => thread.id !== threadId);
      if (activeThreadId === threadId) {
        setActiveThreadId(updated[0]?.id ?? null);
      }
      if (updated.length === 0) {
        setShowHistory(false);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setThreads([]);
    setActiveThreadId(null);
    setInput("");
    setErrorMessage(null);
    setSystemPromptInput(DEFAULT_SYSTEM_PROMPT);
    setShowHistory(false);
    setIsScrolledUp(false);
  };

  const shouldShowSystemPromptCard =
    !!currentThread &&
    currentThread.systemPrompt.trim().length > 0 &&
    sanitizeSystemPrompt(currentThread.systemPrompt) !== DEFAULT_SYSTEM_PROMPT;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-900 text-slate-100">
      {showHistory && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/70 backdrop-blur-sm md:hidden"
          onClick={() => setShowHistory(false)}
        />
      )}
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col md:flex-row">
        <aside
          className={clsx(
            "fixed inset-y-0 left-0 z-30 w-72 transform border-r border-white/10 bg-slate-950/95 p-5 transition-transform duration-200 md:static md:block md:h-screen md:w-72 md:translate-x-0 md:bg-transparent md:p-6",
            showHistory ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="flex items-center justify-between md:block">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">GoopUI</h2>
              <p className="text-xs text-slate-400">Chat with local Ollama</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs text-slate-300 md:hidden"
              onClick={() => setShowHistory(false)}
            >
              Close
            </button>
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            className="mt-6 w-full rounded-2xl border border-sky-500/30 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-200 transition hover:border-sky-400/50 hover:bg-sky-500/20"
          >
            New chat
          </button>

          <button
            type="button"
            onClick={handleClearHistory}
            disabled={!hasThreads}
            className={clsx(
              "mt-3 w-full rounded-2xl border px-4 py-2 text-sm font-medium transition",
              hasThreads
                ? "border-white/10 bg-slate-900/60 text-slate-300 hover:border-red-400/60 hover:bg-red-500/15 hover:text-red-200"
                : "cursor-not-allowed border-white/5 bg-slate-900/30 text-slate-600"
            )}
          >
            Clear history
          </button>

          <div className="mt-6 space-y-2 overflow-y-auto pr-1 text-sm text-slate-300 md:h-[calc(100vh-13rem)]">
            {sortedThreads.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-6 text-center text-xs text-slate-500">
                Conversations you start will appear here.
              </div>
            ) : (
              sortedThreads.map((thread) => {
                const isActive = thread.id === currentThread?.id;
                return (
                  <div
                    key={thread.id}
                    role="button"
                    tabIndex={0}
                    aria-selected={isActive}
                    onClick={() => handleSelectThread(thread.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleSelectThread(thread.id);
                      }
                    }}
                    className={clsx(
                      "group cursor-pointer rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                      isActive
                        ? "border-sky-500/40 bg-sky-500/15 text-sky-100"
                        : "border-white/5 bg-slate-900/40 text-slate-300 hover:border-white/15 hover:bg-slate-900/60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 text-sm font-medium text-slate-100">
                      <span className="truncate">{resolveThreadTitle(thread)}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteThread(thread.id);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-red-400/60 hover:bg-red-500/15 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-400/60"
                        aria-label="Delete chat"
                        title="Delete chat"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-full border border-white/10 bg-slate-900/70 p-2 text-slate-300 transition hover:border-white/20 hover:text-white md:hidden"
                  onClick={() => setShowHistory(true)}
                >
                  <span className="sr-only">Toggle history</span>
                  ☰
                </button>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">GoopUI</h1>
                  <p className="text-xs text-slate-400">Powered by your local models</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{statusText}</span>
                <label className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-slate-200">
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">Model</span>
                  <select
                    className="bg-transparent text-sm font-medium text-slate-100 outline-none disabled:text-slate-600"
                    value={selectedModel ?? ""}
                    onChange={(event) => setSelectedModel(event.target.value)}
                    disabled={modelSelectDisabled}
                    title={
                      !canChangeModel && currentThread
                        ? "Model locked after conversation starts"
                        : undefined
                    }
                  >
                    <option value="" disabled>
                      {loadingModels ? "Loading…" : "Select"}
                    </option>
                    {models?.map((model) => (
                      <option key={model.name} value={model.name} className="bg-slate-900 text-slate-100">
                        {model.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </header>

          <div className="relative flex flex-1 flex-col overflow-hidden">
            <main ref={scrollContainerRef} className="flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
                {shouldShowSystemPromptCard && (
                  <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 text-sm text-slate-300 shadow-lg shadow-slate-950/40">
                    <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">System prompt</div>
                    <p className="whitespace-pre-wrap">{currentThread?.systemPrompt}</p>
                  </div>
                )}

                {history.length === 0 ? (
                  <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-10 text-center shadow-xl shadow-slate-950/40">
                    <h2 className="text-3xl font-semibold text-white">How can I help?</h2>
                    <p className="mt-3 text-base text-slate-300">
                      Ask about your projects, draft content, or explore new ideas with your local models.
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {promptIdeas.map((idea) => (
                        <button
                          key={idea.title}
                          type="button"
                          className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4 text-left transition hover:border-sky-400/40 hover:bg-sky-500/15"
                          onClick={() => handleIdeaClick(idea.prompt)}
                        >
                          <div className="text-sm font-semibold text-slate-100">{idea.title}</div>
                          <div className="mt-2 text-xs text-slate-400">{idea.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  history.map((message, index) => (
                    <div key={`${message.role}-${index}`}>
                      {message.role === "assistant" ? (
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/15 text-sm font-semibold text-sky-300">
                            AI
                          </div>
                          <div className="w-full rounded-3xl border border-sky-500/30 bg-slate-900/70 p-5 text-slate-100 shadow-xl shadow-sky-900/30">
                            {message.content.split(/\n{2,}/g).map((block, blockIndex) => (
                              <p key={blockIndex} className="mb-3 whitespace-pre-wrap text-base leading-7 last:mb-0">
                                {block.length ? block : "\u00A0"}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <div className="max-w-full rounded-3xl border border-slate-200/20 bg-slate-100 px-5 py-5 text-right text-slate-900 shadow-lg shadow-slate-950/30 sm:max-w-xl">
                            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">You</div>
                            {message.content.split(/\n{2,}/g).map((block, blockIndex) => (
                              <p key={blockIndex} className="mb-3 whitespace-pre-wrap text-base leading-7 last:mb-0">
                                {block.length ? block : "\u00A0"}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isSending && (
                  <div className="flex items-start gap-3 text-sm text-slate-400">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/15 text-sm font-semibold text-sky-300">
                      AI
                    </div>
                    <div className="flex items-center gap-3 rounded-3xl border border-sky-500/20 bg-slate-900/40 px-5 py-4">
                      <LoadingIndicator />
                      <span>Thinking…</span>
                    </div>
                  </div>
                )}
              </div>
            </main>

            {isScrolledUp && history.length > 0 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-40 flex justify-center md:bottom-32">
                <div className="pointer-events-auto rounded-full bg-slate-950/40 p-2 shadow-lg shadow-slate-950/40 backdrop-blur">
                  <ScrollToBottomButton onClick={() => scrollToBottom("smooth")} />
                </div>
              </div>
            )}

            <footer className="border-t border-white/10 bg-slate-950/80">
              <div className="mx-auto w-full max-w-4xl px-4 py-6">
                <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/60 p-4 shadow-xl shadow-slate-950/40">
                  {modelsError && (
                    <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      Failed to load models. Ensure the backend is running.
                    </div>
                  )}
                  {errorMessage && (
                    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-100">
                      {errorMessage}
                    </div>
                  )}

                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={4}
                    placeholder={selectedModel ? "Ask anything..." : "Waiting for models to load"}
                    className="w-full resize-none rounded-3xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm text-slate-100 outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30 disabled:opacity-50"
                    disabled={!isReady || isSending}
                  />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 text-xs text-slate-300">
                      <span className="block text-xs uppercase tracking-wide text-slate-500">System prompt</span>
                      <input
                        type="text"
                        value={systemPromptInput}
                        onChange={(event) => handleSystemPromptChange(event.target.value)}
                        placeholder="Customize the assistant's persona"
                        className="mt-1 w-full bg-transparent text-sm text-slate-100 outline-none"
                      />
                    </label>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!isReady || !input.trim() || isSending}
                        className={clsx(
                          "flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition",
                          !isReady || !input.trim() || isSending
                            ? "bg-slate-800 text-slate-500"
                            : "bg-sky-400 text-slate-950 hover:bg-sky-300"
                        )}
                      >
                        {isSending ? (
                          <>
                            <LoadingIndicator />
                            Sending…
                          </>
                        ) : (
                          "Send"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
