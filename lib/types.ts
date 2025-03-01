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