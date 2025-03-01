import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/lib/types';
import { storage } from '@/lib/storage';

const USER_PROFILES_KEY = 'userProfiles';
const CURRENT_PROFILE_ID_KEY = 'currentProfileId';

/**
 * Hook for managing user profiles
 * Profiles are persisted to localStorage using the storage utility
 */
export function useProfileStore() {
  // Initialize profiles from storage
  const [profiles, setProfiles] = useState<UserProfile[]>(() => 
    storage.get<UserProfile[]>(USER_PROFILES_KEY, [])
  );

  // Initialize current profile ID from storage
  const [currentProfileId, setCurrentProfileId] = useState<string>(() => 
    storage.get<string>(CURRENT_PROFILE_ID_KEY, '')
  );

  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on initial render
  useEffect(() => {
    // Handle potential migration from old localStorage structure
    migrateFromLegacyStorage();
    setIsLoaded(true);
  }, []);

  // Save profiles whenever they change
  useEffect(() => {
    if (isLoaded) {
      storage.set(USER_PROFILES_KEY, profiles);
    }
  }, [profiles, isLoaded]);

  // Save current profile ID whenever it changes
  useEffect(() => {
    if (isLoaded) {
      storage.set(CURRENT_PROFILE_ID_KEY, currentProfileId);
    }
  }, [currentProfileId, isLoaded]);

  /**
   * Create new profile
   */
  const createProfile = useCallback((profileData: Partial<UserProfile>) => {
    const newProfile: UserProfile = {
      id: generateId(),
      name: profileData.name || 'Default Profile',
      information: profileData.information || '',
      customInstruction: profileData.customInstruction || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setProfiles(prev => [...prev, newProfile]);
    
    // If first profile, set as current
    if (profiles.length === 0 || !currentProfileId) {
      setCurrentProfileId(newProfile.id);
    }
    
    return newProfile;
  }, [profiles, currentProfileId]);

  /**
   * Update an existing profile
   */
  const updateProfile = useCallback((
    profileId: string, 
    updates: Partial<UserProfile>
  ) => {
    setProfiles(prev => 
      prev.map(profile => 
        profile.id === profileId
          ? { ...profile, ...updates, updatedAt: new Date() }
          : profile
      )
    );
  }, []);

  /**
   * Delete a profile
   */
  const deleteProfile = useCallback((profileId: string) => {
    setProfiles(prev => prev.filter(profile => profile.id !== profileId));
    
    // If current profile is deleted, select another one
    if (currentProfileId === profileId) {
      const remainingProfiles = profiles.filter(p => p.id !== profileId);
      if (remainingProfiles.length > 0) {
        setCurrentProfileId(remainingProfiles[0].id);
      } else {
        setCurrentProfileId('');
      }
    }
  }, [profiles, currentProfileId]);

  /**
   * Get the current profile object
   */
  const currentProfile = profiles.find(p => p.id === currentProfileId);

  return {
    profiles,
    currentProfile,
    currentProfileId,
    setCurrentProfileId,
    createProfile,
    updateProfile,
    deleteProfile,
    isLoaded
  };
}

/**
 * Migrate data from the old localStorage format to our new storage utility
 */
function migrateFromLegacyStorage() {
  if (typeof window === 'undefined') return;
  
  // Check if we already have data in the new format
  const existingProfiles = storage.get<UserProfile[]>(USER_PROFILES_KEY, []);
  if (existingProfiles.length > 0) return;
  
  try {
    // Check for legacy data
    const name = localStorage.getItem('user-name');
    const information = localStorage.getItem('user-information');
    const customInstruction = localStorage.getItem('custom-instructions');
    
    // If there's legacy data, create a profile from it
    if (name || information || customInstruction) {
      const legacyProfile: UserProfile = {
        id: generateId(),
        name: name || 'Default Profile',
        information: information || '',
        customInstruction: customInstruction || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      storage.set(USER_PROFILES_KEY, [legacyProfile]);
      storage.set(CURRENT_PROFILE_ID_KEY, legacyProfile.id);
    }
  } catch (error) {
    console.error('Error migrating from legacy storage:', error);
  }
}

/**
 * Generate a unique ID for profiles
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
} 