/**
 * API Key management utilities
 * Handles secure storage and retrieval of API keys for different providers
 */

import { storage } from './storage';
import { ApiKeys } from './types';

const API_KEYS_STORAGE_KEY = 'api-keys';

/**
 * Utility for API key management
 */
export const apiKeyStorage = {
  /**
   * Get all API keys
   */
  getApiKeys: async (): Promise<ApiKeys> => {
    try {
      // Get from storage
      const keys = await storage.get<ApiKeys>(API_KEYS_STORAGE_KEY);
      
      if (keys) {
        // Filter out any non-allowed keys (gpt-4o, etc.)
        const { openai, anthropic, gemini, firecrawl, ...rest } = keys;
        return { 
          openai: openai || '', 
          anthropic: anthropic || '', 
          gemini: gemini || '',
          firecrawl: firecrawl || ''
        };
      }
      
      return { openai: '', anthropic: '', gemini: '', firecrawl: '' };
    } catch (error) {
      console.error('Error getting API keys:', error);
      return { openai: '', anthropic: '', gemini: '', firecrawl: '' };
    }
  },
  
  /**
   * Set an API key for a specific provider
   */
  setApiKey: async (provider: keyof ApiKeys, key: string): Promise<void> => {
    try {
      // Only allow openai, anthropic, gemini, and firecrawl
      if (provider !== 'openai' && provider !== 'anthropic' && 
          provider !== 'gemini' && provider !== 'firecrawl') {
        console.error(`API key provider ${provider} is not supported`);
        return;
      }
      
      // Get current keys
      const keys = await apiKeyStorage.getApiKeys();
      
      // Update the specific key
      const updatedKeys = { ...keys, [provider]: key };
      
      // Save to storage
      await storage.set(API_KEYS_STORAGE_KEY, updatedKeys);
    } catch (error) {
      console.error(`Error setting ${provider} API key:`, error);
    }
  },
  
  /**
   * Clear all API keys
   */
  clearAllApiKeys: async (): Promise<void> => {
    try {
      // Clear from storage
      await storage.remove(API_KEYS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing API keys:', error);
    }
  },

  /**
   * Get OpenAI API key
   */
  getOpenAIKey: (): string => {
    const keys = storage.get<ApiKeys>(API_KEYS_STORAGE_KEY, {});
    return keys.openai || '';
  },

  /**
   * Set OpenAI API key
   */
  setOpenAIKey: async (key: string): Promise<void> => {
    await apiKeyStorage.setApiKey('openai', key);
  },

  /**
   * Get Anthropic API key
   */
  getAnthropicKey: (): string => {
    const keys = storage.get<ApiKeys>(API_KEYS_STORAGE_KEY, {});
    return keys.anthropic || '';
  },

  /**
   * Set Anthropic API key
   */
  setAnthropicKey: async (key: string): Promise<void> => {
    await apiKeyStorage.setApiKey('anthropic', key);
  },

  /**
   * Get Gemini API key
   */
  getGeminiKey: (): string => {
    const keys = storage.get<ApiKeys>(API_KEYS_STORAGE_KEY, {});
    return keys.gemini || '';
  },

  /**
   * Set Gemini API key
   */
  setGeminiKey: async (key: string): Promise<void> => {
    await apiKeyStorage.setApiKey('gemini', key);
  },

  /**
   * Get Firecrawl API key
   */
  getFirecrawlKey: (): string => {
    const keys = storage.get<ApiKeys>(API_KEYS_STORAGE_KEY, {});
    return keys.firecrawl || '';
  },

  /**
   * Set Firecrawl API key
   */
  setFirecrawlKey: async (key: string): Promise<void> => {
    await apiKeyStorage.setApiKey('firecrawl', key);
  },

  /**
   * Check if a key exists for a provider
   */
  hasKey: (provider: 'openai' | 'anthropic' | 'gemini' | 'firecrawl'): boolean => {
    const keys = storage.get<ApiKeys>(API_KEYS_STORAGE_KEY, {});
    return !!keys[provider];
  },

  /**
   * Mask an API key for display
   */
  maskApiKey: (key: string): string => {
    if (!key) return '';
    if (key.length <= 8) return '********';
    return '••••••••' + key.slice(-4);
  },

  /**
   * Check if an API key is valid
   */
  isValidKey: (key: string): boolean => {
    return key.length > 8;
  }
};

export default apiKeyStorage;