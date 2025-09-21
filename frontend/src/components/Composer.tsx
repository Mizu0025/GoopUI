import type { KeyboardEvent } from "react";
import { clsx } from "clsx";
import LoadingIndicator from "./LoadingIndicator";

type ComposerProps = {
  input: string;
  systemPromptInput: string;
  isReady: boolean;
  isSending: boolean;
  selectedModel: string | undefined;
  errorMessage: string | null;
  modelsError: unknown;
  onInputChange: (value: string) => void;
  onSystemPromptChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
};

const Composer = ({
  input,
  systemPromptInput,
  isReady,
  isSending,
  selectedModel,
  errorMessage,
  modelsError,
  onInputChange,
  onSystemPromptChange,
  onKeyDown,
  onSend,
}: ComposerProps) => {
  const disableSend = !isReady || !input.trim() || isSending;

  return (
    <footer className="border-t border-blue-500/25 bg-blue-950/80">
      <div className="mx-auto w-full max-w-4xl px-4 py-5">
        <div className="composer-card">
          {Boolean(modelsError) && (
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
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            rows={4}
            placeholder={selectedModel ? "Ask anything..." : "Waiting for models to load"}
            className="composer-textarea"
            disabled={!isReady || isSending}
          />

          <div className="composer-footer">
            <button
              type="button"
              onClick={onSend}
              disabled={disableSend}
              className={clsx(
                "composer-send",
                disableSend ? "composer-send--disabled" : "composer-send--active"
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
    </footer>
  );
};

export default Composer;
