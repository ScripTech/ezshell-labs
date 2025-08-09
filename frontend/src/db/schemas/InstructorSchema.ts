import {
  timestamp,
  pgTable,
  text,
  boolean,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const instructors = pgTable("instructors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  bio: text("bio"),
  avatar: text("avatar"),
  email: text("email"),
  experience: text("experience"),
  specializations: jsonb("specializations").$type<string[]>(),
  socialLinks: jsonb("social_links").$type<{
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
  }>(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailUnique: unique("instructors_email_unique").on(table.email),
}));

export const instructorRelations = relations(instructors, ({ many }) => ({
  labs: many(labs),
}));

// Import labs table to establish the relation
import { labs } from "./LabSchema";
