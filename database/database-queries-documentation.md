# Database Queries and Schema Documentation

This document contains all the database queries, schema definitions, and database-related operations performed during the development of the EZShell Labs platform.

## Table of Contents
1. [Schema Definitions](#schema-definitions)
2. [Database Queries](#database-queries)
3. [Migration Commands](#migration-commands)
4. [API Database Operations](#api-database-operations)
5. [Troubleshooting Queries](#troubleshooting-queries)
6. [Performance Monitoring Queries](#performance-monitoring-queries)

## Schema Definitions

### Instructors Schema
```typescript
// InstructorSchema.ts
import {
  timestamp,
  pgTable,
  text,
  boolean,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

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
```

### Updated Labs Schema
```typescript
// Added instructor relationship to LabSchema.ts
export const labs = pgTable("labs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  labId: text("labId").notNull().unique(),
  imageUrl: text("imageUrl").default(""),
  description: text("description"),
  duration: integer("duration").notNull().default(30), // duration in minutes
  instructorId: text("instructor_id"), // Added for instructor relationship
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

## Database Queries

### 1. Provisioning Queue Status Checks

#### Check Enrollment Queue Status
```sql
SELECT status, updated_at FROM provisioning_queue 
WHERE enrollment_id = '9db1e605-448c-4750-8ff3-89bdb0d75e53';
```

#### Check Lab Provision Details
```sql
SELECT instance_state, public_ip, updated_at FROM lab_provisions 
WHERE enrollment_id = '9db1e605-448c-4750-8ff3-89bdb0d75e53';
```

#### Check All Provisioning Queue Records
```sql
SELECT 
  enrollment_id,
  status,
  created_at,
  processed_at,
  updated_at,
  last_error
FROM provisioning_queue 
ORDER BY created_at DESC 
LIMIT 10;
```

### 2. Lab Provisions Monitoring

#### Check Instance States and IPs
```sql
SELECT 
  enrollment_id,
  instance_id,
  instance_state,
  public_ip,
  private_ip,
  provisioned_at,
  updated_at
FROM lab_provisions 
WHERE instance_state = 'running';
```

#### Find Provisions with Missing Public IPs
```sql
SELECT 
  enrollment_id,
  instance_id,
  instance_state,
  public_ip
FROM lab_provisions 
WHERE instance_state = 'running' AND public_ip IS NULL;
```

### 3. Active Provisions for Status Monitor

#### Get Processing Provisions
```sql
SELECT 
  pq.enrollment_id,
  pq.status as queue_status,
  lp.instance_id,
  lp.instance_state,
  lp.id as provision_id
FROM provisioning_queue pq
LEFT JOIN lab_provisions lp ON pq.enrollment_id = lp.enrollment_id
WHERE pq.status = 'processing';
```

### 4. Complete Provision Details

#### Get Full Provision Information
```sql
SELECT 
  pq.enrollment_id,
  pq.status as queue_status,
  pq.created_at as queue_created,
  pq.processed_at,
  pq.updated_at as queue_updated,
  lp.instance_id,
  lp.instance_state,
  lp.public_ip,
  lp.private_ip,
  lp.key_pair_name,
  lp.provisioned_at,
  lp.updated_at as provision_updated
FROM provisioning_queue pq
LEFT JOIN lab_provisions lp ON pq.enrollment_id = lp.enrollment_id
WHERE pq.enrollment_id = 'ENROLLMENT_ID_HERE';
```

### 5. Instructor Management Queries

#### Get All Instructors
```sql
SELECT 
  id,
  name,
  title,
  email,
  bio,
  avatar,
  experience,
  specializations,
  social_links,
  is_active,
  created_at,
  updated_at
FROM instructors 
WHERE is_active = true
ORDER BY name;
```

#### Get Instructor Details
```sql
SELECT * FROM instructors WHERE id = 'INSTRUCTOR_ID_HERE';
```

#### Get Labs by Instructor
```sql
SELECT 
  l.id,
  l.name,
  l.description,
  l.duration,
  l.image_url,
  i.name as instructor_name,
  i.title as instructor_title
FROM labs l
JOIN instructors i ON l.instructor_id = i.id
WHERE i.id = 'INSTRUCTOR_ID_HERE'
AND i.is_active = true;
```

#### Search Instructors
```sql
SELECT 
  id,
  name,
  title,
  email,
  experience,
  is_active
FROM instructors 
WHERE (
  name ILIKE '%SEARCH_TERM%' 
  OR title ILIKE '%SEARCH_TERM%'
  OR email ILIKE '%SEARCH_TERM%'
)
AND is_active = true
ORDER BY name;
```

### 6. User and Enrollment Queries

#### Get User Enrollments with Lab Details
```sql
SELECT 
  e.id as enrollment_id,
  e.user_id,
  e.enrolled_at,
  e.status as enrollment_status,
  l.name as lab_name,
  l.description,
  i.name as instructor_name,
  pq.status as provision_status,
  lp.instance_state,
  lp.public_ip
FROM lab_enrollments e
JOIN labs l ON e.lab_id = l.id
LEFT JOIN instructors i ON l.instructor_id = i.id
LEFT JOIN provisioning_queue pq ON e.id = pq.enrollment_id
LEFT JOIN lab_provisions lp ON e.id = lp.enrollment_id
WHERE e.user_id = 'USER_ID_HERE'
ORDER BY e.enrolled_at DESC;
```

## Migration Commands

### Database Setup Commands

#### Initialize Database
```bash
# Build database container
cd /Users/a254627/Development/eZetsu/ezshell-labs
docker-compose build postgres-db

# Start database
docker-compose up -d postgres-db

# Check database logs
docker-compose logs postgres-db
```

#### Connect to Database
```bash
# Connect to PostgreSQL
docker exec -it ezshell-postgres-db psql -U ezshell_user -d ezshell_labs

# List all tables
\dt

# Describe table structure
\d table_name

# Check if instructors table exists
\d instructors
```

#### Schema Migration (Drizzle)
```bash
# Generate migration for new schema changes
cd backend
npm run db:generate

# Push schema changes directly to database
npm run db:push

# Run pending migrations
npm run db:migrate
```

## API Database Operations

### 1. Instructor Management API Operations

#### Create Instructor
```typescript
const newInstructor = {
  id: nanoid(),
  name,
  title,
  bio: bio || null,
  avatar: avatar || null,
  email: email || null,
  experience: experience || null,
  specializations: specializations || null,
  socialLinks: socialLinks || null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const [instructor] = await db
  .insert(instructors)
  .values(newInstructor)
  .returning()
```

#### Get All Instructors (API)
```typescript
const allInstructors = await db
  .select()
  .from(instructors)
  .orderBy(desc(instructors.createdAt))
```

#### Get Single Instructor
```typescript
const [instructor] = await db
  .select()
  .from(instructors)
  .where(eq(instructors.id, instructorId))
  .limit(1)
```

#### Update Instructor
```typescript
const updateData = {
  ...(name && { name }),
  ...(title && { title }),
  bio: bio || null,
  avatar: avatar || null,
  email: email || null,
  experience: experience || null,
  specializations: specializations || null,
  socialLinks: socialLinks || null,
  ...(typeof isActive === 'boolean' && { isActive }),
  updatedAt: new Date(),
}

const [updatedInstructor] = await db
  .update(instructors)
  .set(updateData)
  .where(eq(instructors.id, instructorId))
  .returning()
```

#### Delete Instructor
```typescript
const [deletedInstructor] = await db
  .delete(instructors)
  .where(eq(instructors.id, instructorId))
  .returning()
```

### 2. Status Monitor Service Database Operations

#### Check Active Provisions
```typescript
const activeProvisions = await db
  .select({
    enrollmentId: provisioningQueue.enrollmentId,
    queueStatus: provisioningQueue.status,
    instanceId: labProvisions.instanceId,
    instanceState: labProvisions.instanceState,
    provisionId: labProvisions.id,
  })
  .from(provisioningQueue)
  .leftJoin(labProvisions, eq(provisioningQueue.enrollmentId, labProvisions.enrollmentId))
  .where(eq(provisioningQueue.status, 'processing'));
```

#### Update Provision Status
```typescript
// Update queue to completed
await db
  .update(provisioningQueue)
  .set({
    status: 'completed',
    updatedAt: new Date().toISOString(),
  })
  .where(eq(provisioningQueue.enrollmentId, enrollmentId));

// Update provision details
await db
  .update(labProvisions)
  .set({
    instanceState: 'running',
    publicIp: publicIpAddress,
    updatedAt: new Date().toISOString(),
  })
  .where(eq(labProvisions.enrollmentId, enrollmentId));
```

### 3. Lab Details with Instructor

#### Get Lab with Instructor Details
```typescript
const labWithInstructor = await db
  .select({
    lab: labs,
    instructor: instructors,
  })
  .from(labs)
  .leftJoin(instructors, eq(labs.instructorId, instructors.id))
  .where(eq(labs.id, labId))
  .limit(1);
```

## Troubleshooting Queries

### 1. Check Stuck Provisions
```sql
-- Find provisions that have been processing for too long
SELECT 
  pq.enrollment_id,
  pq.status,
  pq.processed_at,
  EXTRACT(EPOCH FROM (NOW() - pq.processed_at)) / 60 as minutes_processing,
  lp.instance_state,
  lp.public_ip
FROM provisioning_queue pq
LEFT JOIN lab_provisions lp ON pq.enrollment_id = lp.enrollment_id
WHERE pq.status = 'processing' 
  AND pq.processed_at < NOW() - INTERVAL '30 minutes';
```

### 2. Check Queue Status Distribution
```sql
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM provisioning_queue 
GROUP BY status
ORDER BY count DESC;
```

### 3. Check Instance State Distribution
```sql
SELECT 
  instance_state,
  COUNT(*) as count,
  COUNT(CASE WHEN public_ip IS NOT NULL THEN 1 END) as with_public_ip,
  COUNT(CASE WHEN public_ip IS NULL THEN 1 END) as without_public_ip
FROM lab_provisions 
GROUP BY instance_state
ORDER BY count DESC;
```

### 4. Find Mismatched Statuses
```sql
-- Find provisions where queue is completed but instance isn't running
SELECT 
  pq.enrollment_id,
  pq.status as queue_status,
  lp.instance_state,
  lp.public_ip,
  pq.updated_at as queue_updated,
  lp.updated_at as provision_updated
FROM provisioning_queue pq
JOIN lab_provisions lp ON pq.enrollment_id = lp.enrollment_id
WHERE pq.status = 'completed' 
  AND lp.instance_state != 'running';
```

### 5. Check Instructor Data Integrity
```sql
-- Find labs without instructors
SELECT 
  l.id,
  l.name,
  l.instructor_id
FROM labs l
LEFT JOIN instructors i ON l.instructor_id = i.id
WHERE l.instructor_id IS NOT NULL 
  AND i.id IS NULL;

-- Find inactive instructors with active labs
SELECT 
  i.id,
  i.name,
  i.is_active,
  COUNT(l.id) as lab_count
FROM instructors i
LEFT JOIN labs l ON i.id = l.instructor_id
WHERE i.is_active = false
GROUP BY i.id, i.name, i.is_active
HAVING COUNT(l.id) > 0;
```

## Performance Monitoring Queries

### 1. Provision Time Analysis
```sql
SELECT 
  AVG(EXTRACT(EPOCH FROM (lp.updated_at - pq.created_at))) as avg_provision_time_seconds,
  MIN(EXTRACT(EPOCH FROM (lp.updated_at - pq.created_at))) as min_provision_time_seconds,
  MAX(EXTRACT(EPOCH FROM (lp.updated_at - pq.created_at))) as max_provision_time_seconds,
  COUNT(*) as total_provisions
FROM provisioning_queue pq
JOIN lab_provisions lp ON pq.enrollment_id = lp.enrollment_id
WHERE pq.status = 'completed' 
  AND lp.instance_state = 'running'
  AND pq.created_at > NOW() - INTERVAL '7 days';
```

### 2. Daily Provision Statistics
```sql
SELECT 
  DATE(pq.created_at) as provision_date,
  COUNT(*) as total_provisions,
  COUNT(CASE WHEN pq.status = 'completed' THEN 1 END) as completed_provisions,
  COUNT(CASE WHEN pq.status = 'failed' THEN 1 END) as failed_provisions,
  COUNT(CASE WHEN pq.status = 'processing' THEN 1 END) as processing_provisions
FROM provisioning_queue pq
WHERE pq.created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(pq.created_at)
ORDER BY provision_date DESC;
```

### 3. Instructor Usage Statistics
```sql
SELECT 
  i.id,
  i.name,
  i.title,
  COUNT(l.id) as total_labs,
  COUNT(le.id) as total_enrollments,
  AVG(l.duration) as avg_lab_duration
FROM instructors i
LEFT JOIN labs l ON i.id = l.instructor_id
LEFT JOIN lab_enrollments le ON l.id = le.lab_id
WHERE i.is_active = true
GROUP BY i.id, i.name, i.title
ORDER BY total_enrollments DESC, total_labs DESC;
```

### 4. System Health Check
```sql
-- Overall system status
SELECT 
  'Total Instructors' as metric,
  COUNT(*) as value
FROM instructors
WHERE is_active = true

UNION ALL

SELECT 
  'Total Labs' as metric,
  COUNT(*) as value
FROM labs

UNION ALL

SELECT 
  'Active Provisions' as metric,
  COUNT(*) as value
FROM lab_provisions
WHERE instance_state = 'running'

UNION ALL

SELECT 
  'Processing Queue' as metric,
  COUNT(*) as value
FROM provisioning_queue
WHERE status = 'processing';
```

## Best Practices and Notes

### 1. Index Recommendations
```sql
-- Recommended indexes for better performance
CREATE INDEX idx_instructors_active ON instructors(is_active);
CREATE INDEX idx_instructors_email ON instructors(email);
CREATE INDEX idx_labs_instructor_id ON labs(instructor_id);
CREATE INDEX idx_provisioning_queue_status ON provisioning_queue(status);
CREATE INDEX idx_lab_provisions_state ON lab_provisions(instance_state);
```

### 2. Data Validation Queries
```sql
-- Check for duplicate instructor emails
SELECT email, COUNT(*) 
FROM instructors 
WHERE email IS NOT NULL 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Validate JSON fields
SELECT id, name, specializations
FROM instructors 
WHERE specializations IS NOT NULL 
  AND NOT (specializations::text ~ '^\[.*\]$');
```

### 3. Cleanup Queries
```sql
-- Clean up old failed provisions (older than 7 days)
DELETE FROM provisioning_queue 
WHERE status = 'failed' 
  AND created_at < NOW() - INTERVAL '7 days';

-- Archive old completed provisions
UPDATE provisioning_queue 
SET status = 'archived' 
WHERE status = 'completed' 
  AND updated_at < NOW() - INTERVAL '30 days';
```

---

*This documentation was created during the development of the EZShell Labs platform on August 22, 2025. Keep this file updated as the database schema and queries evolve.*

**Last Updated:** August 22, 2025  
**Version:** 1.0  
**Database:** PostgreSQL with Drizzle ORM
