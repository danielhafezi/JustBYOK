import { Chat, Message, AIModel } from '../types';
import { storage } from '../storage';

const STORAGE_KEY = 'chats';
const FOLDERS_KEY = 'chatFolders';

// Functions kept for backwards compatibility, but they should no longer be used
// Chat data should only be stored in IndexedDB now
export function saveChatsToLocalStorage(chats: Chat[]): void {
  // Do nothing - we no longer use localStorage for chats
  console.warn('saveChatsToLocalStorage is deprecated - use IndexedDB instead');
}

export function loadChatsFromLocalStorage(): Chat[] {
  console.warn('loadChatsFromLocalStorage is deprecated - use IndexedDB instead');
  return [];
}

export function saveFoldersToStorage(folders: any[]): void {
  // Do nothing - we no longer use localStorage for folders
  console.warn('saveFoldersToStorage is deprecated - use IndexedDB instead');
}

export function loadFoldersFromStorage(): any[] {
  console.warn('loadFoldersFromStorage is deprecated - use IndexedDB instead');
  return [];
}

export function createNewChat(model: string = 'smart'): Chat {
  // Validate model
  const validModel = ['smart', 'openai', 'anthropic', 'gemini'].includes(model) ? model : 'smart';
  
  return {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    model: validModel as AIModel,
    favorite: false,
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