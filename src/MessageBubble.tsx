import React from 'react';

interface MessageProps {
  message: string;
}

function MessageBubble({ message }: MessageProps) {
  return (
    <div className="message-bubble">
      {message}
    </div>
  );
}

export default MessageBubble;
