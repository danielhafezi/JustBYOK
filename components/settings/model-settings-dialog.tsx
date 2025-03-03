'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModelSettings } from '@/lib/types';
import { useSettingsStore } from '@/hooks/use-settings-store';

interface ModelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SafetyLevel = 'none' | 'few' | 'some' | 'most';
type SafetySettingKey = 'harassment' | 'hateSpeech' | 'sexuallyExplicit' | 'dangerous' | 'civicIntegrity';

export function ModelSettingsDialog({
  open,
  onOpenChange,
}: ModelSettingsDialogProps) {
  const { 
    settings, 
    updateModelSettings, 
    resetModelSettings 
  } = useSettingsStore();
  
  const [localSettings, setLocalSettings] = useState<ModelSettings>(() => {
    // Ensure safetySettings is initialized with default values if undefined
    const modelSettings = settings.modelSettings;
    return {
      ...modelSettings,
      safetySettings: modelSettings.safetySettings || {
        harassment: 'none',
        hateSpeech: 'none',
        sexuallyExplicit: 'none',
        dangerous: 'none',
        civicIntegrity: 'some'
      }
    };
  });

  // Update local settings when stored settings change
  useEffect(() => {
    setLocalSettings(prev => ({
      ...settings.modelSettings,
      safetySettings: settings.modelSettings.safetySettings || prev.safetySettings
    }));
  }, [settings.modelSettings]);

  const handleSave = () => {
    updateModelSettings(localSettings);
    onOpenChange(false);
  };

  const handleReset = () => {
    resetModelSettings();
    onOpenChange(false);
  };

  const handleChange = (
    key: keyof ModelSettings,
    value: string | number | boolean | string[]
  ) => {
    setLocalSettings((prev: ModelSettings) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSafetySettingChange = (
    setting: SafetySettingKey,
    value: SafetyLevel
  ) => {
    setLocalSettings((prev: ModelSettings) => {
      // Ensure safetySettings exists
      const safetySettings = prev.safetySettings || {
        harassment: 'none',
        hateSpeech: 'none',
        sexuallyExplicit: 'none',
        dangerous: 'none',
        civicIntegrity: 'some'
      };
      
      return {
        ...prev,
        safetySettings: {
          ...safetySettings,
          [setting]: value,
        },
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Model Settings</DialogTitle>
          <DialogDescription>
            Configure the AI model behavior and parameters
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            {/* Stream AI responses toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="streamResponses" className="text-base">Stream AI responses word by word</Label>
                <p className="text-xs text-muted-foreground">
                  Cost estimation will be less accurate when stream response is enabled
                </p>
              </div>
              <Switch
                id="streamResponses"
                checked={localSettings.streamResponses}
                onCheckedChange={(checked: boolean) => handleChange('streamResponses', checked)}
              />
            </div>

            {/* Context Limit */}
            <div className="grid gap-2">
              <Label htmlFor="contextLimit">Context Limit</Label>
              <Select 
                value={localSettings.contextLimit} 
                onValueChange={(value: string) => handleChange('contextLimit', value)}
              >
                <SelectTrigger id="contextLimit">
                  <SelectValue placeholder="Select context limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Previous Messages</SelectItem>
                  <SelectItem value="last1">Last Message Only</SelectItem>
                  <SelectItem value="last5">Last 5 Messages</SelectItem>
                  <SelectItem value="last10">Last 10 Messages</SelectItem>
                  <SelectItem value="last20">Last 20 Messages</SelectItem>
                  <SelectItem value="last50">Last 50 Messages</SelectItem>
                  <SelectItem value="last100">Last 100 Messages</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The number of messages to include in the context for the AI assistant
              </p>
            </div>

            {/* Temperature */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="temperature">Temperature: {localSettings.temperature.toFixed(1)}</Label>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[localSettings.temperature]}
                onValueChange={(values: number[]) => handleChange('temperature', values[0])}
              />
              <p className="text-xs text-muted-foreground">
                Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic
              </p>
            </div>

            {/* Max Tokens */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="maxTokens">Max Tokens</Label>
              </div>
              <Input 
                id="maxTokens"
                type="number"
                min="0"
                max="32000"
                value={localSettings.maxTokens === 0 ? "" : localSettings.maxTokens.toString()}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                  handleChange('maxTokens', isNaN(value) ? 0 : Math.max(0, Math.min(32000, value)));
                }}
                placeholder="0 (no limit)"
              />
              <p className="text-xs text-muted-foreground">
                The maximum number of tokens to generate before stopping (0 or empty means no limit)
              </p>
            </div>

            {/* Default Model */}
            <div className="grid gap-2">
              <Label htmlFor="defaultModel">Default Model</Label>
              <Select 
                value={localSettings.defaultModel} 
                onValueChange={(value: string) => handleChange('defaultModel', value as any)}
              >
                <SelectTrigger id="defaultModel">
                  <SelectValue placeholder="Select default model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smart">Smart (automatic selection)</SelectItem>
                  <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The default model used for new conversations
              </p>
            </div>

            {/* Prompt Caching */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="promptCaching" className="text-base">Prompt Caching (For Supported Models)</Label>
                <p className="text-xs text-muted-foreground">
                  Prompt caching helps save token costs for long conversations. Enabling this will incur additional tokens when initiating the cache
                </p>
              </div>
              <Switch
                id="promptCaching"
                checked={localSettings.promptCaching}
                onCheckedChange={(checked: boolean) => handleChange('promptCaching', checked)}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* Presence Penalty */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="presencePenalty">Presence Penalty: {localSettings.presencePenalty.toFixed(1)}</Label>
              </div>
              <Slider
                id="presencePenalty"
                min={0}
                max={2}
                step={0.1}
                value={[localSettings.presencePenalty]}
                onValueChange={(values: number[]) => handleChange('presencePenalty', values[0])}
              />
              <p className="text-xs text-muted-foreground">
                How much to penalize new tokens based on whether they appear in the text so far
              </p>
            </div>

            {/* Frequency Penalty */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="frequencyPenalty">Frequency Penalty: {localSettings.frequencyPenalty.toFixed(1)}</Label>
              </div>
              <Slider
                id="frequencyPenalty"
                min={0}
                max={2}
                step={0.1}
                value={[localSettings.frequencyPenalty]}
                onValueChange={(values: number[]) => handleChange('frequencyPenalty', values[0])}
              />
              <p className="text-xs text-muted-foreground">
                How much to penalize new tokens based on their existing frequency in the text so far
              </p>
            </div>

            {/* Top P */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="topP">Top P: {localSettings.topP.toFixed(1)}</Label>
              </div>
              <Slider
                id="topP"
                min={0}
                max={1}
                step={0.1}
                value={[localSettings.topP]}
                onValueChange={(values: number[]) => handleChange('topP', values[0])}
              />
              <p className="text-xs text-muted-foreground">
                An alternative to sampling with temperature called nucleus sampling, where the model considers the results of the tokens with top_p probability mass
              </p>
            </div>

            {/* Top K */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="topK">Top K: {localSettings.topK}</Label>
              </div>
              <Slider
                id="topK"
                min={0}
                max={100}
                step={1}
                value={[localSettings.topK]}
                onValueChange={(values: number[]) => handleChange('topK', values[0])}
              />
              <p className="text-xs text-muted-foreground">
                Only sample from the top K options for each subsequent token
              </p>
            </div>

            {/* Reasoning Effort */}
            <div className="grid gap-2">
              <Label htmlFor="reasoningEffort">Reasoning Effort (For Supported Models)</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-md ${
                    localSettings.reasoningEffort <= 0.3 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                  onClick={() => handleChange('reasoningEffort', 0.25)}
                >
                  Low
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-md ${
                    localSettings.reasoningEffort > 0.3 && localSettings.reasoningEffort <= 0.7
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                  onClick={() => handleChange('reasoningEffort', 0.5)}
                >
                  Medium
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-md ${
                    localSettings.reasoningEffort > 0.7
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                  onClick={() => handleChange('reasoningEffort', 0.9)}
                >
                  High
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Constrains effort on reasoning for reasoning models. Reducing can result in faster responses
              </p>
            </div>
            
            {/* Reasoning Enabled - OpenAI models - Set to false by default */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reasoningEnabled" className="text-base">Enable Reasoning (OpenAI Models)</Label>
                <p className="text-xs text-muted-foreground">
                  This feature is not currently supported by OpenAI models. Leave disabled for regular models.
                </p>
              </div>
              <Switch
                id="reasoningEnabled"
                checked={localSettings.reasoningEnabled || false}
                onCheckedChange={(checked: boolean) => handleChange('reasoningEnabled', checked)}
                disabled={true} // Disable this switch as it's not supported
              />
            </div>

            {/* System Prompt */}
            <div className="grid gap-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={localSettings.systemPrompt}
                onChange={(e) => handleChange('systemPrompt', e.target.value)}
                rows={3}
                placeholder="You are a helpful AI assistant..."
              />
              <p className="text-xs text-muted-foreground">
                The system prompt that defines the AI's personality and behavior
              </p>
            </div>
          </TabsContent>

          <TabsContent value="safety" className="space-y-4">
            <div className="mb-4 space-y-2">
              <h3 className="font-medium">Safety Settings (Gemini Only)</h3>
              <p className="text-xs text-muted-foreground">
                Content is blocked based on the probability that it is harmful. These settings only apply to Gemini models and have no effect on OpenAI models.
              </p>
            </div>

            {/* Harassment */}
            <div className="space-y-2">
              <Label htmlFor="harassment">Harassment</Label>
              <div className="flex items-center justify-between">
                <span className="text-xs">Block none</span>
                <Slider
                  id="harassment"
                  className="w-[70%]"
                  value={[
                    localSettings.safetySettings?.harassment === 'none' ? 0 :
                    localSettings.safetySettings?.harassment === 'few' ? 33 :
                    localSettings.safetySettings?.harassment === 'some' ? 66 : 100
                  ]}
                  onValueChange={(values: number[]) => {
                    const value = values[0];
                    let setting: SafetyLevel = 'none';
                    if (value < 25) setting = 'none';
                    else if (value < 50) setting = 'few';
                    else if (value < 75) setting = 'some';
                    else setting = 'most';
                    handleSafetySettingChange('harassment', setting);
                  }}
                  step={33}
                  min={0}
                  max={100}
                />
                <span className="text-xs">most</span>
              </div>
            </div>

            {/* Hate Speech */}
            <div className="space-y-2">
              <Label htmlFor="hateSpeech">Hate speech</Label>
              <div className="flex items-center justify-between">
                <span className="text-xs">Block none</span>
                <Slider
                  id="hateSpeech"
                  className="w-[70%]"
                  value={[
                    localSettings.safetySettings?.hateSpeech === 'none' ? 0 :
                    localSettings.safetySettings?.hateSpeech === 'few' ? 33 :
                    localSettings.safetySettings?.hateSpeech === 'some' ? 66 : 100
                  ]}
                  onValueChange={(values: number[]) => {
                    const value = values[0];
                    let setting: SafetyLevel = 'none';
                    if (value < 25) setting = 'none';
                    else if (value < 50) setting = 'few';
                    else if (value < 75) setting = 'some';
                    else setting = 'most';
                    handleSafetySettingChange('hateSpeech', setting);
                  }}
                  step={33}
                  min={0}
                  max={100}
                />
                <span className="text-xs">most</span>
              </div>
            </div>

            {/* Sexually Explicit */}
            <div className="space-y-2">
              <Label htmlFor="sexuallyExplicit">Sexually explicit</Label>
              <div className="flex items-center justify-between">
                <span className="text-xs">Block none</span>
                <Slider
                  id="sexuallyExplicit"
                  className="w-[70%]"
                  value={[
                    localSettings.safetySettings?.sexuallyExplicit === 'none' ? 0 :
                    localSettings.safetySettings?.sexuallyExplicit === 'few' ? 33 :
                    localSettings.safetySettings?.sexuallyExplicit === 'some' ? 66 : 100
                  ]}
                  onValueChange={(values: number[]) => {
                    const value = values[0];
                    let setting: SafetyLevel = 'none';
                    if (value < 25) setting = 'none';
                    else if (value < 50) setting = 'few';
                    else if (value < 75) setting = 'some';
                    else setting = 'most';
                    handleSafetySettingChange('sexuallyExplicit', setting);
                  }}
                  step={33}
                  min={0}
                  max={100}
                />
                <span className="text-xs">most</span>
              </div>
            </div>

            {/* Dangerous */}
            <div className="space-y-2">
              <Label htmlFor="dangerous">Dangerous</Label>
              <div className="flex items-center justify-between">
                <span className="text-xs">Block none</span>
                <Slider
                  id="dangerous"
                  className="w-[70%]"
                  value={[
                    localSettings.safetySettings?.dangerous === 'none' ? 0 :
                    localSettings.safetySettings?.dangerous === 'few' ? 33 :
                    localSettings.safetySettings?.dangerous === 'some' ? 66 : 100
                  ]}
                  onValueChange={(values: number[]) => {
                    const value = values[0];
                    let setting: SafetyLevel = 'none';
                    if (value < 25) setting = 'none';
                    else if (value < 50) setting = 'few';
                    else if (value < 75) setting = 'some';
                    else setting = 'most';
                    handleSafetySettingChange('dangerous', setting);
                  }}
                  step={33}
                  min={0}
                  max={100}
                />
                <span className="text-xs">most</span>
              </div>
            </div>

            {/* Civic Integrity */}
            <div className="space-y-2">
              <Label htmlFor="civicIntegrity">Civic integrity</Label>
              <div className="flex items-center justify-between">
                <span className="text-xs">Block none</span>
                <Slider
                  id="civicIntegrity"
                  className="w-[70%]"
                  value={[
                    localSettings.safetySettings?.civicIntegrity === 'none' ? 0 :
                    localSettings.safetySettings?.civicIntegrity === 'few' ? 33 :
                    localSettings.safetySettings?.civicIntegrity === 'some' ? 66 : 100
                  ]}
                  onValueChange={(values: number[]) => {
                    const value = values[0];
                    let setting: SafetyLevel = 'none';
                    if (value < 25) setting = 'none';
                    else if (value < 50) setting = 'few';
                    else if (value < 75) setting = 'some';
                    else setting = 'most';
                    handleSafetySettingChange('civicIntegrity', setting);
                  }}
                  step={33}
                  min={0}
                  max={100}
                />
                <span className="text-xs">most</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            className="border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}