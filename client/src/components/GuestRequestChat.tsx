import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { getApiUrl } from '@/lib/apiUrl';

interface Message {
  id: string;
  sender_type: 'guest' | 'staff';
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface GuestRequestChatProps {
  requestId: string;
  isStaff: boolean;
  sessionToken?: string;
  roomNumber?: string;
  onMessageSent?: () => void;
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('sr-RS', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
  });
};

export default function GuestRequestChat({
  requestId,
  isStaff,
  sessionToken,
  roomNumber,
  onMessageSent,
}: GuestRequestChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      let url: string;

      if (isStaff) {
        url = getApiUrl(`/api/guest-requests/${requestId}/messages`);
      } else {
        url = getApiUrl(`/api/public/room/${roomNumber}/${sessionToken}/request/${requestId}/messages`);
      }

      const response = await fetch(url, {
        headers: isStaff ? getAuthHeaders() : {},
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      let url: string;
      const body: any = { message: newMessage.trim() };

      if (isStaff) {
        url = getApiUrl(`/api/guest-requests/${requestId}/messages`);
      } else {
        url = getApiUrl(`/api/public/room/${roomNumber}/${sessionToken}/request/${requestId}/messages`);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isStaff ? getAuthHeaders() : {}),
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setNewMessage('');
        await fetchMessages();
        onMessageSent?.();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Fetch messages on mount and poll every 5 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [requestId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[350px]">
      {/* Messages area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">Nema poruka</p>
            <p className="text-xs">Započnite razgovor</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => {
              const isOwnMessage = isStaff ? msg.sender_type === 'staff' : msg.sender_type === 'guest';
              const showDate = index === 0 ||
                formatDate(msg.created_at) !== formatDate(messages[index - 1].created_at);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="text-center text-xs text-muted-foreground my-2">
                      {formatDate(msg.created_at)}
                    </div>
                  )}
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      {!isOwnMessage && (
                        <p className={`text-xs font-medium mb-1 ${
                          isOwnMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}>
                          {msg.sender_name}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${
                        isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Napišite poruku..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
