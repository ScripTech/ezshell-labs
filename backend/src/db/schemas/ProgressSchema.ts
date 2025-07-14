import {
  timestamp,
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
// Import existing tables from their proper schemas
import { users } from "./UserSchema";
import { labs, labTasks, labEnrollments } from "./LabSchema";

// Enhanced lab progress tracking with detailed persistence
export const labProgressSessions = pgTable("lab_progress_sessions", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  labId: text("labId").references(() => labs.id, { onDelete: "cascade" }),
  enrollmentId: text("enrollmentId").references(() => labEnrollments.id, { onDelete: "cascade" }),
  sessionName: text("sessionName"), // e.g., "EX200-Lab1-Session1"
  startedAt: timestamp("startedAt").defaultNow(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow(),
  endedAt: timestamp("endedAt"),
  pausedAt: timestamp("pausedAt"), // when session was paused
  resumedAt: timestamp("resumedAt"), // when session was resumed
  expiresAt: timestamp("expiresAt").notNull(), // calculated based on lab duration
  status: text("status").default("active"), // active, paused, completed, abandoned, expired
  totalTimeSpent: integer("totalTimeSpent").default(0), // in seconds (excluding paused time)
  timeRemaining: integer("timeRemaining"), // in seconds, calculated field
  currentTaskId: text("currentTaskId").references(() => labTasks.id),
  overallProgress: decimal("overallProgress", { precision: 5, scale: 2 }).default("0"), // percentage
  autoSaveInterval: integer("autoSaveInterval").default(30), // auto-save frequency in seconds
  metadata: jsonb("metadata").default({}), // session-specific data
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Individual task attempts with comprehensive tracking
export const taskAttempts = pgTable("task_attempts", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId").references(() => labProgressSessions.id, { onDelete: "cascade" }),
  taskId: text("taskId").references(() => labTasks.id, { onDelete: "cascade" }),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  attemptNumber: integer("attemptNumber").notNull(), // 1, 2, 3, etc.
  startedAt: timestamp("startedAt").defaultNow(),
  completedAt: timestamp("completedAt"),
  status: text("status").default("in_progress"), // in_progress, completed, failed, abandoned
  score: decimal("score", { precision: 5, scale: 2 }).default("0"), // 0-100
  maxPossibleScore: decimal("maxPossibleScore", { precision: 5, scale: 2 }).default("100"),
  timeSpent: integer("timeSpent").default(0), // in seconds
  hintsUsed: integer("hintsUsed").default(0),
  validationResult: jsonb("validationResult").default({}), // detailed validation results
  errors: jsonb("errors").default([]), // array of error messages
  metadata: jsonb("metadata").default({}), // attempt-specific data
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Step-by-step validation progress (real-time)
export const validationSteps = pgTable("validation_steps", {
  id: text("id").primaryKey(),
  attemptId: text("attemptId").references(() => taskAttempts.id, { onDelete: "cascade" }),
  stepNumber: integer("stepNumber").notNull(),
  stepName: text("stepName").notNull(),
  stepDescription: text("stepDescription"),
  status: text("status").default("pending"), // pending, running, passed, failed, skipped
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  executionTime: integer("executionTime").default(0), // in milliseconds
  output: text("output"), // command output or result
  expectedOutput: text("expectedOutput"),
  score: decimal("score", { precision: 5, scale: 2 }).default("0"),
  maxScore: decimal("maxScore", { precision: 5, scale: 2 }).default("10"),
  errorMessage: text("errorMessage"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Learning analytics and insights
export const learningAnalytics = pgTable("learning_analytics", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  labId: text("labId").references(() => labs.id, { onDelete: "cascade" }),
  totalTimeSpent: integer("totalTimeSpent").default(0), // in seconds
  totalAttempts: integer("totalAttempts").default(0),
  successfulAttempts: integer("successfulAttempts").default(0),
  averageScore: decimal("averageScore", { precision: 5, scale: 2 }).default("0"),
  completionRate: decimal("completionRate", { precision: 5, scale: 2 }).default("0"), // percentage
  strugglingTopics: jsonb("strugglingTopics").default([]), // array of topic names
  strongAreas: jsonb("strongAreas").default([]), // array of topic names
  learningPattern: jsonb("learningPattern").default({}), // usage patterns, time preferences
  recommendedNextSteps: jsonb("recommendedNextSteps").default([]),
  lastAnalyzedAt: timestamp("lastAnalyzedAt").defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Real-time events for WebSocket debugging and analytics
export const realtimeEvents = pgTable("realtime_events", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("sessionId").references(() => labProgressSessions.id, { onDelete: "cascade" }),
  eventType: text("eventType").notNull(), // websocket-connect, validation-start, command-executed, etc.
  eventData: jsonb("eventData").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
  sourceIP: text("sourceIP"),
  userAgent: text("userAgent"),
  metadata: jsonb("metadata").default({}),
});

// Enhanced relations for comprehensive data access
export const labProgressSessionsRelations = relations(labProgressSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [labProgressSessions.userId],
    references: [users.id],
  }),
  lab: one(labs, {
    fields: [labProgressSessions.labId],
    references: [labs.id],
  }),
  enrollment: one(labEnrollments, {
    fields: [labProgressSessions.enrollmentId],
    references: [labEnrollments.id],
  }),
  currentTask: one(labTasks, {
    fields: [labProgressSessions.currentTaskId],
    references: [labTasks.id],
  }),
  taskAttempts: many(taskAttempts),
  realtimeEvents: many(realtimeEvents),
}));

export const taskAttemptsRelations = relations(taskAttempts, ({ one, many }) => ({
  session: one(labProgressSessions, {
    fields: [taskAttempts.sessionId],
    references: [labProgressSessions.id],
  }),
  task: one(labTasks, {
    fields: [taskAttempts.taskId],
    references: [labTasks.id],
  }),
  user: one(users, {
    fields: [taskAttempts.userId],
    references: [users.id],
  }),
  validationSteps: many(validationSteps),
}));

export const validationStepsRelations = relations(validationSteps, ({ one }) => ({
  attempt: one(taskAttempts, {
    fields: [validationSteps.attemptId],
    references: [taskAttempts.id],
  }),
}));

export const learningAnalyticsRelations = relations(learningAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [learningAnalytics.userId],
    references: [users.id],
  }),
  lab: one(labs, {
    fields: [learningAnalytics.labId],
    references: [labs.id],
  }),
}));

export const realtimeEventsRelations = relations(realtimeEvents, ({ one }) => ({
  user: one(users, {
    fields: [realtimeEvents.userId],
    references: [users.id],
  }),
  session: one(labProgressSessions, {
    fields: [realtimeEvents.sessionId],
    references: [labProgressSessions.id],
  }),
}));
