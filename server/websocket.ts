import { WebSocketServer, WebSocket } from "ws";
import { Server } from 'http';
import { db } from "../db";
import { messages, users } from "@db/schema";
import { eq } from "drizzle-orm";

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  isAlive?: boolean;
  subscribedPrayers: Set<number>;
  connectionId: string;
}

type ValidatedMessage = {
  type: string;
  prayerId?: number;
  content?: string;
  userId?: number;
};

function validateMessage(data: any): ValidatedMessage | null {
  if (!data || typeof data !== 'object') return null;
  if (!data.type || typeof data.type !== 'string') return null;
  
  if (data.type === 'CHAT_MESSAGE') {
    if (!data.prayerId || typeof data.prayerId !== 'number') return null;
    if (!data.content || typeof data.content !== 'string') return null;
    if (data.content.length > 1000) return null; // Limit message length
  }
  
  return data as ValidatedMessage;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'  // Explicit WebSocket path
  });

  // Add ping/pong interval to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const extWs = ws as ExtendedWebSocket;
      if (extWs.isAlive === false) {
        return ws.terminate();
      }
      extWs.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  const activePrayerRooms = new Map<number, Set<ExtendedWebSocket>>();
  const messageIds = new Set<string>();

  wss.on("connection", (ws) => {
    ws.on("error", console.error);

    const extWs = ws as ExtendedWebSocket;
    extWs.isAlive = true;
    extWs.subscribedPrayers = new Set();
    extWs.connectionId = crypto.randomBytes(16).toString('hex');

    ws.on("pong", () => {
      extWs.isAlive = true;
    });

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case "AUTHENTICATE":
            extWs.userId = message.userId;
            break;

          case "SUBSCRIBE_PRAYER":
            if (typeof message.prayerId === 'number') {
              extWs.subscribedPrayers.add(message.prayerId);
              if (!activePrayerRooms.has(message.prayerId)) {
                activePrayerRooms.set(message.prayerId, new Set());
              }
              activePrayerRooms.get(message.prayerId)?.add(extWs);
            }
            break;

          case "UNSUBSCRIBE_PRAYER":
            if (typeof message.prayerId === 'number') {
              extWs.subscribedPrayers.delete(message.prayerId);
              activePrayerRooms.get(message.prayerId)?.delete(extWs);
            }
            break;

          case "CHAT_MESSAGE":
            const validated = validateMessage(message);
            if (!validated || !extWs.userId) {
              ws.send(JSON.stringify({ type: "ERROR", error: "Invalid message or not authenticated" }));
              return;
            }

            // Sanitize message content
            const sanitizedContent = validated.content!
              .trim()
              .replace(/[<>]/g, '') // Basic XSS prevention
              .slice(0, 1000); // Limit message length

            const [newMessage] = await db
              .insert(messages)
              .values({
                prayerId: validated.prayerId!,
                userId: extWs.userId,
                content: sanitizedContent
              })
              .returning();

            const messageId = `${newMessage.id}-${newMessage.createdAt?.getTime()}`;
            if (messageIds.has(messageId)) {
              return; // Skip duplicate messages
            }
            messageIds.add(messageId);

            const [user] = await db
              .select({
                id: users.id,
                name: users.name
              })
              .from(users)
              .where(eq(users.id, extWs.userId));

            // Only broadcast to clients subscribed to this prayer
            const prayerRoom = activePrayerRooms.get(validated.prayerId!);
            if (prayerRoom) {
              const messageData = JSON.stringify({
                type: "NEW_CHAT_MESSAGE",
                message: {
                  ...newMessage,
                  user: {
                    id: user.id,
                    name: user.name
                  }
                }
              });

              prayerRoom.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(messageData);
                }
              });
            }
            break;

          case "PING":
            ws.send(JSON.stringify({ type: "PONG" }));
            break;

          default:
            console.warn("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
  });

  return wss;
}
