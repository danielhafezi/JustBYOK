'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Message } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface PinnedMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
}

export function PinnedMessagesDialog({ 
  open, 
  onOpenChange,
  messages = []
}: PinnedMessagesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xl font-bold">Pinned Messages</DialogTitle>
        </DialogHeader>
        
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pinned messages</p>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={cn(
                    "flex items-start p-3 gap-3 rounded-md hover:bg-muted/50 transition-colors",
                    message.role === 'user' ? "bg-muted/30" : "bg-transparent"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {message.role === 'user' ? (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        U
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        AI
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm line-clamp-6">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="pt-2 flex justify-center border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}