'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Chat, Message, AIModel, Folder } from '@/lib/types';
import { 
  loadChatsFromLocalStorage, 
  loadFoldersFromStorage,
  generateId
} from '@/lib/utils/chat-storage';
import { chatDB } from '@/lib/chat-db';

/**
 * React hook for managing chat state with IndexedDB persistence
 */
export function useChatStore() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // Load chats from IndexedDB on initial render
  useEffect(() => {
    const initializeStore = async () => {
      try {
        // Check if we're running in a browser environment
        if (!chatDB.isAvailable) {
          // Fall back to localStorage if not in browser or IndexedDB not available
          console.log('IndexedDB not available, falling back to localStorage');
          const loadedChats = loadChatsFromLocalStorage();
          const loadedFolders = loadFoldersFromStorage();
          
          setChats(Array.isArray(loadedChats) ? loadedChats : []);
          setFolders(Array.isArray(loadedFolders) ? loadedFolders : []);
          setUsingFallback(true);
          
          // Set current chat to the most recent one, or create a new one if none exist
          if (loadedChats.length > 0) {
            setCurrentChatId(loadedChats[0].id);
          } else {
            const newChat = createNewChat();
            setChats([newChat]);
            setCurrentChatId(newChat.id);
          }
          
          setIsLoaded(true);
          return;
        }
        
        // Check if IndexedDB is empty (first time use)
        const isEmpty = await chatDB.isEmpty();
        
        if (isEmpty) {
          // If empty, import data from localStorage
          console.log('Importing data from localStorage to IndexedDB...');
          const loadedChats = loadChatsFromLocalStorage();
          const loadedFolders = loadFoldersFromStorage();
          
          // Import to IndexedDB
          await chatDB.importFromLocalStorage(
            Array.isArray(loadedChats) ? loadedChats : [], 
            Array.isArray(loadedFolders) ? loadedFolders : []
          );
        }
        
        // Load data from IndexedDB
        const [loadedChats, loadedFolders] = await Promise.all([
          chatDB.getAllChats(),
          chatDB.getAllFolders()
        ]);
        
        // Set state with loaded data
        setChats(loadedChats);
        setFolders(loadedFolders);
        
        // Set current chat to the most recent one, or create a new one if none exist
        if (loadedChats.length > 0) {
          setCurrentChatId(loadedChats[0].id);
        } else {
          const newChat = createNewChat();
          await chatDB.saveChat(newChat);
          setChats([newChat]);
          setCurrentChatId(newChat.id);
        }
      } catch (error) {
        console.error('Error initializing chat store:', error);
        
        // Fall back to localStorage on error
        try {
          console.log('Falling back to localStorage due to error');
          const loadedChats = loadChatsFromLocalStorage();
          const loadedFolders = loadFoldersFromStorage();
          
          setChats(Array.isArray(loadedChats) ? loadedChats : []);
          setFolders(Array.isArray(loadedFolders) ? loadedFolders : []);
          setUsingFallback(true);
          
          // Set current chat
          if (loadedChats.length > 0) {
            setCurrentChatId(loadedChats[0].id);
          } else {
            const newChat = createNewChat();
            setChats([newChat]);
            setCurrentChatId(newChat.id);
          }
        } catch (fallbackError) {
          console.error('Error falling back to localStorage:', fallbackError);
          
          // Last resort: create a new chat
          const newChat = createNewChat();
          setChats([newChat]);
          setCurrentChatId(newChat.id);
          setUsingFallback(true);
        }
      } finally {
        setIsLoaded(true);
      }
    };
    
    // Only run in browser
    if (typeof window !== 'undefined') {
      initializeStore();
    } else {
      // Mark as loaded immediately on server to avoid hydration issues
      setIsLoaded(true);
    }
  }, []);

  // Current chat getter
  const currentChat = useMemo(() => {
    if (!currentChatId) return null;
    
    const chat = chats.find(c => c.id === currentChatId);
    if (!chat) return null;
    
    return chat;
  }, [chats, currentChatId]);
  
  /**
   * Create a new folder
   */
  const createFolder = useCallback(async () => {
    const newFolder: Folder = {
      id: generateId(),
      name: 'New Folder',
      chatIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isEditing: true
    };
    
    // Update local state (optimistic update)
    setFolders(prev => [newFolder, ...prev]);
    
    // Persist to IndexedDB
    await chatDB.saveFolder(newFolder);
    
    return newFolder;
  }, []);

  /**
   * Update a folder
   */
  const updateFolder = useCallback(async (folderId: string, updates: Partial<Folder>) => {
    // Update local state
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, ...updates, updatedAt: new Date() } : folder
    ));
    
    // Get the updated folder from state
    const updatedFolder = folders.find(f => f.id === folderId);
    if (updatedFolder) {
      // Persist to IndexedDB
      const folderToSave = { ...updatedFolder, ...updates, updatedAt: new Date() };
      await chatDB.saveFolder(folderToSave);
    }
  }, [folders]);

  /**
   * Delete a folder
   */
  const deleteFolder = useCallback(async (folderId: string) => {
    // Update local state
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
    
    // Update chats that were in this folder
    setChats(prev => prev.map(chat => 
      chat.folderId === folderId ? { ...chat, folderId: undefined } : chat
    ));
    
    // Persist to IndexedDB
    await chatDB.deleteFolder(folderId);
  }, []);

  /**
   * Move a chat to a folder
   */
  const moveChatToFolder = useCallback(async (chatId: string, folderId: string | undefined) => {
    // Update the chat's folder
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, folderId, updatedAt: new Date() }
        : chat
    ));
    
    // Update folders' chat lists
    setFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        // Add to new folder
        return {
          ...folder,
          chatIds: [...(folder.chatIds || []), chatId],
          updatedAt: new Date()
        };
      } else if (folder.chatIds?.includes(chatId)) {
        // Remove from other folders
        return {
          ...folder,
          chatIds: folder.chatIds.filter(id => id !== chatId),
          updatedAt: new Date()
        };
      }
      return folder;
    }));
    
    // Persist to IndexedDB
    await chatDB.moveChatToFolder(chatId, folderId);
    
    // Update folders in IndexedDB
    for (const folder of folders) {
      if (folder.id === folderId || folder.chatIds?.includes(chatId)) {
        await chatDB.saveFolder(folder);
      }
    }
  }, [folders]);

  /**
   * Reorder folders
   */
  const reorderFolders = useCallback(async (reorderedFolders: Folder[]) => {
    setFolders(reorderedFolders);
    
    // Save each folder to update its order
    for (const folder of reorderedFolders) {
      await chatDB.saveFolder(folder);
    }
  }, []);

  /**
   * Toggle favorite status of a chat
   */
  const toggleFavorite = useCallback(async (chatId: string) => {
    // Update local state
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updatedChat = { 
          ...chat, 
          favorite: !chat.favorite,
          updatedAt: new Date()
        };
        return updatedChat;
      }
      return chat;
    }));
    
    // Get the updated chat from state
    const updatedChat = chats.find(c => c.id === chatId);
    if (updatedChat) {
      // Persist to IndexedDB
      await chatDB.saveChat(updatedChat);
    }
  }, [chats]);

  /**
   * Toggle pin status of a message
   */
  const togglePinMessage = useCallback(async (chatId: string, messageId: string) => {
    // Update local state
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        // Find the message
        const messages = chat.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, isPinned: !msg.isPinned }
            : msg
        );
        
        // Update pinnedMessageIds
        let pinnedMessageIds = chat.pinnedMessageIds || [];
        if (messages.find(m => m.id === messageId)?.isPinned) {
          // Add to pinned list if not already there
          if (!pinnedMessageIds.includes(messageId)) {
            pinnedMessageIds = [...pinnedMessageIds, messageId];
          }
        } else {
          // Remove from pinned list
          pinnedMessageIds = pinnedMessageIds.filter(id => id !== messageId);
        }
        
        return {
          ...chat,
          messages,
          pinnedMessageIds,
          updatedAt: new Date()
        };
      }
      return chat;
    }));
    
    // Get the updated chat and message from state
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      // Get the message
      const message = chat.messages.find(m => m.id === messageId);
      if (message) {
        // Update the message in IndexedDB
        await chatDB.saveMessage({
          ...message,
          chatId
        });
        
        // Update the chat to save pinnedMessageIds
        await chatDB.saveChat(chat);
      }
    }
  }, [chats]);

  /**
   * Create a new chat
   */
  const createChat = useCallback(async (model: AIModel = 'smart') => {
    const newChat = createNewChat(model);
    
    // Update local state (optimistic update)
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    
    // Persist to IndexedDB
    await chatDB.saveChat(newChat);
    
    return newChat;
  }, []);

  /**
   * Update a chat
   */
  const updateChat = useCallback(async (chatId: string, updates: Partial<Chat>) => {
    // Update local state
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, ...updates, updatedAt: new Date() } 
        : chat
    ));
    
    // Get the updated chat from state
    const updatedChat = chats.find(c => c.id === chatId);
    if (updatedChat) {
      // Persist to IndexedDB
      const chatToSave = { ...updatedChat, ...updates, updatedAt: new Date() };
      await chatDB.saveChat(chatToSave);
    }
  }, [chats]);

  /**
   * Delete a chat
   */
  const deleteChat = useCallback(async (chatId: string) => {
    // Get the chat to be deleted
    const chatToDelete = chats.find(c => c.id === chatId);
    
    // Update local state
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    
    // If the current chat is being deleted, select another one
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(c => c.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        // Create a new chat if there are no remaining chats
        const newChat = createNewChat();
        setChats([newChat]);
        setCurrentChatId(newChat.id);
        await chatDB.saveChat(newChat);
      }
    }
    
    // Update any folders that contained this chat
    if (chatToDelete?.folderId) {
      setFolders(prev => prev.map(folder => {
        if (folder.chatIds?.includes(chatId)) {
          return {
            ...folder,
            chatIds: folder.chatIds.filter(id => id !== chatId),
            updatedAt: new Date()
          };
        }
        return folder;
      }));
      
      // Save updated folders
      const foldersToUpdate = folders.filter(f => f.chatIds?.includes(chatId));
      for (const folder of foldersToUpdate) {
        const updatedFolder = {
          ...folder,
          chatIds: folder.chatIds?.filter(id => id !== chatId) || [],
          updatedAt: new Date()
        };
        await chatDB.saveFolder(updatedFolder);
      }
    }
    
    // Persist to IndexedDB
    await chatDB.deleteChat(chatId);
  }, [chats, currentChatId, folders]);

  /**
   * Add a message to a chat
   */
  const addMessage = useCallback(async (chatId: string, message: Omit<Message, 'id' | 'createdAt'>) => {
    if (!chatId || !message?.content) return null;
    
    const newMessage: Message = {
      id: generateId(),
      content: message.content,
      role: message.role,
      createdAt: new Date(),
      isPinned: false
    };
    
    // Update local state
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updatedMessages = [...chat.messages, newMessage];
        return {
          ...chat,
          messages: updatedMessages,
          updatedAt: new Date(),
          // Update chat title if it's still the default
          title: chat.title === 'New Chat' && message.role === 'user'
            ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
            : chat.title
        };
      }
      return chat;
    }));
    
    // Persist message to IndexedDB
    await chatDB.saveMessage({
      ...newMessage,
      chatId
    });
    
    // Update chat in IndexedDB
    const updatedChat = chats.find(c => c.id === chatId);
    if (updatedChat) {
      // Update the title if needed
      if (updatedChat.title === 'New Chat' && message.role === 'user') {
        const newTitle = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
        updatedChat.title = newTitle;
      }
      
      await chatDB.saveChat(updatedChat);
    }
    
    return newMessage;
  }, [chats]);

  /**
   * Update a message in a chat
   */
  const updateMessage = useCallback(async (chatId: string, messageId: string, content: string) => {
    // Update local state
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const updatedMessages = chat.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content }
            : msg
        );
        return {
          ...chat,
          messages: updatedMessages,
          updatedAt: new Date()
        };
      }
      return chat;
    }));
    
    // Get the updated message from state
    const chat = chats.find(c => c.id === chatId);
    const message = chat?.messages.find(m => m.id === messageId);
    
    if (message) {
      // Persist to IndexedDB
      await chatDB.saveMessage({
        ...message,
        content,
        chatId
      });
      
      // Update chat's updatedAt
      await chatDB.saveChat({
        ...chat!,
        updatedAt: new Date()
      });
    }
  }, [chats]);

  /**
   * Clear all messages in a chat
   */
  const clearMessages = useCallback(async (chatId: string) => {
    // Update local state
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, messages: [], updatedAt: new Date() }
        : chat
    ));
    
    // Persist to IndexedDB
    await chatDB.clearChatMessages(chatId);
    
    // Update chat in IndexedDB
    const updatedChat = chats.find(c => c.id === chatId);
    if (updatedChat) {
      await chatDB.saveChat({
        ...updatedChat,
        messages: [],
        updatedAt: new Date()
      });
    }
  }, [chats]);

  /**
   * Change the model for a chat
   */
  const changeModel = useCallback(async (chatId: string, newModel: AIModel) => {
    // Update local state
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, model: newModel, updatedAt: new Date() }
        : chat
    ));
    
    // Get the updated chat from state
    const updatedChat = chats.find(c => c.id === chatId);
    if (updatedChat) {
      // Persist to IndexedDB
      await chatDB.saveChat({
        ...updatedChat,
        model: newModel,
        updatedAt: new Date()
      });
    }
  }, [chats]);

  /**
   * Search for chats matching a query
   */
  const searchChats = useCallback((query: string) => {
    if (!query.trim()) {
      return chats;
    }
    
    const lowerQuery = query.toLowerCase();
    return chats.filter(chat => {
      // Search in title
      if (chat.title.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Search in messages
      return chat.messages.some(msg => 
        msg.content.toLowerCase().includes(lowerQuery)
      );
    });
  }, [chats]);

  /**
   * Create a new empty chat
   */
  function createNewChat(model: AIModel = 'smart'): Chat {
    return {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      model,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Return all methods and state
  return {
    chats,
    folders,
    currentChat,
    currentChatId,
    isLoaded,
    usingFallback,
    setCurrentChatId,
    createFolder,
    updateFolder,
    deleteFolder,
    moveChatToFolder,
    reorderFolders,
    toggleFavorite,
    togglePinMessage,
    createChat,
    updateChat,
    deleteChat,
    addMessage,
    updateMessage,
    clearMessages,
    changeModel,
    searchChats
  };
}

export default useChatStore;