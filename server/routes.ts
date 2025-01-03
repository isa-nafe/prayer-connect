import type { Express } from "express";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./websocket";
import { db } from "../db";
import { prayers, users, prayerAttendees, messages } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { WebSocket, WebSocketServer } from 'ws';

export function registerRoutes(app: Express) {
  setupAuth(app);
  
  const wss = app.get('wss') as WebSocketServer;

  // Authentication middleware
  const requireAuth = (req: Express.Request, res: Express.Response, next: Function) => {
    if (!req.isAuthenticated()) {
      console.log(`[auth] Unauthorized access attempt to ${req.path}`);
      return res.status(401).send("Not authenticated");
    }
    if (!req.user) {
      console.log(`[auth] No user found in session for ${req.path}`);
      return res.status(401).send("User session invalid");
    }
    console.log(`[auth] Authenticated user ${req.user.id} accessing ${req.path}`);
    next();
  };
  
  // Get all prayers
  app.get("/api/prayers", requireAuth, async (req, res) => {

    try {
      const allPrayers = await db
        .select()
        .from(prayers)
        .orderBy(prayers.prayerTime);

      // Get attendee counts for each prayer
      const prayersWithCounts = await Promise.all(
        allPrayers.map(async (prayer) => {
          const attendees = await db
            .select()
            .from(prayerAttendees)
            .where(eq(prayerAttendees.prayerId, prayer.id));

          return {
            ...prayer,
            attendeeCount: attendees.length
          };
        })
      );

      res.json(prayersWithCounts);
    } catch (error) {
      res.status(500).send("Failed to fetch prayers");
    }
  });

  // Create a new prayer
  app.post("/api/prayers", requireAuth, async (req, res) => {
    const { musallahLocation, prayerTime } = req.body;
    
    if (!musallahLocation || !prayerTime) {
      return res.status(400).send("Missing required fields");
    }

    try {
      const [prayer] = await db
        .insert(prayers)
        .values({
          creatorId: req.user!.id,
          musallahLocation,
          prayerTime: new Date(prayerTime)
        })
        .returning();

      // Add creator as first attendee
      await db.insert(prayerAttendees).values({
        prayerId: prayer.id,
        userId: req.user!.id
      });

      // Notify all connected clients
      const clients = wss.clients as Set<WebSocket>;
      clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "PRAYER_CREATED",
            prayer: {
              ...prayer,
              attendeeCount: 1
            }
          }));
        }
      });

      res.json(prayer);
    } catch (error) {
      res.status(500).send("Failed to create prayer");
    }
  });

  // Join a prayer
  app.post("/api/prayers/:id/join", requireAuth, async (req, res) => {
    const prayerId = parseInt(req.params.id);
    if (isNaN(prayerId)) {
      return res.status(400).send("Invalid prayer ID");
    }

    try {
      // Check if already joined
      const [existingAttendee] = await db
        .select()
        .from(prayerAttendees)
        .where(
          and(
            eq(prayerAttendees.prayerId, prayerId),
            eq(prayerAttendees.userId, req.user!.id)
          )
        )
        .limit(1);

      if (!existingAttendee) {
        await db.insert(prayerAttendees).values({
          prayerId,
          userId: req.user!.id
        });
      }

      // Notify all connected clients
      const clients = wss.clients as Set<WebSocket>;
      clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "PRAYER_JOINED",
            prayerId,
            userId: req.user!.id
          }));
        }
      });

      res.json({ message: "Joined successfully" });
    } catch (error) {
      res.status(500).send("Failed to join prayer");
    }
  });

  // Get messages for a prayer
  app.get("/api/prayers/:id/messages", requireAuth, async (req, res) => {
    const prayerId = parseInt(req.params.id);
    if (isNaN(prayerId)) {
      return res.status(400).send("Invalid prayer ID");
    }

    try {
      const result = await db
        .select({
          id: messages.id,
          prayerId: messages.prayerId,
          userId: messages.userId,
          content: messages.content,
          createdAt: messages.createdAt,
          user: {
            id: users.id,
            name: users.name,
          },
        })
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
        .where(eq(messages.prayerId, prayerId))
        .orderBy(messages.createdAt);

      res.json(result);
    } catch (error) {
      res.status(500).send("Failed to fetch messages");
    }
  });
}
