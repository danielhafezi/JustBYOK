'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { storage } from '@/lib/storage';
import { UserProfile } from '@/lib/types';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAPIKeys: () => void;
  onOpenModelSettings?: () => void;
}

export function SettingsDialog({ 
  open, 
  onOpenChange,
  onOpenAPIKeys,
  onOpenModelSettings
}: SettingsDialogProps) {
  // State for user profile
  const [userName, setUserName] = useState<string>('');
  const [userInformation, setUserInformation] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [userProfileId, setUserProfileId] = useState<string>('default');

  // Load user profile from storage on initial render or when dialog opens
  useEffect(() => {
    if (open) {
      const userProfiles = storage.get<UserProfile[]>('userProfiles', []);
      const currentProfileId = storage.get<string>('currentProfileId', '');
      
      // If we have profiles and a current profile ID
      if (userProfiles.length > 0 && currentProfileId) {
        const currentProfile = userProfiles.find(profile => profile.id === currentProfileId);
        if (currentProfile) {
          setUserName(currentProfile.name);
          setUserInformation(currentProfile.preferences?.information || '');
          setCustomInstructions(currentProfile.preferences?.customInstruction || '');
          setUserProfileId(currentProfile.id);
          return;
        }
      }
      
      // Fallback to legacy localStorage data if no profiles exist yet
      if (typeof window !== 'undefined') {
        const storedUserName = localStorage.getItem('user-name') || '';
        const storedUserInformation = localStorage.getItem('user-information') || '';
        const storedCustomInstructions = localStorage.getItem('custom-instructions') || '';
        
        setUserName(storedUserName);
        setUserInformation(storedUserInformation);
        setCustomInstructions(storedCustomInstructions);
      }
    }
  }, [open]);

  // Save user profile to storage
  const saveUserProfile = () => {
    // Generate a unique ID if this is a new profile
    if (userProfileId === 'default') {
      setUserProfileId(generateId());
    }
    
    // Create or update profile object
    const updatedProfile: UserProfile = {
      id: userProfileId,
      name: userName,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        information: userInformation,
        customInstruction: customInstructions
      }
    };
    
    // Get existing profiles
    const userProfiles = storage.get<UserProfile[]>('userProfiles', []);
    
    // Check if the profile already exists
    const existingProfileIndex = userProfiles.findIndex(p => p.id === userProfileId);
    
    if (existingProfileIndex >= 0) {
      // Update existing profile
      userProfiles[existingProfileIndex] = updatedProfile;
    } else {
      // Add new profile
      userProfiles.push(updatedProfile);
    }
    
    // Save profiles and set current profile ID
    storage.set('userProfiles', userProfiles);
    storage.set('currentProfileId', userProfileId);
    
    // Maintain backward compatibility with direct localStorage for now
    localStorage.setItem('user-name', userName);
    localStorage.setItem('user-information', userInformation);
    localStorage.setItem('custom-instructions', customInstructions);
    
    toast.success('Profile settings saved');
    onOpenChange(false);
  };

  // Helper function to generate a unique ID
  const generateId = (): string => {
    return Math.random().toString(36).substring(2, 10);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              size="icon" 
              className="h-8 w-8" 
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
          </div>
          <p className="text-muted-foreground mt-2 text-center">
            The AI assistant will remember your information on all future chats.
          </p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* User Name */}
          <div className="space-y-2">
            <Label htmlFor="user-name" className="text-base">Your Name</Label>
            <Input 
              id="user-name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full"
            />
          </div>
          
          {/* User Information */}
          <div className="space-y-2">
            <Label htmlFor="user-information" className="text-base">Your Information</Label>
            <p className="text-muted-foreground text-sm">
              Enter any information you want the AI assistant to remember about you here:
            </p>
            <Textarea 
              id="user-information"
              value={userInformation}
              onChange={(e) => setUserInformation(e.target.value)}
              placeholder="I'm a software developer with interests in AI and machine learning..."
              className="min-h-[100px]"
            />
          </div>
          
          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="custom-instructions" className="text-base">Custom Instruction</Label>
            <p className="text-muted-foreground text-sm">
              Let the AI know how to respond when this profile is used.
            </p>
            <Textarea 
              id="custom-instructions"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="1. Be clear and concise in your responses.
2. Avoid technical jargon unless specifically asked.
3. Provide code examples when appropriate."
              className="min-h-[150px]"
            />
          </div>
          
          {/* Model Settings Link */}
          {/* This section is not needed and has been removed */}
        </div>
        
        <DialogFooter>
          <Button onClick={saveUserProfile} className="w-24">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}