import { Chat, Message, AIModel } from '../types';
import { storage } from '../storage';

const STORAGE_KEY = 'chats';
const FOLDERS_KEY = 'chatFolders';

export function saveChatsToLocalStorage(chats: Chat[]): void {
  storage.set(STORAGE_KEY, chats);
}

export function loadChatsFromLocalStorage(): Chat[] {
  // Try to load chats from our new storage utility first
  const chatsFromStorage = storage.get<Chat[]>(STORAGE_KEY);
  if (chatsFromStorage) {
    return chatsFromStorage;
  }
  
  // Fallback to the old localStorage method if not found in our new storage
  if (typeof window === 'undefined') return [];
  
  try {
    const chats = localStorage.getItem('ai-chat-history');
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
    
    // Migrate the old data to our new storage format
    storage.set(STORAGE_KEY, parsedChats);
    
    return parsedChats;
  } catch (error) {
    console.error('Failed to parse chats from localStorage:', error);
    return [];
  }
}

export function saveFoldersToStorage(folders: any[]): void {
  storage.set(FOLDERS_KEY, folders);
}

export function loadFoldersFromStorage(): any[] {
  // Try to load folders from our new storage utility first
  const foldersFromStorage = storage.get<any[]>(FOLDERS_KEY);
  if (foldersFromStorage) {
    return foldersFromStorage;
  }
  
  // Fallback to the old localStorage method if not found in our new storage
  if (typeof window === 'undefined') return [];
  
  try {
    const folders = localStorage.getItem('chat-folders');
    if (!folders) return [];
    
    const parsedFolders = JSON.parse(folders);
    
    // Migrate the old data to our new storage format
    storage.set(FOLDERS_KEY, parsedFolders);
    
    return parsedFolders;
  } catch (error) {
    console.error('Failed to parse folders from localStorage:', error);
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

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}