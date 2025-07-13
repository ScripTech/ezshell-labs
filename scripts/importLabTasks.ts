import { importLabTasksFromMarkdown } from "../frontend/src/services/labTaskService"

// Example usage: node scripts/importLabTasks.js EX294 ./frontend/storage/labs/EX294
async function main() {
  const [labId, labFolder] = process.argv.slice(2)
  if (!labId || !labFolder) {
    console.error("Usage: node importLabTasks.js <labId> <labFolder>")
    process.exit(1)
  }
  try {
    await importLabTasksFromMarkdown(labId, labFolder)
    console.log(`Imported lab tasks for ${labId} from ${labFolder}`)
  } catch (err) {
    console.error("Error importing lab tasks:", err)
    process.exit(1)
  }
}

main()
