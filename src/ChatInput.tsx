import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (messageText: string) => void;
}

function ChatInput({ onSendMessage }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (inputValue.trim() === '') {
      alert('Please enter a message.');
      return;
    }
    onSendMessage(inputValue);
    setInputValue('');
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <div className="chat-input-wrapper">
        <input
          type="text"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit"></button>
      </div>
    </form>
  );
}

export default ChatInput;
