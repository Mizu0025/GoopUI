import type { RefObject } from "react";
import type { ChatMessage } from "../lib/api";
import type { ChatThread } from "../lib/chat";
import LoadingIndicator from "./LoadingIndicator";
import ScrollToBottomButton from "./ScrollToBottomButton";
import WelcomeCard from "./WelcomeCard";

type ChatAreaProps = {
  history: ChatMessage[];
  currentThread: ChatThread | null;
  scrollContainerRef: RefObject<HTMLDivElement>;
  isScrolledUp: boolean;
  onScrollToBottom: () => void;
  isSending: boolean;
  shouldShowSystemPromptCard: boolean;
  welcomeName: string;
  showWelcomeImage: boolean;
  welcomeImageSrc: string;
};

const ChatArea = ({
  history,
  currentThread,
  scrollContainerRef,
  isScrolledUp,
  onScrollToBottom,
  isSending,
  shouldShowSystemPromptCard,
  welcomeName,
  showWelcomeImage,
  welcomeImageSrc,
}: ChatAreaProps) => {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <main ref={scrollContainerRef} className="chat-scroll">
        <div className="chat-content">
          {shouldShowSystemPromptCard && (
            <div className="system-prompt-card">
              <div className="system-prompt-label">System prompt</div>
              <p className="whitespace-pre-wrap">{currentThread?.systemPrompt}</p>
            </div>
          )}

          {history.length === 0 ? (
            <WelcomeCard
              welcomeName={welcomeName}
              showImage={showWelcomeImage}
              imageSrc={welcomeImageSrc}
            />
          ) : (
            history.map((message, index) => (
              <div key={`${message.role}-${index}`}>
                {message.role === "assistant" ? (
                  <div className="message-thread">
                    <div className="assistant-avatar">AI</div>
                    <div className="assistant-bubble">
                      {message.content.split(/\n{2,}/g).map((block, blockIndex) => (
                        <p key={blockIndex} className="message-paragraph">
                          {block.length ? block : "\u00A0"}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="user-row">
                    <div className="user-bubble">
                      <div className="user-label">You</div>
                      {message.content.split(/\n{2,}/g).map((block, blockIndex) => (
                        <p key={blockIndex} className="message-paragraph">
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
            <div className="typing-indicator">
              <div className="assistant-avatar">AI</div>
              <div className="typing-bubble">
                <LoadingIndicator />
                <span>Thinking…</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {isScrolledUp && history.length > 0 && (
        <div className="scroll-button-container">
          <div className="scroll-button-inner">
            <ScrollToBottomButton onClick={() => onScrollToBottom()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
