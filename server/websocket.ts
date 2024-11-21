import { WebSocketServer, WebSocket } from "ws";
import { Express } from "express";
import { createServer } from "http";
import { db } from "../db";
import { messages, users } from "@db/schema";
import { eq } from "drizzle-orm";

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

export function setupWebSocket(app: Express) {
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    ws.on("error", console.error);

    const extWs = ws as ExtendedWebSocket;
    extWs.isAlive = true;

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

          case "CHAT_MESSAGE":
            if (!extWs.userId) {
              ws.send(JSON.stringify({ type: "ERROR", error: "Not authenticated" }));
              return;
            }

            const [newMessage] = await db
              .insert(messages)
              .values({
                prayerId: message.prayerId,
                userId: extWs.userId,
                content: message.content
              })
              .returning();

            const [user] = await db
              .select({
                id: users.id,
                name: users.name
              })
              .from(users)
              .where(eq(users.id, extWs.userId));

            // Broadcast to all connected clients
            wss.clients.forEach((client: WebSocket) => {
              client.send(JSON.stringify({
                type: "NEW_CHAT_MESSAGE",
                message: {
                  ...newMessage,
                  user: {
                    id: user.id,
                    name: user.name
                  }
                }
              }));
            });
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
