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

export type AIModel = 
  | 'gpt-4o' 
  | 'gpt-4o-mini' 
  | 'gpt45-preview'
  | 'claude-3-sonnet'
  | 'claude-3-sonnet-reasoning'
  | 'gemini-flash-2';

export const AI_MODELS = [
  // OpenAI Models
  { id: 'gpt-4o', name: 'GPT-4o', icon: 'sparkles', category: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', icon: 'sparkles', category: 'openai' },
  { id: 'gpt45-preview', name: 'GPT 4.5 Preview', icon: 'sparkles', category: 'openai' },
  
  // Anthropic Models
  { id: 'claude-3-sonnet', name: 'Claude Sonnet 3.7', icon: 'bot', category: 'anthropic' },
  { id: 'claude-3-sonnet-reasoning', name: 'Claude Sonnet 3.7 (Reasoning)', icon: 'bot', category: 'anthropic' },
  
  // Google Models
  { id: 'gemini-flash-2', name: 'Gemini Flash 2', icon: 'atom', category: 'gemini' }
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
  defaultModel: 'gpt-4o',
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
    reasoningEnabled: false,
    systemPrompt: '',
    contextLength: 2048,
    contextStrategy: 'basic',
    defaultModel: 'gpt-4o',
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
  reasoningEnabled: boolean;
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