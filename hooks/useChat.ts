
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, Source } from '../types';
import { getLawyerSystemPrompt } from '../prompts/lawyerPrompt';
import { startChat } from '../services/geminiService';
import type { Chat, Content } from '@google/genai';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // remove "data:mime/type;base64," prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};


export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);

  // Effect to save chat history to localStorage
  useEffect(() => {
    if (messages.length > 1) { // Avoid saving the initial state
      const savableMessages = messages.filter(msg => !msg.id.startsWith('error-'));
      localStorage.setItem('chatHistory', JSON.stringify(savableMessages));
    }
  }, [messages]);

  // Effect to initialize chat and load history from localStorage
  useEffect(() => {
    const initializeChat = () => {
      try {
        const savedHistoryJson = localStorage.getItem('chatHistory');
        const systemPrompt = getLawyerSystemPrompt();

        if (savedHistoryJson) {
          const loadedMessages: Message[] = JSON.parse(savedHistoryJson);
          if (loadedMessages.length > 0) {
            setMessages(loadedMessages);
            const historyForApi: Content[] = loadedMessages
              .filter(msg => msg.role === 'user' || msg.role === 'model')
              .map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }],
              }));
            chatRef.current = startChat(systemPrompt, historyForApi);
            return;
          }
        }
        
        // Start a fresh chat if no history is found
        chatRef.current = startChat(systemPrompt);
        setMessages([
          {
            id: 'init',
            role: 'model',
            text: 'Вітаю! Я ваш AI-Юрист. Чим можу допомогти у вашій цивільній чи адміністративній справі? Ви можете також додавати файли-зображення (JPEG, PNG, WEBP, HEIC/HEIF) розміром до 4МБ.',
          },
        ]);
      } catch (e) {
        if (e instanceof Error) {
            setError(`Помилка ініціалізації: ${e.message}. Перевірте API ключ.`);
        } else {
            setError('Невідома помилка ініціалізації.');
        }
        localStorage.removeItem('chatHistory'); // Clear potentially corrupt data
      }
    };
    initializeChat();
  }, []);

  const sendMessage = useCallback(async (text: string, file?: File | null, useGoogleSearch?: boolean, sourceUrls?: string[]) => {
    if (!text.trim() && !file) return;

    const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: text,
        file: file ? { name: file.name, type: file.type } : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    if (!chatRef.current) {
        setError("Чат не ініціалізовано.");
        setIsLoading(false);
        return;
    }

    try {
        let promptText = text;
        if (sourceUrls && sourceUrls.length > 0) {
            const urlList = sourceUrls.map(url => `- ${url}`).join('\n');
            promptText = `Будь ласка, дайте відповідь на запит, базуючись на інформації з наступних URL-адрес:\n${urlList}\n\nЗапит користувача: ${text}`;
        }
        const messageParts: (string | { inlineData: { data: string; mimeType: string; } })[] = [promptText];
        
        if (file) {
            try {
              const base64Data = await fileToBase64(file);
              messageParts.push({
                inlineData: {
                  data: base64Data,
                  mimeType: file.type,
                },
              });
            } catch (e) {
              const errorMessage = e instanceof Error ? e.message : 'Unknown error';
              setError(`Помилка зчитування файлу: ${errorMessage}`);
              setIsLoading(false);
              return;
            }
        }

        const stream = await chatRef.current.sendMessageStream({
            message: messageParts,
            ...(useGoogleSearch && { config: { tools: [{googleSearch: {}}] } })
        });
        
        let fullResponse = '';
        let sources: Source[] = [];
        const modelMessageId = (Date.now() + 1).toString();
        
        setMessages((prev) => [...prev, { id: modelMessageId, role: 'model', text: '', sources: [] }]);

        for await (const chunk of stream) {
            fullResponse += chunk.text;

            const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
                const newSources = groundingMetadata.groundingChunks
                    .map((c: any) => c.web)
                    .filter((s: any) => s && s.uri && s.title) as Source[];
                
                const allSources = [...sources, ...newSources];
                const uniqueSources: Source[] = [];
                const seenUris = new Set<string>();
                for (const source of allSources) {
                    if (!seenUris.has(source.uri)) {
                        uniqueSources.push(source);
                        seenUris.add(source.uri);
                    }
                }
                sources = uniqueSources;
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === modelMessageId ? { ...msg, text: fullResponse, sources } : msg
              )
            );
        }

    } catch (e) {
      if (e instanceof Error) {
        setError(`Помилка API: ${e.message}`);
      } else {
        setError('Сталася невідома помилка.');
      }
      setMessages((prev) => [...prev, { id: 'error-' + Date.now(), role: 'model', text: 'Вибачте, сталася помилка. Спробуйте ще раз.' }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startNewChat = useCallback(() => {
    localStorage.removeItem('chatHistory');
    chatRef.current = null;
    try {
      const systemPrompt = getLawyerSystemPrompt();
      chatRef.current = startChat(systemPrompt);
      setMessages([
        {
          id: 'init',
          role: 'model',
          text: 'Вітаю! Я ваш AI-Юрист. Чим можу допомогти у вашій цивільній чи адміністративній справі? Ви можете також додавати файли-зображення (JPEG, PNG, WEBP, HEIC/HEIF) розміром до 4МБ.',
        },
      ]);
      setError(null);
    } catch (e) {
      if (e instanceof Error) {
          setError(`Помилка ініціалізації: ${e.message}. Перевірте API ключ.`);
      } else {
          setError('Невідома помилка ініціалізації.');
      }
    }
  }, []);

  const saveChatToFile = useCallback(() => {
    if (messages.length <= 1) {
        alert("Немає чого зберігати. Почніть розмову.");
        return;
    }
    try {
        const savableMessages = messages.filter(msg => !msg.id.startsWith('error-') && msg.id !== 'init');
        if (savableMessages.length === 0) {
            alert("Немає повідомлень для збереження.");
            return;
        }

        const dataStr = JSON.stringify(savableMessages, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `ai-lawyer-chat-${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        setError(`Помилка збереження чату: ${errorMsg}`);
    }
  }, [messages]);

  const loadChatFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const loadedMessages: Message[] = JSON.parse(json);

                if (!Array.isArray(loadedMessages) || loadedMessages.some(msg => !msg.id || !msg.role || typeof msg.text === 'undefined')) {
                    throw new Error("Невірний формат файлу.");
                }

                localStorage.setItem('chatHistory', JSON.stringify(loadedMessages));
                setMessages(loadedMessages);

                const systemPrompt = getLawyerSystemPrompt();
                const historyForApi: Content[] = loadedMessages
                  .filter(msg => msg.role === 'user' || msg.role === 'model')
                  .map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.text }],
                  }));
                chatRef.current = startChat(systemPrompt, historyForApi);
                setError(null);
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                setError(`Помилка завантаження чату: ${errorMsg}`);
            }
        };

        reader.onerror = () => {
            setError('Помилка читання файлу.');
        };
        
        reader.readAsText(file);
    };

    input.click();
  }, []);

  return { messages, sendMessage, isLoading, error, startNewChat, saveChatToFile, loadChatFromFile };
};