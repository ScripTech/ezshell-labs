'use server'

import fs from 'fs';

import path from "path";
import { remark } from "remark";
import html from "remark-html";
import matter from "gray-matter";
import { metadata } from '../../app/layout';
import { questions } from '@/app/ezshell/components/lab-exercises';


export interface LabExercises {
  id: string,
  exerciseHtml: string,
  exerciseHintHtml: string,
  metadata?: any
}

export async function getExerciseData(id: string) {

  const exerciseDirectory = "./storage/exercises";
  const hintsDirectory = "./storage/hints";
  // console.log(path.basename.toString())
  // fs.readdir(exerciseDirectory, (err, files) => {
  //   files.forEach((file) => {
  //     console.log(file);
  //   });
  // });

  // here i'm get the hint
  const index = questions.findIndex((q) => q.file === id);
  const hintId = questions[index].hint;

  const fullPath_exercise = path.join(exerciseDirectory, `${id}.md`);
  const fileExerciseContent = fs.readFileSync(fullPath_exercise, "utf8");

  const fullPath_exercise_hint = path.join(hintsDirectory, `${hintId}.md`);
  const fileExerciseContentHint = fs.readFileSync(fullPath_exercise_hint, "utf8");

  // Use gray-matter to parse the post metadata section
  const matterExercise = matter(fileExerciseContent);
  const matterExerciseHint = matter(fileExerciseContentHint);

  // Use remark to convert markdown into HTML string
  const processedExerciseContent = await remark()
    .use(html)
    .process(matterExercise.content);

  const processedExerciseHintContent = await remark()
    .use(html)
    .process(matterExerciseHint.content);

  const exerciseHtml = processedExerciseContent.toString();
  const exerciseHintHtml = processedExerciseHintContent.toString();

  const exerciseData: LabExercises = {
    id: id,
    exerciseHtml: exerciseHtml,
    exerciseHintHtml: exerciseHintHtml,
  };
  return exerciseData;
}
