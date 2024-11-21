import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  verified: integer("verified").default(0),
});

export const prayers = pgTable("prayers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  creatorId: integer("creator_id").references(() => users.id).notNull(),
  musallahLocation: text("musallah_location").notNull(),
  prayerTime: timestamp("prayer_time").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prayerAttendees = pgTable("prayer_attendees", {
  prayerId: integer("prayer_id").references(() => prayers.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

export const insertPrayerSchema = createInsertSchema(prayers);
export const selectPrayerSchema = createSelectSchema(prayers);
export type InsertPrayer = z.infer<typeof insertPrayerSchema>;
export type Prayer = z.infer<typeof selectPrayerSchema>;
