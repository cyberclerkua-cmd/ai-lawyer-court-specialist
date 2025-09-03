
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, PaperclipIcon, XIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (message: string, file?: File | null) => void;
  isLoading: boolean;
}

const SUPPORTED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
];
const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || file) && !isLoading) {
      onSendMessage(text, file);
      setText('');
      setFile(null);
      setFileError(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFileError(null);
    setFile(null);

    if (selectedFile) {
        if (!SUPPORTED_MIME_TYPES.includes(selectedFile.type)) {
            setFileError('Непідтримуваний тип файлу. Будь ласка, виберіть зображення (JPEG, PNG, WEBP, HEIC, HEIF).');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
            setFileError(`Файл завеликий. Максимальний розмір: ${MAX_FILE_SIZE_MB}MB.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setFile(selectedFile);
    }
  }

  const removeFile = () => {
    setFile(null);
    setFileError(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="p-4 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {fileError && (
          <div className="mb-2 text-center text-sm text-red-400 bg-red-900/30 p-2 rounded-lg">
            {fileError}
          </div>
        )}
        <div className="flex items-end space-x-3">
            <div className="flex-1 bg-gray-700 rounded-2xl p-1 flex flex-col">
            {file && (
                <div className="p-2 m-1.5 bg-gray-800/60 rounded-lg flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-300 truncate">{file.name}</span>
                    <button 
                        type="button" 
                        onClick={removeFile}
                        className="text-gray-400 hover:text-white"
                        aria-label="Remove file"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="flex items-end">
                <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введіть ваше питання тут..."
                className="flex-1 bg-transparent p-2.5 text-gray-200 placeholder-gray-400 focus:outline-none resize-none max-h-48"
                rows={1}
                disabled={isLoading}
                />
                <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={SUPPORTED_MIME_TYPES.join(',')}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 transition-colors"
                    aria-label="Attach file"
                    aria-describedby="file-limit-description"
                >
                    <PaperclipIcon className="w-6 h-6" />
                </button>
            </div>
            </div>
            <button
            type="submit"
            disabled={isLoading || (!text.trim() && !file)}
            className="w-12 h-12 flex-shrink-0 bg-indigo-600 rounded-full flex items-center justify-center text-white disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
            aria-label="Send message"
            >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <SendIcon className="w-6 h-6" />
            )}
            </button>
        </div>
      </form>
      <p id="file-limit-description" className="text-xs text-center text-gray-500 mt-2 max-w-4xl mx-auto">
        Підтримувані формати файлів: JPEG, PNG, WEBP, HEIC, HEIF. Максимальний розмір: {MAX_FILE_SIZE_MB}MB.
      </p>
    </div>
  );
};

export default ChatInput;
