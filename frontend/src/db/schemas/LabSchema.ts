import {
  timestamp,
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  decimal,
} from "drizzle-orm/pg-core";
import { users } from "./UserSchema";
import { relations } from "drizzle-orm";

export const labSessions = pgTable("lab_session", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").default(true),
  labId: text("lab_id").references(() => labs.id),
});

export const labs = pgTable("labs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  labId: text("labId").notNull().unique(),
  imageUrl: text("imageUrl").default(""),
  description: text("description"),
  duration: integer("duration").notNull().default(30), // duration in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const labEnrollments = pgTable("lab_enrollments", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  labId: text("labId").references(() => labs.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  progress: integer("progress").default(0),
  status: text("status").default("enrolled"), // enrolled, in_progress, completed
});

export const labExercises = pgTable("lab_exercises", {
  id: text("id").primaryKey(),
  labId: text("labId").references(() => labs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const labExerciseProgress = pgTable("lab_exercise_progress", {
  id: text("id").primaryKey(),
  exerciseId: text("exercise_id").references(() => labExercises.id, { onDelete: "cascade" }),
  enrollmentId: text("enrollment_id").references(() => labEnrollments.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const labTasks = pgTable("lab_tasks", {
  id: text("id").primaryKey(),
  labId: text("labId").references(() => labs.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty"),
  points: integer("points").notNull().default(0),
  hint: text("hint"),
  validationSteps: jsonb("validation_steps"), // array of strings
  markdown: text("markdown"), // full markdown content
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const labTaskProgress = pgTable("lab_task_progress", {
  id: text("id").primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  labTaskId: text("labTaskId").references(() => labTasks.id, {
    onDelete: "cascade",
  }),
  labEnrollmentId: text("labEnrollmentId").references(() => labEnrollments.id, {
    onDelete: "cascade",
  }),
  score: decimal("score", { precision: 5, scale: 2 }).default("0"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  attempts: integer("attempts").default(0), // Track number of attempts
  maxAttempts: integer("max_attempts").default(3), // Maximum allowed attempts
  lastAttemptAt: timestamp("last_attempt_at"), // Track when last attempt was made
  validationResults: jsonb("validation_results"), // Store detailed validation results
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const labRelations = relations(labs, ({ many }) => ({
  sessions: many(labSessions),
  enrollments: many(labEnrollments),
  exercises: many(labExercises),
  tasks: many(labTasks),
}));

export const labSessionRelations = relations(labSessions, ({ one }) => ({
  lab: one(labs, {
    fields: [labSessions.labId],
    references: [labs.id],
  }),
  user: one(users, {
    fields: [labSessions.userId],
    references: [users.id],
  }),
}));

export const labEnrollmentRelations = relations(labEnrollments, ({ one }) => ({
  lab: one(labs, {
    fields: [labEnrollments.labId],
    references: [labs.id],
  }),
  user: one(users, {
    fields: [labEnrollments.userId],
    references: [users.id],
  }),
}));

export const labExerciseRelations = relations(labExercises, ({ one, many }) => ({
  lab: one(labs, {
    fields: [labExercises.labId],
    references: [labs.id],
  }),
  progress: many(labExerciseProgress),
}));

export const labTaskRelations = relations(labTasks, ({ one, many }) => ({
  lab: one(labs, {
    fields: [labTasks.labId],
    references: [labs.id],
  }),
  progress: many(labTaskProgress),
}));

export const labTaskProgressRelations = relations(labTaskProgress, ({ one }) => ({
  user: one(users, {
    fields: [labTaskProgress.userId],
    references: [users.id],
  }),
  labTask: one(labTasks, {
    fields: [labTaskProgress.labTaskId],
    references: [labTasks.id],
  }),
  enrollment: one(labEnrollments, {
    fields: [labTaskProgress.labEnrollmentId],
    references: [labEnrollments.id],
  }),
}));

export const labExerciseProgressRelations = relations(labExerciseProgress, ({ one }) => ({
  exercise: one(labExercises, {
    fields: [labExerciseProgress.exerciseId],
    references: [labExercises.id],
  }),
  enrollment: one(labEnrollments, {
    fields: [labExerciseProgress.enrollmentId],
    references: [labEnrollments.id],
  }),
}));
