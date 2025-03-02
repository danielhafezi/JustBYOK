'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from 'ai/react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatPanel } from '@/components/chat/chat-panel';
import { ChatMessage } from '@/components/chat/chat-message';
import { ChatList } from '@/components/chat/chat-list';
import { Button } from '@/components/ui/button';
import { Moon, Sun, PanelLeftClose, PanelLeftOpen, Settings, LogOut, Key, Sliders, User, Pin } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useChatStore } from '@/hooks/use-chat-store';
import { useProfileStore } from '@/hooks/use-profile-store';
import { AIModel } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ApiKeysDialog } from '@/components/settings/api-keys-dialog';
import { SettingsDialog } from '@/components/settings/settings-dialog';
import { ModelSettingsDialog } from '@/components/settings/model-settings-dialog';
import { PinnedMessagesDialog } from '@/components/chat/pinned-messages-dialog';

// Demo message content for testing UI without API
const DEMO_ASSISTANT_RESPONSE = `This is a placeholder response from the assistant. 

In a real implementation, this would be replaced with actual AI-generated content. For now, this helps us verify that the UI is displaying assistant messages correctly.

## Features demonstrated:
* Markdown support
* Message persistence
* UI layout verification`;

export default function Home() {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { setTheme, theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Completely independent UI state for development
  const [uiMessages, setUiMessages] = useState<any[]>([]);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [apiKeysDialogOpen, setApiKeysDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [modelSettingsDialogOpen, setModelSettingsDialogOpen] = useState(false);
  const [pinnedMessagesDialogOpen, setPinnedMessagesDialogOpen] = useState(false);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [profilePhotoLink, setProfilePhotoLink] = useState<string>('');
  
  const {
    chats,
    folders,
    currentChat,
    currentChatId,
    setCurrentChatId,
    createChat,
    createFolder,
    deleteChat,
    deleteFolder,
    addMessage,
    updateMessage,
    changeModel,
    searchChats,
    updateChat,
    updateFolder,
    moveChatToFolder,
    toggleFavorite,
    togglePinMessage,
    isLoaded
  } = useChatStore();

  const {
    currentProfile
  } = useProfileStore();

  // Set up Vercel AI SDK chat
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
    stop
  } = useChat({
    api: '/api/chat',
    body: {
      model: currentChat?.model || 'gpt4o',
    },
    onFinish: (message) => {
      if (currentChat) {
        addMessage(currentChat.id, {
          content: message.content,
          role: 'assistant',
        });
      }
    },
  });

  // Sync local messages with the chat store when current chat changes
  useEffect(() => {
    if (currentChat) {
      // Ensure we have a valid messages array
      const validMessages = Array.isArray(currentChat.messages) ? currentChat.messages : [];
      setMessages(validMessages);
      
      // Update UI messages
      setUiMessages(validMessages);
      setIsAssistantTyping(false);
    } else {
      setMessages([]);
      setUiMessages([]);
    }
  }, [currentChatId, setMessages, currentChat]);

  // Always scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50); // Small delay to ensure DOM updates
    }
  }, [uiMessages, isAssistantTyping]);

  // Listen for edit message events
  useEffect(() => {
    const handleEditMessageEvent = (event: CustomEvent) => {
      const { messageId, content } = event.detail;
      setEditingMessageId(messageId);
      setEditingContent(content);
    };

    window.addEventListener('editMessage', handleEditMessageEvent as EventListener);
    
    return () => {
      window.removeEventListener('editMessage', handleEditMessageEvent as EventListener);
    };
  }, []);

  // Handle sending a new message
  const handleSendMessage = (content: string) => {
    if (!currentChat || !content.trim()) return;

    // If we're editing a message
    if (editingMessageId) {
      // Update the message in the store
      updateMessage(currentChat.id, editingMessageId, content);
      
      // Update UI messages
      setUiMessages(prev => prev.map(msg => 
        msg.id === editingMessageId ? { ...msg, content } : msg
      ));
      
      // Reset editing state
      setEditingMessageId(null);
      setEditingContent('');
      
      toast.success('Message updated');
      return;
    }
    
    // Create user message
    const userMessage = {
      id: `user-${Date.now()}`,
      content: content,
      role: 'user',
      createdAt: new Date()
    };
    
    // Add user message to chat history in store
    addMessage(currentChat.id, {
      content,
      role: 'user',
    });
    
    // Update UI messages first with just the user message
    setUiMessages(prev => [...prev, userMessage]);
    
    // Then start showing typing indicator
    setIsAssistantTyping(true);
    
    // After a short delay, add the assistant message (simulating API response)
    setTimeout(() => {
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        content: DEMO_ASSISTANT_RESPONSE,
        role: 'assistant',
        createdAt: new Date()
      };
      
      // Update UI messages with assistant response
      setUiMessages(prev => [...prev, assistantMessage]);
      setIsAssistantTyping(false);
      
      // Add assistant message to chat history in store
      addMessage(currentChat.id, {
        content: DEMO_ASSISTANT_RESPONSE,
        role: 'assistant',
      });
    }, 1500); // Simulate typing delay
  };

  // Handle creating a new chat
  const handleCreateChat = () => {
    createChat();
  };

  // Handle changing the AI model
  const handleModelChange = (model: AIModel) => {
    if (currentChat) {
      changeModel(currentChat.id, model);
    }
  };

  // Handle renaming a chat
  const handleRenameChat = (chatId: string, newTitle: string) => {
    if (chatId && newTitle) {
      updateChat(chatId, { title: newTitle });
    }
  };
  
  // Handle toggling favorite status of a chat
  const handleToggleFavorite = (chatId: string) => {
    if (chatId) {
      toggleFavorite(chatId);
    }
  };

  // Handle toggling pin status of a message
  const handleTogglePin = (messageId: string) => {
    if (currentChat && messageId) {
      togglePinMessage(currentChat.id, messageId);
    }
  };

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Handle file upload
  const handleFileUpload = (file: File) => {
    toast.success(`File attached: ${file.name}`, {
      description: `${(file.size / 1024).toFixed(2)} KB`,
    });
    
    if (currentChat) {
      const fileMessage = {
        id: `user-${Date.now()}`,
        content: `Attached file: ${file.name}`,
        role: 'user',
        createdAt: new Date()
      };
      
      // Add to UI messages
      setUiMessages(prev => [...prev, fileMessage]);
      
      // Add to chat store
      addMessage(currentChat.id, {
        content: `Attached file: ${file.name}`,
        role: 'user',
      });
    }
  };

  // Handle stopping the fake response
  const handleStopResponse = () => {
    setIsAssistantTyping(false);
    stop();
  };

  // Handle settings click
  const handleOpenSettings = () => {
    setSettingsDialogOpen(true);
  };

  // Handle API keys click
  const handleOpenAPIKeys = () => {
    setApiKeysDialogOpen(true);
  };
  
  // Handle model settings click
  const handleOpenModelSettings = () => {
    setModelSettingsDialogOpen(true);
  };

  // Handle sign out click
  const handleSignOut = () => {
    toast.info("Sign out functionality would be implemented here");
  };

  // Open pinned messages dialog
  const openPinnedMessagesDialog = () => {
    setPinnedMessagesDialogOpen(true);
  };

  // Toggle showing pinned messages in-line
  const togglePinnedMessagesView = () => {
    setShowPinnedMessages(!showPinnedMessages);
  };

  // Filter messages based on pinned status if showPinnedMessages is true
  const filteredMessages = showPinnedMessages && currentChat
    ? currentChat.messages.filter(msg => msg.isPinned)
    : uiMessages;

  // Get the user's first initial for the avatar fallback
  const userInitial = currentProfile?.name ? currentProfile.name.charAt(0).toUpperCase() : 'U';

  // Load profile photo link from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProfilePhotoLink = localStorage.getItem('profilephotoLink') || '';
      setProfilePhotoLink(storedProfilePhotoLink);
      
      // Listen for profile updates
      const handleProfileUpdate = (event: CustomEvent) => {
        const { avatar } = event.detail;
        if (avatar) {
          setProfilePhotoLink(avatar);
        }
      };
      
      // Add event listener
      window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
      
      // Clean up
      return () => {
        window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
      };
    }
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Get the number of pinned messages for the current chat
  const pinnedMessagesCount = currentChat?.messages.filter(msg => msg.isPinned)?.length || 0;
  
  // Get pinned messages for the dialog
  const pinnedMessages = currentChat?.messages.filter(msg => msg.isPinned) || [];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* API Keys Dialog */}
      <ApiKeysDialog 
        open={apiKeysDialogOpen} 
        onOpenChange={setApiKeysDialogOpen} 
      />
      
      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        onOpenAPIKeys={handleOpenAPIKeys}
        onOpenModelSettings={handleOpenModelSettings}
      />
      
      {/* Model Settings Dialog */}
      <ModelSettingsDialog
        open={modelSettingsDialogOpen}
        onOpenChange={setModelSettingsDialogOpen}
      />
      
      {/* Pinned Messages Dialog */}
      <PinnedMessagesDialog
        open={pinnedMessagesDialogOpen}
        onOpenChange={setPinnedMessagesDialogOpen}
        messages={pinnedMessages}
      />
      
      {/* Sidebar */}
      <div className={cn(
        "border-r bg-muted/40 transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-0 opacity-0 overflow-hidden"
      )}>
        <ChatList
          chats={chats}
          folders={folders}
          currentChatId={currentChatId}
          onSelectChat={setCurrentChatId}
          onCreateChat={handleCreateChat}
          onCreateFolder={createFolder}
          onDeleteChat={deleteChat}
          onDeleteFolder={deleteFolder}
          onUpdateFolder={updateFolder}
          onMoveChat={moveChatToFolder}
          onSearch={searchChats}
          onRenameChat={handleRenameChat}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-2"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-lg font-semibold">
              {currentChat?.title || 'New Chat'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Pinned Messages Toggle */}
            {pinnedMessagesCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={openPinnedMessagesDialog}
                className={cn(
                  "relative",
                  pinnedMessagesDialogOpen && "text-yellow-500"
                )}
              >
                <Pin className={cn("h-5 w-5", pinnedMessagesDialogOpen && "fill-yellow-500")} />
                {pinnedMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-500 text-[10px] text-white flex items-center justify-center">
                    {pinnedMessagesCount}
                  </span>
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            {/* Profile Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  {(currentProfile?.avatar || profilePhotoLink) ? (
                    <AvatarImage 
                      src={currentProfile?.avatar || profilePhotoLink} 
                      alt={currentProfile?.name || 'User'} 
                      onError={(e) => {
                        // If image fails to load, show fallback
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenSettings}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenModelSettings}>
                  <Sliders className="mr-2 h-4 w-4" />
                  <span>Model Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenAPIKeys}>
                  <Key className="mr-2 h-4 w-4" />
                  <span>API Keys</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {currentChat ? (
          <>
            <div className="flex-1 p-4 overflow-auto bg-background" ref={chatContainerRef}>
              {showPinnedMessages && (
                <div className="mb-4 p-2 bg-yellow-500/10 rounded-md border border-yellow-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Pin className="h-4 w-4 text-yellow-500 mr-2 fill-yellow-500" />
                      <h3 className="text-sm font-medium">Pinned Messages ({pinnedMessagesCount})</h3>
                    </div>
                    <Button variant="ghost" size="sm" onClick={togglePinnedMessagesView} className="h-6 px-2 text-xs">
                      Show All Messages
                    </Button>
                  </div>
                  {filteredMessages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-2">No pinned messages</p>
                  )}
                </div>
              )}
              
              {(!filteredMessages || filteredMessages.length === 0) && !showPinnedMessages ? (
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="mb-4 h-12 w-12 text-muted-foreground" onClick={handleCreateChat}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Start a new conversation</h3>
                  <p className="text-center text-muted-foreground">
                    Send a message to begin chatting with the AI
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.reduce((acc, message, index, array) => {
  const messageDate = new Date(message.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
  const prevMessageDate = index > 0 ? new Date(array[index - 1].createdAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) : null;

  if (messageDate !== prevMessageDate) {
    acc.push(
      <div key={`date-separator-${messageDate}-${index}`} className="flex items-center my-4">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="mx-4 text-xs text-gray-500">{messageDate}</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
    );
  }

  acc.push(
    <ChatMessage
      key={message.id}
      message={message}
      model={currentChat.model}
      onTogglePin={handleTogglePin}
    />
  );

  return acc;
}, [])}
                  
                  {/* Assistant typing indicator */}
                  {isAssistantTyping && !showPinnedMessages && (
                    <div className="flex mb-4 px-4">
                      <div className="h-8 w-8 mr-3 mt-1 bg-secondary rounded-full flex items-center justify-center">
                        <span className="animate-pulse">...</span>
                      </div>
                      <div className="flex items-center">
                        <div className="bg-secondary text-secondary-foreground rounded-md py-2 px-3">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '600ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {!showPinnedMessages && (
              <ChatPanel
                isLoading={isAssistantTyping}
                model={currentChat.model}
                onModelChange={handleModelChange}
                onSubmit={handleSendMessage}
                onStop={handleStopResponse}
                onFileUpload={handleFileUpload}
                isEditing={!!editingMessageId}
                editingContent={editingContent}
                onCancelEdit={handleCancelEdit}
              />
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            <Card className="mx-auto max-w-md p-6 text-center">
              <h2 className="mb-2 text-xl font-semibold">No Chat Selected</h2>
              <p className="mb-4 text-muted-foreground">
                Select an existing chat or create a new one to get started.
              </p>
              <Button onClick={handleCreateChat}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                New Chat
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
