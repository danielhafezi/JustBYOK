import { useEffect, useState } from 'react';
import { Chat, Message, AIModel, Folder } from '@/lib/types';
import { loadChatsFromLocalStorage, saveChatsToLocalStorage, createNewChat, updateChatTitle } from '@/lib/utils/chat-storage';

export function useChatStore() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load chats from localStorage on initial render
  useEffect(() => {
    try {
      const loadedChats = loadChatsFromLocalStorage();
      const loadedFolders = JSON.parse(localStorage.getItem('chat-folders') || '[]');
      setChats(Array.isArray(loadedChats) ? loadedChats : []);
      setFolders(Array.isArray(loadedFolders) ? loadedFolders : []);
      
      // Set current chat to the most recent one, or create a new one if none exist
      if (loadedChats.length > 0) {
        setCurrentChatId(loadedChats[0].id);
      } else {
        const newChat = createNewChat();
        setChats([newChat]);
        setCurrentChatId(newChat.id);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      // Handle error by creating a new chat
      const newChat = createNewChat();
      setChats([newChat]);
      setCurrentChatId(newChat.id);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && Array.isArray(chats)) {
      try {
        saveChatsToLocalStorage(chats);
        localStorage.setItem('chat-folders', JSON.stringify(folders));
      } catch (error) {
        console.error('Error saving chats to localStorage:', error);
      }
    }
  }, [chats, folders, isLoaded]);

  // Create a new folder
  const createFolder = () => {
    const newFolder: Folder = {
      id: Math.random().toString(36).substring(2, 10),
      name: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      chatIds: [],
      isEditing: true
    };
    setFolders(prev => [newFolder, ...prev]);
    return newFolder;
  };

  // Update folder
  const updateFolder = (folderId: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId 
        ? { ...folder, ...updates, updatedAt: new Date() }
        : folder
    ));
  };

  // Delete folder
  const deleteFolder = (folderId: string) => {
    // Remove folder reference from chats
    setChats(prev => prev.map(chat => 
      chat.folderId === folderId 
        ? { ...chat, folderId: undefined }
        : chat
    ));
    
    // Remove folder
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
  };

  // Move chat to folder
  const moveChatToFolder = (chatId: string, folderId: string | undefined) => {
    // Update chat's folder reference
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, folderId }
        : chat
    ));

    // Update folders' chat lists
    setFolders(prev => prev.map(folder => {
      if (folder.id === folderId) {
        // Add to new folder
        return { ...folder, chatIds: [...folder.chatIds, chatId] };
      } else {
        // Remove from other folders
        return { ...folder, chatIds: folder.chatIds.filter(id => id !== chatId) };
      }
    }));
  };

  // Reorder folders
  const reorderFolders = (reorderedFolders: Folder[]) => {
    setFolders(reorderedFolders);
  };

  // Toggle chat favorite status
  const toggleFavorite = (chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId
        ? { ...chat, favorite: !chat.favorite, updatedAt: new Date() }
        : chat
    ));
  };

  // Pin/unpin a message
  const togglePinMessage = (chatId: string, messageId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        // Get current pinned message ids (or initialize empty array)
        const pinnedMessageIds = Array.isArray(chat.pinnedMessageIds) ? [...chat.pinnedMessageIds] : [];
        
        // Toggle pin status
        const isPinned = pinnedMessageIds.includes(messageId);
        const updatedPinnedMessageIds = isPinned 
          ? pinnedMessageIds.filter(id => id !== messageId)
          : [...pinnedMessageIds, messageId];
        
        // Update message pin status in messages array
        const updatedMessages = chat.messages.map(message => 
          message.id === messageId 
            ? { ...message, isPinned: !isPinned } 
            : message
        );
        
        return {
          ...chat,
          pinnedMessageIds: updatedPinnedMessageIds,
          messages: updatedMessages,
          updatedAt: new Date()
        };
      }
      return chat;
    }));
  };

  // Sort chats: favorites first, then by updated date
  const sortedChats = [...chats].sort((a, b) => {
    // First sort by favorite status
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    
    // Then sort by updated date (most recent first)
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Get the current chat
  const currentChat = chats.find(chat => chat?.id === currentChatId) || null;

  // Create a new chat
  const createChat = (model: AIModel = 'smart') => {
    const newChat = createNewChat(model);
    setChats(prevChats => [newChat, ...(Array.isArray(prevChats) ? prevChats : [])]);
    setCurrentChatId(newChat.id);
    return newChat;
  };

  // Update a chat
  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    if (!chatId) return;
    
    setChats(prevChats =>
      (Array.isArray(prevChats) ? prevChats : []).map(chat =>
        chat?.id === chatId
          ? { ...chat, ...updates, updatedAt: new Date() }
          : chat
      )
    );
  };

  // Delete a chat
  const deleteChat = (chatId: string) => {
    if (!chatId) return;
    
    setChats(prevChats => (Array.isArray(prevChats) ? prevChats : []).filter(chat => chat?.id !== chatId));
    
    // If we're deleting the current chat, switch to another one
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat?.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        const newChat = createNewChat();
        setChats([newChat]);
        setCurrentChatId(newChat.id);
      }
    }
  };

  // Add a message to a chat
  const addMessage = (chatId: string, message: Omit<Message, 'id' | 'createdAt'>) => {
    if (!chatId || !message?.content) return null;
    
    const newMessage: Message = {
      id: Math.random().toString(36).substring(2, 10),
      ...message,
      createdAt: new Date()
    };
    
    setChats(prevChats =>
      (Array.isArray(prevChats) ? prevChats : []).map(chat => {
        if (chat?.id === chatId) {
          const updatedMessages = Array.isArray(chat.messages) ? [...chat.messages, newMessage] : [newMessage];
          const updatedChat = updateChatTitle(chat, updatedMessages);
          
          return {
            ...updatedChat,
            messages: updatedMessages,
            updatedAt: new Date()
          };
        }
        return chat;
      })
    );
    
    return newMessage;
  };

  // Clear all messages from a chat
  const clearMessages = (chatId: string) => {
    if (!chatId) return;
    
    setChats(prevChats =>
      (Array.isArray(prevChats) ? prevChats : []).map(chat =>
        chat?.id === chatId
          ? { ...chat, messages: [], pinnedMessageIds: [], updatedAt: new Date() }
          : chat
      )
    );
  };

  // Change the model for a chat
  const changeModel = (chatId: string, newModel: AIModel) => {
    if (!chatId) return;
    
    // Validate model
    const validModel = ['smart', 'openai', 'anthropic', 'gemini'].includes(newModel) ? newModel : 'smart';
    
    setChats(prevChats =>
      (Array.isArray(prevChats) ? prevChats : []).map(chat =>
        chat?.id === chatId
          ? { ...chat, model: validModel as AIModel, updatedAt: new Date() }
          : chat
      )
    );
  };

  // Search chats
  const searchChats = (query: string) => {
    if (!query?.trim()) return sortedChats;
    
    if (!Array.isArray(chats)) return [];
    
    const lowercasedQuery = query.toLowerCase();
    
    return sortedChats.filter(chat => {
      if (!chat) return false;
      
      // Search in title
      if (chat.title?.toLowerCase().includes(lowercasedQuery)) return true;
      
      // Search in messages
      return Array.isArray(chat.messages) && chat.messages.some(message => 
        message?.content?.toLowerCase().includes(lowercasedQuery)
      );
    });
  };

  return {
    chats: sortedChats,
    currentChat,
    currentChatId,
    folders,
    setCurrentChatId,
    createChat,
    updateChat,
    deleteChat,
    createFolder,
    updateFolder,
    deleteFolder,
    moveChatToFolder,
    reorderFolders,
    addMessage,
    clearMessages,
    changeModel,
    searchChats,
    toggleFavorite,
    togglePinMessage,
    isLoaded
  };
}