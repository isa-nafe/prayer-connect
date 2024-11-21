import { WebSocketServer } from "ws";
import { Express } from "express";
import { createServer } from "http";

export function setupWebSocket(app: Express) {
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    ws.on("error", console.error);

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        // Handle different message types
        switch (message.type) {
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
