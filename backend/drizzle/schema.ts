import { pgTable, foreignKey, text, timestamp, boolean, integer, unique, jsonb, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const userRole = pgEnum("user_role", ['manager', 'admin', 'user', 'clientUser'])


export const labSession = pgTable("lab_session", {
	id: text().primaryKey().notNull(),
	userId: text(),
	startTime: timestamp("start_time", { mode: 'string' }).defaultNow(),
	endTime: timestamp("end_time", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
	labId: text("lab_id"),
}, (table) => {
	return {
		labSessionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "lab_session_userId_user_id_fk"
		}).onDelete("cascade"),
		labSessionLabIdLabsIdFk: foreignKey({
			columns: [table.labId],
			foreignColumns: [labs.id],
			name: "lab_session_lab_id_labs_id_fk"
		}),
	}
});

export const session = pgTable("session", {
	sessionToken: text().primaryKey().notNull(),
	userId: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => {
	return {
		sessionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_user_id_fk"
		}).onDelete("cascade"),
	}
});

export const labs = pgTable("labs", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	duration: integer().default(30).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	imageUrl: text().default(''),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text(),
	emailVerified: timestamp({ mode: 'string' }),
	image: text(),
	role: userRole().default('user').notNull(),
}, (table) => {
	return {
		userEmailUnique: unique("user_email_unique").on(table.email),
	}
});

export const labTasks = pgTable("lab_tasks", {
	id: text().primaryKey().notNull(),
	labId: text(),
	order: integer().notNull(),
	title: text().notNull(),
	description: text(),
	difficulty: text(),
	points: integer().default(0).notNull(),
	hint: text(),
	validationSteps: jsonb("validation_steps"),
	markdown: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		labTasksLabIdLabsIdFk: foreignKey({
			columns: [table.labId],
			foreignColumns: [labs.id],
			name: "lab_tasks_labId_labs_id_fk"
		}).onDelete("cascade"),
	}
});

export const labTaskProgress = pgTable("lab_task_progress", {
	id: text().primaryKey().notNull(),
	userId: text(),
	labTaskId: text(),
	labEnrollmentId: text(),
	score: integer().default(0),
	completed: boolean().default(false),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		labTaskProgressUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "lab_task_progress_userId_user_id_fk"
		}).onDelete("cascade"),
		labTaskProgressLabTaskIdLabTasksIdFk: foreignKey({
			columns: [table.labTaskId],
			foreignColumns: [labTasks.id],
			name: "lab_task_progress_labTaskId_lab_tasks_id_fk"
		}).onDelete("cascade"),
		labTaskProgressLabEnrollmentIdLabEnrollmentsIdFk: foreignKey({
			columns: [table.labEnrollmentId],
			foreignColumns: [labEnrollments.id],
			name: "lab_task_progress_labEnrollmentId_lab_enrollments_id_fk"
		}).onDelete("cascade"),
	}
});

export const labEnrollments = pgTable("lab_enrollments", {
	id: text().primaryKey().notNull(),
	userId: text(),
	labId: text(),
	enrolledAt: timestamp("enrolled_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	progress: integer().default(0),
	status: text().default('enrolled'),
}, (table) => {
	return {
		labEnrollmentsUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "lab_enrollments_userId_user_id_fk"
		}).onDelete("cascade"),
		labEnrollmentsLabIdLabsIdFk: foreignKey({
			columns: [table.labId],
			foreignColumns: [labs.id],
			name: "lab_enrollments_labId_labs_id_fk"
		}).onDelete("cascade"),
	}
});

export const labExercises = pgTable("lab_exercises", {
	id: text().primaryKey().notNull(),
	labId: text(),
	title: text().notNull(),
	description: text(),
	orderIndex: integer("order_index").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		labExercisesLabIdLabsIdFk: foreignKey({
			columns: [table.labId],
			foreignColumns: [labs.id],
			name: "lab_exercises_labId_labs_id_fk"
		}).onDelete("cascade"),
	}
});

export const labExerciseProgress = pgTable("lab_exercise_progress", {
	id: text().primaryKey().notNull(),
	exerciseId: text("exercise_id"),
	enrollmentId: text("enrollment_id"),
	completed: boolean().default(false),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		labExerciseProgressExerciseIdLabExercisesIdFk: foreignKey({
			columns: [table.exerciseId],
			foreignColumns: [labExercises.id],
			name: "lab_exercise_progress_exercise_id_lab_exercises_id_fk"
		}).onDelete("cascade"),
		labExerciseProgressEnrollmentIdLabEnrollmentsIdFk: foreignKey({
			columns: [table.enrollmentId],
			foreignColumns: [labEnrollments.id],
			name: "lab_exercise_progress_enrollment_id_lab_enrollments_id_fk"
		}).onDelete("cascade"),
	}
});

export const verificationToken = pgTable("verificationToken", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => {
	return {
		verificationTokenIdentifierTokenPk: primaryKey({ columns: [table.identifier, table.token], name: "verificationToken_identifier_token_pk"}),
	}
});

export const account = pgTable("account", {
	userId: text().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => {
	return {
		accountUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}).onDelete("cascade"),
		accountProviderProviderAccountIdPk: primaryKey({ columns: [table.provider, table.providerAccountId], name: "account_provider_providerAccountId_pk"}),
	}
});
