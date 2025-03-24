import {
  timestamp,
  pgTable,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./UserSchema";

export const labSessions = pgTable("lab_session", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").default(true),
  labId: text("lab_id").references(() => labs.id),
});

export const labs = pgTable("labs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("imageUrl").default(""),
  description: text("description"),
  duration: integer("duration").notNull().default(30), // duration in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
