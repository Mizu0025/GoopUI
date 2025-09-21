import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import "./App.css";
import { useQuery } from "@tanstack/react-query";

import {
  ChatMessage,
  ChatResponseChunk,
  listModels,
  OllamaModel,
  submitChat,
} from "./lib/api";
import {
  DEFAULT_SYSTEM_PROMPT,
  TITLE_FALLBACK,
  buildRequestMessages,
  buildTitleFromContent,
  createThread,
  sanitizeSystemPrompt,
  resolveThreadTitle,
  type ChatThread,
} from "./lib/chat";
import {
  AppSettings,
  DEFAULT_SETTINGS,
  loadStoredSettings,
  persistSettings,
} from "./lib/settings";
import Sidebar from "./components/Sidebar";
import HeaderBar from "./components/HeaderBar";
import ChatArea from "./components/ChatArea";
import Composer from "./components/Composer";
import SettingsModal from "./components/SettingsModal";
import welcomeImage from "./assets/welcome.png";

const THREADS_STORAGE_KEY = "goopui_threads_v1";
const ACTIVE_THREAD_STORAGE_KEY = "goopui_active_thread";

const App = () => {
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredSettings());
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
  const [systemPromptInput, setSystemPromptInput] = useState(settings.defaultSystemPrompt);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    persistSettings(settings);
  }, [settings]);

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
      setSystemPromptInput(settings.defaultSystemPrompt);
    }
  }, [currentThread?.id, currentThread?.systemPrompt, settings.defaultSystemPrompt]);

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
    if (!settings.autoScroll) return;
    if (!currentThread) {
      setIsScrolledUp(false);
      requestAnimationFrame(() => scrollToBottom("auto"));
      return;
    }
    if (!isScrolledUp) {
      requestAnimationFrame(() => scrollToBottom(history.length <= 1 ? "auto" : "smooth"));
    }
  }, [history.length, currentThread?.id, isScrolledUp, settings.autoScroll]);

  useEffect(() => {
    if (!settings.autoScroll) return;
    if (!isScrolledUp && isSending) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
    }
  }, [isSending, isScrolledUp, settings.autoScroll]);

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

    if (settings.autoScroll) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
    }

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
    setSystemPromptInput(settings.defaultSystemPrompt);
    setInput("");
    setErrorMessage(null);
    setIsScrolledUp(false);
    setShowHistory(false);
    if (settings.autoScroll) {
      requestAnimationFrame(() => scrollToBottom("auto"));
    }
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setShowHistory(false);
    setIsScrolledUp(false);
    if (settings.autoScroll) {
      requestAnimationFrame(() => scrollToBottom("auto"));
    }
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
    setSystemPromptInput(settings.defaultSystemPrompt);
    setShowHistory(false);
    setIsScrolledUp(false);
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  const handleSaveSettings = (next: AppSettings) => {
    setSettings(next);
    setIsSettingsOpen(false);
  };

  const isReady = useMemo(() => !loadingModels && !!selectedModel, [loadingModels, selectedModel]);

  const statusText = loadingModels ? "Loading models…" : isReady ? "Ready" : "Select a model";

  const canChangeModel = !currentThread || currentThread.messages.length === 0;
  const modelSelectDisabled = loadingModels || !canChangeModel || (models?.length ?? 0) === 0;

  const welcomeName = settings.userName.trim() || DEFAULT_SETTINGS.userName;
  const showWelcomeImage = settings.showPromptIdeas;
  const defaultPromptForComparison = sanitizeSystemPrompt(settings.defaultSystemPrompt);
  const shouldShowSystemPromptCard =
    !!currentThread &&
    currentThread.systemPrompt.trim().length > 0 &&
    sanitizeSystemPrompt(currentThread.systemPrompt) !== defaultPromptForComparison;

  return (
    <div className="app-shell">
      {showHistory && <div className="app-overlay" onClick={() => setShowHistory(false)} />}
      <div className="app-layout">
        <Sidebar
          threads={sortedThreads}
          activeThreadId={currentThread?.id ?? null}
          hasThreads={hasThreads}
          showHistory={showHistory}
          onCloseHistory={() => setShowHistory(false)}
          onSelectThread={handleSelectThread}
          onDeleteThread={handleDeleteThread}
          onNewChat={handleNewChat}
          onClearHistory={handleClearHistory}
          onOpenSettings={handleOpenSettings}
        />

        <div className="app-main">
          <HeaderBar
            statusText={statusText}
            loadingModels={loadingModels}
            models={models}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            modelSelectDisabled={modelSelectDisabled}
            onToggleHistory={() => setShowHistory(true)}
          />

          <ChatArea
            history={history}
            currentThread={currentThread}
            scrollContainerRef={scrollContainerRef}
            isScrolledUp={isScrolledUp}
            onScrollToBottom={() => scrollToBottom("smooth")}
            isSending={isSending}
            shouldShowSystemPromptCard={shouldShowSystemPromptCard}
            welcomeName={welcomeName}
            showWelcomeImage={showWelcomeImage}
            welcomeImageSrc={welcomeImage}
          />

          <Composer
            input={input}
            systemPromptInput={systemPromptInput}
            isReady={isReady}
            isSending={isSending}
            selectedModel={selectedModel}
            errorMessage={errorMessage}
            modelsError={modelsError}
            onInputChange={setInput}
            onSystemPromptChange={handleSystemPromptChange}
            onKeyDown={handleKeyDown}
            onSend={handleSend}
          />
        </div>
      </div>

      <SettingsModal
        open={isSettingsOpen}
        initialSettings={settings}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;
