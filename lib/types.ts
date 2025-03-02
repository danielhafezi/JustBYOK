export type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: Date;
  isPinned?: boolean;
};

export type Folder = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  chatIds: string[];
  isEditing?: boolean;
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  model: AIModel;
  createdAt: Date;
  updatedAt: Date;
  folderId?: string;
  favorite?: boolean;
  pinnedMessageIds?: string[];
};

export type AIModel = 'smart' | 'openai' | 'anthropic' | 'gemini';

export const AI_MODELS = [
  // Smart Selection
  { id: 'smart', name: 'Smart Selection', icon: 'brain', category: 'smart' },
  
  // OpenAI Models
  { id: 'openai', name: 'OpenAI GPT-4o', icon: 'sparkles', category: 'openai' },
  { id: 'openai', name: 'OpenAI GPT-4 Turbo', icon: 'sparkles', category: 'openai' },
  { id: 'openai', name: 'OpenAI GPT-3.5 Turbo', icon: 'sparkles', category: 'openai' },
  
  // Anthropic Models
  { id: 'anthropic', name: 'Anthropic Claude 3 Opus', icon: 'bot', category: 'anthropic' },
  { id: 'anthropic', name: 'Anthropic Claude 3 Sonnet', icon: 'bot', category: 'anthropic' },
  { id: 'anthropic', name: 'Anthropic Claude 3 Haiku', icon: 'bot', category: 'anthropic' },
  
  // Google Models
  { id: 'gemini', name: 'Google Gemini Pro', icon: 'atom', category: 'gemini' },
  { id: 'gemini', name: 'Google Gemini Flash', icon: 'atom', category: 'gemini' },
  { id: 'gemini', name: 'Google Gemini Ultra', icon: 'atom', category: 'gemini' }
];

/**
 * User profile type for storing user information and preferences
 */
export type UserProfile = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: {
    theme?: string;
    fontSize?: string;
    layout?: string;
    information?: string;
    customInstruction?: string;
  };
};

/**
 * Application settings type for storing UI preferences
 */
export type Settings = {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'sm' | 'md' | 'lg';
  messageBubbleStyle: 'modern' | 'classic';
  enterToSend: boolean;
  showTimestamps: boolean;
  defaultModel: AIModel;
  autoSaveDrafts: boolean;
  autoGenerateTitles: boolean;
  modelSettings: ModelSettings;
};

/**
 * Default application settings
 */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  fontSize: 'md',
  messageBubbleStyle: 'modern',
  enterToSend: true,
  showTimestamps: true,
  defaultModel: 'smart',
  autoSaveDrafts: true,
  autoGenerateTitles: true,
  modelSettings: {
    temperature: 0.7,
    presencePenalty: 0,
    frequencyPenalty: 0,
    topP: 0.9,
    topK: 40,
    maxTokens: 0, // 0 means no limit
    contextLimit: 'all',
    streamResponses: true,
    promptCaching: false,
    reasoningEffort: 0.5,
    systemPrompt: '',
    contextLength: 2048,
    contextStrategy: 'basic',
    defaultModel: 'smart',
    enabledPlugins: [],
    safetySettings: {
      harassment: 'none',
      hateSpeech: 'none',
      sexuallyExplicit: 'none',
      dangerous: 'none',
      civicIntegrity: 'some'
    }
  },
};

// Storage types
export type StorageKey = string;

export interface ModelSettings {
  temperature: number;
  presencePenalty: number;
  frequencyPenalty: number;
  topP: number;
  topK: number;
  maxTokens: number;
  contextLimit: 'all' | 'last1' | 'last5' | 'last10' | 'last20';
  streamResponses: boolean;
  promptCaching: boolean;
  reasoningEffort: number;
  systemPrompt: string;
  contextLength: number;
  contextStrategy: string;
  defaultModel: AIModel;
  enabledPlugins: string[];
  safetySettings: {
    harassment: 'none' | 'few' | 'some' | 'most';
    hateSpeech: 'none' | 'few' | 'some' | 'most';
    sexuallyExplicit: 'none' | 'few' | 'some' | 'most';
    dangerous: 'none' | 'few' | 'some' | 'most';
    civicIntegrity: 'none' | 'few' | 'some' | 'most';
  };
}

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  gemini?: string;
  firecrawl?: string;
  [key: string]: string | undefined;
}