import { Chat, Message, AIModel } from '../types';

const STORAGE_KEY = 'ai-chat-history';

export function saveChatsToLocalStorage(chats: Chat[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (error) {
    console.error('Error saving chats to localStorage:', error);
  }
}

export function loadChatsFromLocalStorage(): Chat[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const chats = localStorage.getItem(STORAGE_KEY);
    if (!chats) return [];
    
    // Parse dates back to Date objects
    const parsedChats = JSON.parse(chats, (key, value) => {
      if (key === 'createdAt' || key === 'updatedAt') {
        return new Date(value);
      }
      return value;
    });
    
    // Validate the parsed data is an array
    if (!Array.isArray(parsedChats)) {
      console.error('Parsed chats is not an array, returning empty array');
      return [];
    }
    
    return parsedChats;
  } catch (error) {
    console.error('Failed to parse chats from localStorage:', error);
    return [];
  }
}

export function createNewChat(model: string = 'smart'): Chat {
  // Validate model
  const validModel = ['smart', 'openai', 'anthropic', 'gemini'].includes(model) ? model : 'smart';
  
  return {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    model: validModel as AIModel,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export function updateChatTitle(chat: Chat, messages: Message[]): Chat {
  if (!chat) return createNewChat();
  
  // If there are messages and title is still "New Chat", try to generate a title from the first message
  if (Array.isArray(messages) && messages.length > 0 && chat.title === 'New Chat') {
    const firstUserMessage = messages.find(m => m?.role === 'user')?.content || '';
    const title = firstUserMessage.slice(0, 30) + (firstUserMessage.length > 30 ? '...' : '');
    return { ...chat, title };
  }
  return chat;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}