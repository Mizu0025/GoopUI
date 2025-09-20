import React from 'react';

interface ChatInputProps {
  onSendMessage: (messageText: string) => void;
}

function ChatInput({ onSendMessage }: ChatInputProps) {
  const handleSendMessage = () => {
    const messageText = document.querySelector('.chat-input input')!.value;

    if (messageText.trim() === '') {
      alert('Please enter a message.');
      return;
    }

    onSendMessage(messageText);
    document.querySelector('.chat-input input')!.value = '';
  };

  return (
    <div className="chat-input">
      <input type="text" placeholder="Type your message..." />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}

export default ChatInput;
