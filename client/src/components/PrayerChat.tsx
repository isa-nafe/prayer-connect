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
  const ws = useRef<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket with protocol matching the page
    ws.current = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`);

    ws.current.onopen = () => {
      if (user) {
        ws.current?.send(JSON.stringify({
          type: "AUTHENTICATE",
          userId: user.id
        }));
      }
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_CHAT_MESSAGE" && data.message.prayerId === prayerId) {
        setMessages(prev => [...prev, data.message]);
        // Scroll to bottom
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }
    };

    // Fetch existing messages
    fetch(`/api/prayers/${prayerId}/messages`)
      .then(res => res.json())
      .then(setMessages);

    return () => {
      ws.current?.close();
    };
  }, [prayerId, user]);

  const sendMessage = () => {
    if (!newMessage.trim() || !ws.current) return;

    ws.current.send(JSON.stringify({
      type: "CHAT_MESSAGE",
      prayerId,
      content: newMessage.trim()
    }));

    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[500px]">
      <DialogHeader className="p-4 border-b">
        <div className="flex justify-between items-center">
          <DialogTitle className="font-semibold">Prayer Meetup Chat</DialogTitle>
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
