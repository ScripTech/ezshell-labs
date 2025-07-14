import { pgTable, text, timestamp, integer, foreignKey, jsonb } from "drizzle-orm/pg-core";

export const labs = pgTable("labs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  duration: integer("duration").default(30).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  imageUrl: text("image_url").default(''),
});

export const labTasks = pgTable("lab_tasks", {
  id: text("id").primaryKey(),
  labId: text("lab_id"),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty"),
  points: integer("points").default(0).notNull(),
  hint: text("hint"),
  validationSteps: jsonb("validation_steps"),
  markdown: text("markdown"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    labTasksLabIdLabsIdFk: foreignKey({
      columns: [table.labId],
      foreignColumns: [labs.id],
      name: "lab_tasks_labId_labs_id_fk"
    }).onDelete("cascade"),
  }
});

export type LabTask = typeof labTasks.$inferSelect;
export type NewLabTask = typeof labTasks.$inferInsert;
export type Lab = typeof labs.$inferSelect;
export type NewLab = typeof labs.$inferInsert;
