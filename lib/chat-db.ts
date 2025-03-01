'use client';

/**
 * ChatDB - IndexedDB implementation for chat history management
 * Handles persistent storage of chats, messages, and folders
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Chat, Message, Folder } from './types';

/**
 * Extended Message type that includes chatId for IndexedDB storage
 */
interface DBMessage extends Message {
  chatId: string;
}

/**
 * Define database schema for TypeScript
 */
interface ChatDBSchema extends DBSchema {
  chats: {
    key: string;
    value: Chat;
    indexes: {
      'updatedAt': Date;
      'folderId': string;
    };
  };
  messages: {
    key: string;
    value: DBMessage;
    indexes: {
      'chatId': string;
      'createdAt': Date;
    };
  };
  folders: {
    key: string;
    value: Folder;
    indexes: {
      'updatedAt': Date;
    };
  };
}

const DB_NAME = 'chatApp';
const DB_VERSION = 1;

/**
 * Check if we're running in a browser environment
 */
const isBrowser = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

/**
 * Initialize database connection
 */
const dbPromise = isBrowser 
  ? openDB<ChatDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create stores with indexes
        if (!db.objectStoreNames.contains('chats')) {
          const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
          chatStore.createIndex('updatedAt', 'updatedAt');
          chatStore.createIndex('folderId', 'folderId');
        }
        
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('chatId', 'chatId');
          messageStore.createIndex('createdAt', 'createdAt');
        }
        
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
          folderStore.createIndex('updatedAt', 'updatedAt');
        }
      }
    })
  : null;

/**
 * Safely get database instance
 */
async function getDB() {
  if (!isBrowser) {
    return null;
  }
  return dbPromise;
}

/**
 * Chat database operations
 */
export const chatDB = {
  /**
   * Save or update a chat
   */
  async saveChat(chat: Chat): Promise<string> {
    const db = await getDB();
    if (!db) return chat.id;
    
    chat.updatedAt = new Date();
    
    // Create a copy of the chat object without messages field
    // to prevent duplicate storage (messages are stored separately)
    const chatToSave = { ...chat };
    
    // If messages array exists, store it temporarily and remove it from the object
    const messages = chatToSave.messages || [];
    chatToSave.messages = []; // Set to empty array to maintain schema consistency
    
    // Save the chat without messages
    await db.put('chats', chatToSave);
    
    // If this is a new chat with messages, save them separately
    for (const message of messages) {
      // Only save messages that don't already have a chatId property
      // This prevents re-saving messages that are already in the store
      if (message.id && !('chatId' in message)) {
        await this.saveMessage({ ...message, chatId: chat.id });
      }
    }
    
    return chat.id;
  },
  
  /**
   * Get a chat by ID
   */
  async getChat(id: string): Promise<Chat | undefined> {
    const db = await getDB();
    if (!db) return undefined;
    
    return db.get('chats', id);
  },
  
  /**
   * Get all chats, sorted by updatedAt (newest first)
   */
  async getAllChats(): Promise<Chat[]> {
    const db = await getDB();
    if (!db) return [];
    
    const chats = await db.getAllFromIndex('chats', 'updatedAt');
    return chats.reverse(); // Newest first
  },
  
  /**
   * Get chats in a folder
   */
  async getChatsByFolder(folderId: string): Promise<Chat[]> {
    const db = await getDB();
    if (!db) return [];
    
    return db.getAllFromIndex('chats', 'folderId', folderId);
  },
  
  /**
   * Delete a chat and its messages
   */
  async deleteChat(id: string): Promise<void> {
    const db = await getDB();
    if (!db) return;
    
    // Delete the chat
    await db.delete('chats', id);
    
    // Delete all messages for this chat
    const tx = db.transaction('messages', 'readwrite');
    const msgIndex = tx.store.index('chatId');
    let cursor = await msgIndex.openCursor(IDBKeyRange.only(id));
    
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    
    await tx.done;
  },
  
  /**
   * Save a message
   */
  async saveMessage(message: Omit<Message, 'chatId'> & { chatId: string }): Promise<string> {
    const db = await getDB();
    if (!db) return message.id;
    
    // Ensure createdAt is set if not already
    if (!message.createdAt) {
      message.createdAt = new Date();
    }
    
    // Save the message to the messages store
    await db.put('messages', message);
    
    // Update the associated chat's updatedAt timestamp WITHOUT modifying the messages array
    // We'll use a transaction to ensure atomicity and prevent race conditions
    const tx = db.transaction('chats', 'readwrite');
    const chatStore = tx.objectStore('chats');
    const chat = await chatStore.get(message.chatId);
    
    if (chat) {
      // Only update the timestamp, don't touch the messages array
      chat.updatedAt = new Date();
      await chatStore.put(chat);
    }
    
    // Commit the transaction
    await tx.done;
    
    return message.id;
  },
  
  /**
   * Get all messages for a chat
   */
  async getChatMessages(chatId: string): Promise<Message[]> {
    const db = await getDB();
    if (!db) return [];
    
    return db.getAllFromIndex('messages', 'chatId', chatId);
  },
  
  /**
   * Delete a specific message
   */
  async deleteMessage(id: string): Promise<void> {
    const db = await getDB();
    if (!db) return;
    
    await db.delete('messages', id);
  },
  
  /**
   * Delete all messages for a chat
   */
  async clearChatMessages(chatId: string): Promise<void> {
    const db = await getDB();
    if (!db) return;
    
    const tx = db.transaction('messages', 'readwrite');
    const index = tx.store.index('chatId');
    let cursor = await index.openCursor(IDBKeyRange.only(chatId));
    
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    
    await tx.done;
    
    // Update the chat's updatedAt timestamp
    const chat = await db.get('chats', chatId);
    if (chat) {
      chat.updatedAt = new Date();
      chat.messages = [];
      await db.put('chats', chat);
    }
  },
  
  /**
   * Save or update a folder
   */
  async saveFolder(folder: Folder): Promise<string> {
    const db = await getDB();
    if (!db) return folder.id;
    
    folder.updatedAt = new Date();
    await db.put('folders', folder);
    return folder.id;
  },
  
  /**
   * Get all folders, sorted by updatedAt (newest first)
   */
  async getAllFolders(): Promise<Folder[]> {
    const db = await getDB();
    if (!db) return [];
    
    const folders = await db.getAllFromIndex('folders', 'updatedAt');
    return folders.reverse(); // Newest first
  },
  
  /**
   * Delete a folder
   */
  async deleteFolder(id: string): Promise<void> {
    const db = await getDB();
    if (!db) return;
    
    await db.delete('folders', id);
    
    // Update any chats that were in this folder to remove the folder reference
    const tx = db.transaction('chats', 'readwrite');
    const index = tx.store.index('folderId');
    let cursor = await index.openCursor(IDBKeyRange.only(id));
    
    while (cursor) {
      const chat = cursor.value;
      if (chat.folderId) {
        chat.folderId = undefined; // Use undefined instead of delete
        await cursor.update(chat);
      }
      cursor = await cursor.continue();
    }
    
    await tx.done;
  },
  
  /**
   * Move a chat to a folder
   */
  async moveChatToFolder(chatId: string, folderId: string | undefined): Promise<void> {
    const db = await getDB();
    if (!db) return;
    
    const chat = await db.get('chats', chatId);
    
    if (chat) {
      chat.folderId = folderId; // Can be undefined
      chat.updatedAt = new Date();
      await db.put('chats', chat);
    }
  },
  
  /**
   * Import data from localStorage to IndexedDB
   * Used for migrating data from previous storage implementation
   */
  async importFromLocalStorage(chats: Chat[], folders: Folder[]): Promise<void> {
    const db = await getDB();
    if (!db) return;
    
    // Use a transaction for atomicity
    const tx = db.transaction(['chats', 'messages', 'folders'], 'readwrite');
    
    // Import folders
    for (const folder of folders) {
      await tx.objectStore('folders').put(folder);
    }
    
    // Import chats and their messages
    for (const chat of chats) {
      // Extract messages from the chat
      const messages = chat.messages || [];
      
      // Save chat without messages array to avoid duplication
      const chatToSave = { ...chat, messages: [] };
      await tx.objectStore('chats').put(chatToSave);
      
      // Save each message separately with chatId reference
      for (const message of messages) {
        // Ensure message has the chatId property
        const messageToSave = { ...message, chatId: chat.id } as DBMessage;
        await tx.objectStore('messages').put(messageToSave);
      }
    }
    
    // Commit the transaction
    await tx.done;
  },
  
  /**
   * Check if database is empty (used to determine if we need to import)
   */
  async isEmpty(): Promise<boolean> {
    const db = await getDB();
    if (!db) return true; // Treat as empty if not in browser
    
    const chatsCount = await db.count('chats');
    return chatsCount === 0;
  },
  
  /**
   * Check if running in browser environment
   */
  get isAvailable(): boolean {
    return isBrowser;
  }
};

export default chatDB; 