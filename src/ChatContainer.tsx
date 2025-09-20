import React, { useState, useEffect } from 'react';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';

function ChatContainer() {
  const [messages, setMessages] = useState([]);

  const sendMessage = (messageText) => {
    // Placeholder for API call
    console.log('Sending message:', messageText);

    // Add the new message to the state
    setMessages([...messages, messageText]);
  };

  return (
    <div className="chat-container">
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}
      <ChatInput onSendMessage={sendMessage} />
      <LoadingIndicator />
    </div>
  );
}

export default ChatContainer;
