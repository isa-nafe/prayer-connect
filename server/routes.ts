import { Express } from "express";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./websocket";
import { db } from "../db";
import { prayers, prayerAttendees, messages, users } from "@db/schema";
import { eq, sql } from "drizzle-orm";

export function registerRoutes(app: Express) {
  setupAuth(app);
  

  // Get all prayers
  app.get("/api/prayers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const result = await db
        .select({
          id: prayers.id,
          creatorId: prayers.creatorId,
          musallahLocation: prayers.musallahLocation,
          prayerTime: prayers.prayerTime,
          createdAt: prayers.createdAt,
          attendeeCount: sql`count(${prayerAttendees.userId})`.as('attendeeCount')
        })
        .from(prayers)
        .leftJoin(prayerAttendees, eq(prayers.id, prayerAttendees.prayerId))
        .groupBy(prayers.id);

      res.json(result);
    } catch (error) {
      res.status(500).send("Failed to fetch prayers");
    }
  });

  // Create a prayer
  app.post("/api/prayers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const [prayer] = await db
        .insert(prayers)
        .values({
          creatorId: req.user!.id,
          musallahLocation: req.body.musallahLocation,
          prayerTime: new Date(req.body.prayerTime)
        })
        .returning();

      // Notify all connected clients
      ws.clients.forEach(client => {
        client.send(JSON.stringify({
          type: "PRAYER_CREATED",
          prayer
        }));
      });

      res.json(prayer);
    } catch (error) {
      res.status(500).send("Failed to create prayer");
    }
  });

  // Join a prayer
  app.post("/api/prayers/:id/join", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const prayerId = parseInt(req.params.id);

    try {
      await db
        .insert(prayerAttendees)
        .values({
          prayerId,
          userId: req.user!.id
        });

      // Notify all connected clients
      ws.clients.forEach(client => {
        client.send(JSON.stringify({
          type: "PRAYER_JOINED",
          prayerId,
          userId: req.user!.id
        }));
      });

      res.json({ message: "Joined successfully" });
    } catch (error) {
      res.status(500).send("Failed to join prayer");
    }
  });
  // Get messages for a prayer
  app.get("/api/prayers/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const prayerId = parseInt(req.params.id);

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
