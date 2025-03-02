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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiKeyStorage } from '@/lib/api-keys';
import { ApiKeys } from '@/lib/types';

interface ApiKeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeysDialog({ open, onOpenChange }: ApiKeysDialogProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: '',
    anthropic: '',
    gemini: '',
    firecrawl: '',
  });

  // Load API keys on mount and when dialog opens
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const keys = await apiKeyStorage.getApiKeys();
        if (keys) {
          setApiKeys(keys);
        }
      } catch (error) {
        console.error('Error loading API keys:', error);
      }
    };
    
    if (open) {
      loadApiKeys();
    }
  }, [open]);

  // Listen for API key updates from other components
  useEffect(() => {
    // Handler for Firecrawl API key updates
    const handleFirecrawlKeyUpdate = (event: CustomEvent<{ key: string }>) => {
      setApiKeys(prevKeys => ({
        ...prevKeys,
        firecrawl: event.detail.key
      }));
    };

    // Add event listener
    window.addEventListener('firecrawl-api-key-updated', handleFirecrawlKeyUpdate as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('firecrawl-api-key-updated', handleFirecrawlKeyUpdate as EventListener);
    };
  }, []);

  const handleChangeKey = async (provider: keyof ApiKeys, value: string) => {
    const updatedKeys = { ...apiKeys, [provider]: value };
    setApiKeys(updatedKeys);
    
    try {
      await apiKeyStorage.setApiKey(provider, value);
      
      // If updating Firecrawl key, dispatch event to notify other components
      if (provider === 'firecrawl') {
        window.dispatchEvent(new CustomEvent('firecrawl-api-key-updated', {
          detail: { key: value }
        }));
      }
    } catch (error) {
      console.error(`Error saving ${provider} API key:`, error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API Keys</DialogTitle>
          <DialogDescription>
            Enter your API keys for the AI providers you want to use.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <Input
              id="openai-key"
              type="password"
              value={apiKeys.openai || ''}
              onChange={(e) => handleChangeKey('openai', e.target.value)}
              placeholder="sk-..."
            />
            <p className="text-xs text-muted-foreground">
              Used for GPT-4 and other OpenAI models
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="anthropic-key">Anthropic API Key</Label>
            <Input
              id="anthropic-key"
              type="password"
              value={apiKeys.anthropic || ''}
              onChange={(e) => handleChangeKey('anthropic', e.target.value)}
              placeholder="sk-ant-..."
            />
            <p className="text-xs text-muted-foreground">
              Used for Claude and other Anthropic models
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gemini-key">Google AI API Key</Label>
            <Input
              id="gemini-key"
              type="password"
              value={apiKeys.gemini || ''}
              onChange={(e) => handleChangeKey('gemini', e.target.value)}
              placeholder="AIza..."
            />
            <p className="text-xs text-muted-foreground">
              Used for Gemini and other Google AI models
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="firecrawl-key">Firecrawl API Key</Label>
            <Input
              id="firecrawl-key"
              type="password"
              value={apiKeys.firecrawl || ''}
              onChange={(e) => handleChangeKey('firecrawl', e.target.value)}
              placeholder="Firecrawl API key..."
            />
            <p className="text-xs text-muted-foreground">
              <strong>Required</strong> for web search functionality. The globe button in the chat panel will not work without this key.
            </p>
          </div>
        </div>
        <div className="flex justify-between">
          <Button
            className="text-destructive hover:text-destructive border border-input bg-background hover:bg-accent"
            onClick={() => {
              apiKeyStorage.clearAllApiKeys();
              setApiKeys({
                openai: '',
                anthropic: '',
                gemini: '',
                firecrawl: ''
              });
              
              // Notify other components that keys have been cleared
              window.dispatchEvent(new CustomEvent('firecrawl-api-key-updated', {
                detail: { key: '' }
              }));
            }}
          >
            Clear All Keys
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}