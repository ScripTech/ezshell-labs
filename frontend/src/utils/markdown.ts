import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface MarkdownContent {
  content: string
  data: Record<string, any>
}

export function getMarkdownContent(filename: string): MarkdownContent {
  const filePath = path.join(process.cwd(), 'src', 'content', `${filename}`)

  try {
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      content,
      data
    }
  } catch (error) {
    console.error(`Error reading markdown file ${filename}:`, error)
    return {
      content: `# ${filename.charAt(0).toUpperCase() + filename.slice(1)}\n\nContent not found.`,
      data: {}
    }
  }
}

export function getAllMarkdownFiles(): string[] {
  const contentDirectory = path.join(process.cwd(), 'src', 'content')

  try {
    const files = fs.readdirSync(contentDirectory)
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''))
  } catch (error) {
    console.error('Error reading content directory:', error)
    return []
  }
}
