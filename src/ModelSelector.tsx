import React from 'react';

function ModelSelector() {
  return (
    <div className="model-selector">
      <select>
        <option value="gpt-3">GPT-3</option>
        <option value="gpt-4">GPT-4</option>
        <option value="custom">Custom</option>
      </select>
    </div>
  );
}

export default ModelSelector;
