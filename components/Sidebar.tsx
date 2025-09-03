import React, { useState } from 'react';
import { XIcon, PlusIcon, NewChatIcon, SaveIcon, UploadIcon } from './icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sourceUrls: string[];
  onAddUrl: (url: string) => void;
  onRemoveUrl: (url: string) => void;
  onStartNewChat: () => void;
  onSaveChat: () => void;
  onLoadChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sourceUrls,
  onAddUrl,
  onRemoveUrl,
  onStartNewChat,
  onSaveChat,
  onLoadChat,
}) => {
  const [urlInput, setUrlInput] = useState('');

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput);
      onAddUrl(urlInput.trim());
      setUrlInput('');
    } catch (_) {
      alert('Будь ласка, введіть дійсну URL-адресу.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-gray-200 border-r border-gray-700 z-40 transform transition-transform md:relative md:translate-x-0 md:flex-shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6 flex-shrink-0">
            <h2 className="text-lg font-semibold text-white">Джерела даних</h2>
          </div>
          
          <div className="space-y-6 overflow-y-auto pr-2 -mr-2 flex-grow">
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-medium text-gray-100 mb-3">Додаткові URL-адреси</h3>
              <p className="mb-3 text-sm text-gray-400">
                Додавання URL-адрес активує Google Search для пошуку інформації за цими джерелами.
              </p>
              <div className="flex gap-2 items-center">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="https://example.com/article"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleAddUrl}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-indigo-600 text-white rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors"
                  aria-label="Додати URL"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>

              {sourceUrls.length > 0 && (
                <div className="mt-4 space-y-2">
                  {sourceUrls.map((url) => (
                    <div key={url} className="flex items-center justify-between gap-2 p-2 bg-gray-700/50 rounded-md text-sm">
                      <p className="text-gray-300 truncate" title={url}>{url}</p>
                      <button
                        onClick={() => onRemoveUrl(url)}
                        className="p-1 text-gray-400 hover:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                        aria-label={`Remove ${url}`}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-800 rounded-lg">
              <h3 className="font-medium text-gray-100 mb-3">Керування чатом</h3>
              <div className="space-y-2">
                <button
                  onClick={onStartNewChat}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 bg-gray-700/60 rounded-md hover:bg-gray-700 transition-colors"
                  aria-label="Почати новий чат"
                >
                  <NewChatIcon className="w-5 h-5 text-gray-400" />
                  <span>Почати новий чат</span>
                </button>
                <button
                  onClick={onSaveChat}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 bg-gray-700/60 rounded-md hover:bg-gray-700 transition-colors"
                  aria-label="Зберегти чат в файл"
                >
                  <SaveIcon className="w-5 h-5 text-gray-400" />
                  <span>Зберегти чат в файл</span>
                </button>
                <button
                  onClick={onLoadChat}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-200 bg-gray-700/60 rounded-md hover:bg-gray-700 transition-colors"
                  aria-label="Завантажити чат з файлу"
                >
                  <UploadIcon className="w-5 h-5 text-gray-400" />
                  <span>Завантажити чат з файлу</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;