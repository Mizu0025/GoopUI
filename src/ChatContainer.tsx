import React, { useState, useEffect } from 'react';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';
import ModelSelector from './ModelSelector';

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('');

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const sendMessage = (messageText: string) => {
    const newUserMessage: Message = { text: messageText, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);

    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = { text: `(${selectedModel}) AI response to "${messageText}"`, sender: 'ai' };
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="chat-container">
      <ModelSelector onModelChange={handleModelChange} />
      <div className="message-list">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {isLoading && <LoadingIndicator />}
      </div>
      <ChatInput onSendMessage={sendMessage} />
    </div>
  );
}

export default ChatContainer;
