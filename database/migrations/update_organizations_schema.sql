-- Migration: Update organizations table and add organization_memberships
-- This script updates the existing organizations table to match the new schema
-- and creates the organization_memberships table for many-to-many relationships

BEGIN;

-- First, let's add all the new columns to the organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS logo text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS size text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free' NOT NULL,
  ADD COLUMN IF NOT EXISTS max_users integer DEFAULT 5 NOT NULL,
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}' NOT NULL,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false NOT NULL;

-- Update the id column to use text instead of UUID (if needed)
-- First, let's check if we need to convert the ID column
-- For now, we'll keep the UUID type but ensure it's compatible

-- Add unique constraint on name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'organizations_name_unique'
    ) THEN
        ALTER TABLE organizations ADD CONSTRAINT organizations_name_unique UNIQUE (name);
    END IF;
END $$;

-- Update existing organization with default plan if it doesn't have one
UPDATE organizations
SET plan = 'enterprise'
WHERE plan IS NULL AND name = 'eZetsu Labs';

-- Create organization_memberships table
CREATE TABLE IF NOT EXISTS organization_memberships (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  organization_id text NOT NULL,
  role text DEFAULT 'member' NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  permissions jsonb DEFAULT '{}' NOT NULL,
  joined_at timestamp without time zone DEFAULT now(),
  last_active_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- Add foreign key constraints to organization_memberships
-- We'll handle the type compatibility by ensuring both sides use the same type
ALTER TABLE organization_memberships 
  ADD CONSTRAINT organization_memberships_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- For organizations, we need to check the actual type and handle appropriately
DO $$
DECLARE
    org_id_type text;
BEGIN
    -- Get the data type of organizations.id
    SELECT data_type INTO org_id_type
    FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'id';
    
    IF org_id_type = 'uuid' THEN
        -- If organizations.id is UUID, we need to convert organization_id to UUID
        ALTER TABLE organization_memberships 
          ALTER COLUMN organization_id TYPE uuid USING organization_id::uuid;
    END IF;
    
    -- Now add the foreign key constraint
    ALTER TABLE organization_memberships 
      ADD CONSTRAINT organization_memberships_organization_id_fkey 
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
END $$;-- Add unique constraint to prevent duplicate memberships
ALTER TABLE organization_memberships
  ADD CONSTRAINT user_organization_unique
  UNIQUE (user_id, organization_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_memberships_user_id
  ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_organization_id
  ON organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_role
  ON organization_memberships(role);
CREATE INDEX IF NOT EXISTS idx_organization_memberships_status
  ON organization_memberships(status);

-- Add trigger for updated_at on organization_memberships
CREATE OR REPLACE FUNCTION update_organization_memberships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_organization_memberships_updated_at ON organization_memberships;
CREATE TRIGGER update_organization_memberships_updated_at
    BEFORE UPDATE ON organization_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_memberships_updated_at();

-- Migrate existing users who have organization_id to organization_memberships
-- First, let's check if the user table has an organization_id column
DO $$
DECLARE
    column_exists boolean;
    user_id_type text;
    org_id_type text;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user' 
        AND column_name = 'organization_id'
    ) INTO column_exists;
    
    -- Get the data types
    SELECT data_type INTO user_id_type
    FROM information_schema.columns 
    WHERE table_name = 'user' AND column_name = 'id';
    
    SELECT data_type INTO org_id_type
    FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'id';
    
    IF column_exists THEN
        -- Insert memberships for users who have organization_id
        IF user_id_type = 'uuid' AND org_id_type = 'uuid' THEN
            INSERT INTO organization_memberships (id, user_id, organization_id, role, status, joined_at, created_at, updated_at)
            SELECT 
                gen_random_uuid(),
                u.id,
                u.organization_id,
                CASE 
                    WHEN u.role = 'admin' THEN 'admin'
                    WHEN u.role = 'manager' THEN 'manager'
                    ELSE 'member'
                END,
                'active',
                u.created_at,
                u.created_at,
                u.updated_at
            FROM "user" u
            WHERE u.organization_id IS NOT NULL
            ON CONFLICT (user_id, organization_id) DO NOTHING;
        END IF;
    END IF;
END $$;-- Create a membership for the owner of the existing organization
DO $$
DECLARE
    owner_record RECORD;
BEGIN
    FOR owner_record IN 
        SELECT o.id as org_id, o.owner_id as user_id, o.created_at, o.updated_at
        FROM organizations o 
        WHERE o.owner_id IS NOT NULL
    LOOP
        INSERT INTO organization_memberships (id, user_id, organization_id, role, status, joined_at, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            owner_record.user_id,
            owner_record.org_id,
            'owner',
            'active',
            owner_record.created_at,
            owner_record.created_at,
            owner_record.updated_at
        )
        ON CONFLICT (user_id, organization_id) DO NOTHING;
    END LOOP;
END $$;

-- Update existing organization with better defaults
UPDATE organizations
SET
    plan = COALESCE(plan, 'enterprise'),
    max_users = COALESCE(max_users, 100),
    settings = COALESCE(settings, '{"allowSelfRegistration": false, "defaultUserRole": "user", "requireEmailVerification": true}'::jsonb),
    is_verified = true
WHERE name = 'eZetsu Labs';

COMMIT;

-- Print summary
DO $$
DECLARE
    org_count integer;
    membership_count integer;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    SELECT COUNT(*) INTO membership_count FROM organization_memberships;

    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Organizations: %', org_count;
    RAISE NOTICE 'Organization memberships: %', membership_count;
END $$;
