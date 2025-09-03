
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, Source } from '../types';
import { UserIcon, BotIcon, CaseLawIcon, LinkIcon } from './icons';

interface ChatMessageProps {
  message: Message;
}

interface CaseLaw {
    caseNumber: string;
    court: string;
    date: string;
    summary: string;
}

const CaseLawCard: React.FC<{ caseLaw: CaseLaw }> = ({ caseLaw }) => {
    return (
      <div className="not-prose my-4 p-4 border border-yellow-600/50 bg-yellow-900/20 rounded-lg text-left">
        <div className="flex items-center gap-2">
          <CaseLawIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <h4 className="font-bold text-yellow-300">Посилання на судову практику</h4>
        </div>
        <div className="mt-3 pl-2.5 text-sm">
            <p className="text-gray-300 mb-1">
              <strong>Справа №:</strong> {caseLaw.caseNumber}
            </p>
            <p className="text-gray-300 mb-1">
              <strong>Суд:</strong> {caseLaw.court}
            </p>
            <p className="text-gray-300">
              <strong>Дата:</strong> {caseLaw.date}
            </p>
            <p className="text-gray-300 mt-2">
              <strong className="block mb-1">Короткий висновок:</strong>
              <span className="text-gray-400">{caseLaw.summary}</span>
            </p>
        </div>
      </div>
    );
};

const SourceCard: React.FC<{ source: Source }> = ({ source }) => (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 text-left rounded-lg bg-gray-800/60 hover:bg-gray-800 transition-colors"
      aria-label={`Source: ${source.title}`}
    >
      <LinkIcon className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-medium text-indigo-300 truncate">{source.title}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{source.uri}</p>
      </div>
    </a>
);
  
const parseMessageContent = (text: string): (string | CaseLaw)[] => {
    const parts: (string | CaseLaw)[] = [];
    if (!text) return parts;

    const caseLawRegex = /\[CASE_LAW:({.*?})\]/gs;
    let lastIndex = 0;
    let match;

    while ((match = caseLawRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        try {
            const caseLawData = JSON.parse(match[1]);
            parts.push(caseLawData as CaseLaw);
        } catch (e) {
            console.error("Failed to parse case law JSON:", match[1], e);
            parts.push(match[0]); // Treat as plain text if parsing fails
        }

        lastIndex = caseLawRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
};


const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const containerClasses = `flex items-start gap-4 ${isUser ? 'flex-row-reverse' : ''}`;
  const avatarContainerClasses = `flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-indigo-600'}`;
  const messageBubbleClasses = `max-w-xl xl:max-w-2xl px-5 py-3 rounded-2xl ${isUser ? 'bg-blue-700/80 rounded-br-none' : 'bg-gray-700/80 rounded-bl-none'}`;
  
  const contentParts = isUser ? [message.text] : parseMessageContent(message.text);
  const hasSources = !isUser && message.sources && message.sources.length > 0;

  return (
    <div className={containerClasses}>
      <div className={avatarContainerClasses}>
        {isUser ? <UserIcon className="w-6 h-6 text-white" /> : <BotIcon className="w-6 h-6 text-white" />}
      </div>
      <div className="flex flex-col gap-3 items-start">
        <div className={messageBubbleClasses}>
            {message.file && (
                <div className="mb-2 p-2 bg-gray-800/50 rounded-lg border border-gray-600 text-left">
                <p className="font-medium text-sm text-gray-300 truncate">{message.file.name}</p>
                <p className="text-xs text-gray-400">{message.file.type}</p>
                </div>
            )}
            
            {contentParts.map((part, index) => {
                if (typeof part === 'string') {
                return part.trim() ? (
                    <div key={index} className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-li:my-1 prose-a:text-indigo-400 hover:prose-a:text-indigo-300">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{part}</ReactMarkdown>
                    </div>
                ) : null;
                } else {
                return <CaseLawCard key={index} caseLaw={part as CaseLaw} />;
                }
            })}
        </div>
        {hasSources && (
          <div className="max-w-xl xl:max-w-2xl w-full">
            <h3 className="text-sm font-semibold text-gray-400 mb-2 ml-2">Джерела</h3>
            <div className="grid grid-cols-1 gap-2">
              {message.sources?.map((source, index) => (
                <SourceCard key={index} source={source} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
