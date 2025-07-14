// // frontend/src/db/schema.ts
// import {
//   pgTable,
//   uuid,
//   text,
//   timestamp,
//   integer,
//   pgEnum,
//   boolean,
//   serial,
// } from "drizzle-orm/pg-core";

// export const roleEnum = pgEnum("role", ["USER", "ADMIN", "SUPERADMIN"]);
// export const userStatusEnum = pgEnum("user_status", [
//   "ACTIVE",
//   "INACTIVE",
//   "SUSPENDED",
// ]);

// export const users = pgTable("users", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   email: text("email").notNull().unique(),
//   name: text("name"),
//   image: text("image"),
//   role: roleEnum("role").notNull().default("USER"),
//   status: userStatusEnum("status").notNull().default("ACTIVE"),
//   createdAt: timestamp("created_at", { withTimezone: true })
//     .notNull()
//     .defaultNow(),
//   updatedAt: timestamp("updated_at", { withTimezone: true })
//     .notNull()
//     .defaultNow(),
// });

// export const labs = pgTable("labs", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   name: text("name").notNull(),
//   description: text("description"),
//   duration: integer("duration"), // in minutes
//   technologies: text("technologies").array(),
//   createdById: uuid("created_by_id").references(() => users.id),
//   createdAt: timestamp("created_at", { withTimezone: true })
//     .notNull()
//     .defaultNow(),
//   updatedAt: timestamp("updated_at", { withTimezone: true })
//     .notNull()
//     .defaultNow(),
// });

// export const shellConfigs = pgTable("shell_configs", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   baseImage: text("base_image").notNull(),
//   script: text("script"),
//   labId: uuid("lab_id")
//     .notNull()
//     .unique()
//     .references(() => labs.id),
// });

// export const networkConfigs = pgTable("network_configs", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   ipAddress: text("ip_address"),
//   netmask: text("netmask"),
//   gateway: text("gateway"),
//   dns: text("dns"),
//   shellConfigId: uuid("shell_config_id")
//     .notNull()
//     .unique()
//     .references(() => shellConfigs.id),
// });

// export const subscriptions = pgTable("subscriptions", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   userId: uuid("user_id")
//     .notNull()
//     .references(() => users.id),
//   plan: text("plan").notNull(),
//   status: text("status").notNull(),
//   startedAt: timestamp("started_at", { withTimezone: true })
//     .notNull()
//     .defaultNow(),
//   endedAt: timestamp("ended_at", { withTimezone: true }),
// });

// export const systemConfig = pgTable("system_config", {
//   id: serial("id").primaryKey(),
//   appName: text("app_name").notNull(),
//   contactEmail: text("contact_email").notNull(),
// });
