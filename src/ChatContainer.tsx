import React, { useState, useEffect } from 'react';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';

function ChatContainer() {
  const [messages, setMessages] = useState([]);

  return (
    <div className="chat-container">
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}
      <ChatInput />
      <LoadingIndicator />
    </div>
  );
}

export default ChatContainer;
