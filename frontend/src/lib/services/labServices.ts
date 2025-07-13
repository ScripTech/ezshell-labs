'use server'

import fs from 'fs'
import path from "path"
import { remark } from "remark"
import html from "remark-html"
import matter from "gray-matter"
import { db } from "@/db"
import { labTasks } from "@/db/schemas/LabSchema"
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

  console.log(`Fetching questions for lab: ${labId}`);

  const rows = await db
    .select()
    .from(labTasks)
    .where(eq(labTasks.labId, labId))
    .orderBy(labTasks.order);
  if (rows.length === 0) {
    throw new Error(`No questions found for lab ${labId}`)
  }


  return rows.map(row => ({
    id: row.id,
    labId: row.labId,
    title: row.title,
    order: row.order,
    metadata: {
      title: row.title,
      order: row.order,
      description: row.description,
      difficulty: row.difficulty,
      points: row.points,
      hint: row.hint,
      validationSteps: row.validationSteps,
      markdown: row.markdown,
    }
  }))
}

export async function getExerciseDataFromDB(
  labId: string,
  questionId: string
): Promise<LabQuestion> {
  const labs = await db
    .select()
    .from(labTasks)
    .where(and(eq(labTasks.labId, labId), eq(labTasks.id, questionId)))
    .orderBy(labTasks.order)
    .limit(1);
  if (labs.length === 0) {
    throw new Error(`No questions found for lab ${labId}`);
  }
  const labQuestion: LabQuestion = {
    id: labs[0].id,
    labId: labs[0].labId,
    title: labs[0].title,
    order: labs[0].order,
    metadata: {
      title: labs[0].title,
      order: labs[0].order,
      description: labs[0].description,
      difficulty: labs[0].difficulty,
      points: labs[0].points,
      hint: labs[0].hint,
      validationSteps: labs[0].validationSteps,
      markdown: labs[0].markdown,
    },
  };
  return labQuestion;
}

export async function getFirstLabQuestionFromDB(labId: string): Promise<LabQuestion | null> {
  const labs = await db
    .select()
    .from(labTasks)
    .where(eq(labTasks.labId, labId))
    .orderBy(labTasks.order)
    .limit(1);

  if (labs.length === 0) return null;

  const labQuestion: LabQuestion = {
    id: labs[0].id,
    labId: labs[0].labId,
    title: labs[0].title,
    order: labs[0].order,
    metadata: {
      title: labs[0].title,
      order: labs[0].order,
      description: labs[0].description,
      difficulty: labs[0].difficulty,
      points: labs[0].points,
      hint: labs[0].hint,
      validationSteps: labs[0].validationSteps,
      markdown: labs[0].markdown,
    },
  };
  return labQuestion;
}
