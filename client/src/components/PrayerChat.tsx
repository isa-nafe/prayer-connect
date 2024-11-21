import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "../hooks/use-user";
import { format } from "date-fns";
import { Send } from "lucide-react";
import type { Message } from "@db/schema";

interface PrayerChatProps {
  prayerId: number;
  onClose: () => void;
}

interface ChatMessage extends Message {
  user: {
    id: number;
    name: string;
  };
}

export function PrayerChat({ prayerId, onClose }: PrayerChatProps) {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messageQueue = useRef<any[]>([]);

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);
      
      // Add ping/pong handlers
      let pingTimeout: NodeJS.Timeout;
      
      const heartbeat = () => {
        clearTimeout(pingTimeout);
        pingTimeout = setTimeout(() => {
          ws.current?.close();
        }, 45000);
      };

      ws.current.onopen = () => {
        setIsConnected(true);
        heartbeat();
        if (user) {
          ws.current?.send(JSON.stringify({
            type: "AUTHENTICATE",
            userId: user.id
          }));
        }
        while (messageQueue.current.length > 0) {
          const msg = messageQueue.current.shift();
          ws.current?.send(JSON.stringify(msg));
        }
      };

      // Set up ping interval
      const pingInterval = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: "PING" }));
        }
      }, 30000);

      ws.current.onclose = () => {
        clearInterval(pingInterval);
        setIsConnected(false);
        // Attempt to reconnect after 2 seconds
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "NEW_CHAT_MESSAGE":
              if (data.message.prayerId === prayerId) {
                setMessages(prev => [...prev, data.message]);
                // Scroll to bottom
                if (scrollAreaRef.current) {
                  scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
                }
              }
              break;
            case "PONG":
              heartbeat();
              break;
            case "ERROR":
              console.error("WebSocket error:", data.error);
              break;
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };
    };

    // Fetch existing messages
    fetch(`/api/prayers/${prayerId}/messages`)
      .then(res => res.json())
      .then(setMessages)
      .catch(error => console.error("Error fetching messages:", error));

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws.current?.close();
    };
  }, [prayerId, user]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      type: "CHAT_MESSAGE",
      prayerId,
      content: newMessage.trim()
    };

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      messageQueue.current.push(message);
    }

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[500px]">
      <DialogHeader className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <DialogTitle className="font-semibold">Prayer Meetup Chat</DialogTitle>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-500">
                {isConnected ? 'Connected' : 'Reconnecting...'}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.userId === user?.id ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.userId === user?.id
                    ? "bg-green-100 text-green-900"
                    : "bg-gray-100"
                }`}
              >
                <p className="text-sm font-medium mb-1">{message.user.name}</p>
                <p>{message.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(message.createdAt!), "h:mm a")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
