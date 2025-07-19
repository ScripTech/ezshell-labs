// Lab Provisioning Schema for EZShell Labs
// Handles AWS EC2 instance provisioning for lab environments

import { pgTable, foreignKey, text, timestamp, integer, unique, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./UserSchema";
import { labs, labEnrollments } from "./LabSchema";

// Enums for provisioning states
export const instanceState = pgEnum("instance_state", [
  'pending',
  'running',
  'stopping',
  'stopped',
  'terminated',
  'shutting-down'
]);

export const provisioningStatus = pgEnum("provisioning_status", [
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled'
]);

// Lab Provisions Table - Tracks EC2 instances for each enrollment
export const labProvisions = pgTable("lab_provisions", {
  id: text().primaryKey().notNull(),
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
      name: "lab_provisions_enrollment_id_fk"
    }).onDelete("cascade"),
  }
});

// Provisioning Queue Table - Tracks async provisioning requests
export const provisioningQueue = pgTable("provisioning_queue", {
  id: text().primaryKey().notNull(),
  enrollmentId: text("enrollment_id").notNull(),
  userId: text("user_id").notNull(),
  labId: text("lab_id").notNull(),
  status: provisioningStatus("status").default('queued'),
  messageData: jsonb("message_data"),
  attempts: integer().default(0),
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
      name: "provisioning_queue_enrollment_id_fk"
    }).onDelete("cascade"),
    provisioningQueueUserIdFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "provisioning_queue_user_id_fk"
    }).onDelete("cascade"),
    provisioningQueueLabIdFk: foreignKey({
      columns: [table.labId],
      foreignColumns: [labs.id],
      name: "provisioning_queue_lab_id_fk"
    }).onDelete("cascade"),
  }
});

// SSH Keys Table - Secure key pair metadata storage
export const sshKeys = pgTable("ssh_keys", {
  id: text().primaryKey().notNull(),
  provisionId: text("provision_id").notNull(),
  publicKey: text("public_key"),
  privateKeyHash: text("private_key_hash"), // Hash for verification, not the actual key
  keyPairName: text("key_pair_name").notNull(),
  filePath: text("file_path"), // Temporary file path for private key
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  expiresAt: timestamp("expires_at", { mode: 'string' }), // For cleanup
}, (table) => {
  return {
    sshKeysProvisionIdFk: foreignKey({
      columns: [table.provisionId],
      foreignColumns: [labProvisions.id],
      name: "ssh_keys_provision_id_fk"
    }).onDelete("cascade"),
    sshKeysKeyPairNameUnique: unique("ssh_keys_key_pair_name_unique").on(table.keyPairName),
  }
});

// Type exports for use in the application
export type LabProvision = typeof labProvisions.$inferSelect;
export type NewLabProvision = typeof labProvisions.$inferInsert;

export type ProvisioningQueue = typeof provisioningQueue.$inferSelect;
export type NewProvisioningQueue = typeof provisioningQueue.$inferInsert;

export type SshKey = typeof sshKeys.$inferSelect;
export type NewSshKey = typeof sshKeys.$inferInsert;
