/**
 * Test utility for storage functions
 * This file demonstrates how to use the storage utilities
 * It can be imported and used for testing or debugging purposes
 */

import { storage } from '../storage';
import { apiKeyStorage } from '../api-keys';
import { Settings, Chat, UserProfile, DEFAULT_SETTINGS } from '../types';

// Define an interface for our test object to fix typing issues
interface TestObject {
  name: string;
  count: number;
  createdAt: Date;
  nestedObject: {
    key: string;
  };
}

/**
 * Test storage functions with sample data
 * @returns Results of the test operations
 */
export function testStorageFunctions() {
  // Test basic storage operations
  const testKey = 'testValue';
  storage.set(testKey, 'Hello World');
  const retrievedValue = storage.get<string>(testKey);
  console.log('Retrieved test value:', retrievedValue);
  
  // Test object storage with date
  const testObject: TestObject = {
    name: 'Test Object',
    count: 42,
    createdAt: new Date(),
    nestedObject: {
      key: 'value'
    }
  };
  storage.set('testObject', testObject);
  const retrievedObject = storage.get<TestObject>('testObject');
  console.log('Retrieved test object:', retrievedObject);
  console.log('Is createdAt a Date object?', retrievedObject?.createdAt instanceof Date);
  
  // Test settings storage
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    themeMode: 'dark'
  };
  storage.set('settings', settings);
  const retrievedSettings = storage.get<Settings>('settings', DEFAULT_SETTINGS);
  console.log('Retrieved settings:', retrievedSettings);
  
  // Test API key storage
  const fakeOpenAIKey = 'sk-abc123456789';
  apiKeyStorage.setOpenAIKey(fakeOpenAIKey);
  const retrievedKey = apiKeyStorage.getOpenAIKey();
  const maskedKey = apiKeyStorage.maskApiKey(retrievedKey);
  console.log('Retrieved API key (masked):', maskedKey);
  
  // Test clearing specific values
  storage.remove(testKey);
  const afterRemoval = storage.get<string>(testKey);
  console.log('Value after removal (should be undefined):', afterRemoval);
  
  // Get all app keys
  const allKeys = storage.getKeys();
  console.log('All application keys:', allKeys);
  
  return {
    basicValue: retrievedValue,
    objectWithDate: retrievedObject,
    settings: retrievedSettings,
    apiKeyMasked: maskedKey,
    allKeys
  };
}

/**
 * Example usage:
 * 
 * import { testStorageFunctions } from '@/lib/utils/storage-test';
 * 
 * // In a component or page:
 * const runTest = () => {
 *   const results = testStorageFunctions();
 *   console.log('Test results:', results);
 * };
 * 
 * <button onClick={runTest}>Test Storage</button>
 */ 