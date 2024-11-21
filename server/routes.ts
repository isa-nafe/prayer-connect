import { Express } from "express";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./websocket";
import { db } from "../db";
import { prayers, prayerAttendees } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  setupAuth(app);
  const ws = setupWebSocket(app);

  // Get all prayers
  app.get("/api/prayers", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const result = await db
        .select()
        .from(prayers)
        .leftJoin(prayerAttendees, eq(prayers.id, prayerAttendees.prayerId))
        .groupBy(prayers.id)
        .then((rows) => rows.map(row => ({
          ...row,
          attendeeCount: row.prayerId ? 1 : 0
        })));

      // Group prayers by ID and count attendees
      const prayersMap = new Map();
      result.forEach(row => {
        const prayer = prayersMap.get(row.id) || { ...row, attendeeCount: 0 };
        if (row.attendees) {
          prayer.attendeeCount++;
        }
        prayersMap.set(row.id, prayer);
      });

      res.json(Array.from(prayersMap.values()));
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
}
