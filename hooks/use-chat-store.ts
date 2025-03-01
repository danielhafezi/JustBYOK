import { useEffect, useState } from 'react';
import { Chat, Message, AIModel, Folder } from '@/lib/types';
import { 
  loadChatsFromLocalStorage, 
  saveChatsToLocalStorage, 
  createNewChat, 
  updateChatTitle,
  loadFoldersFromStorage,
  saveFoldersToStorage,
  generateId
} from '@/lib/utils/chat-storage';

export function useChatStore() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load chats from storage on initial render
  useEffect(() => {
    try {
      const loadedChats = loadChatsFromLocalStorage();
      const loadedFolders = loadFoldersFromStorage();
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

  // Save chats to storage whenever they change
  useEffect(() => {
    if (isLoaded && Array.isArray(chats)) {
      try {
        saveChatsToLocalStorage(chats);
        saveFoldersToStorage(folders);
      } catch (error) {
        console.error('Error saving chats to storage:', error);
      }
    }
  }, [chats, folders, isLoaded]);

  // Create a new folder
  const createFolder = () => {
    const newFolder: Folder = {
      id: generateId(),
      name: 'New Folder',
      createdAt: new Date(),
      updatedAt: new Date(),
      chatIds: [],
      isEditing: true
    };
    
    setFolders([...folders, newFolder]);
    
    return newFolder;
  };

  // Update a folder
  const updateFolder = (folderId: string, updates: Partial<Folder>) => {
    setFolders(
      folders.map(folder => {
        if (folder.id === folderId) {
          return { ...folder, ...updates, updatedAt: new Date() };
        }
        return folder;
      })
    );
  };

  // Delete a folder
  const deleteFolder = (folderId: string) => {
    // Get all chatIds in this folder
    const folderToDelete = folders.find(f => f.id === folderId);
    if (folderToDelete && folderToDelete.chatIds) {
      // Remove folder reference from chats
      setChats(
        chats.map(chat => {
          if (chat.folderId === folderId) {
            return { ...chat, folderId: undefined };
          }
          return chat;
        })
      );
    }
    
    // Remove the folder
    setFolders(folders.filter(f => f.id !== folderId));
  };

  // Move a chat to a folder
  const moveChatToFolder = (chatId: string, folderId: string | undefined) => {
    // Update the chat's folder reference
    setChats(
      chats.map(chat => {
        if (chat.id === chatId) {
          return { ...chat, folderId, updatedAt: new Date() };
        }
        return chat;
      })
    );
    
    // Update folders
    setFolders(
      folders.map(folder => {
        // Add to new folder
        if (folder.id === folderId) {
          const chatIds = folder.chatIds || [];
          if (!chatIds.includes(chatId)) {
            return { 
              ...folder, 
              chatIds: [...chatIds, chatId],
              updatedAt: new Date() 
            };
          }
        } 
        // Remove from other folders
        else if (folder.chatIds && folder.chatIds.includes(chatId)) {
          return { 
            ...folder, 
            chatIds: folder.chatIds.filter(id => id !== chatId),
            updatedAt: new Date() 
          };
        }
        return folder;
      })
    );
  };

  // Reorder folders
  const reorderFolders = (reorderedFolders: Folder[]) => {
    setFolders(reorderedFolders);
  };

  // Toggle favorite status for a chat
  const toggleFavorite = (chatId: string) => {
    setChats(
      chats.map(chat => {
        if (chat.id === chatId) {
          return { 
            ...chat, 
            favorite: !chat.favorite,
            updatedAt: new Date() 
          };
        }
        return chat;
      })
    );
  };

  // Toggle pin status for a message
  const togglePinMessage = (chatId: string, messageId: string) => {
    setChats(
      chats.map(chat => {
        if (chat.id === chatId) {
          // Get the current list of pinned message IDs or create an empty array
          const pinnedMessageIds = chat.pinnedMessageIds || [];
          
          // Check if the message is already pinned
          const isCurrentlyPinned = pinnedMessageIds.includes(messageId);
          
          // Toggle the pin status
          const updatedPinnedMessageIds = isCurrentlyPinned
            ? pinnedMessageIds.filter(id => id !== messageId)
            : [...pinnedMessageIds, messageId];
          
          // Update the messages to mark them as pinned/unpinned
          const updatedMessages = chat.messages.map(message => {
            if (message.id === messageId) {
              return {
                ...message,
                isPinned: !isCurrentlyPinned
              };
            }
            return message;
          });
          
          return {
            ...chat,
            messages: updatedMessages,
            pinnedMessageIds: updatedPinnedMessageIds,
            updatedAt: new Date()
          };
        }
        return chat;
      })
    );
  };

  // Create a new chat
  const createChat = (model: AIModel = 'smart') => {
    const newChat = createNewChat(model);
    
    // Add to beginning of array (most recent first)
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    
    return newChat;
  };

  // Update a chat
  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    setChats(
      chats.map(chat => {
        if (chat.id === chatId) {
          return { ...chat, ...updates, updatedAt: new Date() };
        }
        return chat;
      })
    );
  };

  // Delete a chat
  const deleteChat = (chatId: string) => {
    // If the chat is in a folder, remove it from the folder
    const chatToDelete = chats.find(c => c.id === chatId);
    if (chatToDelete && chatToDelete.folderId) {
      setFolders(
        folders.map(folder => {
          if (folder.id === chatToDelete.folderId) {
            return {
              ...folder,
              chatIds: folder.chatIds.filter(id => id !== chatId),
              updatedAt: new Date()
            };
          }
          return folder;
        })
      );
    }
    
    // Remove the chat
    setChats(chats.filter(c => c.id !== chatId));
    
    // If deleted the current chat, select another one
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(c => c.id !== chatId);
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
      id: generateId(),
      ...message,
      createdAt: new Date(),
    };

    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedMessages = [...(chat.messages || []), newMessage];

          const updatedChat = updateChatTitle(
            {
              ...chat,
              messages: updatedMessages,
              updatedAt: new Date()
            },
            updatedMessages
          );

          return updatedChat;
        }
        return chat;
      })
    );

    return newMessage;
  };

  // Update a message in a chat
  const updateMessage = (chatId: string, messageId: string, content: string) => {
    setChats(
      chats.map(chat => {
        if (chat.id === chatId) {
          const updatedMessages = chat.messages.map(message => {
            if (message.id === messageId) {
              return {
                ...message,
                content
              };
            }
            return message;
          });
          
          return {
            ...chat,
            messages: updatedMessages,
            updatedAt: new Date()
          };
        }
        return chat;
      })
    );
  };

  // Clear all messages from a chat
  const clearMessages = (chatId: string) => {
    setChats(
      chats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [],
            title: 'New Chat',
            updatedAt: new Date()
          };
        }
        return chat;
      })
    );
  };

  // Change the model for a chat
  const changeModel = (chatId: string, newModel: AIModel) => {
    setChats(
      chats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            model: newModel,
            updatedAt: new Date()
          };
        }
        return chat;
      })
    );
  };

  // Return the current chat
  const currentChat = chats.find(chat => chat.id === currentChatId) || null;

  // Search chats by title and content
  const searchChats = (query: string) => {
    if (!query) return chats;
    
    const lowercaseQuery = query.toLowerCase();
    
    return chats.filter(chat => {
      const titleMatch = chat.title.toLowerCase().includes(lowercaseQuery);
      
      const contentMatch = chat.messages.some(message => 
        message.content.toLowerCase().includes(lowercaseQuery)
      );
      
      return titleMatch || contentMatch;
    });
  };
  
  return {
    chats,
    folders,
    currentChat,
    currentChatId,
    setCurrentChatId,
    createChat,
    updateChat,
    deleteChat,
    addMessage,
    updateMessage,
    clearMessages,
    changeModel,
    createFolder,
    updateFolder,
    deleteFolder,
    moveChatToFolder,
    reorderFolders,
    toggleFavorite,
    togglePinMessage,
    searchChats,
    isLoaded,
  };
}