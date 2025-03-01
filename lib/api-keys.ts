/**
 * API Key management utilities
 * Handles secure storage and retrieval of API keys for different providers
 */

import { storage } from './storage';
import { ApiKeys } from './types';

const API_KEYS_STORAGE_KEY = 'api-keys';

// Legacy storage keys
const OPENAI_KEY = 'openai-api-key';
const ANTHROPIC_KEY = 'anthropic-api-key';
const GEMINI_KEY = 'gemini-api-key';

/**
 * Utility for API key management
 */
export const apiKeyStorage = {
  /**
   * Get all API keys
   */
  getApiKeys: async (): Promise<ApiKeys> => {
    try {
      // Try to get from new storage
      const keys = await storage.get<ApiKeys>(API_KEYS_STORAGE_KEY);
      
      if (keys) {
        return keys;
      }
      
      // Fallback to legacy storage
      const openai = localStorage.getItem(OPENAI_KEY) || '';
      const anthropic = localStorage.getItem(ANTHROPIC_KEY) || '';
      const gemini = localStorage.getItem(GEMINI_KEY) || '';
      
      // Migrate to new storage format
      const migratedKeys: ApiKeys = { openai, anthropic, gemini };
      await storage.set(API_KEYS_STORAGE_KEY, migratedKeys);
      
      return migratedKeys;
    } catch (error) {
      console.error('Error getting API keys:', error);
      return {};
    }
  },
  
  /**
   * Set an API key for a specific provider
   */
  setApiKey: async (provider: keyof ApiKeys, key: string): Promise<void> => {
    try {
      // Get current keys
      const keys = await apiKeyStorage.getApiKeys();
      
      // Update the specific key
      const updatedKeys = { ...keys, [provider]: key };
      
      // Save to storage
      await storage.set(API_KEYS_STORAGE_KEY, updatedKeys);
      
      // Also update legacy storage for backward compatibility
      if (provider === 'openai') {
        localStorage.setItem(OPENAI_KEY, key);
      } else if (provider === 'anthropic') {
        localStorage.setItem(ANTHROPIC_KEY, key);
      } else if (provider === 'gemini') {
        localStorage.setItem(GEMINI_KEY, key);
      }
    } catch (error) {
      console.error(`Error setting ${provider} API key:`, error);
    }
  },
  
  /**
   * Clear all API keys
   */
  clearAllApiKeys: async (): Promise<void> => {
    try {
      // Clear from new storage
      await storage.remove(API_KEYS_STORAGE_KEY);
      
      // Clear from legacy storage
      localStorage.removeItem(OPENAI_KEY);
      localStorage.removeItem(ANTHROPIC_KEY);
      localStorage.removeItem(GEMINI_KEY);
    } catch (error) {
      console.error('Error clearing API keys:', error);
    }
  },

  /**
   * Get OpenAI API key
   */
  getOpenAIKey: (): string => {
    return localStorage.getItem(OPENAI_KEY) || '';
  },

  /**
   * Set OpenAI API key
   */
  setOpenAIKey: (key: string): void => {
    localStorage.setItem(OPENAI_KEY, key);
  },

  /**
   * Get Anthropic API key
   */
  getAnthropicKey: (): string => {
    return localStorage.getItem(ANTHROPIC_KEY) || '';
  },

  /**
   * Set Anthropic API key
   */
  setAnthropicKey: (key: string): void => {
    localStorage.setItem(ANTHROPIC_KEY, key);
  },

  /**
   * Get Gemini API key
   */
  getGeminiKey: (): string => {
    return localStorage.getItem(GEMINI_KEY) || '';
  },

  /**
   * Set Gemini API key
   */
  setGeminiKey: (key: string): void => {
    localStorage.setItem(GEMINI_KEY, key);
  },

  /**
   * Check if a key exists for a provider
   */
  hasKey: (provider: 'openai' | 'anthropic' | 'gemini'): boolean => {
    switch (provider) {
      case 'openai':
        return !!apiKeyStorage.getOpenAIKey();
      case 'anthropic':
        return !!apiKeyStorage.getAnthropicKey();
      case 'gemini':
        return !!apiKeyStorage.getGeminiKey();
      default:
        return false;
    }
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