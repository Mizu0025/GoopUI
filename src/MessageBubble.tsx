import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MessageProps {
  message: {
    text: string;
    sender: 'user' | 'ai';
  };
}

function MessageBubble({ message }: MessageProps) {
  const { text, sender } = message;
  const bubbleClass = sender === 'user' ? 'user-bubble' : 'ai-bubble';

  return (
    <div className={`message-bubble ${bubbleClass}`}>
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}

export default MessageBubble;
