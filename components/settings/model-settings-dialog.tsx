'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface ModelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModel: string;
}

export function ModelSettingsDialog({ 
  open, 
  onOpenChange,
  currentModel
}: ModelSettingsDialogProps) {
  // State for all model settings
  const [contextLimit, setContextLimit] = useState<string>("All Previous Messages");
  const [temperature, setTemperature] = useState<number>(0.7); // Default value
  const [presencePenalty, setPresencePenalty] = useState<number>(0);
  const [frequencyPenalty, setFrequencyPenalty] = useState<number>(0);
  const [topP, setTopP] = useState<number>(0.9);
  const [topK, setTopK] = useState<number>(40);
  const [maxTokens, setMaxTokens] = useState<number>(4096);
  
  // Safety settings sliders
  const [harassmentLevel, setHarassmentLevel] = useState<number>(75);
  const [hateLevel, setHateLevel] = useState<number>(80);
  const [sexualLevel, setSexualLevel] = useState<number>(85);
  const [dangerousLevel, setDangerousLevel] = useState<number>(90);
  const [civicLevel, setCivicLevel] = useState<number>(50);
  
  // Other settings
  const [promptCaching, setPromptCaching] = useState<boolean>(true);
  const [reasoningEffort, setReasoningEffort] = useState<string>("High");

  // Handle resetting to default
  const handleResetToDefault = (setting: string) => {
    switch(setting) {
      case 'context':
        setContextLimit("All Previous Messages");
        toast.success("Context limit reset to default");
        break;
      case 'temperature':
        setTemperature(0.7);
        toast.success("Temperature reset to default");
        break;
      case 'presence':
        setPresencePenalty(0);
        toast.success("Presence penalty reset to default");
        break;
      case 'frequency':
        setFrequencyPenalty(0);
        toast.success("Frequency penalty reset to default");
        break;
      case 'topP':
        setTopP(0.9);
        toast.success("Top P reset to default");
        break;
      case 'topK':
        setTopK(40);
        toast.success("Top K reset to default");
        break;
      case 'maxTokens':
        setMaxTokens(4096);
        toast.success("Max tokens reset to default");
        break;
      case 'safety':
        setHarassmentLevel(75);
        setHateLevel(80);
        setSexualLevel(85);
        setDangerousLevel(90);
        setCivicLevel(50);
        toast.success("Safety settings reset to default");
        break;
      case 'reasoning':
        setReasoningEffort("High");
        toast.success("Reasoning effort reset to default");
        break;
      case 'all':
        setContextLimit("All Previous Messages");
        setTemperature(0.7);
        setPresencePenalty(0);
        setFrequencyPenalty(0);
        setTopP(0.9);
        setTopK(40);
        setMaxTokens(4096);
        setHarassmentLevel(75);
        setHateLevel(80);
        setSexualLevel(85);
        setDangerousLevel(90);
        setCivicLevel(50);
        setPromptCaching(true);
        setReasoningEffort("High");
        toast.success("All settings reset to default");
        break;
    }
  };

  // Label formatter for sliders
  const formatSliderLabel = (value: number) => {
    return value.toFixed(1);
  };

  // Get model display name
  const getModelDisplayName = () => {
    switch(currentModel) {
      case 'openai':
        return 'OpenAI GPT-4o';
      case 'anthropic':
        return 'Anthropic Claude 3';
      case 'gemini':
        return 'Google Gemini Pro';
      case 'smart':
        return 'Smart Selection';
      default:
        return 'AI Model';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-xl font-bold">Model Settings</DialogTitle>
          </div>
          <DialogDescription className="text-center">
            Customize {getModelDisplayName()} parameters for this chat
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Context Limit */}
          <div className="flex justify-between items-start">
            <div>
              <Label className="text-base font-medium">Context Limit: {contextLimit}</Label>
              <p className="text-sm text-muted-foreground mt-1">
                The number of messages to include in the context for the AI assistant. When set to 1, the AI assistant will only see and remember the most recent message.
              </p>
            </div>
            <Button 
              variant="link" 
              className="text-sm text-blue-600 dark:text-blue-500 h-auto p-0"
              onClick={() => handleResetToDefault('context')}
            >
              (Reset to default)
            </Button>
          </div>
          <Select value={contextLimit} onValueChange={setContextLimit}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select context limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Previous Messages">All Previous Messages</SelectItem>
              <SelectItem value="Last 20 messages">Last 20 messages</SelectItem>
              <SelectItem value="Last 10 messages">Last 10 messages</SelectItem>
              <SelectItem value="Last 5 messages">Last 5 messages</SelectItem>
              <SelectItem value="Last message only">Last message only</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <Label className="text-base font-medium">Temperature: {temperature.toFixed(1)}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.
                </p>
              </div>
              <Button 
                variant="link" 
                className="text-sm text-blue-600 dark:text-blue-500 h-auto p-0"
                onClick={() => handleResetToDefault('temperature')}
              >
                (Change)
              </Button>
            </div>
            <Slider 
              value={[temperature]} 
              min={0} 
              max={1} 
              step={0.1} 
              onValueChange={(values) => setTemperature(values[0])} 
            />
          </div>
          
          {/* Presence Penalty */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <Label className="text-base font-medium">Presence Penalty: {presencePenalty.toFixed(1)}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  How much to penalize new tokens based on whether they appear in the text so far. Increases the model's likelihood to talk about new topics.
                </p>
              </div>
              <Button 
                variant="link" 
                className="text-sm text-blue-600 dark:text-blue-500 h-auto p-0"
                onClick={() => handleResetToDefault('presence')}
              >
                (Change)
              </Button>
            </div>
            <Slider 
              value={[presencePenalty]} 
              min={-2} 
              max={2} 
              step={0.1} 
              onValueChange={(values) => setPresencePenalty(values[0])} 
            />
          </div>
          
          {/* Frequency Penalty */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <Label className="text-base font-medium">Frequency Penalty: {frequencyPenalty.toFixed(1)}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  How much to penalize new tokens based on their existing frequency in the text so far. Decreases the model's likelihood to repeat the same line verbatim.
                </p>
              </div>
              <Button 
                variant="link" 
                className="text-sm text-blue-600 dark:text-blue-500 h-auto p-0"
                onClick={() => handleResetToDefault('frequency')}
              >
                (Change)
              </Button>
            </div>
            <Slider 
              value={[frequencyPenalty]} 
              min={-2} 
              max={2} 
              step={0.1} 
              onValueChange={(values) => setFrequencyPenalty(values[0])} 
            />
          </div>
          
          {/* Top P */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <Label className="text-base font-medium">Top P: {topP.toFixed(1)}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.
                </p>
              </div>
              <Button 
                variant="link" 
                className="text-sm text-blue-600 dark:text-blue-500 h-auto p-0"
                onClick={() => handleResetToDefault('topP')}
              >
                (Change)
              </Button>
            </div>
            <Slider 
              value={[topP]} 
              min={0.1} 
              max={1} 
              step={0.1} 
              onValueChange={(values) => setTopP(values[0])} 
            />
          </div>
          
          {/* Top K */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <Label className="text-base font-medium">Top K: {topK}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Only sample from the top K options for each subsequent token. Used to remove "long tail" low probability responses. Min: 0
                </p>
              </div>
              <Button 
                variant="link" 
                className="text-sm text-blue-600 dark:text-blue-500 h-auto p-0"
                onClick={() => handleResetToDefault('topK')}
              >
                (Change)
              </Button>
            </div>
            <Slider 
              value={[topK]} 
              min={0} 
              max={100} 
              step={1} 
              onValueChange={(values) => setTopK(values[0])} 
            />
          </div>
          
          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <Label className="text-base font-medium">Max Tokens: {maxTokens}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  The maximum number of tokens to generate before stopping.
                </p>
              </div>
              <Button 
                variant="link" 
                className="text-sm text-blue-600 dark:text-blue-500 h-auto p-0"
                onClick={() => handleResetToDefault('maxTokens')}
              >
                (Change)
              </Button>
            </div>
            <Slider 
              value={[maxTokens]} 
              min={1} 
              max={8192} 
              step={1} 
              onValueChange={(values) => setMaxTokens(values[0])} 
            />
          </div>
          
          {/* Safety Settings (Gemini Only) */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <Label className="text-base font-medium">Safety Settings (Gemini Only): Custom</Label>
              <Button 
                variant="link" 
                className="text-sm text-blue-600 dark:text-blue-500 h-auto p-0"
                onClick={() => handleResetToDefault('safety')}
              >
                (Reset to default)
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Content is blocked based on the probability that it is harmful.
            </p>
            
            {/* Harassment */}
            <div className="space-y-2">
              <Label>Harassment</Label>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Block none</span>
                <span>few</span>
                <span>some</span>
                <span>most</span>
              </div>
              <Slider 
                value={[harassmentLevel]} 
                min={0} 
                max={100} 
                onValueChange={(values) => setHarassmentLevel(values[0])} 
              />
            </div>
            
            {/* Hate speech */}
            <div className="space-y-2">
              <Label>Hate speech</Label>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Block none</span>
                <span>few</span>
                <span>some</span>
                <span>most</span>
              </div>
              <Slider 
                value={[hateLevel]} 
                min={0} 
                max={100} 
                onValueChange={(values) => setHateLevel(values[0])} 
              />
            </div>
            
            {/* Sexually explicit */}
            <div className="space-y-2">
              <Label>Sexually explicit</Label>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Block none</span>
                <span>few</span>
                <span>some</span>
                <span>most</span>
              </div>
              <Slider 
                value={[sexualLevel]} 
                min={0} 
                max={100} 
                onValueChange={(values) => setSexualLevel(values[0])} 
              />
            </div>
            
            {/* Dangerous */}
            <div className="space-y-2">
              <Label>Dangerous</Label>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Block none</span>
                <span>few</span>
                <span>some</span>
                <span>most</span>
              </div>
              <Slider 
                value={[dangerousLevel]} 
                min={0} 
                max={100} 
                onValueChange={(values) => setDangerousLevel(values[0])} 
              />
            </div>
            
            {/* Civic integrity */}
            <div className="space-y-2">
              <Label>Civic integrity</Label>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Block none</span>
                <span>few</span>
                <span>some</span>
                <span>most</span>
              </div>
              <Slider 
                value={[civicLevel]} 
                min={0} 
                max={100} 
                onValueChange={(values) => setCivicLevel(values[0])} 
              />
            </div>
          </div>
          
          {/* Prompt Caching */}
          <div className="flex items-center justify-between space-x-2">
            <div>
              <Label className="text-base font-medium">Prompt Caching:</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Prompt caching helps save token costs for long conversations. Enabling this will incur additional tokens when initiating the cache for the first time, but it can save many more tokens later, especially for long conversations. Not all models support caching, and some models require a minimum number of tokens for caching to be initiated. Please check with your AI model provider for more information.
              </p>
            </div>
            <Switch 
              checked={promptCaching}
              onCheckedChange={setPromptCaching}
            />
          </div>
          
          {/* Reasoning Effort */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <Label className="text-base font-medium">Reasoning Effort (Reasoning models only): {reasoningEffort}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Constrains effort on reasoning for reasoning models. Reducing reasoning effort can result in faster responses and fewer tokens used on reasoning in a response.
                </p>
              </div>
              <Button 
                variant="link" 
                className="text-sm text-blue-600 dark:text-blue-500 h-auto p-0"
                onClick={() => handleResetToDefault('reasoning')}
              >
                (Reset to default)
              </Button>
            </div>
            <Select value={reasoningEffort} onValueChange={setReasoningEffort}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select reasoning effort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}