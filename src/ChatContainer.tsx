import React, { useState, useEffect } from 'react';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';
import ModelSelector from './ModelSelector';

function ChatContainer() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const sendMessage = (messageText) => {
    // Placeholder for API call
    console.log('Sending message:', messageText);

    // Add the new message to the state
    setMessages([...messages, messageText]);
  };

  return (
    <div className="chat-container">
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
          <ModelSelector />
          <ChatInput onSendMessage={sendMessage} />
        </>
      )}
    </div>
  );
}

export default ChatContainer;
