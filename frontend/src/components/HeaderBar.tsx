import type { OllamaModel } from "../lib/api";

type HeaderBarProps = {
  statusText: string;
  loadingModels: boolean;
  models: OllamaModel[] | undefined;
  selectedModel: string | undefined;
  onSelectModel: (modelName: string) => void;
  modelSelectDisabled: boolean;
  onToggleHistory: () => void;
};

const HeaderBar = ({
  statusText,
  loadingModels,
  models,
  selectedModel,
  onSelectModel,
  modelSelectDisabled,
  onToggleHistory,
}: HeaderBarProps) => {
  return (
    <header className="header-bar">
      <div className="header-inner">
        <div className="header-group">
          <button type="button" className="header-history" onClick={onToggleHistory}>
            <span className="sr-only">Toggle history</span>
            ☰
          </button>
          <div>
            <h1 className="header-brand">GoopUI</h1>
            <p className="header-subtitle">Powered by your local models</p>
          </div>
        </div>
        <div className="header-status">
          <span>{statusText}</span>
          <label className="header-select">
            <span className="header-select-label">Model</span>
            <select
              className="header-select-control"
              value={selectedModel ?? ""}
              onChange={(event) => onSelectModel(event.target.value)}
              disabled={modelSelectDisabled}
            >
              <option value="" disabled>
                {loadingModels ? "Loading…" : "Select"}
              </option>
              {models?.map((model) => (
                <option key={model.name} value={model.name} className="header-select-option">
                  {model.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
