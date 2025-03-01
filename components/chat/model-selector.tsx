'use client';

import React from 'react';
import { Check, ChevronsUpDown, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AI_MODELS, AIModel } from '@/lib/types';
import { Sparkles, Bot, Atom } from 'lucide-react';

interface ModelSelectorProps {
  model: AIModel;
  onModelChange: (model: AIModel) => void;
}

export function ModelSelector({ model, onModelChange }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);

  // Validate model - ensure we always have a valid model even if somehow an invalid one is passed
  const validModel: AIModel = ['smart', 'openai', 'anthropic', 'gemini'].includes(model) 
    ? model as AIModel 
    : 'openai';

  const getModelIcon = (iconName: string) => {
    switch (iconName) {
      case 'brain':
        return <Brain className="mr-2 h-4 w-4" />;
      case 'sparkles':
        return <Sparkles className="mr-2 h-4 w-4" />;
      case 'bot':
        return <Bot className="mr-2 h-4 w-4" />;
      case 'atom':
        return <Atom className="mr-2 h-4 w-4" />;
      default:
        return null;
    }
  };

  // Get all models of the selected category
  const modelsInCategory = AI_MODELS.filter(m => m.id === validModel);
  // Get the first model in the selected category (default selection)
  const selectedModel = modelsInCategory.length > 0 ? modelsInCategory[0] : AI_MODELS[0];

  // Group models by category
  const smartModel = AI_MODELS.filter(m => m.category === 'smart');
  const openaiModels = AI_MODELS.filter(m => m.category === 'openai');
  const anthropicModels = AI_MODELS.filter(m => m.category === 'anthropic');
  const geminiModels = AI_MODELS.filter(m => m.category === 'gemini');

  const handleSelect = (value: string) => {
    // Validate the selected model is one of the acceptable values
    if (['smart', 'openai', 'anthropic', 'gemini'].includes(value)) {
      onModelChange(value as AIModel);
    } else {
      onModelChange('openai');
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center">
            {selectedModel && getModelIcon(selectedModel.icon)}
            <span>{selectedModel?.name || 'Select model...'}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandEmpty>No model found.</CommandEmpty>
          <CommandList>
            {/* Smart Selection Option */}
            <CommandGroup heading="Recommended">
              {smartModel.map((item) => (
                <CommandItem
                  key={item.name}
                  value={item.id}
                  onSelect={handleSelect}
                >
                  <div className="flex items-center">
                    {getModelIcon(item.icon)}
                    {item.name}
                  </div>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      validModel === item.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="OpenAI">
              {openaiModels.map((item) => (
                <CommandItem
                  key={item.name}
                  value={item.id}
                  onSelect={handleSelect}
                >
                  <div className="flex items-center">
                    {getModelIcon(item.icon)}
                    {item.name}
                  </div>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      validModel === item.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Anthropic">
              {anthropicModels.map((item) => (
                <CommandItem
                  key={item.name}
                  value={item.id}
                  onSelect={handleSelect}
                >
                  <div className="flex items-center">
                    {getModelIcon(item.icon)}
                    {item.name}
                  </div>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      validModel === item.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Google">
              {geminiModels.map((item) => (
                <CommandItem
                  key={item.name}
                  value={item.id}
                  onSelect={handleSelect}
                >
                  <div className="flex items-center">
                    {getModelIcon(item.icon)}
                    {item.name}
                  </div>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      validModel === item.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}