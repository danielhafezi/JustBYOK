'use client';

import { useEffect, useState } from 'react';
import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Sparkles, Bot, Copy, Pencil, Pin } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import { toast } from "sonner";

interface ChatMessageProps {
  message: Message;
  model: string;
  onTogglePin?: (messageId: string) => void;
}

export function ChatMessage({ message, model, onTogglePin }: ChatMessageProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [isHovering, setIsHovering] = useState(false);
  const [messageTime, setMessageTime] = useState<string>('');

  // Ensure model is valid
  const validModel = ['smart', 'openai', 'anthropic', 'gemini'].includes(model) ? model : 'openai';

  useEffect(() => {
    const updateTimeAgo = () => {
      if (!message?.createdAt) {
        setTimeAgo('just now');
        return;
      }
      
      try {
        const now = new Date();
        const messageDate = new Date(message.createdAt);
        
        // Format the time in 24-hour format (00:00)
        const hours = messageDate.getHours().toString().padStart(2, '0');
        const minutes = messageDate.getMinutes().toString().padStart(2, '0');
        setMessageTime(`${hours}:${minutes}`);
        
        const diffInSeconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
        
        if (diffInSeconds < 60) {
          setTimeAgo('just now');
        } else if (diffInSeconds < 3600) {
          const minutes = Math.floor(diffInSeconds / 60);
          setTimeAgo(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`);
        } else if (diffInSeconds < 86400) {
          const hours = Math.floor(diffInSeconds / 3600);
          setTimeAgo(`${hours} ${hours === 1 ? 'hour' : 'hours'} ago`);
        } else {
          const days = Math.floor(diffInSeconds / 86400);
          setTimeAgo(`${days} ${days === 1 ? 'day' : 'days'} ago`);
        }
      } catch (error) {
        console.error('Error calculating time ago:', error);
        setTimeAgo('');
      }
    };
    
    updateTimeAgo();
    const intervalId = setInterval(updateTimeAgo, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, [message?.createdAt]);

  // Get model display name based on the selected model
  const getModelDisplayName = (modelType: string) => {
    switch (modelType) {
      case 'smart':
        return 'Smart AI Assistant';
      case 'openai':
        return 'OpenAI GPT-4o';
      case 'anthropic':
        return 'Anthropic Claude 3';
      case 'gemini':
        return 'Google Gemini Pro';
      default:
        return 'AI Assistant';
    }
  };

  // Function to copy message content to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content)
      .then(() => {
        toast.success("Message copied to clipboard");
      })
      .catch((err) => {
        console.error('Failed to copy message: ', err);
        toast.error("Failed to copy message");
      });
  };

  // Function to handle edit message
  const handleEdit = () => {
    if (message.role === 'user') {
      const event = new CustomEvent('editMessage', { 
        detail: { messageId: message.id, content: message.content } 
      });
      window.dispatchEvent(event);
    }
  };

  // Function to handle pin/unpin
  const handleTogglePin = () => {
    if (onTogglePin) {
      onTogglePin(message.id);
      toast.success(message.isPinned ? "Message unpinned" : "Message pinned");
    }
  };

  if (!message || !message.content) {
    return null;
  }

  // For user messages (displayed on the right with bubble)
  if (message.role === 'user') {
    return (
      <div 
        className={cn(
          "flex justify-end mb-4 px-4 relative group",
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Time display on hover */}
        {isHovering && messageTime && (
          <div className="absolute -top-6 right-2 text-xs text-muted-foreground px-2 py-0.5 bg-background/90 backdrop-blur-sm rounded-md">
            {messageTime}
          </div>
        )}
        
        {/* Message bubble with pin indicator */}
        <div className="relative flex">
          {/* Pin indicator */}
          {message.isPinned && (
            <div className="flex items-stretch mr-[-1px]">
              <div className="w-1.5 bg-yellow-500/70 rounded-l-2xl"></div>
            </div>
          )}
          
          <div className={cn(
            "bg-primary text-primary-foreground py-2 px-4 inline-block relative",
            message.isPinned 
              ? "rounded-tr-md rounded-br-2xl rounded-tl-sm rounded-bl-sm" 
              : "rounded-tl-2xl rounded-bl-2xl rounded-tr-md rounded-br-2xl"
          )}>
            <div className="prose dark:prose-invert prose-sm" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            
            {/* Action buttons */}
            <div 
              className={cn(
                "absolute -bottom-7 right-0 flex items-center gap-1",
                isHovering ? "opacity-100" : "opacity-0"
              )}
            >
              <button 
                onClick={handleTogglePin}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur-sm rounded-full p-1.5",
                  message.isPinned && "text-yellow-500 hover:text-yellow-600"
                )}
                aria-label={message.isPinned ? "Unpin message" : "Pin message"}
              >
                <Pin className={cn("h-3.5 w-3.5", message.isPinned && "fill-yellow-500")} />
              </button>
              <button 
                onClick={handleEdit}
                className="text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur-sm rounded-full p-1.5"
                aria-label="Edit message"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={copyToClipboard}
                className="text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur-sm rounded-full p-1.5"
                aria-label="Copy message"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // For assistant messages (displayed on the left without bubble)
  return (
    <div 
      className={cn(
        "flex mb-4 px-4 relative group",
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex-1 max-w-[95%] relative">
        {/* Time display on hover - moved inside the content container for better alignment */}
        {isHovering && messageTime && (
          <div className="absolute -top-6 -left-2 text-xs text-muted-foreground px-2 py-0.5 bg-background/90 backdrop-blur-sm rounded-md z-10">
            {messageTime}
          </div>
        )}
        
        {/* Pin indicator */}
        {message.isPinned && (
          <div className="absolute left-0 top-0 bottom-0 flex items-stretch">
            <div className="w-1.5 bg-yellow-500/70 rounded-l-2xl"></div>
          </div>
        )}
        
        <div className={cn(
          "prose dark:prose-invert prose-sm", 
          message.isPinned && "pl-3"
        )} style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        
        {/* Action buttons for assistant messages - now positioned closer to content */}
        <div 
          className={cn(
            "absolute -bottom-7 -left-2 flex items-center gap-1 z-10",
            isHovering ? "opacity-100" : "opacity-0"
          )}
        >
          <button 
            onClick={handleTogglePin}
            className={cn(
              "text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur-sm rounded-full p-1.5",
              message.isPinned && "text-yellow-500 hover:text-yellow-600"
            )}
            aria-label={message.isPinned ? "Unpin message" : "Pin message"}
          >
            <Pin className={cn("h-3.5 w-3.5", message.isPinned && "fill-yellow-500")} />
          </button>
          <button 
            onClick={copyToClipboard}
            className="text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur-sm rounded-full p-1.5"
            aria-label="Copy message"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
