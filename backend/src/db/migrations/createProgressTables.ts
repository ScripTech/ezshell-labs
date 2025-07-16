import { db } from '../index';
import { sql } from 'drizzle-orm';

export async function createProgressTables() {
  console.log('Creating progress tracking tables...');

  try {
    // Create lab_progress_sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS lab_progress_sessions (
        id TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
        "labId" TEXT REFERENCES labs(id) ON DELETE CASCADE,
        "enrollmentId" TEXT REFERENCES lab_enrollments(id) ON DELETE CASCADE,
        session_start TIMESTAMP DEFAULT NOW(),
        session_end TIMESTAMP,
        total_time_spent INTEGER DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        tasks_attempted INTEGER DEFAULT 0,
        current_task_id TEXT REFERENCES lab_tasks(id),
        session_data JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create task_attempts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS task_attempts (
        id TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
        "taskId" TEXT REFERENCES lab_tasks(id) ON DELETE CASCADE,
        "sessionId" TEXT REFERENCES lab_progress_sessions(id) ON DELETE CASCADE,
        attempt_number INTEGER NOT NULL,
        start_time TIMESTAMP DEFAULT NOW(),
        end_time TIMESTAMP,
        time_spent INTEGER DEFAULT 0,
        score DECIMAL(5,2) DEFAULT 0.00,
        max_score DECIMAL(5,2) DEFAULT 100.00,
        status TEXT DEFAULT 'in_progress',
        validation_results JSONB,
        error_logs JSONB,
        hints_used INTEGER DEFAULT 0,
        commands_executed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create validation_steps table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS validation_steps (
        id TEXT PRIMARY KEY,
        "attemptId" TEXT REFERENCES task_attempts(id) ON DELETE CASCADE,
        step_name TEXT NOT NULL,
        step_order INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        start_time TIMESTAMP DEFAULT NOW(),
        end_time TIMESTAMP,
        duration INTEGER DEFAULT 0,
        result JSONB,
        error_message TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create learning_analytics table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS learning_analytics (
        id TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
        "labId" TEXT REFERENCES labs(id) ON DELETE CASCADE,
        total_time_spent INTEGER DEFAULT 0,
        average_task_time DECIMAL(8,2) DEFAULT 0.00,
        completion_rate DECIMAL(5,2) DEFAULT 0.00,
        average_score DECIMAL(5,2) DEFAULT 0.00,
        struggling_topics JSONB,
        strong_topics JSONB,
        preferred_learning_time JSONB,
        command_patterns JSONB,
        streak INTEGER DEFAULT 0,
        last_active_date TIMESTAMP,
        milestones JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create realtime_events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS realtime_events (
        id TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
        "sessionId" TEXT REFERENCES lab_progress_sessions(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        event_data JSONB,
        socket_id TEXT,
        timestamp TIMESTAMP DEFAULT NOW(),
        processed BOOLEAN DEFAULT false,
        metadata JSONB
      );
    `);

    console.log('✅ Progress tracking tables created successfully!');

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_lab_progress_sessions_user_lab
      ON lab_progress_sessions("userId", "labId");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_task_attempts_user_task
      ON task_attempts("userId", "taskId");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_validation_steps_attempt
      ON validation_steps("attemptId", step_order);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_realtime_events_user_session
      ON realtime_events("userId", "sessionId", timestamp);
    `);

    console.log('✅ Database indexes created successfully!');

  } catch (error) {
    console.error('❌ Failed to create progress tables:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  createProgressTables()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
