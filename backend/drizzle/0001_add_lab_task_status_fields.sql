-- Add status management fields to lab_tasks table
ALTER TABLE "lab_tasks" ADD COLUMN "is_enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "lab_tasks" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;
ALTER TABLE "lab_tasks" ADD COLUMN "maintenance_message" text;
