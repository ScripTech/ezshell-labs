// Lab Provisioner Database Schema
// This file contains minimal schema definitions needed for the lab provisioner service
// The actual tables are managed in the frontend and shared via the database

import { pgTable, foreignKey, text, timestamp, integer, unique, jsonb, pgEnum } from "drizzle-orm/pg-core";

// Enums (these must match the frontend schema exactly)
export const userRole = pgEnum("user_role", ['manager', 'admin', 'user', 'clientUser']);
export const instanceState = pgEnum("instance_state", ['pending', 'running', 'stopping', 'stopped', 'terminated', 'shutting-down']);
export const provisioningStatus = pgEnum("provisioning_status", ['queued', 'processing', 'completed', 'failed', 'cancelled']);

// Table references (minimal definitions for ORM, actual tables created by frontend migrations)
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  emailVerified: timestamp("emailVerified", { mode: 'string' }),
  image: text("image"),
  role: userRole("role").default('user').notNull(),
  password: text("password"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
  return {
    userEmailUnique: unique("user_email_unique").on(table.email),
  }
});

export const labs = pgTable("labs", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration").default(30).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
  imageUrl: text("image_url").default(''),
});

export const labEnrollments = pgTable("lab_enrollments", {
  id: text("id").primaryKey().notNull(),
  userId: text("userId"),
  labId: text("labId"),
  enrolledAt: timestamp("enrolled_at", { mode: 'string' }).defaultNow(),
  completedAt: timestamp("completed_at", { mode: 'string' }),
  progress: integer("progress").default(0),
  status: text("status").default('enrolled'),
}, (table) => {
  return {
    labEnrollmentsUserIdUserIdFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    labEnrollmentsLabIdLabsIdFk: foreignKey({
      columns: [table.labId],
      foreignColumns: [labs.id],
    }).onDelete("cascade"),
  }
});

// Provisioning tables (these are created by our migration)
export const labProvisions = pgTable("lab_provisions", {
  id: text("id").primaryKey().notNull(),
  enrollmentId: text("enrollment_id").notNull(),
  instanceId: text("instance_id"),
  publicIp: text("public_ip"),
  privateIp: text("private_ip"),
  keyPairName: text("key_pair_name"),
  instanceState: instanceState("instance_state").default('pending'),
  provisionedAt: timestamp("provisioned_at", { mode: 'string' }),
  terminatedAt: timestamp("terminated_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
  return {
    labProvisionsEnrollmentIdFk: foreignKey({
      columns: [table.enrollmentId],
      foreignColumns: [labEnrollments.id],
    }).onDelete("cascade"),
  }
});

export const provisioningQueue = pgTable("provisioning_queue", {
  id: text("id").primaryKey().notNull(),
  enrollmentId: text("enrollment_id").notNull(),
  userId: text("user_id").notNull(),
  labId: text("lab_id").notNull(),
  status: provisioningStatus("status").default('queued'),
  messageData: jsonb("message_data"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  lastError: text("last_error"),
  processedAt: timestamp("processed_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
  return {
    provisioningQueueEnrollmentIdFk: foreignKey({
      columns: [table.enrollmentId],
      foreignColumns: [labEnrollments.id],
    }).onDelete("cascade"),
    provisioningQueueUserIdFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    provisioningQueueLabIdFk: foreignKey({
      columns: [table.labId],
      foreignColumns: [labs.id],
    }).onDelete("cascade"),
  }
});

export const sshKeys = pgTable("ssh_keys", {
  id: text("id").primaryKey().notNull(),
  provisionId: text("provision_id").notNull(),
  publicKey: text("public_key"),
  privateKeyHash: text("private_key_hash"),
  keyPairName: text("key_pair_name").notNull(),
  filePath: text("file_path"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => {
  return {
    sshKeysProvisionIdFk: foreignKey({
      columns: [table.provisionId],
      foreignColumns: [labProvisions.id],
    }).onDelete("cascade"),
    sshKeysKeyPairNameUnique: unique("ssh_keys_key_pair_name_unique").on(table.keyPairName),
  }
});

// Type exports for use in the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Lab = typeof labs.$inferSelect;
export type NewLab = typeof labs.$inferInsert;

export type LabEnrollment = typeof labEnrollments.$inferSelect;
export type NewLabEnrollment = typeof labEnrollments.$inferInsert;

export type LabProvision = typeof labProvisions.$inferSelect;
export type NewLabProvision = typeof labProvisions.$inferInsert;

export type ProvisioningQueue = typeof provisioningQueue.$inferSelect;
export type NewProvisioningQueue = typeof provisioningQueue.$inferInsert;

export type SshKey = typeof sshKeys.$inferSelect;
export type NewSshKey = typeof sshKeys.$inferInsert;
