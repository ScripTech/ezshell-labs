'use server'

import fs from 'fs';

import path from "path";
import { remark } from "remark";
import html from "remark-html";
import matter from "gray-matter";


export async function getExerciseData(id: string) {

  const postsDirectory = "./storage/exercises";

  // console.log(path.basename.toString())
  // fs.readdir(postsDirectory, (err, files) => {
  //   files.forEach((file) => {
  //     console.log(file);
  //   });
  // });

  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    ...matterResult.data,
  };
}
