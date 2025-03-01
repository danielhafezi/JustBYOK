'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeysDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  // State for API keys
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [anthropicKey, setAnthropicKey] = useState<string>('');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [firecrawlKey, setFirecrawlKey] = useState<string>('');

  // Load keys from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedOpenaiKey = localStorage.getItem('openai-api-key') || '';
      const storedAnthropicKey = localStorage.getItem('anthropic-api-key') || '';
      const storedGeminiKey = localStorage.getItem('gemini-api-key') || '';
      const storedFirecrawlKey = localStorage.getItem('firecrawl-api-key') || '';
      
      setOpenaiKey(storedOpenaiKey);
      setAnthropicKey(storedAnthropicKey);
      setGeminiKey(storedGeminiKey);
      setFirecrawlKey(storedFirecrawlKey);
    }
  }, [open]);

  // Function to mask API keys for display
  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '********';
    return '****************' + key.slice(-4);
  };

  // Function to handle changing an API key
  const handleChangeKey = (provider: 'openai' | 'anthropic' | 'gemini' | 'firecrawl', newKey: string | null) => {
    // If newKey is null, prompt the user to enter a new key
    if (newKey === null) {
      const promptedKey = prompt(`Enter your ${provider} API Key:`);
      if (!promptedKey) return; // User cancelled the prompt
      newKey = promptedKey.trim();
    }

    // Store the key in localStorage
    localStorage.setItem(`${provider}-api-key`, newKey);
    
    // Update state
    switch (provider) {
      case 'openai':
        setOpenaiKey(newKey);
        break;
      case 'anthropic':
        setAnthropicKey(newKey);
        break;
      case 'gemini':
        setGeminiKey(newKey);
        break;
      case 'firecrawl':
        setFirecrawlKey(newKey);
        break;
    }
    
    toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key updated`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[485px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold mb-2">Manage your API keys</DialogTitle>
          <DialogDescription className="text-center text-sm">
            By default, your API Key is stored locally on your browser and never sent anywhere else.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* OpenAI API Key */}
          <div>
            <div className="flex mb-2">
              <span className="font-medium">OpenAI API Key:</span>
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-500 hover:underline text-sm ml-2"
              >
                (Get API key here)
              </a>
            </div>
            <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden">
              <div className="flex items-center flex-1 p-3">
                <div className="bg-purple-600 p-1 rounded w-8 h-8 flex items-center justify-center mr-2">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729Z" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-red-500" />
                  <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{maskApiKey(openaiKey)}k0YA</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 h-full px-4 py-0 rounded-none border-l border-gray-300 dark:border-gray-700 min-h-[3.5rem]"
                onClick={() => handleChangeKey('openai', null)}
              >
                Change Key
              </Button>
            </div>
          </div>
          
          {/* Anthropic API Key */}
          <div>
            <div className="flex mb-2">
              <span className="font-medium">Anthropic API Key:</span>
              <a 
                href="https://console.anthropic.com/settings/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-500 hover:underline text-sm ml-2"
              >
                (Get API key here)
              </a>
            </div>
            <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden">
              <div className="flex items-center flex-1 p-3">
                <div className="bg-amber-700 p-1 rounded w-8 h-8 flex items-center justify-center mr-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm2.535 8.4c0-.938-.385-1.077-.694-1.077-.387 0-.926.244-.926 1.039v2.396H10.01V7.8c0-.978-.463-1.077-.694-1.077-.309 0-.926.24-.926 1.039v6.475c0 .799.617 1.039.926 1.039.232 0 .694-.1.694-1.077v-1.762h2.906V14.2c0 .898.539 1.077.926 1.077.309 0 .694-.14.694-1.077z"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-red-500" />
                  <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{maskApiKey(anthropicKey)}AAA</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 h-full px-4 py-0 rounded-none border-l border-gray-300 dark:border-gray-700 min-h-[3.5rem]"
                onClick={() => handleChangeKey('anthropic', null)}
              >
                Change Key
              </Button>
            </div>
          </div>
          
          {/* Google Gemini API Key */}
          <div>
            <div className="flex mb-2">
              <span className="font-medium">Google Gemini API Key:</span>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-500 hover:underline text-sm ml-2"
              >
                (Get API key here)
              </a>
            </div>
            <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden">
              <div className="flex items-center flex-1 p-3">
                <div className="bg-blue-600 p-1 rounded w-8 h-8 flex items-center justify-center mr-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M12 3.36C6.9 3.36 2.76 7.5 2.76 12.6c0 5.1 4.14 9.24 9.24 9.24 5.1 0 9.24-4.14 9.24-9.24 0-5.1-4.14-9.24-9.24-9.24zm3.85 4.9a1.12 1.12 0 0 1 1.59 0c.44.44.44 1.15 0 1.59L16 11.3a.23.23 0 0 0 0 .35l1.39 1.39a1.12 1.12 0 0 1 0 1.59c-.44.44-1.15.44-1.59 0l-1.55-1.55a1.59 1.59 0 0 1 0-2.24l1.6-1.58z"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-red-500" />
                  <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{maskApiKey(geminiKey)}xDfY</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 h-full px-4 py-0 rounded-none border-l border-gray-300 dark:border-gray-700 min-h-[3.5rem]"
                onClick={() => handleChangeKey('gemini', null)}
              >
                Change Key
              </Button>
            </div>
          </div>
          
          {/* Firecrawl API Key */}
          <div>
            <div className="flex mb-2">
              <span className="font-medium">Firecrawl API Key:</span>
              <a 
                href="https://www.firecrawl.dev/app/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-500 hover:underline text-sm ml-2"
              >
                (Get API key here)
              </a>
            </div>
            <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden">
              <div className="flex items-center flex-1 p-3">
                <div className="bg-orange-500 p-1 rounded w-8 h-8 flex items-center justify-center mr-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M19.87 12.42c-.02 0-.17.02-.32.06-.71.18-2.26.58-3.23 2.05l-.2.31c-.14.23-.26.37-.39.56a1.01 1.01 0 0 1-.57.36c-.65.14-1.25-.27-1.36-.92-.22-1.27.88-3.27 1.71-4.04.65-.6 1.71-1.21 2.9-1.55.9-.25 1.73-.28 1.93-.09.48.46.09 1.47-.29 2.15-.14.25-.28.47-.51.68-.27.24-.55.39-.67.43zM9.54 14.7c-.36 0-.95.07-1.55.35-1.42.65-1.92 1.17-2.34 1.91-.32.56-.46 1-.51 1.25-.12.62.16 1.23.74 1.39.57.16 1.14-.21 1.37-.77.34-.82 1.38-1.85 2.26-2.41.91-.58 1.96-.89 2.36-.97.51-.11.82-.59.73-1.1-.08-.51-.54-.85-1.05-.77-.56.08-1.24.12-2.01.12z"/>
                    <path d="M19.97 2.06C18.95.56 16.99.21 15.05.35c-2.47.17-5.14 1.56-7.21 3.7a16.5 16.5 0 0 0-1.92 2.45c-.37-.38-.77-.74-1.19-1.06C3.47 4.46 2.31 4.45.97 5.59c-.6.51-.93 1.23-.97 2.07-.03.74.21 1.44.63 2.02.04.06.08.11.13.16l-.09.12c-.33.47-.65.96-.77 1.52-.19.86-.06 1.75.54 2.45.59.69 1.45 1.07 2.32 1.07.49 0 .98-.11 1.44-.34.6-.3 1.01-.82 1.39-1.33.11-.15.22-.3.33-.43 1.4.7 2.81 1.9 3.74 3.19.52.72 1.35 1.15 2.19 1.15.21 0 .43-.02.63-.07.62-.14 1.18-.48 1.59-.97.47-.57.67-1.35.56-2.19-.04-.31-.08-.51-.17-.79-.53-1.83-1.7-3.83-3.39-5.13.32-.4.65-.79.99-1.15a16.5 16.5 0 0 1 3.3-2.71 7.3 7.3 0 0 1 2.73-1.02c.9-.12 1.53.27 1.76.64.4.63.01 1.48-.97 2.85-.25.35-.54.74-.86 1.18-.34.46-.64.94-.81 1.47-.33 1.01-.22 2.15.36 3.25.62 1.18 1.67 1.93 2.8 1.99.17.01.34.02.52.02 1.37 0 2.67-.56 3.5-1.51.86-.98 1.1-2.14 1.11-2.94.01-.45.02-.76-.05-1.1-.24-1.07-1.13-2.32-2.45-3.43.92-1.26 2.35-3.23 2.38-5.2.03-1.53-.66-3.09-1.89-4.77zm-4.56 18.98c-.7-.03-1.33-.48-1.75-1.27-.33-.63-.4-1.31-.2-1.93.09-.29.28-.57.51-.88.34-.47.65-.89.93-1.26.53-.72 1.65-2.23.9-3.43-.32-.51-.79-.68-1.21-.68-1.04 0-2.31.89-2.85 1.46-.38.41-.74.83-1.06 1.27-.32-.24-.83-.48-1.42-.48-.1 0-.2 0-.3.02-.44.06-.85.21-1.26.35-.38.13-.78.27-1.2.34-.44.07-.9.02-1.4-.07-.29-.05-.58-.17-.84-.28-.29-.12-.59-.25-.9-.25a.6.6 0 0 0-.38.12c-.28.21-.34.57-.42.94-.1.49-.29 1.26.14 1.83.35.47.8.53 1.2.51.29-.01.59-.07.88-.13.27-.05.55-.11.83-.14.52-.05 1.14.06 1.92.32-.31.36-.62.75-.89 1.17-.43.67-.87 1.36-1.7 1.77a3.2 3.2 0 0 1-1.41.33c-.53 0-1.02-.22-1.37-.62-.36-.41-.44-.96-.3-1.6.09-.42.35-.81.63-1.21.16-.22.32-.45.47-.69.12.11.25.22.4.32.01 0 .02.01.03.02.36.25.85.21 1.17-.08.32-.29.35-.78.07-1.11-.39-.45-.62-.94-.69-1.45-.06-.52.06-1.01.39-1.47.11-.16.26-.27.4-.37.13-.09.27-.18.38-.3.27-.31.26-.77-.03-1.06-.28-.28-.74-.26-1.04.04-.12.12-.32.28-.51.43a3.2 3.2 0 0 1-1.81-.05c-.03 0-.05-.02-.08-.03-.06-.05-.11-.11-.15-.16-.28-.37-.44-.83-.42-1.36.03-.52.22-.96.55-1.23.83-.71 1.42-.51 2.02-.31.53.18 1.09.37 1.71.3.53-.06 1.02-.32 1.5-.57.5-.26 1.01-.53 1.6-.59.07-.01.15-.01.22-.01.24 0 .48.05.72.09.24.04.47.09.71.1.19.01.38-.02.57-.05.19-.03.37-.06.56-.07.32-.01.63.11.88.37.16.16.23.39.19.54-.06.27-.21.49-.34.68-.07.11-.15.21-.21.31-.01.02-.03.04-.04.05-.22.35-.13.82.23 1.04.36.23.82.13 1.05-.22.06-.09.15-.21.26-.36-.02.05-.03.1-.05.15a1.28 1.28 0 0 0 .22 1.16c.49.61 1.45.71 2.19.71.17 0 .33-.01.47-.02.26-.02.52-.19.81-.39.32-.21.67-.45 1.06-.5.21-.03.42.04.7.14.21.08.52.2.69.23.26.05.54.11.82.17.5.1 1.01.2 1.5.24.04 0 .08.01.12.01.48 0 .96-.17 1.37-.49.06-.05.12-.1.17-.16-.02.34-.08.7-.15 1.05a.756.756 0 0 0 .63.86c.42.06.8-.23.86-.65.21-1.41-.15-2.5-.53-3.21l-.06-.11c.33-.45.64-.87.91-1.25 1.18-1.67 1.76-2.92 1.08-4.01-.4-.64-1.33-1.44-2.98-1.25-1.08.13-2.13.48-3.13 1.17-1.15.78-2.28 1.71-3.37 2.77-.29-.45-.67-.85-1.17-1.16-.43-.27-.93-.41-1.48-.41-.2 0-.41.02-.62.06-.63.1-1.22.42-1.79.73-.56.3-1.14.61-1.77.67-.88.09-1.64-.16-2.17-.33-.74-.25-1.75-.6-3.1.51-.67.55-1.07 1.27-1.13 2.04-.06.79.18 1.5.67 2.08-1.37 2.08-2.29 4.19-2.72 6.33-.3 1.5-.34 3.04-.12 4.57.23 1.6.73 3.08 1.49 4.41a12.67 12.67 0 0 0 3.18 3.65c1.06.82 2.24 1.4 3.5 1.7 1.55.38 2.52.06 2.95-.13a.76.76 0 0 0 .43-.98.76.76 0 0 0-.98-.43c-.36.15-.85.2-1.6.01-1.02-.25-1.96-.74-2.8-1.38a11.19 11.19 0 0 1-2.81-3.22c-.65-1.11-1.08-2.36-1.27-3.7-.19-1.31-.15-2.62.1-3.89.4-1.98 1.26-3.94 2.56-5.85.2.13.44.24.71.32.61.19 1.26.29 1.91.29.34 0 .68-.03 1.01-.08a12.5 12.5 0 0 0 2.11 3.05c-.75.14-1.44.4-2.04.77-1.11.7-2.42 1.97-2.87 3.08-.41.99.09 2.06 1.07 2.32 1.07.29 2.14-.32 2.56-1.32.59-1.4 2.43-1.99 3.31-2.15.77-.14 1.56-.17 2.05-.17.43 0 .83.02 1.17.05.15.01.3.01.45.01 1.22 0 2.36-.23 3.44-.93 1.56-1 2.41-2.19 2.81-3.14.24-.59.53-1.46.01-2.35-.43-.73-1.19-.97-1.7-1.13-.45-.14-.95-.31-1.09-.61-.06-.12-.03-.35.01-.53.03-.16.06-.31.06-.46 0-.22.04-.44.07-.65.04-.24.07-.48.06-.72-.02-.5-.15-.98-.4-1.38-.37-.59-.95-.81-1.4-.96-.22-.07-.44-.15-.61-.25-.17-.1-.3-.28-.49-.51-.13-.17-.29-.37-.47-.53.3-.32.62-.62.94-.92.41-.38.81-.7 1.2-1a5.89 5.89 0 0 1 2.1-1.05c1.95-.5 2.92-.02 3.33.59.83 1.21-.36 3.02-1.55 4.66-.57.8-1.17 1.62-1.61 2.49-.56 1.1-.79 2.34-.65 3.5.13 1.1.64 2.17 1.32 2.94.61.7 1.85 1.89 3.56 1.55.58-.11 1.31-.74 1.85-1.36.5-.58.71-1.39.7-2.05-.02-.52-.07-.62-.14-1.03-.69-3.92-3.68-7.15-6.79-9.21.51-.97 1.07-1.85 1.66-2.63.29.14.58.3.86.48.28.19.56.42.86.67.23.2.44.39.64.57.52.45 1.02.88 1.93.9.18 0 .36-.02.55-.07a.76.76 0 0 0 .6-.88.76.76 0 0 0-.88-.6c-.08.01-.16.02-.24.02-.21 0-.41-.15-.79-.48-.19-.16-.38-.34-.6-.53-.67-.56-1.42-1.2-2.45-1.33.78-1.24 1.09-2.45.49-3.41-.81-1.27-2.37-1.45-3.57-1.28-1.28.18-2.54.68-3.79 1.55-1.13.77-2.25 1.7-3.32 2.75-.03-.05-.07-.09-.11-.14a8.35 8.35 0 0 0-.84-.85c.31-.48.66-.94 1.04-1.38 1.86-2.17 4.21-3.58 6.22-4.09 2.34-.6 3.64-.08 4.2.77.08.13.32.51.31 1.19-.01 1.03-.63 2.35-1.84 3.92-.29.38-.78.45-1.16.17-.38-.29-.45-.82-.17-1.2.85-1.1 1.32-2.03 1.31-2.62-.01-.12-.02-.11-.02-.11-.01-.01-.11-.08-.53-.09z"/>
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-red-500" />
                  <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{maskApiKey(firecrawlKey)}fDb3</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 h-full px-4 py-0 rounded-none border-l border-gray-300 dark:border-gray-700 min-h-[3.5rem]"
                onClick={() => handleChangeKey('firecrawl', null)}
              >
                Change Key
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}