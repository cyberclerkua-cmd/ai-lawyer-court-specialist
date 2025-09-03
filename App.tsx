
import React, { useState } from 'react';
import { useChat } from './hooks/useChat';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import { BotIcon, MenuIcon } from './components/icons';

const App: React.FC = () => {
  const { messages, sendMessage, isLoading, error, startNewChat, saveChatToFile, loadChatFromFile } = useChat();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);

  const addUrl = (url: string) => {
    if (url && !sourceUrls.includes(url)) {
      setSourceUrls(prev => [...prev, url]);
    }
  };

  const removeUrl = (urlToRemove: string) => {
    setSourceUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSendMessage = (text: string, file?: File | null) => {
    // Force Google Search if URLs are provided
    sendMessage(text, file, sourceUrls.length > 0, sourceUrls);
  };
  
  const handleStartNewChat = () => {
    startNewChat();
    // Optionally, you could also clear the sources here if desired
    // setSourceUrls([]);
  };

  return (
    <div className="flex h-screen bg-gray-800 text-gray-100 font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        sourceUrls={sourceUrls}
        onAddUrl={addUrl}
        onRemoveUrl={removeUrl}
        onStartNewChat={handleStartNewChat}
        onSaveChat={saveChatToFile}
        onLoadChat={loadChatFromFile}
      />
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <header className="bg-gray-900/80 backdrop-blur-sm shadow-lg p-4 border-b border-gray-700 flex items-center space-x-4 flex-shrink-0">
          <button 
            className="md:hidden p-1 text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="p-2 bg-indigo-600 rounded-full">
            <BotIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI-Юрист — Судовий спеціаліст</h1>
            <p className="text-sm text-gray-400">Інтелектуальний цифровий помічник для формування передових судових стратегій, що поєднує юридичну експертизу з можливостями штучного інтелекту.</p>
          </div>
        </header>
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatWindow messages={messages} isLoading={isLoading} />
          {error && <div className="p-4 text-center bg-red-800/50 text-red-300">{error}</div>}
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </main>
        <footer className="text-center p-2 bg-gray-900 text-xs text-gray-500 border-t border-gray-700 flex-shrink-0">
          © 2025 Powered by frost_ua. Support author: PrivatBank 5457 0825 1180 2659
        </footer>
      </div>
    </div>
  );
};

export default App;
