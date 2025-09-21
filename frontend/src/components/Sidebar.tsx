import { clsx } from "clsx";
import type { ChatThread } from "../lib/chat";
import { resolveThreadTitle } from "../lib/chat";

type SidebarProps = {
  threads: ChatThread[];
  activeThreadId: string | null;
  hasThreads: boolean;
  showHistory: boolean;
  onCloseHistory: () => void;
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onNewChat: () => void;
  onClearHistory: () => void;
  onOpenSettings: () => void;
};

const Sidebar = ({
  threads,
  activeThreadId,
  hasThreads,
  showHistory,
  onCloseHistory,
  onSelectThread,
  onDeleteThread,
  onNewChat,
  onClearHistory,
  onOpenSettings,
}: SidebarProps) => {
  return (
    <aside
      className={clsx(
        "sidebar",
        showHistory ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="sidebar-content">
        <div className="sidebar-header">
          <div>
            <h2 className="sidebar-title">GoopUI</h2>
            <p className="sidebar-subtitle">Chat with local Ollama</p>
          </div>
          <button type="button" className="sidebar-dismiss" onClick={onCloseHistory}>
            Close
          </button>
        </div>

        <button type="button" onClick={onNewChat} className="sidebar-button">
          New chat
        </button>

        <button
          type="button"
          onClick={onClearHistory}
          disabled={!hasThreads}
          className={clsx(
            "sidebar-clear",
            hasThreads ? "sidebar-clear--enabled" : "sidebar-clear--disabled"
          )}
        >
          Clear history
        </button>

        <div className="thread-list">
          {threads.length === 0 ? (
            <div className="thread-empty">Conversations you start will appear here.</div>
          ) : (
            threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <div
                  key={thread.id}
                  role="button"
                  tabIndex={0}
                  aria-selected={isActive}
                  onClick={() => onSelectThread(thread.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectThread(thread.id);
                    }
                  }}
                  className={clsx(
                    "thread-item group",
                    isActive ? "thread-item--active" : "thread-item--inactive"
                  )}
                >
                  <div className="thread-title-row">
                    <span className="truncate">{resolveThreadTitle(thread)}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteThread(thread.id);
                      }}
                      className="thread-delete"
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

        <div className="sidebar-settings">
          <div className="sidebar-settings-header">
            <h3 className="sidebar-settings-title">Settings</h3>
            <span aria-hidden="true" className="text-base">
              ⚙️
            </span>
          </div>
          <button type="button" className="sidebar-settings-button" onClick={onOpenSettings}>
            Open settings
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
