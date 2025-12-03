import {
  timestamp,
  pgTable,
  text,
  boolean,
  jsonb,
  unique,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./UserSchema";

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  website: text("website"),
  logo: text("logo"),
  industry: text("industry"),
  size: text("size"), // startup, small, medium, large, enterprise
  country: text("country"),
  timezone: text("timezone"),
  owner_id: text("owner_id").references(() => users.id, { onDelete: "set null" }),
  // Subscription & billing
  plan: text("plan").default("free").notNull(), // free, basic, pro, enterprise
  maxUsers: integer("max_users").default(5).notNull(),
  billingEmail: text("billing_email"),

  // Settings
  settings: jsonb("settings").$type<{
    allowSelfRegistration?: boolean;
    defaultUserRole?: "user" | "manager";
    requireEmailVerification?: boolean;
    labRetentionDays?: number;
  }>().default({}),

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  slugUnique: unique("organizations_slug_unique").on(table.slug),
  nameUnique: unique("organizations_name_unique").on(table.name),
}));

// Organization memberships - many-to-many relationship between users and organizations
export const organizationMemberships = pgTable("organization_memberships", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("member").notNull(), // owner, admin, manager, member
  status: text("status").default("active").notNull(), // active, inactive, pending, suspended

  // Permissions (could be extended to more granular permissions)
  permissions: jsonb("permissions").$type<{
    canManageUsers?: boolean;
    canManageLabs?: boolean;
    canViewBilling?: boolean;
    canManageSettings?: boolean;
  }>().default({}),

  // Timestamps
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userOrgUnique: unique("user_organization_unique").on(table.userId, table.organizationId),
}));

// Relations
export const organizationRelations = relations(organizations, ({ many }) => ({
  memberships: many(organizationMemberships),
}));

export const organizationMembershipRelations = relations(organizationMemberships, ({ one }) => ({
  user: one(users, {
    fields: [organizationMemberships.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [organizationMemberships.organizationId],
    references: [organizations.id],
  }),
}));

// Types for TypeScript
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMembership = typeof organizationMemberships.$inferSelect;
export type NewOrganizationMembership = typeof organizationMemberships.$inferInsert;
