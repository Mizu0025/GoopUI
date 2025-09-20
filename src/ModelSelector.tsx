import React, { useState, useEffect } from 'react';

interface ModelSelectorProps {
  onModelChange: (model: string) => void;
}

function ModelSelector({ onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    // Mock fetching models from the backend
    const fetchedModels = ['llama2', 'mistral', 'codellama'];
    setModels(fetchedModels);
    setSelectedModel(fetchedModels[0]);
    onModelChange(fetchedModels[0]);
  }, [onModelChange]);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value;
    setSelectedModel(newModel);
    onModelChange(newModel);
  };

  return (
    <div className="model-selector">
      <select value={selectedModel} onChange={handleModelChange} style={{ margin: '10px', padding: '5px' }}>
        {models.map(model => (
          <option key={model} value={model}>{model}</option>
        ))}
      </select>
    </div>
  );
}

export default ModelSelector;
