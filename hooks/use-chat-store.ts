'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Chat, Message, AIModel, Folder, Settings } from '@/lib/types';
import { 
  loadChatsFromLocalStorage, 
  loadFoldersFromStorage,
  generateId
} from '@/lib/utils/chat-storage';
import { chatDB } from '@/lib/chat-db';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { storage } from '@/lib/storage';

/**
 * React hook for managing chat state with IndexedDB persistence
 */
export function useChatStore() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

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
    
    initializeStore();
  }, []);

  // Listen for API key updates
  useEffect(() => {
    const handleApiKeyUpdate = (event: CustomEvent<{ provider: string, key: string }>) => {
      console.log(`API key updated for ${event.detail.provider}`);
      // No need to do anything else here, as getApiKey will fetch the latest key from localStorage
    };
    
    window.addEventListener('api-key-update', handleApiKeyUpdate as EventListener);
    
    return () => {
      window.removeEventListener('api-key-update', handleApiKeyUpdate as EventListener);
    };
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
    const chatToUpdate = (await new Promise<Chat | undefined>(resolve => {
      setChats(prevChats => {
        const latestChat = prevChats.find(c => c.id === chatId);
        resolve(latestChat);
        return prevChats;
      });
    }));

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
    
    // Persist chat to IndexedDB without clearing messages
    await chatDB.saveChat(updatedChat);
    
    console.log(`Message ${messageId} pin status toggled to: ${updatedMessage.isPinned}`);
  }, [chats]);

  /**
   * Create a new chat
   */
  const createChat = useCallback(async (model: AIModel = 'gpt-4o') => {
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
    
    console.log(`Adding ${message.role} message to chat ${chatId}. Current message count: ${chatToUpdate.messages.length}`);
    
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
    
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          title: newTitle,
          updatedAt: new Date()
        };
      }
      return chat;
    }));
    
    try {
      // Now handle async operations
      
      // Persist message to IndexedDB
      await chatDB.saveMessage({
        ...newMessage,
        chatId
      });
      
      // Persist chat to IndexedDB without clearing messages
      await chatDB.saveChat(updatedChat);
      
      // Log success for debugging
      console.log(`Message saved successfully: ${newMessage.id}`);
      
      // If the message is from the user, generate an AI response
      if (message.role === 'user') {
        // Ensure the message is in the chat object before generating a response
        // This is a critical fix for the "one message behind" issue
        const updatedChatToUpdate = {
          ...chatToUpdate,
          messages: [...chatToUpdate.messages, newMessage]
        };
        
        // Update the chat in the local chats array to ensure it has the latest messages
        const updatedChats = chats.map(chat => 
          chat.id === chatId ? updatedChatToUpdate : chat
        );
        
        // Force a state update to ensure the message is in the state
        setChats(updatedChats);
        
        // Wait a moment to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Now generate the AI response with the updated chat object
await generateAIResponse(updatedChatToUpdate.id, updatedChatToUpdate.model, updatedChatToUpdate.messages);
      }
      
    } catch (error) {
      console.error('Error saving message:', error);
      // If there's an error, we don't need to revert the UI state
      // as the message is already displayed and the user expects it to stay
    }
    
    return newMessage;
  }, [chats]);

  /**
   * Get API key from localStorage based on model provider
   */
  const getApiKey = useCallback((model: AIModel): string => {
    try {
      // Determine provider based on model ID
      let provider: string;
      
      if (['gpt-4o', 'gpt-4o-mini', 'gpt-45-preview'].includes(model as string)) {
        provider = 'openai';
      } else if (['claude-3-sonnet', 'claude-3-sonnet-reasoning'].includes(model as string)) {
        provider = 'anthropic';
      } else if (model === 'gemini-flash-2') {
        provider = 'gemini';
      } else {
        // Default to OpenAI for unknown models
        provider = 'openai';
      }
      
      // Get API keys from localStorage
      const keysJson = localStorage.getItem('APP_api-keys');
      if (keysJson) {
        const keys = JSON.parse(keysJson);
        return keys[provider] || '';
      }
    } catch (error) {
      console.error('Error getting API key:', error);
    }
    return '';
  }, []);

  /**
   * Convert internal model ID to API-specific model ID
   */
  const getModelIdForApiRequest = (model: AIModel): string => {
    // Just pass through the model ID - the API will handle conversion
    return model;
  };

  /**
   * Generate AI response to a message
   */
const generateAIResponse = useCallback(async (chatId: string, model: AIModel, messages: Message[]) => {
    
    console.log('Generating AI response for chat:', chatId);
console.log('Chat messages count:', messages.length);
    
    // Print the last message for debugging
if (messages.length > 0) {
  const lastMsg = messages[messages.length - 1];
      console.log('Last message in chat:', {
        role: lastMsg.role,
        contentStart: lastMsg.content.substring(0, 50) + (lastMsg.content.length > 50 ? '...' : '')
      });
    } else {
      console.warn('No messages found in chat, will use default message');
    }
    
    // Get stored API key
    const apiKey = getApiKey(model);
    
    // Get model settings using the storage utility
    let modelSettings;
    try {
      // Use the storage utility which handles the APP_ prefix internally
      const settings = storage.get<Settings>('settings');
      if (settings && settings.modelSettings) {
        // Create a clean model settings object with just the properties we need
        modelSettings = {
          temperature: settings.modelSettings.temperature || 0.7,
          topP: settings.modelSettings.topP || 0.9,
          frequencyPenalty: settings.modelSettings.frequencyPenalty || 0,
          presencePenalty: settings.modelSettings.presencePenalty || 0,
          maxTokens: settings.modelSettings.maxTokens || 1000,
          systemPrompt: settings.modelSettings.systemPrompt || ''
        };
        
        console.log('Using model settings from storage:', modelSettings);
      } else {
        console.log('No model settings found in storage, using defaults');
        // Use default settings
        modelSettings = {
          temperature: 0.7,
          topP: 0.9, 
          frequencyPenalty: 0,
          presencePenalty: 0,
          maxTokens: 1000,
          systemPrompt: ''
        };
      }
    } catch (error) {
      console.error('Error getting model settings:', error);
      // Use default settings on error
      modelSettings = {
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        maxTokens: 1000,
        systemPrompt: ''
      };
    }
    
    // If no API key is available, add system message indicating error
    if (!apiKey) {
      const errorMessage: Message = {
        id: generateId(),
        content: `API key required for ${model}. Please add your API key in settings.`,
        role: 'system',
        createdAt: new Date(),
        isPinned: false
      };
      
      // Update local state with error message
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, errorMessage],
            updatedAt: new Date()
          };
        }
        return chat;
      }));
      
      // Save error message to IndexedDB
      await chatDB.saveMessage({
        ...errorMessage,
        chatId
      });
      
      return null;
    }
    
    // Format messages for the API - do this BEFORE creating placeholder message
    // Extract current messages, excluding any empty assistant messages
const existingMessages = messages
      .filter(msg => msg.role !== 'assistant' || msg.content.trim() !== '');  // Filter out empty assistant messages
    
    // Ensure we have at least one user message (this is the critical fix)
    
    // Format messages for the API
    const apiMessages = existingMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    console.log('API messages prepared:', apiMessages.length, 'messages');
    
    // Add validation check for empty messages array - this should never happen
    if (apiMessages.length === 0) {
      console.error('No valid messages to send to API - this should never happen');
      
      const errorMessage: Message = {
        id: generateId(),
        content: 'Error: No valid messages to send. Please try again or refresh the page.',
        role: 'system',
        createdAt: new Date(),
        isPinned: false
      };
      
      // Update chat with error message
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, errorMessage],
            updatedAt: new Date()
          };
        }
        return chat;
      }));
      
      // Save error message
      await chatDB.saveMessage({
        ...errorMessage,
        chatId
      });
      
      return null;
    }
    
    // Get the latest chat state again to ensure we have any new messages that might have been added
    // after we started generating the response
    const latestChat = chats.find(c => c.id === chatId);
if (latestChat && latestChat.messages.length > messages.length) {
      console.log('Chat messages changed during processing, using latest state');
      
      // Refresh our messages from the latest state
      const latestMessages = latestChat.messages
        .filter(msg => msg.role !== 'assistant' || msg.content.trim() !== '');
        
      // Update the API messages
      if (latestMessages.length > existingMessages.length) {
        const updatedApiMessages = latestMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        console.log('Updated API messages count:', updatedApiMessages.length);
        
        // Only use the updated messages if we found more than before
        if (updatedApiMessages.length > 0) {
          // Replace our apiMessages array with the updated one
          apiMessages.length = 0;
          apiMessages.push(...updatedApiMessages);
        }
      }
    }
    
    // Create a payload object with all needed data
    const payload = {
      messages: apiMessages.length > 0 ? apiMessages : [{ 
        role: 'system', 
        content: modelSettings?.systemPrompt || 'The user is starting a new conversation.' 
      }],
      apiKey,
      model: getModelIdForApiRequest(model),
      modelSettings // Include model settings from localStorage
    };
    
    console.log('API Payload Check:', {
      hasMessages: !!payload.messages && Array.isArray(payload.messages),
      messagesCount: payload.messages ? payload.messages.length : 0,
      hasApiKey: !!payload.apiKey,
      hasModel: !!payload.model,
      modelValue: payload.model
    });
    
    // Final safety check - ensure we have at least one message
    if (!payload.messages || !Array.isArray(payload.messages) || payload.messages.length === 0) {
      console.error('No messages in payload after all checks - adding default message');
      
      // Use the system prompt from model settings if available
      const systemPromptContent = modelSettings?.systemPrompt || 'The user is starting a new conversation.';
      
      payload.messages = [{ 
        role: 'system', 
        content: systemPromptContent
      }];
      
      console.log('Added system prompt to empty messages array:', 
        systemPromptContent.substring(0, 50) + (systemPromptContent.length > 50 ? '...' : ''));
    }
    
    // Create placeholder assistant message only after preparing the API payload
    const assistantMessageId = generateId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      createdAt: new Date(),
      isPinned: false
    };
    
    // Add empty message to the chat first (will be updated with streaming content)
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: [...chat.messages, assistantMessage],
          updatedAt: new Date()
        };
      }
      return chat;
    }));
    
    // Save initial empty message to IndexedDB
    await chatDB.saveMessage({
      ...assistantMessage,
      chatId
    });
    
    // Set generating state to true
    setIsGenerating(true);
    
    // Create an AbortController for cancellation
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      // Call the simplechat API directly
      console.log('Calling simplechat API with messages:', apiMessages.length);
      
      // Log detailed information about the messages
      console.log('API Messages structure check:', {
        isArray: Array.isArray(apiMessages),
        isEmpty: apiMessages.length === 0,
        firstMessageRole: apiMessages.length > 0 ? apiMessages[0].role : 'none',
        lastMessageRole: apiMessages.length > 0 ? apiMessages[apiMessages.length - 1].role : 'none'
      });
      
      // Log full messages array for first chat only (helpful for debugging)
      if (apiMessages.length <= 3) {
        console.log('Full messages array for debugging:', JSON.stringify(apiMessages));
      }
      
      // Log the last message to help with debugging
      if (apiMessages.length > 0) {
        console.log('Last message:', {
          role: apiMessages[apiMessages.length - 1].role,
          contentPreview: apiMessages[apiMessages.length - 1].content.substring(0, 50)
        });
      }
      
      const response = await fetch('/api/simplechat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      console.log('Simplechat API status:', response.status);
      
      if (!response.ok) {
        // Get more detailed error info if available
        try {
          const errorBody = await response.json();
          console.error('API error details:', errorBody);
          
          // Create an error message with more details
          const errorMessage: Message = {
            id: generateId(),
            content: `Sorry, there was an error: ${errorBody.error || `HTTP error! status: ${response.status}`}. Please try again.`,
            role: 'system',
            createdAt: new Date(),
            isPinned: false
          };
          
          // Update the UI with the error message
          setChats(prev => prev.map(chat => {
            if (chat.id === chatId) {
              // Replace the empty assistant message with the error message
              const updatedMessages = chat.messages.filter(msg => msg.id !== assistantMessageId);
              return {
                ...chat,
                messages: [...updatedMessages, errorMessage],
                updatedAt: new Date()
              };
            }
            return chat;
          }));
          
          // Save the error message
          await chatDB.saveMessage({
            ...errorMessage,
            chatId
          });
          
          throw new Error(`HTTP error! status: ${response.status}. Details: ${JSON.stringify(errorBody)}`);
        } catch (parseError) {
          // If we can't parse the error JSON, fall back to basic error
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      if (!response.body) {
        throw new Error('No response body from API');
      }
      
      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = '';
      let chunkCount = 0;
      
      console.log('Starting to process stream...');
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream done, total chunks processed:', chunkCount);
          break;
        }
        
        chunkCount++;
        
        // Decode the chunk
        const chunk = decoder.decode(value);
        if (chunkCount === 1 || chunkCount % 10 === 0) {
          console.log(`Received chunk #${chunkCount}, length: ${chunk.length} bytes`);
        }
        
        const dataLines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of dataLines) {
          if (line.startsWith('data:')) {
            try {
              const content = line.slice(5).trim();
              
              if (content === '[DONE]') {
                console.log('Received [DONE] signal');
                continue;
              }
              
              // Parse the data
              const data = JSON.parse(content);
              
              if (data.type === 'text') {
                // Update the accumulated content
                responseText += data.value || '';
                
                if (chunkCount === 1 || responseText.length % 100 === 0) {
                  console.log(`Current response length: ${responseText.length} chars`);
                }
                
                // Update in-memory chat state
                setChats(prev => prev.map(chat => {
                  if (chat.id === chatId) {
                    return {
                      ...chat,
                      messages: chat.messages.map(msg => 
                        msg.id === assistantMessageId 
                          ? { ...msg, content: responseText }
                          : msg
                      ),
                      updatedAt: new Date()
                    };
                  }
                  return chat;
                }));
                
                // Update message in IndexedDB periodically (not on every token)
                if (responseText.length % 100 === 0) {
                  await chatDB.saveMessage({
                    ...assistantMessage,
                    content: responseText,
                    chatId
                  });
                }
              } else if (data.type === 'error') {
                console.error('Error in stream:', data.value);
                responseText = `Error: ${data.value}`;
                
                // Update in-memory chat state with error
                setChats(prev => prev.map(chat => {
                  if (chat.id === chatId) {
                    return {
                      ...chat,
                      messages: chat.messages.map(msg => 
                        msg.id === assistantMessageId 
                          ? { ...msg, content: responseText }
                          : msg
                      ),
                      updatedAt: new Date()
                    };
                  }
                  return chat;
                }));
              }
            } catch (err) {
              console.error('Error parsing stream data:', err, 'Line:', line);
            }
          }
        }
      }
      
      console.log('Stream processing complete, final response length:', responseText.length);
      
      // Final update to IndexedDB once streaming is complete
      await chatDB.saveMessage({
        ...assistantMessage,
        content: responseText,
        chatId
      });
      
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      
      // Don't show error for aborted requests
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        // Update with error message
        const errorContent = `Sorry, there was an error: ${error.message}. Please try again.`;
        
        // Update in-memory message
        setChats(prev => prev.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: errorContent }
                  : msg
              ),
              updatedAt: new Date()
            };
          }
          return chat;
        }));
        
        // Update message in IndexedDB
        await chatDB.saveMessage({
          ...assistantMessage,
          content: errorContent,
          chatId
        });
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [chats, getApiKey]);

  /**
   * Stop generating AI response
   */
  const stopGenerating = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [abortController]);

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
  function createNewChat(model: AIModel = 'gpt-4o'): Chat {
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
    isGenerating,
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
    searchChats,
    stopGenerating
  };
}

export default useChatStore;
