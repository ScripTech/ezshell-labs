'use server'

import fs from 'fs'
import path from "path"
import { remark } from "remark"
import html from "remark-html"
import matter from "gray-matter"
import { db } from "@/db"
import { labTasks, labs } from "@/db/schemas/LabSchema"
import { eq, and } from "drizzle-orm";

export interface LabExercise {
  id: string
  exerciseHtml: string
  exerciseHintHtml: string
  metadata?: any
  labId: string
}

export interface LabQuestion {
  id: string;
  labId: string | null;
  title: string;
  order: number;
  lab?: {
    id: string;
    name: string;
    labId: string;
    description: string | null;
    duration: number;
    imageUrl: string | null;
  };
  metadata:
    | {
        title: string;
        order: number;
        description?: string | null;
        [key: string]: any;
      }
    ;
}

export async function getExerciseData(labId: string, questionId: string): Promise<LabExercise> {
  const labsDirectory = path.join(process.cwd(), 'storage', 'labs')
  const labPath = path.join(labsDirectory, labId)

  // Validate lab exists
  if (!fs.existsSync(labPath)) {
    throw new Error(`Lab ${labId} not found`)
  }

  // Get all questions for the lab
  const questions = fs.readdirSync(labPath)
    .filter(file => file.endsWith('.md'))
    .map(file => path.parse(file).name)

  // Find the matching question
  const questionFile = questions.find(q => q === questionId)
  if (!questionFile) {
    throw new Error(`Question ${questionId} not found in lab ${labId}`)
  }

  // Read and process the question content
  const questionPath = path.join(labPath, `${questionFile}.md`)
  const fileContent = fs.readFileSync(questionPath, 'utf8')

  // Parse frontmatter and content
  const { data: metadata, content } = matter(fileContent)

  // Convert markdown to HTML
  const processedContent = await remark()
    .use(html)
    .process(content)

  // Get hint content if available
  let hintHtml = ''
  if (metadata.hint) {
    const hintPath = path.join(labPath, `hints`, `${metadata.hint}.md`)
    if (fs.existsSync(hintPath)) {
      const hintContent = fs.readFileSync(hintPath, 'utf8')
      const processedHint = await remark()
        .use(html)
        .process(matter(hintContent).content)
      hintHtml = processedHint.toString()
    }
  }

  return {
    id: questionId,
    labId,
    exerciseHtml: processedContent.toString(),
    exerciseHintHtml: hintHtml,
    metadata: {
      ...metadata,
      title: metadata.title || `Question ${metadata.order || 1}`,
      order: metadata.order || 1
    }
  }
}

export async function getLabQuestions(labId: string): Promise<LabQuestion[]> {
  const labPath = path.join(process.cwd(), 'storage', 'labs', labId)

  if (!fs.existsSync(labPath)) {
    throw new Error(`Lab ${labId} not found`)
  }

  console.log(`Fetching questions for lab: ${labId} from path: ${labPath}`)

  const questions = fs.readdirSync(labPath)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const fullPath = path.join(labPath, file)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data: metadata } = matter(fileContents)

      return {
        id: path.parse(file).name,
        labId,
        title: metadata.title || `Question ${metadata.order || 1}`,
        order: metadata.order || 1,
        metadata: {
          ...metadata,
          title: metadata.title || `Question ${metadata.order || 1}`,
          order: metadata.order || 1
        }
      }
    })
    .sort((a, b) => a.order - b.order)

  return questions
}

export async function getFirstLabQuestion(labId: string): Promise<string> {
  const labPath = path.join(process.cwd(), 'storage', 'labs', labId)

  if (!fs.existsSync(labPath)) {
    throw new Error(`Lab ${labId} not found`)
  }

  // Get all .md files and sort them alphabetically
  const questions = fs.readdirSync(labPath)
    .filter(file => file.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b))

  if (questions.length === 0) {
    throw new Error(`No questions found for lab ${labId}`)
  }

  // Return the first question ID without the .md extension
  return path.parse(questions[0]).name
}

export async function getLabQuestionsFromDB(labId: string): Promise<LabQuestion[]> {

  console.log(`Fetching active questions for lab: ${labId}`);

  const rows = await db
    .select({
      task: labTasks,
      lab: labs,
    })
    .from(labTasks)
    .leftJoin(labs, eq(labTasks.labId, labs.id))
    .where(and(
      eq(labTasks.labId, labId),
      eq(labTasks.isEnabled, true),
      eq(labTasks.status, 'active')
    ))
    .orderBy(labTasks.order);

  if (rows.length === 0) {
    throw new Error(`@getLabQuestionsFromDB No active questions found for lab ${labId}`);
  }

  const activeQuestions = rows.map(row => ({
    id: row.task.id,
    labId: row.task.labId,
    title: row.task.title,
    order: row.task.order,
    lab: row.lab ? {
      id: row.lab.id,
      name: row.lab.name,
      labId: row.lab.labId,
      description: row.lab.description,
      duration: row.lab.duration,
      imageUrl: row.lab.imageUrl,
    } : undefined,
    metadata: {
      title: row.task.title,
      order: row.task.order,
      description: row.task.description,
      difficulty: row.task.difficulty,
      points: row.task.points,
      hint: row.task.hint,
      validationSteps: row.task.validationSteps,
      markdown: row.task.markdown,
    }
  }));

  console.log(`Found ${activeQuestions.length} active questions for lab: ${labId}`);
  return activeQuestions;
}

export async function getExerciseDataFromDB(
  labId: string,
  questionId: string
): Promise<LabQuestion> {
  const result = await db
    .select({
      task: labTasks,
      lab: labs,
    })
    .from(labTasks)
    .leftJoin(labs, eq(labTasks.labId, labs.id))
    .where(and(eq(labTasks.labId, labId), eq(labTasks.id, questionId)))
    .orderBy(labTasks.order)
    .limit(1);

  if (result.length === 0) {
    console.error(
      `@getExerciseDataFromDB No questions found for lab ${labId} with question ${questionId}`
    );
    return Promise.reject({ message: `Question ${questionId} not found in lab ${labId}` });
  }

  const row = result[0];
  const labQuestion: LabQuestion = {
    id: row.task.id,
    labId: row.task.labId,
    title: row.task.title,
    order: row.task.order,
    lab: row.lab ? {
      id: row.lab.id,
      name: row.lab.name,
      labId: row.lab.labId,
      description: row.lab.description,
      duration: row.lab.duration,
      imageUrl: row.lab.imageUrl,
    } : undefined,
    metadata: {
      title: row.task.title,
      order: row.task.order,
      description: row.task.description,
      difficulty: row.task.difficulty,
      points: row.task.points,
      hint: row.task.hint,
      validationSteps: row.task.validationSteps,
      markdown: row.task.markdown,
    },
  };

  console.log(
    `Fetched question from DB: ${labQuestion.id} for lab: ${labQuestion.labId}`
  );
  return labQuestion;
}

export async function getFirstLabQuestionFromDB(labId: string): Promise<LabQuestion | null> {
  console.log(`Fetching DB for first active question for lab: ${labId}`);
  const result = await db
    .select({
      task: labTasks,
      lab: labs,
    })
    .from(labTasks)
    .leftJoin(labs, eq(labTasks.labId, labs.id))
    .where(and(
      eq(labTasks.labId, labId),
      eq(labTasks.isEnabled, true),
      eq(labTasks.status, 'active')
    ))
    .orderBy(labTasks.order)
    .limit(1);

  if (result.length === 0) {
    console.log(`No active questions found for lab: ${labId}`);
    return null;
  }

  const row = result[0];
  const labQuestion: LabQuestion = {
    id: row.task.id,
    labId: row.task.labId,
    title: row.task.title,
    order: row.task.order,
    lab: row.lab ? {
      id: row.lab.id,
      name: row.lab.name,
      labId: row.lab.labId,
      description: row.lab.description,
      duration: row.lab.duration,
      imageUrl: row.lab.imageUrl,
    } : undefined,
    metadata: {
      title: row.task.title,
      order: row.task.order,
      description: row.task.description,
      difficulty: row.task.difficulty,
      points: row.task.points,
      hint: row.task.hint,
      validationSteps: row.task.validationSteps,
      markdown: row.task.markdown,
    },
  };

  console.log(`Found first active question: ${labQuestion.id} (order: ${labQuestion.order}) for lab: ${labQuestion.labId}`);
  return labQuestion;
}

export async function getNextActiveLabQuestionFromDB(
  labId: string,
  currentOrder: number
): Promise<LabQuestion | null> {
  console.log(`Fetching next active question after order ${currentOrder} for lab: ${labId}`);

  const result = await db
    .select({
      task: labTasks,
      lab: labs,
    })
    .from(labTasks)
    .leftJoin(labs, eq(labTasks.labId, labs.id))
    .where(and(
      eq(labTasks.labId, labId),
      eq(labTasks.isEnabled, true),
      eq(labTasks.status, 'active')
    ))
    .orderBy(labTasks.order);

  if (result.length === 0) {
    console.log(`No active questions found for lab: ${labId}`);
    return null;
  }

  // Find the next question with order > currentOrder
  const nextQuestion = result.find(row => row.task.order > currentOrder);

  if (!nextQuestion) {
    console.log(`No next active question found after order ${currentOrder} for lab: ${labId}`);
    return null;
  }

  const row = nextQuestion;
  const labQuestion: LabQuestion = {
    id: row.task.id,
    labId: row.task.labId,
    title: row.task.title,
    order: row.task.order,
    lab: row.lab ? {
      id: row.lab.id,
      name: row.lab.name,
      labId: row.lab.labId,
      description: row.lab.description,
      duration: row.lab.duration,
      imageUrl: row.lab.imageUrl,
    } : undefined,
    metadata: {
      title: row.task.title,
      order: row.task.order,
      description: row.task.description,
      difficulty: row.task.difficulty,
      points: row.task.points,
      hint: row.task.hint,
      validationSteps: row.task.validationSteps,
      markdown: row.task.markdown,
    },
  };

  console.log(`Found next active question: ${labQuestion.id} (order: ${labQuestion.order}) for lab: ${labQuestion.labId}`);
  return labQuestion;
}

export async function getPreviousActiveLabQuestionFromDB(
  labId: string,
  currentOrder: number
): Promise<LabQuestion | null> {
  console.log(`Fetching previous active question before order ${currentOrder} for lab: ${labId}`);

  const result = await db
    .select({
      task: labTasks,
      lab: labs,
    })
    .from(labTasks)
    .leftJoin(labs, eq(labTasks.labId, labs.id))
    .where(and(
      eq(labTasks.labId, labId),
      eq(labTasks.isEnabled, true),
      eq(labTasks.status, 'active')
    ))
    .orderBy(labTasks.order);

  if (result.length === 0) {
    console.log(`No active questions found for lab: ${labId}`);
    return null;
  }

  // Find the previous question with order < currentOrder (get the highest order that's still less than current)
  const previousQuestions = result.filter(row => row.task.order < currentOrder);
  const previousQuestion = previousQuestions[previousQuestions.length - 1]; // Last in the filtered array = highest order < current

  if (!previousQuestion) {
    console.log(`No previous active question found before order ${currentOrder} for lab: ${labId}`);
    return null;
  }

  const row = previousQuestion;
  const labQuestion: LabQuestion = {
    id: row.task.id,
    labId: row.task.labId,
    title: row.task.title,
    order: row.task.order,
    lab: row.lab ? {
      id: row.lab.id,
      name: row.lab.name,
      labId: row.lab.labId,
      description: row.lab.description,
      duration: row.lab.duration,
      imageUrl: row.lab.imageUrl,
    } : undefined,
    metadata: {
      title: row.task.title,
      order: row.task.order,
      description: row.task.description,
      difficulty: row.task.difficulty,
      points: row.task.points,
      hint: row.task.hint,
      validationSteps: row.task.validationSteps,
      markdown: row.task.markdown,
    },
  };

  console.log(`Found previous active question: ${labQuestion.id} (order: ${labQuestion.order}) for lab: ${labQuestion.labId}`);
  return labQuestion;
}
