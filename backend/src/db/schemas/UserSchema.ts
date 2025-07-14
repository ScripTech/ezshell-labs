import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

// Use the existing enum from the database
export const userBuiltRoleEnum = pgEnum("user_role", [
  "manager",
  "admin",
  "user",
  "clientUser",
]);

// Since 'user' table already exists, let's use the existing structure
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  role: userBuiltRoleEnum("role").default("user").notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
