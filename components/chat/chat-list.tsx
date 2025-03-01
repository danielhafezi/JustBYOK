'use client';

import { useState, useRef } from 'react';
import { Chat, Folder } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  FolderPlus,
  Plus, 
  Search, 
  Trash2, 
  X, 
  Sparkles, 
  Bot, 
  Atom,
  MoreHorizontal,
  Pencil,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  FolderInput,
  Star,
  Settings,
  Folder as FolderIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { FolderSettingsDialog } from '@/components/settings/folder-settings-dialog';

interface ChatListProps {
  chats: Chat[];
  folders: Folder[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: () => void;
  onCreateFolder: () => void;
  onDeleteChat: (chatId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onUpdateFolder: (folderId: string, updates: Partial<Folder>) => void;
  onMoveChat: (chatId: string, folderId: string | undefined) => void;
  onSearch: (query: string) => Chat[];
  onRenameChat?: (chatId: string, newTitle: string) => void;
  onToggleFavorite?: (chatId: string) => void;
}

export function ChatList({
  chats = [],
  folders = [],
  currentChatId,
  onSelectChat,
  onCreateChat,
  onCreateFolder,
  onDeleteChat,
  onDeleteFolder,
  onUpdateFolder,
  onMoveChat,
  onSearch,
  onRenameChat,
  onToggleFavorite
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Chat[]>([]);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // State for folder expansion
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [draggedChat, setDraggedChat] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [dragOverRoot, setDragOverRoot] = useState(false);
  const dragCounterRef = useRef<{ [key: string]: number }>({});
  
  // State for folder settings dialog
  const [folderSettingsOpen, setFolderSettingsOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<{ id: string, name: string } | null>(null);

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query?.trim()) {
      try {
        const results = onSearch(query);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Error searching chats:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleStartRename = (chat: Chat) => {
    setIsRenaming(chat.id);
    setNewTitle(chat.title);
  };

  const handleRename = (chatId: string) => {
    if (onRenameChat && newTitle.trim()) {
      onRenameChat(chatId, newTitle.trim());
    }
    setIsRenaming(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRename(chatId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsRenaming(null);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent triggering chat selection
    if (onToggleFavorite) {
      onToggleFavorite(chatId);
    }
  };

  // Handle folder settings click
  const handleFolderSettings = (folder: Folder) => {
    setCurrentFolder({
      id: folder.id,
      name: folder.name
    });
    setFolderSettingsOpen(true);
  };

  const getModelIcon = (model: string) => {
    switch (model) {
      case 'openai':
        return <Sparkles className="h-4 w-4" />;
      case 'anthropic':
        return <Bot className="h-4 w-4" />;
      case 'gemini':
        return <Atom className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, chatId: string) => {
    setDraggedChat(chatId);
    e.dataTransfer.setData('text/plain', chatId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Initialize counter if needed
    if (!dragCounterRef.current[folderId]) {
      dragCounterRef.current[folderId] = 0;
    }
    
    dragCounterRef.current[folderId]++;
    setDragOverFolder(folderId);
    
    // Expand folder after hovering for a short time
    if (dragCounterRef.current[folderId] === 30) {
      setExpandedFolders(prev => new Set([...prev, folderId]));
    }
  };

  const handleDragLeave = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current[folderId]--;
    
    if (dragCounterRef.current[folderId] === 0) {
      setDragOverFolder(null);
    }
  };

  const handleDrop = (e: React.DragEvent, folderId: string | undefined) => {
    e.preventDefault();
    e.stopPropagation();
    
    const chatId = e.dataTransfer.getData('text/plain');
    if (chatId && draggedChat) {
      onMoveChat(chatId, folderId);
    }
    
    setDraggedChat(null);
    setDragOverFolder(null);
    dragCounterRef.current = {};
  };

  // Handle root level drag over
  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedChat) {
      setDragOverRoot(true);
    }
  };

  // Handle root level drag leave
  const handleRootDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverRoot(false);
  };

  // Handle root level drop
  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const chatId = e.dataTransfer.getData('text/plain');
    if (chatId && draggedChat) {
      onMoveChat(chatId, undefined);
    }
    setDraggedChat(null);
    setDragOverRoot(false);
  };

  const displayChats = (searchQuery?.trim() && Array.isArray(searchResults)) ? searchResults : (Array.isArray(chats) ? chats : []);
  
  // Separate favorite chats and sort them by updatedAt
  const favoriteChats = displayChats
    .filter(chat => !chat.folderId && chat.favorite)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  // Non-favorite chats (outside folders)
  const nonFavoriteChats = displayChats.filter(chat => !chat.folderId && !chat.favorite);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Chats</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleSearch}>
            {isSearching ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onCreateFolder}>
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onCreateChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Folder Settings Dialog */}
      {currentFolder && (
        <FolderSettingsDialog
          open={folderSettingsOpen}
          onOpenChange={setFolderSettingsOpen}
          folderId={currentFolder.id}
          folderName={currentFolder.name}
          onUpdateFolder={onUpdateFolder}
          onDeleteFolder={onDeleteFolder}
        />
      )}
      
      {isSearching && (
        <div className="px-4 pb-2">
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>
      )}
      
      <ScrollArea className="flex-1 px-2">
        <div 
          className={cn(
            "space-y-2 py-2 min-h-[200px]",
            dragOverRoot && "bg-muted/50 rounded-lg"
          )}
          onDragOver={handleRootDragOver}
          onDragLeave={handleRootDragLeave}
          onDrop={handleRootDrop}
        >
          {displayChats.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? 'No results found' : 'No chats yet'}
            </div>
          ) : (
            <>
            {/* Folders */}
            {folders.map((folder) => (
              <div key={folder.id} className="mb-2">
                <div 
                  className={cn(
                    "flex items-center px-2 py-1 text-sm text-muted-foreground rounded-md transition-colors cursor-pointer",
                    dragOverFolder === folder.id && "bg-muted/80"
                  )}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDragLeave={(e) => handleDragLeave(e, folder.id)}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  onClick={(e) => {
                    // Only toggle if not clicking on specific interactive elements
                    if (!(e.target as HTMLElement).closest('button.trash-button, input')) {
                      toggleFolder(folder.id);
                    }
                  }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 mr-1 pointer-events-none"
                    tabIndex={-1}
                  >
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                  {folder.isEditing ? (
                    <Input
                      value={folder.name}
                      placeholder="Folder name"
                      onChange={(e) => onUpdateFolder(folder.id, { name: e.target.value })}
                      onBlur={() => onUpdateFolder(folder.id, { isEditing: false })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateFolder(folder.id, { isEditing: false });
                        } else if (e.key === 'Escape') {
                          onUpdateFolder(folder.id, { isEditing: false });
                        }
                      }}
                      className="h-6 py-1 px-2 text-sm bg-background"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="flex items-center w-full group">
                      {expandedFolders.has(folder.id) ? (
                        <FolderOpen className="h-4 w-4 mr-2" />
                      ) : (
                        <FolderIcon className="h-4 w-4 mr-2" />
                      )}
                      <span>{folder.name || 'Unnamed Folder'}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity trash-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder(folder.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {expandedFolders.has(folder.id) && (
                  <div className="relative">
                    {/* Folder Settings Button - now opens the dialog */}
                    <div className="px-6 py-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[10px] px-1.5 py-0.5 h-5 justify-start"
                        onClick={() => handleFolderSettings(folder)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Folder Settings
                      </Button>
                    </div>
                    
                    {/* Vertical connector line - moved more to the right */}
                    <div className="absolute left-[14px] top-2 bottom-0 w-[1px] bg-border" />
                    
                    <div className="ml-6 space-y-1 mt-1 relative">
                      {chats.filter(chat => chat.folderId === folder.id).map((chat) => (
                        <div
                          key={chat.id}
                          className={cn(
                            "group relative hover:bg-muted/50 rounded-md transition-opacity",
                            draggedChat === chat.id && "opacity-50",
                          )}
                          draggable
                          onDragStart={(e) => handleDragStart(e, chat.id)}
                        >
                          <Button
                            variant={chat.id === currentChatId ? 'secondary' : 'ghost'}
                            className={cn(
                              'w-full justify-start text-sm',
                              chat.id === currentChatId && 'bg-secondary'
                            )}
                            onClick={() => onSelectChat(chat.id)}
                          >
                            <div className="flex w-full items-center">
                              <div className="mr-2">{getModelIcon(chat.model)}</div>
                              <span className="truncate">{chat.title}</span>
                            </div>
                          </Button>
                          
                          {/* Star button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "absolute right-8 top-2.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                              chat.favorite ? "text-yellow-500" : "text-muted-foreground"
                            )}
                            onClick={(e) => handleToggleFavorite(e, chat.id)}
                          >
                            <Star className={cn(
                              "h-4 w-4",
                              chat.favorite ? "fill-current" : ""
                            )} />
                          </Button>
                          
                          {/* Context menu for folder items */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-2.5 h-6 w-6 opacity-0 group-hover:opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              {onRenameChat && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartRename(chat);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onToggleFavorite) onToggleFavorite(chat.id);
                                }}
                              >
                                <Star className={cn(
                                  "mr-2 h-4 w-4",
                                  chat.favorite ? "fill-current text-yellow-500" : ""
                                )} />
                                {chat.favorite ? "Unfavorite" : "Favorite"}
                              </DropdownMenuItem>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <FolderInput className="mr-2 h-4 w-4" />
                                  Move
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMoveChat(chat.id, undefined);
                                    }}
                                  >
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    None
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {folders.map(folder => (
                                    <DropdownMenuItem
                                      key={folder.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onMoveChat(chat.id, folder.id);
                                      }}
                                    >
                                      <FolderOpen className="mr-2 h-4 w-4" />
                                      {folder.name || 'Unnamed Folder'}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteChat(chat.id);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Favorite Chats - displayed right under folders */}
            {favoriteChats.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Favorites
                </div>
                <div className="space-y-1">
                  {favoriteChats.map((chat) => (
                    <div 
                      key={chat.id} 
                      className={cn(
                        "group relative hover:bg-muted/50 rounded-md transition-opacity",
                        draggedChat === chat.id && "opacity-50",
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, chat.id)}
                    >
                      {isRenaming === chat.id ? (
                        <div className="flex items-center space-x-2 p-2">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
                            onBlur={() => handleRename(chat.id)}
                            autoFocus
                            className="h-8 text-sm"
                          />
                        </div>
                      ) : (
                        <Button
                          variant={chat.id === currentChatId ? 'secondary' : 'ghost'}
                          className={cn(
                            'w-full justify-start text-sm',
                            chat.id === currentChatId && 'bg-secondary'
                          )}
                          onClick={() => onSelectChat(chat.id)}
                        >
                          <div className="flex w-full items-center">
                            <div className="mr-2">{getModelIcon(chat.model)}</div>
                            <span className="truncate">{chat.title}</span>
                          </div>
                        </Button>
                      )}
                      
                      {/* Star button */}
                      {!isRenaming && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "absolute right-8 top-2.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                            chat.favorite ? "text-yellow-500" : "text-muted-foreground"
                          )}
                          onClick={(e) => handleToggleFavorite(e, chat.id)}
                        >
                          <Star className={cn(
                            "h-4 w-4",
                            chat.favorite ? "fill-current" : ""
                          )} />
                        </Button>
                      )}
                      
                      {/* Context menu */}
                      {!isRenaming && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-2.5 h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            {onRenameChat && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartRename(chat);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleFavorite) onToggleFavorite(chat.id);
                              }}
                            >
                              <Star className={cn(
                                "mr-2 h-4 w-4",
                                chat.favorite ? "fill-current text-yellow-500" : ""
                              )} />
                              {chat.favorite ? "Unfavorite" : "Favorite"}
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <FolderInput className="mr-2 h-4 w-4" />
                                Move
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveChat(chat.id, undefined);
                                  }}
                                >
                                  <FolderOpen className="mr-2 h-4 w-4" />
                                  None
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {folders.map(folder => (
                                  <DropdownMenuItem
                                    key={folder.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMoveChat(chat.id, folder.id);
                                    }}
                                  >
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    {folder.name || 'Unnamed Folder'}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(chat.id);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Ungrouped Non-Favorite Chats */}
            {nonFavoriteChats.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Chats
                </div>
                <div className="space-y-1">
                  {nonFavoriteChats.map((chat) => (
                    <div 
                      key={chat.id} 
                      className={cn(
                        "group relative hover:bg-muted/50 rounded-md transition-opacity",
                        draggedChat === chat.id && "opacity-50",
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, chat.id)}
                    >
                      {isRenaming === chat.id ? (
                        <div className="flex items-center space-x-2 p-2">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
                            onBlur={() => handleRename(chat.id)}
                            autoFocus
                            className="h-8 text-sm"
                          />
                        </div>
                      ) : (
                        <Button
                          variant={chat.id === currentChatId ? 'secondary' : 'ghost'}
                          className={cn(
                            'w-full justify-start text-sm',
                            chat.id === currentChatId && 'bg-secondary'
                          )}
                          onClick={() => onSelectChat(chat.id)}
                        >
                          <div className="flex w-full items-center">
                            <div className="mr-2">{getModelIcon(chat.model)}</div>
                            <span className="truncate">{chat.title}</span>
                          </div>
                        </Button>
                      )}
                      
                      {/* Star button */}
                      {!isRenaming && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "absolute right-8 top-2.5 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                            chat.favorite ? "text-yellow-500" : "text-muted-foreground"
                          )}
                          onClick={(e) => handleToggleFavorite(e, chat.id)}
                        >
                          <Star className={cn(
                            "h-4 w-4",
                            chat.favorite ? "fill-current" : ""
                          )} />
                        </Button>
                      )}
                      
                      {/* Context menu */}
                      {!isRenaming && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-2.5 h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            {onRenameChat && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartRename(chat);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleFavorite) onToggleFavorite(chat.id);
                              }}
                            >
                              <Star className={cn(
                                "mr-2 h-4 w-4",
                                chat.favorite ? "fill-current text-yellow-500" : ""
                              )} />
                              {chat.favorite ? "Unfavorite" : "Favorite"}
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <FolderInput className="mr-2 h-4 w-4" />
                                Move
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveChat(chat.id, undefined);
                                  }}
                                >
                                  <FolderOpen className="mr-2 h-4 w-4" />
                                  None
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {folders.map(folder => (
                                  <DropdownMenuItem
                                    key={folder.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMoveChat(chat.id, folder.id);
                                    }}
                                  >
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    {folder.name || 'Unnamed Folder'}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(chat.id);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}