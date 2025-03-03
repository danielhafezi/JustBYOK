'use client';

import { useState, useRef, useEffect } from 'react';
import { SendHorizontal, StopCircle, Paperclip, ChevronDown, Globe, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ModelSelector } from '@/components/chat/model-selector';
import { AIModel, AI_MODELS } from '@/lib/types';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Brain, Sparkles, Bot, Atom } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiKeyStorage } from '@/lib/api-keys';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChatPanelProps {
  isLoading: boolean;
  model: AIModel;
  onModelChange: (model: AIModel) => void;
  onSubmit: (message: string) => void;
  onStop: () => void;
  onFileUpload?: (file: File) => void;
  isEditing?: boolean;
  editingContent?: string;
  onCancelEdit?: () => void;
}

export function ChatPanel({
  isLoading,
  model,
  onModelChange,
  onSubmit,
  onStop,
  onFileUpload,
  isEditing = false,
  editingContent = '',
  onCancelEdit
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [firecrawlApiKey, setFirecrawlApiKey] = useState('');
  const [showFirecrawlDialog, setShowFirecrawlDialog] = useState(false);
  const [browseModeActive, setBrowseModeActive] = useState(false);
  const resizeTimeoutRef = useRef<number | null>(null);

  // Set initial input value for editing mode
  useEffect(() => {
    if (isEditing && editingContent) {
      setInput(editingContent);
    }
  }, [isEditing, editingContent]);

  // Focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Check for Firecrawl API key on mount
  useEffect(() => {
    const key = apiKeyStorage.getFirecrawlKey();
    setFirecrawlApiKey(key);
    
    // If key exists, check if browse mode should be active
    if (key) {
      // You could add logic here to determine if browse mode should be active by default
      // For now, we'll leave it inactive until user clicks the button
    }
  }, []);

  // Listen for API key updates from other components (like the API keys dialog)
  useEffect(() => {
    // Handler for Firecrawl API key updates
    const handleFirecrawlKeyUpdate = (event: CustomEvent<{ key: string }>) => {
      setFirecrawlApiKey(event.detail.key);
      
      // If key was cleared, disable browse mode
      if (!event.detail.key) {
        setBrowseModeActive(false);
      }
    };

    // Add event listener
    window.addEventListener('firecrawl-api-key-updated', handleFirecrawlKeyUpdate as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('firecrawl-api-key-updated', handleFirecrawlKeyUpdate as EventListener);
    };
  }, []);

  // Auto-resize textarea based on content - optimized with debounce
  useEffect(() => {
    const resizeTextarea = () => {
      if (inputRef.current) {
        // Reset height to auto to accurately calculate the new height
        inputRef.current.style.height = 'auto';
        
        // Calculate new height based on scroll height, with a maximum of 10 lines
        const lineHeight = 24; // Approximate line height in pixels
        const maxHeight = lineHeight * 10;
        const scrollHeight = inputRef.current.scrollHeight;
        
        inputRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        inputRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
      }
    };

    // Cancel any pending resize and schedule a new one
    if (resizeTimeoutRef.current) {
      cancelAnimationFrame(resizeTimeoutRef.current);
    }
    
    resizeTimeoutRef.current = requestAnimationFrame(resizeTextarea);

    return () => {
      if (resizeTimeoutRef.current) {
        cancelAnimationFrame(resizeTimeoutRef.current);
      }
    };
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    onSubmit(input);
    setInput('');
    
    // Reset textarea height after submission
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileClick = () => {
    // Trigger the hidden file input click
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      setSelectedFile(file);
      onFileUpload(file);
      
      // You can optionally add the filename to the input field
      setInput(prev => prev + ` [File: ${file.name}]`);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle browse button click
  const handleBrowseClick = () => {
    // Always get the latest key from storage
    const key = apiKeyStorage.getFirecrawlKey();
    
    if (!key) {
      // Update the local state with the latest key (which is empty)
      setFirecrawlApiKey('');
      setShowFirecrawlDialog(true);
    } else {
      // Update the local state with the latest key
      setFirecrawlApiKey(key);
      // Toggle browse mode if API key exists
      setBrowseModeActive(!browseModeActive);
    }
  };

  // Handle saving Firecrawl API key
  const handleSaveFirecrawlKey = async () => {
    if (firecrawlApiKey.trim()) {
      try {
        // Save the API key using the storage utility
        await apiKeyStorage.setFirecrawlKey(firecrawlApiKey);
        
        // Close the dialog
        setShowFirecrawlDialog(false);
        
        // Activate browse mode after saving key
        setBrowseModeActive(true);
        
        // Dispatch a custom event to notify other components about the API key change
        window.dispatchEvent(new CustomEvent('firecrawl-api-key-updated', {
          detail: { key: firecrawlApiKey }
        }));
      } catch (error) {
        console.error('Error saving Firecrawl API key:', error);
      }
    }
  };

  // Handle cancel button click in edit mode
  const handleCancelEdit = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
    setInput('');
  };

  // Ensure model is a valid value
  const validModel: AIModel = AI_MODELS.some(m => m.id === model) 
    ? model as AIModel 
    : 'gpt-4o';

  // Get model icon and name for the selected model
  const getModelIcon = (modelType: string) => {
    const modelConfig = AI_MODELS.find(m => m.id === modelType);
    switch (modelConfig?.icon) {
      case 'brain':
        return <Brain className="h-4 w-4" />;
      case 'sparkles':
        return <Sparkles className="h-4 w-4" />;
      case 'bot':
        return <Bot className="h-4 w-4" />;
      case 'atom':
        return <Atom className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getModelDisplayName = (modelType: string) => {
    const modelConfig = AI_MODELS.find(m => m.id === modelType);
    return modelConfig?.name || 'Smart';
  };

  const modelIcon = getModelIcon(validModel);
  const modelName = getModelDisplayName(validModel);

  return (
    <div className="bg-background">
      <form onSubmit={handleSubmit} className="w-full">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        
        {/* Unified container with theme-appropriate background for both input and controls */}
        <div className="bg-gray-200 dark:bg-neutral-900 overflow-hidden mx-4 my-2 rounded-md">
          {/* Edit message indicator */}
          {isEditing && (
            <div className="flex items-center gap-1 px-3 pt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
              <Pencil className="h-3 w-3" />
              <span>Edit Message</span>
            </div>
          )}
          
          {/* Top level - Primary input area */}
          <div className="px-2 pt-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isEditing ? "Edit your message..." : "What do you want to know?"}
              className="min-h-10 resize-none border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-800 dark:text-neutral-100 placeholder:text-gray-500 dark:placeholder:text-neutral-400 rounded-md"
              rows={1}
              disabled={isLoading}
              style={{
                overflow: 'hidden',
                transition: 'height 0.2s ease'
              }}
            />
          </div>
          
          {/* Bottom level - Controls area */}
          <div className="flex items-center justify-between px-2 pb-2">
            {/* Left side - Attachment & other tools */}
            <div className="flex items-center gap-1">
              {/* Paperclip icon - always shown */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleFileClick}
                      className="h-7 w-7 p-0 text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 hover:bg-gray-300 dark:hover:bg-neutral-800 rounded-full"
                      disabled={isLoading}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Attach a file</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Browse button with globe icon - always shown */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleBrowseClick}
                      className={cn(
                        "h-7 w-7 rounded-full p-0",
                        browseModeActive 
                          ? "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700" 
                          : "bg-gray-300/80 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200"
                      )}
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{browseModeActive ? "Web search enabled" : "Enable web search"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Cancel button - only shown when editing */}
              {isEditing && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="h-7 rounded-full bg-gray-300/80 hover:bg-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-200 px-2 py-0"
                      >
                        <X className="h-4 w-4 mr-1" />
                        <span className="text-xs">Cancel</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cancel editing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {/* Right side - Model selector and send/stop button */}
            <div className="flex items-center gap-1">
              {/* Model selector - only shown when not editing */}
              {!isEditing && (
                <Popover open={modelDropdownOpen} onOpenChange={setModelDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-neutral-100 rounded-full"
                    >
                      <span className="flex items-center gap-1">
                        {modelName}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[230px] p-2 bg-gray-200 dark:bg-neutral-900 rounded-md" align="end">
                    <div className="space-y-2">
                      {/* OpenAI Models */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500 dark:text-neutral-400 px-2 py-1">OpenAI</div>
                        {AI_MODELS.filter(m => m.category === 'openai').map((item) => (
                          <Button
                            key={item.name}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start text-xs text-gray-700 dark:text-neutral-300 rounded-md",
                              validModel === item.id && "bg-gray-300 dark:bg-neutral-800"
                            )}
                            onClick={() => {
                              onModelChange(item.id as AIModel);
                              setModelDropdownOpen(false);
                            }}
                          >
                            <div className="flex items-center">
                              <Sparkles className="mr-2 h-3 w-3" />
                              {item.name}
                            </div>
                          </Button>
                        ))}
                      </div>
                      
                      {/* Anthropic Models */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500 dark:text-neutral-400 px-2 py-1">Anthropic</div>
                        {AI_MODELS.filter(m => m.category === 'anthropic').map((item) => (
                          <Button
                            key={item.name}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start text-xs text-gray-700 dark:text-neutral-300 rounded-md",
                              validModel === item.id && "bg-gray-300 dark:bg-neutral-800"
                            )}
                            onClick={() => {
                              onModelChange(item.id as AIModel);
                              setModelDropdownOpen(false);
                            }}
                          >
                            <div className="flex items-center">
                              <Bot className="mr-2 h-3 w-3" />
                              {item.name}
                            </div>
                          </Button>
                        ))}
                      </div>
                      
                      {/* Google Models */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500 dark:text-neutral-400 px-2 py-1">Google</div>
                        {AI_MODELS.filter(m => m.category === 'gemini').map((item) => (
                          <Button
                            key={item.name}
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "w-full justify-start text-xs text-gray-700 dark:text-neutral-300 rounded-md",
                              validModel === item.id && "bg-gray-300 dark:bg-neutral-800"
                            )}
                            onClick={() => {
                              onModelChange(item.id as AIModel);
                              setModelDropdownOpen(false);
                            }}
                          >
                            <div className="flex items-center">
                              <Atom className="mr-2 h-3 w-3" />
                              {item.name}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              
              {/* Send/Stop button */}
              <Button
                type={isLoading ? "button" : "submit"}
                size="icon"
                variant="ghost"
                disabled={!input.trim() && !isLoading}
                className={cn(
                  "h-7 w-7 rounded-full",
                  isLoading ? "bg-red-500 hover:bg-red-600" : "bg-gray-300 hover:bg-gray-400 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                )}
                onClick={isLoading ? onStop : undefined}
              >
                {isLoading ? (
                  <StopCircle className="h-4 w-4 text-white" />
                ) : (
                  <SendHorizontal className="h-4 w-4 text-gray-800 dark:text-neutral-200" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Firecrawl API Key Dialog */}
      <Dialog open={showFirecrawlDialog} onOpenChange={setShowFirecrawlDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Web Search API Key Required</DialogTitle>
            <DialogDescription>
              To use web search functionality, you need to enter a Firecrawl API key.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="firecrawl-key">Firecrawl API Key</Label>
              <Input
                id="firecrawl-key"
                type="password"
                value={firecrawlApiKey}
                onChange={(e) => setFirecrawlApiKey(e.target.value)}
                placeholder="Enter your Firecrawl API key..."
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This key will be saved in your browser's local storage.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowFirecrawlDialog(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSaveFirecrawlKey} disabled={!firecrawlApiKey.trim()}>
              Save & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}