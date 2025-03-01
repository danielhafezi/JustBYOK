'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

interface FolderSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string;
  folderName: string;
  onUpdateFolder?: (folderId: string, updates: any) => void;
  onDeleteFolder?: (folderId: string) => void;
}

export function FolderSettingsDialog({ 
  open, 
  onOpenChange,
  folderId,
  folderName,
  onUpdateFolder,
  onDeleteFolder
}: FolderSettingsDialogProps) {
  // State for folder settings
  const [name, setName] = useState<string>(folderName);
  const [instructions, setInstructions] = useState<string>("");

  // Handle save changes
  const saveChanges = () => {
    if (onUpdateFolder && name.trim()) {
      onUpdateFolder(folderId, { name: name.trim() });
      toast.success("Folder updated successfully");
      onOpenChange(false);
    } else if (!name.trim()) {
      toast.error("Folder name cannot be empty");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
            <DialogTitle className="text-xl font-bold">Folder Settings</DialogTitle>
          </div>
          <DialogDescription className="text-center">
            Customize folder properties and organization
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Folder Name */}
          <div className="space-y-2">
            <Label htmlFor="folder-name" className="text-base font-medium">Folder Name</Label>
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <Input 
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter folder name"
                className="flex-1"
              />
            </div>
          </div>
          
          {/* Project Instructions */}
          <div className="space-y-2">
            <Label htmlFor="folder-instructions" className="text-base font-medium">Project Instructions</Label>
            <p className="text-sm text-muted-foreground mt-1">
              This will be appended to the system instruction for all chats in this folder.
            </p>
            <Textarea 
              id="folder-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="E.g., Use ReactJS/TailwindCSS for all code output."
              className="min-h-[150px]"
            />
          </div>
        </div>
        
        <DialogFooter className="flex justify-end items-center">
          <Button onClick={saveChanges}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}