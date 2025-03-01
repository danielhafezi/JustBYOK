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
          // No fallback anymore - just create an empty chat
          console.log('IndexedDB not available, creating empty chat');
          const newChat = createNewChat();
          setChats([newChat]);
          setCurrentChatId(newChat.id);
          setFolders([]);
          setUsingFallback(true);
          setIsLoaded(true);
          return;
        }
        
        // We don't try to load from localStorage anymore
        // Just load directly from IndexedDB
        
        // Load data from IndexedDB
        const [loadedChats, loadedFolders] = await Promise.all([
          chatDB.getAllChats(),
          chatDB.getAllFolders()
        ]);
        
        console.log(`Loaded ${loadedChats.length} chats from IndexedDB`);
        
        // Load messages for each chat to ensure they're fully populated
        const populatedChats = await Promise.all(
          loadedChats.map(async (chat) => {
            // Only load messages if the chat object doesn't already have them
            if (!chat.messages || chat.messages.length === 0) {
              const messages = await chatDB.getChatMessages(chat.id);
              return { ...chat, messages };
            }
            return chat;
          })
        );
        
        // Set state with loaded data
        setChats(populatedChats);
        setFolders(loadedFolders);
        
        // Set current chat to the most recent one, or create a new one if none exist
        if (populatedChats.length > 0) {
          setCurrentChatId(populatedChats[0].id);
        } else {
          const newChat = createNewChat();
          await chatDB.saveChat(newChat);
          setChats([newChat]);
          setCurrentChatId(newChat.id);
        }
      } catch (error) {
        console.error('Error initializing chat store:', error);
        
        // No fallback to localStorage anymore
        // Just create a new chat on error
        const newChat = createNewChat();
        setChats([newChat]);
        setCurrentChatId(newChat.id);
        setFolders([]);
        setUsingFallback(true);
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
    // Find the folder to update
    const folderToUpdate = folders.find(f => f.id === folderId);
    if (!folderToUpdate) return;
    
    // Create the updated folder object
    const updatedFolder = { 
      ...folderToUpdate, 
      ...updates, 
      updatedAt: new Date() 
    };
    
    // Update local state
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? updatedFolder : folder
    ));
    
    // Persist to IndexedDB
    await chatDB.saveFolder(updatedFolder);
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
    // Find the chat to update
    const chatToUpdate = chats.find(c => c.id === chatId);
    if (!chatToUpdate) return;
    
    // Determine the new favorite status (ensure it's a boolean, not undefined)
    const newFavoriteStatus = chatToUpdate.favorite === true ? false : true;
    
    // Create the updated chat object with explicit boolean value
    const updatedChat = { 
      ...chatToUpdate, 
      favorite: newFavoriteStatus,
      updatedAt: new Date()
    };
    
    // Update local state
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? updatedChat : chat
    ));
    
    // Persist to IndexedDB with explicit favorite property
    await chatDB.saveChat(updatedChat);
    
    console.log(`Chat ${chatId} favorite status toggled to: ${newFavoriteStatus}`);
  }, [chats]);

  /**
   * Toggle pin status of a message
   */
  const togglePinMessage = useCallback(async (chatId: string, messageId: string) => {
    // Find the chat and message
    const chatToUpdate = chats.find(c => c.id === chatId);
    if (!chatToUpdate) return;
    
    const messageToUpdate = chatToUpdate.messages.find(m => m.id === messageId);
    if (!messageToUpdate) return;
    
    // Create updated message with toggled pin status
    const updatedMessage = {
      ...messageToUpdate,
      isPinned: !messageToUpdate.isPinned
    };
    
    // Update pinnedMessageIds
    let pinnedMessageIds = [...(chatToUpdate.pinnedMessageIds || [])];
    if (updatedMessage.isPinned) {
      // Add to pinned list if not already there
      if (!pinnedMessageIds.includes(messageId)) {
        pinnedMessageIds.push(messageId);
      }
    } else {
      // Remove from pinned list
      pinnedMessageIds = pinnedMessageIds.filter(id => id !== messageId);
    }
    
    // Create updated chat with updated message and pinnedMessageIds
    const updatedChat = {
      ...chatToUpdate,
      messages: chatToUpdate.messages.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ),
      pinnedMessageIds,
      updatedAt: new Date()
    };
    
    // Update local state
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? updatedChat : chat
    ));
    
    // Persist message to IndexedDB
    await chatDB.saveMessage({
      ...updatedMessage,
      chatId
    });
    
    // Persist chat to IndexedDB to save pinnedMessageIds
    await chatDB.saveChat(updatedChat);
    
    console.log(`Message ${messageId} pin status toggled to: ${updatedMessage.isPinned}`);
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
    // Find the chat to update
    const chatToUpdate = chats.find(c => c.id === chatId);
    if (!chatToUpdate) return;
    
    // Create the updated chat object
    const updatedChat = { 
      ...chatToUpdate, 
      ...updates, 
      updatedAt: new Date() 
    };
    
    // Update local state
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? updatedChat : chat
    ));
    
    // Persist to IndexedDB
    await chatDB.saveChat(updatedChat);
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
    
    // Find the chat to update
    const chatToUpdate = chats.find(c => c.id === chatId);
    if (!chatToUpdate) return null;
    
    // Create the new message
    const newMessage: Message = {
      id: generateId(),
      content: message.content,
      role: message.role,
      createdAt: new Date(),
      isPinned: false
    };
    
    // Determine if we need to update the chat title
    const shouldUpdateTitle = chatToUpdate.title === 'New Chat' && message.role === 'user';
    const newTitle = shouldUpdateTitle
      ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
      : chatToUpdate.title;
    
    // Create a copy of the messages array to avoid reference issues
    const updatedMessages = [...chatToUpdate.messages, newMessage];
    
    // Create the updated chat
    const updatedChat = {
      ...chatToUpdate,
      messages: updatedMessages,
      title: newTitle,
      updatedAt: new Date()
    };
    
    // Update local state with the new message FIRST before any async operations
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? updatedChat : chat
    ));
    
    try {
      // Now handle async operations
      
      // Persist message to IndexedDB
      await chatDB.saveMessage({
        ...newMessage,
        chatId
      });
      
      // Persist chat to IndexedDB (don't overwrite the messages array)
      await chatDB.saveChat({
        ...updatedChat,
        // Don't include messages as they're stored separately
        messages: []
      });
      
      // Log success for debugging
      console.log(`Message saved successfully: ${newMessage.id}`);
      
    } catch (error) {
      console.error('Error saving message:', error);
      // If there's an error, we don't need to revert the UI state
      // as the message is already displayed and the user expects it to stay
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
      favorite: false,
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