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
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const sendMessage = (messageText: string) => {
    const newUserMessage: Message = { text: messageText, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);

    setIsLoading(true);
    setErrorMessage('');

    fetch(`/api/chat?model=${selectedModel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: messageText }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const aiResponse: Message = { text: data.response, sender: 'ai' };
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      setIsLoading(false);
    })
    .catch(error => {
      console.error('Error fetching AI response:', error);
      setIsLoading(false);
      setErrorMessage('Failed to get AI response. Please try again.');
    });
  };

  return (
    <div className="chat-container">
      <ModelSelector onModelChange={handleModelChange} />
      <div className="message-list">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {isLoading && <LoadingIndicator />}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>
      <ChatInput onSendMessage={sendMessage} />
    </div>
  );
}

export default ChatContainer;
