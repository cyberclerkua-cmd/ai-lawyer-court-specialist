
import React, { useRef, useEffect } from 'react';
import type { Message } from '../types';
import ChatMessage from './ChatMessage';
import { BotIcon } from './icons';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-indigo-600">
            <BotIcon className="w-6 h-6 text-white" />
        </div>
        <div className="max-w-xl px-5 py-3 rounded-2xl bg-gray-700/80 rounded-bl-none flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-400"></div>
        </div>
    </div>
);


const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {isLoading && <TypingIndicator />}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;
