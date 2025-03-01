/**
 * UI Component to test storage functionality
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { storage } from '@/lib/storage';
import { apiKeyStorage } from '@/lib/api-keys';
import { testStorageFunctions } from '@/lib/utils/storage-test';

export function StorageTestUI() {
  // State for test results
  const [testResults, setTestResults] = useState<any>(null);
  
  // State for storage key/value test
  const [testKey, setTestKey] = useState('testKey');
  const [testValue, setTestValue] = useState('');
  const [retrievedValue, setRetrievedValue] = useState<any>(null);
  
  // State for API key test
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [retrievedApiKey, setRetrievedApiKey] = useState('');
  
  // Run storage tests
  const runTests = () => {
    const results = testStorageFunctions();
    setTestResults(results);
  };
  
  // Set a test value
  const saveTestValue = () => {
    if (!testKey) return;
    storage.set(testKey, testValue);
    setTestValue('');
  };
  
  // Get a test value
  const getTestValue = () => {
    if (!testKey) return;
    const value = storage.get(testKey);
    setRetrievedValue(value);
  };
  
  // Clear a test value
  const clearTestValue = () => {
    if (!testKey) return;
    storage.remove(testKey);
    setRetrievedValue(null);
  };
  
  // Set API key
  const saveApiKey = () => {
    if (!apiKey) return;
    
    switch (provider) {
      case 'openai':
        apiKeyStorage.setOpenAIKey(apiKey);
        break;
      case 'anthropic':
        apiKeyStorage.setAnthropicKey(apiKey);
        break;
      case 'gemini':
        apiKeyStorage.setGeminiKey(apiKey);
        break;
    }
    
    setApiKey('');
  };
  
  // Get API key
  const getApiKey = () => {
    let key = '';
    
    switch (provider) {
      case 'openai':
        key = apiKeyStorage.getOpenAIKey();
        break;
      case 'anthropic':
        key = apiKeyStorage.getAnthropicKey();
        break;
      case 'gemini':
        key = apiKeyStorage.getGeminiKey();
        break;
    }
    
    setRetrievedApiKey(key);
  };
  
  // Clear all storage
  const clearAllStorage = () => {
    storage.clearAll();
    setTestResults(null);
    setRetrievedValue(null);
    setRetrievedApiKey('');
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Storage Test UI</CardTitle>
        <CardDescription>
          Test client-side storage functionality for the chatbot app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic">
          <TabsList>
            <TabsTrigger value="basic">Basic Storage</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="autotest">Auto Tests</TabsTrigger>
          </TabsList>
          
          {/* Basic Storage Test */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4">
                <Label htmlFor="key">Storage Key</Label>
                <Input
                  id="key"
                  value={testKey}
                  onChange={(e) => setTestKey(e.target.value)}
                  placeholder="Enter key name"
                />
              </div>
              
              <div className="col-span-3">
                <Label htmlFor="value">Value to Store</Label>
                <Input
                  id="value"
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  placeholder="Enter value to store"
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={saveTestValue} className="w-full">Save</Button>
              </div>
              
              <div className="col-span-2">
                <Button onClick={getTestValue} variant="outline" className="w-full">
                  Get Value
                </Button>
              </div>
              
              <div className="col-span-2">
                <Button onClick={clearTestValue} variant="outline" className="w-full">
                  Clear Value
                </Button>
              </div>
            </div>
            
            {retrievedValue !== null && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <Label>Retrieved Value:</Label>
                <pre className="mt-2 p-2 bg-background rounded text-sm overflow-auto">
                  {JSON.stringify(retrievedValue, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>
          
          {/* API Key Test */}
          <TabsContent value="api" className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4">
                <Label htmlFor="provider">API Provider</Label>
                <select
                  id="provider"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as any)}
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>
              
              <div className="col-span-3">
                <Label htmlFor="apikey">API Key</Label>
                <Input
                  id="apikey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key"
                  type="password"
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={saveApiKey} className="w-full">Save</Button>
              </div>
              
              <div className="col-span-4">
                <Button onClick={getApiKey} variant="outline" className="w-full">
                  Get {provider} API Key
                </Button>
              </div>
            </div>
            
            {retrievedApiKey && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <Label>Retrieved API Key:</Label>
                <div className="mt-2 p-2 bg-background rounded text-sm">
                  <div>Raw: {retrievedApiKey}</div>
                  <div>Masked: {apiKeyStorage.maskApiKey(retrievedApiKey)}</div>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Auto Tests */}
          <TabsContent value="autotest" className="space-y-4">
            <div className="flex justify-between">
              <Button onClick={runTests}>Run All Tests</Button>
              <Button onClick={clearAllStorage} variant="destructive">Clear All Storage</Button>
            </div>
            
            {testResults && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <Label>Test Results:</Label>
                <pre className="mt-2 p-2 bg-background rounded text-sm overflow-auto">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          API keys, settings and profile data are stored in localStorage. Chat data is stored in IndexedDB.
        </p>
      </CardFooter>
    </Card>
  );
}

export default StorageTestUI;