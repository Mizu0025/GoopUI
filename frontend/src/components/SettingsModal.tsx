import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, type AppSettings } from "../lib/settings";
import { sanitizeSystemPrompt } from "../lib/chat";

type SettingsModalProps = {
  open: boolean;
  initialSettings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
};

const SettingsModal = ({ open, initialSettings, onClose, onSave }: SettingsModalProps) => {
  const [draft, setDraft] = useState<AppSettings>(initialSettings);

  useEffect(() => {
    if (open) {
      setDraft(initialSettings);
    }
  }, [open, initialSettings]);

  if (!open) return null;

  const handleSave = () => {
    const sanitized: AppSettings = {
      ...draft,
      userName: draft.userName.trim() || DEFAULT_SETTINGS.userName,
      defaultSystemPrompt: sanitizeSystemPrompt(draft.defaultSystemPrompt),
    };
    onSave(sanitized);
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_SETTINGS });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-dialog" role="dialog" aria-modal="true">
        <div className="modal-panel">
          <div className="modal-header">
            <h2 className="modal-title">Workspace settings</h2>
            <button type="button" className="modal-close" onClick={onClose}>
              ✖️
            </button>
          </div>

          <div className="modal-body">
            <div className="modal-field">
              <label className="modal-field-label" htmlFor="settings-display-name">
                Display name
              </label>
              <input
                id="settings-display-name"
                type="text"
                value={draft.userName}
                onChange={(event) => setDraft((prev) => ({ ...prev, userName: event.target.value }))}
                placeholder="How should we greet you?"
                className="modal-input"
              />
            </div>

            <div className="modal-field">
              <label className="modal-field-label" htmlFor="settings-default-prompt">
                Default system prompt
              </label>
              <textarea
                id="settings-default-prompt"
                value={draft.defaultSystemPrompt}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, defaultSystemPrompt: event.target.value }))
                }
                rows={4}
                placeholder="Set the assistant's default instructions"
                className="modal-textarea"
              />
            </div>

            <div className="modal-toggles">
              <label className="modal-checkbox">
                <input
                  type="checkbox"
                  checked={draft.autoScroll}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, autoScroll: event.target.checked }))
                  }
                  className="modal-checkbox-input"
                />
                <span>Auto-scroll to latest reply</span>
              </label>
              <label className="modal-checkbox">
                <input
                  type="checkbox"
                  checked={draft.showPromptIdeas}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, showPromptIdeas: event.target.checked }))
                  }
                  className="modal-checkbox-input"
                />
                <span>Show welcome artwork on empty chats</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-secondary" onClick={handleReset}>
              Reset to defaults
            </button>
            <button type="button" className="modal-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="modal-primary" onClick={handleSave}>
              Save changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsModal;
