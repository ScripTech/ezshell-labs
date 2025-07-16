import { relations } from "drizzle-orm/relations";
import { user, labSession, labs, session, labTasks, labTaskProgress, labEnrollments, labExercises, labExerciseProgress, account } from "./schema";

export const labSessionRelations = relations(labSession, ({one}) => ({
	user: one(user, {
		fields: [labSession.userId],
		references: [user.id]
	}),
	lab: one(labs, {
		fields: [labSession.labId],
		references: [labs.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	labSessions: many(labSession),
	sessions: many(session),
	labTaskProgresses: many(labTaskProgress),
	labEnrollments: many(labEnrollments),
	accounts: many(account),
}));

export const labsRelations = relations(labs, ({many}) => ({
	labSessions: many(labSession),
	labTasks: many(labTasks),
	labEnrollments: many(labEnrollments),
	labExercises: many(labExercises),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const labTasksRelations = relations(labTasks, ({one, many}) => ({
	lab: one(labs, {
		fields: [labTasks.labId],
		references: [labs.id]
	}),
	labTaskProgresses: many(labTaskProgress),
}));

export const labTaskProgressRelations = relations(labTaskProgress, ({one}) => ({
	user: one(user, {
		fields: [labTaskProgress.userId],
		references: [user.id]
	}),
	labTask: one(labTasks, {
		fields: [labTaskProgress.labTaskId],
		references: [labTasks.id]
	}),
	labEnrollment: one(labEnrollments, {
		fields: [labTaskProgress.labEnrollmentId],
		references: [labEnrollments.id]
	}),
}));

export const labEnrollmentsRelations = relations(labEnrollments, ({one, many}) => ({
	labTaskProgresses: many(labTaskProgress),
	user: one(user, {
		fields: [labEnrollments.userId],
		references: [user.id]
	}),
	lab: one(labs, {
		fields: [labEnrollments.labId],
		references: [labs.id]
	}),
	labExerciseProgresses: many(labExerciseProgress),
}));

export const labExercisesRelations = relations(labExercises, ({one, many}) => ({
	lab: one(labs, {
		fields: [labExercises.labId],
		references: [labs.id]
	}),
	labExerciseProgresses: many(labExerciseProgress),
}));

export const labExerciseProgressRelations = relations(labExerciseProgress, ({one}) => ({
	labExercise: one(labExercises, {
		fields: [labExerciseProgress.exerciseId],
		references: [labExercises.id]
	}),
	labEnrollment: one(labEnrollments, {
		fields: [labExerciseProgress.enrollmentId],
		references: [labEnrollments.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));